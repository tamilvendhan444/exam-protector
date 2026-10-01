import mongoose from 'mongoose';
import { getModel } from '../db/database.js';

const { Schema } = mongoose;

// User Schema
const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['STUDENT', 'FACULTY', 'ADMIN'], default: 'STUDENT' },
  avatar: { type: String },
  department: { type: String },
  classSection: { type: String },
  rollNumber: { type: String, unique: true, sparse: true },
  streak: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  medals: [{
    badgeId: { type: String }, // 'fastest_solver' | 'platinum_champion' | 'code_optimizer'
    title: { type: String },
    type: { type: String },
    earnedAt: { type: Date, default: Date.now },
    metrics: { type: Schema.Types.Mixed }
  }]
}, { timestamps: true });

// Exam Schema
const ExamSchema = new Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  department: { type: String },
  classSection: { type: String },
  session: { type: String, enum: ['Morning', 'Evening'] },
  description: { type: String },
  durationMinutes: { type: Number, required: true, default: 60 },
  totalMarks: { type: Number, required: true, default: 100 },
  passingMarks: { type: Number, default: 40 },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Intermediate' },
  startDate: { type: Date },
  endDate: { type: Date },
  status: { type: String, enum: ['Draft', 'Published', 'Unpublished', 'Scheduled', 'Active', 'Completed'], default: 'Active' },
  questionTypes: [{ type: String }], // 'MCQ', 'Coding', 'Descriptive'
  negativeMarking: { type: Boolean, default: false },
  negativeMarksPerQuestion: { type: Number, default: 0.25 },
  proctoringEnabled: { type: Boolean, default: true },
  proctoringSettings: {
    faceDetection: { type: Boolean, default: true },
    multipleFaceDetection: { type: Boolean, default: true },
    objectDetection: { type: Boolean, default: true },
    headPoseDetection: { type: Boolean, default: true },
    tabSwitchDetection: { type: Boolean, default: true },
    fullscreenEnforced: { type: Boolean, default: true },
    clipboardGuard: { type: Boolean, default: true },
    devtoolsDetection: { type: Boolean, default: true },
    multiDisplayDetection: { type: Boolean, default: true },
    contextMenuBlocked: { type: Boolean, default: true },
    idleDetection: { type: Boolean, default: true },
    idleTimeoutMinutes: { type: Number, default: 3 },
    networkGapDetection: { type: Boolean, default: true },
    networkGapGraceSeconds: { type: Number, default: 20 },
    autoSubmitOnRepeatedIncidents: { type: Boolean, default: false },
    maxAllowedIncidents: { type: Number, default: 5 },
    sensitivity: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    maxWarningsBeforeFlag: { type: Number, default: 3 }
  },
  questionIds: [{ type: String }],
  createdBy: { type: String }, // Faculty ID
  createdByName: { type: String }
}, { timestamps: true });

// Question Schema
const QuestionSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ['mcq', 'coding', 'descriptive'], required: true },
  subject: { type: String, required: true },
  topic: { type: String },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  marks: { type: Number, default: 10 },
  negativeMarks: { type: Number, default: 0 },
  tags: [{ type: String }],

  // MCQ specific
  options: [{
    id: { type: String },
    text: { type: String }
  }],
  correctOptionIds: [{ type: String }],
  isMultipleChoice: { type: Boolean, default: false },
  explanation: { type: String },

  // Coding specific
  inputFormat: { type: String },
  outputFormat: { type: String },
  constraints: { type: String },
  examples: [{
    input: { type: String },
    output: { type: String },
    explanation: { type: String }
  }],
  starterCode: {
    cpp: { type: String },
    java: { type: String },
    python: { type: String },
    javascript: { type: String }
  },
  testCases: [{
    input: { type: String },
    expectedOutput: { type: String },
    isHidden: { type: Boolean, default: false },
    explanation: { type: String }
  }],
  timeLimitMs: { type: Number, default: 2000 },
  memoryLimitMb: { type: Number, default: 128 },

  // Descriptive specific
  minWords: { type: Number, default: 50 },
  maxWords: { type: Number, default: 500 },
  rubricCriteria: [{ type: String }]
}, { timestamps: true });

// QuestionSet Schema
const QuestionSetSchema = new Schema({
  examId: { type: String, required: true },
  slotId: { type: String, required: true },
  name: { type: String, required: true },
  questions: [QuestionSchema]
}, { timestamps: true });

