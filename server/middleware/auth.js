import jwt from 'jsonwebtoken';
import { User } from '../models/schemas.js';

const JWT_SECRET = process.env.JWT_SECRET || 'eduproctor-super-secret-jwt-key-2026';

export function generateToken(user) {
  console.log('[TRIGGER-1-JWT] Generating JWT token for user:', user.email, 'with expiresIn: 7d');
  return jwt.sign(
    {
      id: user._id || user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function authenticate(req, res, next) {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      console.warn('[TRIGGER-1-JWT] 401: No token provided for request:', req.originalUrl || req.url);
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      console.warn('[TRIGGER-1-JWT] 401: User not found for decoded ID:', decoded.id);
      return res.status(401).json({ success: false, message: 'User session no longer valid.' });
    }

    req.user = {
      id: user._id || user.id,
      _id: user._id || user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      rollNumber: user.rollNumber,
      avatar: user.avatar
    };

    next();
  } catch (err) {
    console.warn('[TRIGGER-1-JWT] 401: Token verification failed on', req.originalUrl || req.url, 'Error:', err.message);
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to roles: ${roles.join(', ')}. Current role: ${req.user.role}`
      });
    }
    next();
  };
}
