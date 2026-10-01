# EduProctor AI — Intelligent Examination & Coding Assessment Platform

EduProctor AI is an enterprise-grade EdTech examination platform designed for students to take coding, MCQ, and descriptive assessments under continuous, privacy-centric AI camera proctoring, with automated sandbox evaluation, digital scratchpad, and real-time faculty monitoring.

---

## Key Feature Modules

1. **Role-Based Workspaces**:
   - **Student**: Portal with exam discovery, pre-flight hardware check, active examination interface with Monaco code editor, digital rough pad, immediate automated assessment, and personalized AI performance recommendations.
   - **Faculty**: Exam builder, question repository bank, real-time live monitoring dashboard with student video grid, and incident audit review triage.
   - **Administrator**: Platform telemetry, user role administration, and AI vision threshold settings.

2. **Isolated Code Execution Sandbox**:
   - Compiles and runs **C++**, **Java**, **Python**, and **JavaScript**.
   - Enforces execution timeouts (3000ms), memory limits, and process isolation.
   - Evaluates programs against visible and hidden test suites with detailed expected vs. actual output diffs.

3. **Client-Side AI Camera Proctoring**:
   - Powered by **BlazeFace** and **COCO-SSD** running client-side on WebGL/WASM.
   - Real-time detections:
     - Missing face / seat left
     - Multiple persons in frame
     - Mobile phone devices and unauthorized electronics
     - Head pose / gaze deflection (yaw and pitch deflection)
   - Transparent, ethical proctoring: Incidents are logged with timestamps, confidence ratings, and snapshot evidence as signals for human faculty review rather than automatic disqualification.

4. **Digital Rough Pad**:
   - Integrated HTML5 canvas scratchpad accessible during exams.
   - Features freehand pen, eraser, geometric shapes (line, rectangle, circle), text tool, undo/redo stacks, canvas clear, zoom, and PNG export.

5. **Faculty Live Proctoring Hub**:
   - Real-time video grid streaming live candidate snapshots via Socket.IO.
   - Status indicators: `Normal` (green), `Warning` (amber), `Incident` (red), and `Offline`.
   - Direct faculty-to-student warning dispatch.

---

## Platform Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│  React 18 + Vite + Tailwind CSS + Monaco Editor + TF.js    │
│  • BlazeFace & COCO-SSD In-Browser Computer Vision         │
│  • Digital Rough Pad (HTML5 Canvas Engine)                  │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP / REST & WebSockets (Socket.IO)
┌──────────────────────────▼──────────────────────────────────┐
│                      Server Layer                           │
│  Node.js + Express.js + Socket.IO Realtime Gateway          │
│  • Auth & Role-Based Access Control (JWT + bcrypt)         │
│  • Isolated Code Execution Sandbox Runner                   │
│  • AI Performance Analytics & Rubric Scoring Engine        │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      Data Layer                             │
│  MongoDB (Mongoose) with Resilient Embedded Storage Fallback│
└─────────────────────────────────────────────────────────────┘
```

---

## Pre-Seeded Demo Credentials

All test accounts use the password: `password123`

| Role | Name | Email | Pass |
|---|---|---|---|
| **Student** | Alex Johnson | `alex.student@eduproctor.ai` | `password123` |
| **Student** | Sophia Chen | `sophia.student@eduproctor.ai` | `password123` |
| **Faculty** | Prof. Alan Turing | `turing@eduproctor.ai` | `password123` |
| **Faculty** | Dr. Grace Hopper | `hopper@eduproctor.ai` | `password123` |
| **Admin** | Dr. Sarah Connor | `admin@eduproctor.ai` | `password123` |

*(Note: The login page includes one-click demo login buttons for rapid testing.)*

---

## Local Development & Setup

### Prerequisites
- Node.js LTS (v18 or v20+)
- npm

### Installation & Launch

1. **Install Dependencies**:
```bash
# In server directory
cd server
npm install

# In client directory
cd ../client
npm install
```

2. **Start Backend Server**:
```bash
cd server
npm run dev
# Server will start on http://localhost:5000 and auto-seed initial assessments
```

3. **Start Frontend Client**:
```bash
cd client
npm run dev
# Client will start on http://localhost:5173
```

4. **Access the Application**:
Open your browser and navigate to `http://localhost:5173`.

---

## Docker Deployment

To launch the full containerized stack:
```bash
docker-compose up --build
```
- Client will be available at `http://localhost:80`
- Server API will be available at `http://localhost:5000/api`
- MongoDB will run on `mongodb://localhost:27017`

---

## API Reference

### Authentication
- `POST /api/auth/register` — Register student or faculty
- `POST /api/auth/login` — Login and receive JWT token
- `GET /api/auth/me` — Verify active user session
- `GET /api/auth/demo-users` — Retrieve demo roster

### Assessments
- `GET /api/exams` — List exams with filters (difficulty, subject)
- `GET /api/exams/:id` — Get exam details
- `POST /api/exams` — Create new assessment (Faculty/Admin)
- `POST /api/exams/:id/start` — Begin or resume exam attempt
- `POST /api/exams/:id/autosave` — Auto-save draft answers
- `POST /api/exams/:id/submit` — Submit and trigger auto-assessment
- `GET /api/exams/attempts/:attemptId` — Retrieve graded report and AI insights

### Code Execution
- `POST /api/code/run` — Run code against sample test cases in Monaco
- `POST /api/code/submit` — Formally submit code for a question

### Proctoring & Real-Time
- `POST /api/proctor/event` — Log proctoring incident
- `GET /api/proctor/events/:attemptId` — Get event audit timeline
- `PUT /api/proctor/events/:eventId/status` — Review/dismiss incident
- `GET /api/faculty/monitoring/:examId` — Live monitoring state