// ExamSlot Schema
const ExamSlotSchema = new Schema({
  examId: { type: String, required: true },
  slotName: { type: String, required: true },
  session: { type: String, enum: ['Morning', 'Evening'] },
  startTime: { type: Date },
  endTime: { type: Date },
  duration: { type: Number, required: true }, // duration in minutes
  startRollNumber: { type: String, required: true },
  endRollNumber: { type: String, required: true },
  questionSetId: { type: String },
  editHistory: [{
    editedBy: { type: String },
    editedAt: { type: Date, default: Date.now },
    previousValues: { type: Schema.Types.Mixed },
    newValues: { type: Schema.Types.Mixed }
  }]
}, { timestamps: true });

// Exam Attempt Schema
const ExamAttemptSchema = new Schema({
  examId: { type: String, required: true },
  slotId: { type: String },
  studentId: { type: String, required: true },
  studentName: { type: String },
  studentEmail: { type: String },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  examStartedAt: { type: Date },
  expiresAt: { type: Date },
  submissionType: { type: String, enum: ['manual', 'auto'] },
  status: { type: String, enum: ['in_progress', 'submitted', 'evaluated'], default: 'in_progress' },
  remainingSeconds: { type: Number },
  answers: [{
    questionId: { type: String },
    type: { type: String },
    selectedOptionIds: [{ type: String }],
    codeAnswer: { type: String },
    language: { type: String },
    descriptiveAnswer: { type: String },
    status: { type: String, enum: ['unanswered', 'answered', 'marked_for_review'], default: 'unanswered' },
    isCorrect: { type: Boolean },
    score: { type: Number, default: 0 },
    passedTestCases: { type: Number, default: 0 },
    totalTestCases: { type: Number, default: 0 },
    timeSpentSeconds: { type: Number, default: 0 },
    autoSavedAt: { type: Date }
  }],
  evaluatedAnswers: [{ type: Schema.Types.Mixed }],
  totalScore: { type: Number, default: 0 },
  totalPossibleMarks: { type: Number, default: 100 },
  accuracyPercentage: { type: Number, default: 0 },
  correctCount: { type: Number, default: 0 },
  wrongCount: { type: Number, default: 0 },
  unattemptedCount: { type: Number, default: 0 },
  codingPerformance: {
    problemsSolved: { type: Number, default: 0 },
    totalProblems: { type: Number, default: 0 },
    passedTestCases: { type: Number, default: 0 },
    totalTestCases: { type: Number, default: 0 },
    compilationErrors: { type: Number, default: 0 },
    submissionCount: { type: Number, default: 0 }
  },
  proctoringSummary: {
    totalIncidents: { type: Number, default: 0 },
    mobilePhoneCount: { type: Number, default: 0 },
    multipleFacesCount: { type: Number, default: 0 },
    faceMissingCount: { type: Number, default: 0 },
    lookingAwayCount: { type: Number, default: 0 },
    tabSwitchesCount: { type: Number, default: 0 },
    fullscreenExitsCount: { type: Number, default: 0 },
    clipboardBlockedCount: { type: Number, default: 0 },
    multipleDisplaysCount: { type: Number, default: 0 },
    devtoolsOpenCount: { type: Number, default: 0 },
    contextMenuBlockedCount: { type: Number, default: 0 },
    idleCount: { type: Number, default: 0 },
    networkDisconnectionsCount: { type: Number, default: 0 },
    suspiciousPastesCount: { type: Number, default: 0 },
    typingBurstsCount: { type: Number, default: 0 },
    plagiarismFlagsCount: { type: Number, default: 0 },
    integrityScore: { type: Number, default: 100 },
    integrityTier: { type: String, enum: ['Clean', 'Review Advised', 'High Risk'], default: 'Clean' },
    warningsSent: { type: Number, default: 0 },
    overallStatus: { type: String, enum: ['Normal', 'Warning', 'Incident'], default: 'Normal' }
  },
  aiAnalysis: {
    strengths: [{ type: String }],
    needsImprovement: [{ type: String }],
    recommendations: [{ type: String }],
    recommendedPracticeQuestionsCount: { type: Number, default: 5 }
  },
  livenessCheck: {
    status: { type: String, enum: ['passed', 'failed', 'pending'], default: 'pending' },
    overallStatus: { type: String, enum: ['fully-auto', 'partial-manual', 'fully-manual'] },
    verifiedAt: { type: Date },
    steps: [{
      stepIndex: { type: Number },
      pose: { type: String }, // 'center', 'left', 'right'
      verificationMethod: { type: String, enum: ['auto', 'manual'] },
      timestamp: { type: Date },
      evidenceSnapshot: { type: String } // Base64 still frame captured as verification evidence
    }]
  }
}, { timestamps: true });

