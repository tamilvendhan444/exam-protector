import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB } from './db/database.js';
import { seedDatabase } from './seed/seedData.js';
import { setupProctorSockets } from './sockets/proctorSocket.js';

import authRoutes from './routes/authRoutes.js';
import examRoutes from './routes/examRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import codeRoutes from './routes/codeRoutes.js';
import proctorRoutes from './routes/proctorRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import facultyRoutes from './routes/facultyRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Production-hardened CORS Origin Configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

const corsOptions = {
  origin: (origin, callback) => {
    // Permit server-to-server, curl, testing tools, and electron without origin header
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV !== 'production' || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for unauthorized origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
};

// Socket.IO configuration with CORS & Horizontal Redis Clustering Hook
const io = new SocketIOServer(server, {
  cors: corsOptions,
  maxHttpBufferSize: 1e7 // 10MB payload ceiling
});

if (process.env.REDIS_URL) {
  try {
    const { createAdapter } = await import('@socket.io/redis-adapter');
    const { createClient } = await import('redis');
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    console.log('  Cluster Gateway: Socket.IO Redis Adapter connected');
  } catch (err) {
    console.warn('  Cluster Gateway: Redis URL specified but adapter failed to load, falling back to local memory adapter:', err.message);
  }
}

app.set('io', io);

// Enterprise Rate Limiting Policies
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // 1000 requests per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP. Please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60, // 60 attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again after 15 minutes.' }
});

const codeExecutionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40, // 40 code runs per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Code sandbox execution rate limit reached. Please wait 1 minute.' }
});

// Middleware Pipeline
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors(corsOptions));
app.use(compression());
app.use(globalLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Connect DB & Seed default state
await connectDB();
await seedDatabase();

// Setup real-time proctoring and exam sockets
setupProctorSockets(io);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'EduProctor AI Engine',
    timestamp: new Date().toISOString()
  });
});

// API Routes with Rate-Limited Critical Endpoints
app.use('/api/auth/login', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/code/run', codeExecutionLimiter);
app.use('/api/code', codeRoutes);
app.use('/api/proctor', proctorRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/admin', adminRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error.'
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  EduProctor AI Server running on port ${PORT}`);
  console.log(`  API URL: http://localhost:${PORT}/api`);
  console.log(`  Realtime Gateway: Socket.IO initialized`);
  console.log(`  Security: Helmet, Compression & Rate Limit Active`);
  console.log(`====================================================`);
});

// Process-level resilience and telemetry handlers
process.on('unhandledRejection', (reason) => {
  console.error('[Process Unhandled Rejection]:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Process Uncaught Exception]:', err);
});