// Proctoring Event Schema
const ProctoringEventSchema = new Schema({
  eventId: { type: String, required: true },
  examAttemptId: { type: String },
  examId: { type: String, required: true },
  studentId: { type: String, required: true },
  studentName: { type: String },
  eventType: {
    type: String,
    enum: [
      'mobile_phone',
      'multiple_faces',
      'face_missing',
      'looking_away',
      'suspicious_object',
      'tab_switch',
      'fullscreen_exit',
      'clipboard_blocked',
      'suspicious_paste',
      'typing_burst',
      'code_plagiarism',
      'multiple_displays',
      'devtools_open',
      'contextmenu_blocked',
      'candidate_idle',
      'network_gap'
    ],
    required: true
  },
  timestamp: { type: Date, default: Date.now },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  confidence: { type: Number, default: 0.85 },
  details: { type: String },
  evidenceSnapshot: { type: String }, // Base64 thumbnail or image URI
  metadata: { type: Schema.Types.Mixed }, // Structured comparison / diff telemetry
  status: { type: String, enum: ['New', 'Reviewed', 'Dismissed', 'Confirmed'], default: 'New' },
  durationSeconds: { type: Number, default: 0 },
  reviewedBy: { type: String },
  notes: { type: String }
}, { timestamps: true });

// Code Submission Schema
const SubmissionSchema = new Schema({
  attemptId: { type: String },
  studentId: { type: String, required: true },
  examId: { type: String, required: true },
  questionId: { type: String, required: true },
  code: { type: String, required: true },
  language: { type: String, required: true },
  status: { type: String, enum: ['Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Memory Limit Exceeded', 'Compilation Error', 'Runtime Error'] },
  allPassed: { type: Boolean, default: false },
  passedTestCases: { type: Number, default: 0 },
  totalTestCases: { type: Number, default: 0 },
  results: [{
    testCaseIndex: { type: Number },
    status: { type: String },
    input: { type: String },
    expectedOutput: { type: String },
    actualOutput: { type: String },
    error: { type: String },
    executionTimeMs: { type: Number },
    passed: { type: Boolean }
  }],
  executionTimeMs: { type: Number, default: 0 },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Notification Schema
const NotificationSchema = new Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'warning', 'success', 'urgent'], default: 'info' },
  read: { type: Boolean, default: false },
  link: { type: String }
}, { timestamps: true });

// ─── High-Performance Secondary & Compound Indexes ─────────────────────────────
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ department: 1 });

ExamSchema.index({ status: 1, department: 1 });
ExamSchema.index({ startDate: 1, endDate: 1 });

ExamSlotSchema.index({ examId: 1 });
QuestionSetSchema.index({ examId: 1, slotId: 1 });
QuestionSchema.index({ subject: 1, difficulty: 1 });

ExamAttemptSchema.index({ examId: 1, studentId: 1 });
ExamAttemptSchema.index({ status: 1, createdAt: -1 });
ExamAttemptSchema.index({ studentId: 1, createdAt: -1 });

ProctoringEventSchema.index({ examId: 1, eventType: 1, timestamp: -1 });
ProctoringEventSchema.index({ examAttemptId: 1 });
ProctoringEventSchema.index({ studentId: 1, timestamp: -1 });

SubmissionSchema.index({ examId: 1, studentId: 1, questionId: 1 });
SubmissionSchema.index({ attemptId: 1 });

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const User = getModel('User', UserSchema);
export const Exam = getModel('Exam', ExamSchema);
export const ExamSlot = getModel('ExamSlot', ExamSlotSchema);
export const QuestionSet = getModel('QuestionSet', QuestionSetSchema);
export const Question = getModel('Question', QuestionSchema);
export const ExamAttempt = getModel('ExamAttempt', ExamAttemptSchema);
export const ProctoringEvent = getModel('ProctoringEvent', ProctoringEventSchema);
export const Submission = getModel('Submission', SubmissionSchema);
export const Notification = getModel('Notification', NotificationSchema);
