import express from 'express';
import { Exam, Question, ExamAttempt, Submission, User, ProctoringEvent, ExamSlot, QuestionSet } from '../models/schemas.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { generatePerformanceAnalysis } from '../services/aiAnalyticsService.js';
import { evaluateSubmission } from '../services/codeExecutionService.js';
import { calculateIntegrityMetrics } from '../services/integrityService.js';
import { runPlagiarismScanForExam } from '../services/plagiarismService.js';
import { toPlainObject } from '../utils/toPlainObject.js';

const router = express.Router();

// List all exams
// List all exams with robust filtering, suggestions, and category counts
router.get('/', async (req, res) => {
  try {
    const { subject, difficulty, status, search } = req.query;

    // Fetch all exams from repository
    const allExams = await Exam.find({});

    let exams = allExams;

    // 1. Status Filter
    if (status && status !== 'undefined' && status !== 'null' && status !== 'all') {
      exams = exams.filter(e => (e.status || 'Active').toLowerCase() === status.toLowerCase());
    }

    // 2. Difficulty Filter (Case-insensitive)
    if (difficulty && difficulty !== 'undefined' && difficulty !== 'null' && difficulty !== 'all' && difficulty !== 'All Difficulties') {
      exams = exams.filter(e => e.difficulty && e.difficulty.toLowerCase() === difficulty.toLowerCase().trim());
    }

    // 3. Subject Filter (Case-insensitive substring match)
    if (subject && subject !== 'undefined' && subject !== 'null' && subject !== 'all' && subject !== 'All Subjects') {
      const subTerm = subject.toLowerCase().trim();
      exams = exams.filter(e => e.subject && (e.subject.toLowerCase() === subTerm || e.subject.toLowerCase().includes(subTerm)));
    }

    // 4. Free-text Search
    if (search && search.trim() && search !== 'undefined' && search !== 'null') {
      const q = search.toLowerCase().trim();
      exams = exams.filter(e =>
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.subject && e.subject.toLowerCase().includes(q)) ||
        (e.description && e.description.toLowerCase().includes(q))
      );
    }

    // 5. Build intelligent fallback suggestions if 0 results matched the combo
    let suggestions = [];
    if (exams.length === 0 && (subject || difficulty)) {
      if (subject && subject !== 'undefined' && subject !== 'null') {
        const subTerm = subject.toLowerCase().trim();
        suggestions = allExams.filter(e => e.subject && e.subject.toLowerCase().includes(subTerm));
      }
      if (suggestions.length === 0 && difficulty && difficulty !== 'undefined' && difficulty !== 'null') {
        suggestions = allExams.filter(e => e.difficulty && e.difficulty.toLowerCase() === difficulty.toLowerCase().trim());
      }
    }

    // 6. Aggregate subject & difficulty counts for dynamic frontend filters
    const subjectCounts = {};
    const difficultyCounts = {};
    allExams.forEach(e => {
      if (e.subject) {
        subjectCounts[e.subject] = (subjectCounts[e.subject] || 0) + 1;
      }
      if (e.difficulty) {
        difficultyCounts[e.difficulty] = (difficultyCounts[e.difficulty] || 0) + 1;
      }
    });

    return res.json({
      success: true,
      exams,
      totalAll: allExams.length,
      suggestions,
      availableSubjects: Object.keys(subjectCounts).map(name => ({ name, count: subjectCounts[name] })),
      availableDifficulties: Object.keys(difficultyCounts).map(name => ({ name, count: difficultyCounts[name] }))
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve exams.' });
  }
});

// Get single exam details
router.get('/:id', async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found.' });
    }

    // Fetch questions associated with this exam
    let questions = [];
    if (exam.questionIds && exam.questionIds.length > 0) {
      questions = await Question.find({ _id: { $in: exam.questionIds } });
    }

    return res.json({
      success: true,
      exam,
      questionCount: questions.length
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve exam details.' });
  }
});

// Get slots for an exam
router.get('/:id/slots', authenticate, requireRole('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const slots = await ExamSlot.find({ examId: req.params.id }).lean();
    
    // Add attempt stats
    const slotsWithStats = await Promise.all(slots.map(async (slot) => {
      const attempts = await ExamAttempt.find({ slotId: slot._id });
      const inProgressCount = attempts.filter(a => a.status === 'in_progress').length;
      const completedCount = attempts.filter(a => a.status === 'submitted' || a.status === 'evaluated').length;
      return { ...slot, inProgressCount, completedCount };
    }));
    
    return res.json({ success: true, slots: slotsWithStats });
  } catch (err) {
    console.error('Error fetching slots:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve slots.' });
  }
});

// Create new exam (Faculty & Admin)
router.post('/', authenticate, requireRole('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const {
      title,
      subject,
      department,
      classSection,
      session,
      description,
      durationMinutes = 60,
      totalMarks = 100,
      difficulty = 'Intermediate',
      startDate,
      endDate,
      negativeMarking = false,
      negativeMarksPerQuestion = 0.25,
      proctoringEnabled = true,
      proctoringSettings,
      questionIds = [],
      slots = []
    } = req.body;

    if (!title || !subject) {
      return res.status(400).json({ success: false, message: 'Title and subject are required.' });
    }

    if (!slots || slots.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one slot must be configured to publish the exam.' });
    }

    // Validate slots roll numbers
    // Sort slots by startRollNumber to easily check overlap
    slots.sort((a, b) => {
      const aStart = String(a.startRollNumber || '');
      const bStart = String(b.startRollNumber || '');
      return aStart.localeCompare(bStart);
    });
    
    for (let i = 0; i < slots.length - 1; i++) {
      const aMatch = (slots[i].endRollNumber || '').toUpperCase().trim().match(/^([A-Z0-9]+?)(\d+)$/);
      const bMatch = (slots[i+1].startRollNumber || '').toUpperCase().trim().match(/^([A-Z0-9]+?)(\d+)$/);
      
      if (aMatch && bMatch) {
        if (aMatch[1] === bMatch[1] && parseInt(aMatch[2], 10) >= parseInt(bMatch[2], 10)) {
          return res.status(400).json({ success: false, message: `Roll number overlap detected between slots: ${slots[i].slotName} and ${slots[i+1].slotName}` });
        }
      } else if (slots[i].endRollNumber >= slots[i+1].startRollNumber) {
        return res.status(400).json({ success: false, message: `Roll number overlap detected between slots: ${slots[i].slotName} and ${slots[i+1].slotName}` });
      }
    }

    const newExam = await Exam.create({
      title,
      subject,
      department,
      classSection,
      session,
      description,
      durationMinutes: Number(durationMinutes),
      totalMarks: Number(totalMarks),
      difficulty,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      negativeMarking,
      negativeMarksPerQuestion,
      proctoringEnabled,
      proctoringSettings: proctoringSettings || {
        faceDetection: true,
        multipleFaceDetection: true,
        objectDetection: true,
        headPoseDetection: true,
        tabSwitchDetection: true,
        fullscreenEnforced: true,
        sensitivity: 'Medium',
        maxWarningsBeforeFlag: 3
      },
      questionIds,
      createdBy: req.user.id,
      createdByName: req.user.name,
      status: 'Published'
    });

    if (slots && slots.length > 0) {
      for (const slot of slots) {
        // Create question set for the slot if it has questionIds
        let questionSetId = null;
        if (slot.questionIds && slot.questionIds.length > 0) {
          const rawQuestions = await Question.find({ _id: { $in: slot.questionIds } });
          const qset = await QuestionSet.create({
            examId: newExam._id || newExam.id,
            slotId: 'temp', // will update
            name: `${newExam.title} - ${slot.slotName} Questions`,
            questions: rawQuestions
          });
          questionSetId = qset._id || qset.id;
        }

        const newSlot = await ExamSlot.create({
          examId: newExam._id || newExam.id,
          slotName: slot.slotName,
          session: slot.session || session,
          duration: Number(slot.duration),
          startRollNumber: slot.startRollNumber,
          endRollNumber: slot.endRollNumber,
          questionSetId
        });

        if (questionSetId) {
          await QuestionSet.findByIdAndUpdate(questionSetId, { slotId: newSlot._id || newSlot.id });
        }
      }
    }

    const io = req.app.get('io');
    if (io) io.emit('exam:created', newExam);

    return res.status(201).json({ success: true, message: 'Exam created successfully', exam: newExam });
  } catch (err) {
    console.error('Error creating exam:', err);
    return res.status(500).json({ success: false, message: 'Failed to create exam.' });
  }
});

// Update existing exam (Faculty & Admin)
router.put('/:id', authenticate, requireRole('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const updated = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Exam not found.' });
    }

    const io = req.app.get('io');
    if (io) io.emit('exam:updated', updated);

    return res.json({ success: true, message: 'Exam updated successfully', exam: updated });
  } catch (err) {
    console.error('Error updating exam:', err);
    return res.status(500).json({ success: false, message: 'Failed to update exam.' });
  }
});

// Update existing exam slot (Faculty & Admin)
router.patch('/:examId/slots/:slotId', authenticate, requireRole('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const { examId, slotId } = req.params;
    const { startTime, endTime, duration, startRollNumber, endRollNumber } = req.body;

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found.' });
    if (req.user.role !== 'ADMIN' && String(exam.createdBy) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Only the creator can edit slots.' });
    }

    const slot = await ExamSlot.findOne({ _id: slotId, examId });
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found.' });

    // Validation
    const effectiveStartRoll = startRollNumber || slot.startRollNumber;
    const effectiveEndRoll = endRollNumber || slot.endRollNumber;
    
    const startMatch = String(effectiveStartRoll).toUpperCase().trim().match(/^([A-Z0-9]+?)(\d+)$/);
    const endMatch = String(effectiveEndRoll).toUpperCase().trim().match(/^([A-Z0-9]+?)(\d+)$/);
    
    if (!startMatch || !endMatch || startMatch[1] !== endMatch[1] || parseInt(startMatch[2], 10) > parseInt(endMatch[2], 10)) {
      return res.status(400).json({ success: false, message: 'Invalid roll number range. Start roll number must be <= end roll number and prefixes must match.' });
    }

    // Check overlap with OTHER slots
    const otherSlots = await ExamSlot.find({ examId, _id: { $ne: slotId } });
    const newStartPrefix = startMatch[1];
    const newStartNum = parseInt(startMatch[2], 10);
    const newEndNum = parseInt(endMatch[2], 10);
    
    for (const other of otherSlots) {
       const oStartMatch = String(other.startRollNumber || '').toUpperCase().trim().match(/^([A-Z0-9]+?)(\d+)$/);
       const oEndMatch = String(other.endRollNumber || '').toUpperCase().trim().match(/^([A-Z0-9]+?)(\d+)$/);
       if (oStartMatch && oEndMatch && oStartMatch[1] === newStartPrefix) {
         const oStartNum = parseInt(oStartMatch[2], 10);
         const oEndNum = parseInt(oEndMatch[2], 10);
         if ((newStartNum >= oStartNum && newStartNum <= oEndNum) || 
             (newEndNum >= oStartNum && newEndNum <= oEndNum) || 
             (newStartNum <= oStartNum && newEndNum >= oEndNum)) {
           return res.status(400).json({ success: false, message: `Roll number range overlaps with another slot: ${other.slotName}` });
         }
       }
    }

    if ((duration !== undefined ? duration : slot.duration) <= 0) {
      return res.status(400).json({ success: false, message: 'Duration must be positive.' });
    }

    // Protection logic for active attempts
    const attempts = await ExamAttempt.find({ slotId });
    const inProgressCount = attempts.filter(a => a.status === 'in_progress').length;
    
    let changingTiming = false;
    if (duration && Number(duration) !== Number(slot.duration)) changingTiming = true;

    if (inProgressCount > 0 && changingTiming) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot change duration while students are actively attempting this slot. ${inProgressCount} student(s) currently in progress.` 
      });
    }

    const previousValues = {
      duration: slot.duration,
      startRollNumber: slot.startRollNumber,
      endRollNumber: slot.endRollNumber
    };

    if (duration) slot.duration = Number(duration);
    if (startRollNumber) slot.startRollNumber = startRollNumber;
    if (endRollNumber) slot.endRollNumber = endRollNumber;

    const newValues = {
      duration: slot.duration,
      startRollNumber: slot.startRollNumber,
      endRollNumber: slot.endRollNumber
    };

    slot.editHistory = slot.editHistory || [];
    slot.editHistory.push({
      editedBy: req.user.id,
      editedAt: new Date(),
      previousValues,
      newValues
    });

    await slot.save();
    return res.json({ success: true, message: 'Slot updated successfully.', slot });
  } catch (err) {
    console.error('Error updating slot:', err);
    return res.status(500).json({ success: false, message: 'Failed to update slot.' });
  }
});

// Delete exam (Faculty & Admin)
router.delete('/:id', authenticate, requireRole('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    await Exam.deleteOne({ _id: req.params.id });
    const io = req.app.get('io');
    if (io) io.emit('exam:deleted', { id: req.params.id });

    return res.json({ success: true, message: 'Exam deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete exam.' });
  }
});

// Helper for roll number validation
async function validateRollNumberForExam(examId, rollNumber, userId) {
  if (!rollNumber) {
    return { success: false, status: 400, message: 'Roll number is required.' };
  }
  rollNumber = rollNumber.toUpperCase().trim();

  // 1. Roll number format is valid (matches expected pattern)
  const match = rollNumber.match(/^([A-Z0-9_\-]+?)(\d+)$/);
  if (!match) {
    return { success: false, status: 400, message: 'Invalid roll number format. Example: 24AD235 or CS2026-001' };
  }
  const [_, prefix, numericStr] = match;
  const studentNum = parseInt(numericStr, 10);

  // 2. A student record exists with this roll number
  const student = await User.findOne({ rollNumber: rollNumber, role: 'STUDENT' });
  if (!student) {
    return { success: false, status: 404, message: 'No student record exists with this roll number.' };
  }
  
  // Ensure the logged in user is the one accessing
   if (student._id.toString() !== userId.toString()) {
    return { success: false, status: 403, message: 'This roll number does not match your account.' };
  }

  // 3. Find the exam's configured slots and check which slot's roll-number range contains this roll number
  const slots = await ExamSlot.find({ examId });
  if (!slots || slots.length === 0) {
    return {
      success: true,
      slotId: null,
      questionSetId: null,
      duration: 60,
      studentId: student._id,
      rollNumber: student.rollNumber
    };
  }

  let matchingSlot = null;
  for (const slot of slots) {
    const startMatch = (slot.startRollNumber || '').toUpperCase().trim().match(/^([A-Z0-9]+?)(\d+)$/);
    const endMatch = (slot.endRollNumber || '').toUpperCase().trim().match(/^([A-Z0-9]+?)(\d+)$/);
    
    if (startMatch && endMatch) {
      const startPrefix = startMatch[1];
      const startNum = parseInt(startMatch[2], 10);
      const endPrefix = endMatch[1];
      const endNum = parseInt(endMatch[2], 10);
      
      if (prefix === startPrefix && prefix === endPrefix) {
        if (studentNum >= startNum && studentNum <= endNum) {
          matchingSlot = slot;
          break;
        }
      }
    }
  }

  if (!matchingSlot) {
    return { success: false, status: 403, message: 'This roll number is not assigned to any slot for this examination.' };
  }

  // Timing check removed.

  // 5. Check if already submitted
  const attempt = await ExamAttempt.findOne({
    examId,
    studentId: student._id
  });
  
  if (attempt && (attempt.attemptStatus === 'submitted' || attempt.attemptStatus === 'evaluated')) {
    return { success: false, status: 403, message: 'You have already submitted this examination.' };
  }

  return {
    success: true,
    slotId: matchingSlot._id,
    questionSetId: matchingSlot.questionSetId,
    duration: matchingSlot.duration,
    studentId: student._id,
    rollNumber: student.rollNumber
  };
}
// Validate roll number and assign slot
router.post('/:id/validate-roll-number', authenticate, requireRole('STUDENT'), async (req, res) => {
  try {
    const { id } = req.params;
    const { rollNumber } = req.body;
    
    const result = await validateRollNumberForExam(id, rollNumber, req.user.userId || req.user.id);
    
    if (!result.success) {
      return res.status(result.status).json({ success: false, message: result.message });
    }

    return res.json({
      success: true,
      slotId: result.slotId,
      questionSetId: result.questionSetId
    });

  } catch (err) {
    console.error('Validation error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

router.post('/:id/liveness-check', authenticate, requireRole('STUDENT'), async (req, res) => {
  try {
    const examId = req.params.id;
    const studentId = req.user.id;
    const { livenessCheck } = req.body;

    if (!livenessCheck) {
      return res.status(400).json({ success: false, message: 'Liveness check data is required.' });
    }

    // Find any existing in_progress or latest attempt for this student
    let attempt = await ExamAttempt.findOne({ examId, studentId, status: 'in_progress' });
    if (!attempt) {
      attempt = await ExamAttempt.findOne({ examId, studentId });
    }
    if (attempt) {
      attempt.livenessCheck = livenessCheck;
      await ExamAttempt.findByIdAndUpdate(attempt._id || attempt.id, { livenessCheck });
    }

    return res.json({
      success: true,
      message: 'Liveness check telemetry recorded successfully.',
      livenessCheck,
      attemptId: attempt?._id || attempt?.id
    });
  } catch (err) {
    console.error('Error saving liveness check telemetry:', err);
    return res.status(500).json({ success: false, message: 'Failed to record liveness check.' });
  }
});

// Start an exam attempt (Student)
router.post('/:id/start', authenticate, requireRole('STUDENT'), async (req, res) => {
  try {
    const examId = req.params.id;
    const studentId = req.user.id;
    const { rollNumber: userRollNumber, department } = req.user;
    const { livenessCheck, rollNumber = userRollNumber } = req.body || {};

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found.' });
    }

    const result = await validateRollNumberForExam(examId, rollNumber, req.user.id || req.user.userId);
    if (!result.success) {
      return res.status(result.status).json({ success: false, message: result.message });
    }

    const currentSlot = { _id: result.slotId, questionSetId: result.questionSetId, duration: result.duration };

    // Check if an existing attempt exists
    let attempt = await ExamAttempt.findOne({ examId, studentId });
    if (attempt && attempt.status !== 'in_progress') {
       return res.status(403).json({ success: false, message: 'You have already submitted this exam.' });
    }

    // Fetch questions
    let questions = [];
    if (currentSlot && currentSlot.questionSetId) {
      const qset = await QuestionSet.findById(currentSlot.questionSetId);
      if (qset && qset.questions) {
        // Mock mapping since QuestionSet might contain embedded questions or IDs. 
        // Assuming embedded questions based on schema: `questions: [QuestionSchema]`
        questions = qset.questions.map(q => ({
          id: q._id || q.id,
          _id: q._id || q.id,
          title: q.title,
          description: q.description,
          type: q.type,
          subject: q.subject,
          topic: q.topic,
          difficulty: q.difficulty,
          marks: q.marks,
          negativeMarks: q.negativeMarks,
          options: q.options,
          isMultipleChoice: q.isMultipleChoice,
          inputFormat: q.inputFormat,
          outputFormat: q.outputFormat,
          constraints: q.constraints,
          examples: q.examples,
          starterCode: q.starterCode,
          testCases: (q.testCases || []).filter(tc => !tc.isHidden),
          timeLimitMs: q.timeLimitMs,
          memoryLimitMb: q.memoryLimitMb,
          minWords: q.minWords,
          maxWords: q.maxWords
        }));
      }
    } else if (exam.questionIds && exam.questionIds.length > 0) {
      const rawQuestions = await Question.find({ _id: { $in: exam.questionIds } });
      questions = rawQuestions.map(q => ({
        id: q._id || q.id,
        _id: q._id || q.id,
        title: q.title,
        description: q.description,
        type: q.type,
        subject: q.subject,
        topic: q.topic,
        difficulty: q.difficulty,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        options: q.options,
        isMultipleChoice: q.isMultipleChoice,
        inputFormat: q.inputFormat,
        outputFormat: q.outputFormat,
        constraints: q.constraints,
        examples: q.examples,
        starterCode: q.starterCode,
        testCases: (q.testCases || []).filter(tc => !tc.isHidden),
        timeLimitMs: q.timeLimitMs,
        memoryLimitMb: q.memoryLimitMb,
        minWords: q.minWords,
        maxWords: q.maxWords
      }));
    }

    if (attempt && attempt.answers) {
      // Security: verify studentId matches token
      if (String(attempt.studentId) !== String(req.user.id)) {
        return res.status(403).json({ success: false, message: 'Forbidden access to another attempt.' });
      }

      let changed = false;
      for (const ans of attempt.answers) {
        if (ans.type === 'coding' && ans.codeAnswer) {
          if (ans.codeAnswer.includes('stringstream') ||
            ans.codeAnswer.includes('getline(cin') ||
            ans.codeAnswer.includes('unordered_map<int, int> seen') ||
            ans.codeAnswer.includes('curr_max = max') ||
            ans.codeAnswer.includes('int main()')) {
            const q = questions.find(x => String(x.id || x._id) === String(ans.questionId));
            if (q && q.starterCode) {
              const lang = ans.language || 'cpp';
              ans.codeAnswer = q.starterCode[lang] || q.starterCode.cpp || '';
              ans.status = 'unanswered';
              changed = true;
            }
          }
        }
      }
      if (changed) {
        await ExamAttempt.findByIdAndUpdate(attempt._id || attempt.id, { answers: attempt.answers });
      }
    }

    if (attempt && livenessCheck) {
      attempt.livenessCheck = livenessCheck;
      await ExamAttempt.findByIdAndUpdate(attempt._id || attempt.id, { livenessCheck });
    }

    if (!attempt) {
      const initialAnswers = questions.map(q => ({
        questionId: q._id || q.id,
        type: q.type,
        selectedOptionIds: [],
        codeAnswer: q.starterCode?.cpp || q.starterCode?.python || q.starterCode?.javascript || '',
        language: q.type === 'coding' ? 'cpp' : undefined,
        descriptiveAnswer: '',
        status: 'unanswered',
        score: 0,
        passedTestCases: 0,
        totalTestCases: 0
      }));

      const durationToUse = ((currentSlot && currentSlot.duration) ? currentSlot.duration : exam.durationMinutes) || 60;
      const examStartedAt = new Date();
      const expiresAt = new Date(examStartedAt.getTime() + durationToUse * 60000);

      attempt = await ExamAttempt.create({
        examId,
        slotId: currentSlot ? currentSlot._id || currentSlot.id : undefined,
        studentId,
        studentName: req.user.name,
        studentEmail: req.user.email,
        startTime: examStartedAt,
        examStartedAt,
        expiresAt,
        status: 'in_progress',
        remainingSeconds: durationToUse * 60,
        answers: initialAnswers,
        totalPossibleMarks: exam.totalMarks || 100,
        proctoringSummary: {
          totalIncidents: 0,
          mobilePhoneCount: 0,
          multipleFacesCount: 0,
          faceMissingCount: 0,
          lookingAwayCount: 0,
          tabSwitchesCount: 0,
          warningsSent: 0,
          overallStatus: 'Normal'
        },
        livenessCheck: livenessCheck || undefined
      });
    }

    // Authoritative remaining time computation
    let authoritativeRemaining = attempt.remainingSeconds;
    if (attempt.expiresAt) {
      const diffSec = Math.floor((new Date(attempt.expiresAt) - new Date()) / 1000);
      if (diffSec <= 0 && attempt.remainingSeconds > 60) {
        // Sync expiresAt so stale attempt doesn't expire immediately upon restart
        attempt.expiresAt = new Date(Date.now() + attempt.remainingSeconds * 1000);
        await ExamAttempt.findByIdAndUpdate(attempt._id || attempt.id, { expiresAt: attempt.expiresAt });
        authoritativeRemaining = attempt.remainingSeconds;
      } else {
        authoritativeRemaining = Math.max(0, diffSec);
      }
    }

    return res.json({
      success: true,
      attempt: { ...toPlainObject(attempt), remainingSeconds: authoritativeRemaining },
      exam,
      questions
    });
  } catch (err) {
    console.error('Error starting exam:', err);
    return res.status(500).json({ success: false, message: 'Failed to start examination. Error: ' + err.message });
  }
});

// Auto-save student answer draft
router.post('/:id/autosave', authenticate, requireRole('STUDENT'), async (req, res) => {
  try {
    const { attemptId, questionId, selectedOptionIds, codeAnswer, language, descriptiveAnswer, status } = req.body;

    if (!attemptId || !questionId) {
      return res.status(400).json({ success: false, message: 'AttemptId and QuestionId required.' });
    }

    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt || attempt.status !== 'in_progress') {
      return res.status(400).json({ success: false, message: 'Valid active attempt required.' });
    }

    // Anti-tampering check
    if (String(attempt.studentId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Forbidden access to another attempt.' });
    }

    const answers = attempt.answers || [];
    const idx = answers.findIndex(a => String(a.questionId) === String(questionId));

    const updatedAns = {
      questionId,
      selectedOptionIds: selectedOptionIds !== undefined ? selectedOptionIds : (idx !== -1 ? answers[idx].selectedOptionIds : []),
      codeAnswer: codeAnswer !== undefined ? codeAnswer : (idx !== -1 ? answers[idx].codeAnswer : ''),
      language: language !== undefined ? language : (idx !== -1 ? answers[idx].language : 'cpp'),
      descriptiveAnswer: descriptiveAnswer !== undefined ? descriptiveAnswer : (idx !== -1 ? answers[idx].descriptiveAnswer : ''),
      status: status || (idx !== -1 ? answers[idx].status : 'answered'),
      timeSpentSeconds: req.body.timeSpentSeconds !== undefined ? req.body.timeSpentSeconds : (idx !== -1 ? (answers[idx].timeSpentSeconds || 0) : 0),
      autoSavedAt: new Date()
    };

    if (idx !== -1) {
      answers[idx] = { ...answers[idx], ...updatedAns };
    } else {
      answers.push(updatedAns);
    }

    // Authoritative remaining time
    let authoritativeRemaining = attempt.remainingSeconds;
    let isExpired = false;
    const clientRemaining = req.body.remainingSeconds !== undefined ? Number(req.body.remainingSeconds) : undefined;

    if (attempt.expiresAt) {
      const diffSec = Math.floor((new Date(attempt.expiresAt) - new Date()) / 1000);
      if (diffSec <= 0) {
        if (clientRemaining !== undefined && clientRemaining > 10) {
          // Avoid premature closure if client clock skew occurs
          attempt.expiresAt = new Date(Date.now() + clientRemaining * 1000);
          authoritativeRemaining = clientRemaining;
          await ExamAttempt.findByIdAndUpdate(attemptId, { expiresAt: attempt.expiresAt });
        } else {
          isExpired = true;
          authoritativeRemaining = 0;
        }
      } else {
        authoritativeRemaining = diffSec;
      }
    }

    await ExamAttempt.findByIdAndUpdate(attemptId, {
      answers,
      remainingSeconds: authoritativeRemaining
    });

    if (isExpired) {
      console.log('[DEBUG-FORCE-SUBMIT] autoSave returned forceSubmit: true');
      return res.json({ success: true, message: 'Exam expired', forceSubmit: true, remainingSeconds: 0 });
    }

    return res.json({ success: true, message: 'Auto-saved successfully', savedAt: new Date().toISOString(), remainingSeconds: authoritativeRemaining });
  } catch (err) {
    console.error('Auto-save error:', err);
    return res.status(500).json({ success: false, message: 'Auto-save failed.' });
  }
});

// Submit Exam & Auto-Assessment
router.post('/:id/submit', authenticate, requireRole('STUDENT'), async (req, res) => {
  try {
    const { attemptId, answers = [] } = req.body;
    const examId = req.params.id;

    const exam = await Exam.findById(examId);
    const attempt = await ExamAttempt.findById(attemptId);

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Attempt not found.' });
    }

    // Anti-tampering check
    if (String(attempt.studentId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Forbidden access to another attempt.' });
    }

    let rawQuestions = [];
    if (attempt.slotId) {
      const slot = await ExamSlot.findById(attempt.slotId);
      if (slot && slot.questionSetId) {
        const qset = await QuestionSet.findById(slot.questionSetId);
        if (qset && qset.questions) {
          rawQuestions = qset.questions;
        }
      }
    } else if (exam.questionIds && exam.questionIds.length > 0) {
      rawQuestions = await Question.find({ _id: { $in: exam.questionIds } });
    }

    let totalScore = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let unattemptedCount = 0;
    let problemsSolved = 0;
    let totalProblems = 0;
    let codingPassedTestCases = 0;
    let codingTotalTestCases = 0;

    const evaluatedAnswers = [];

    for (const q of rawQuestions) {
      const qIdStr = String(q._id || q.id);
      const studentAns = answers.find(a => String(a.questionId) === qIdStr) ||
        (attempt.answers || []).find(a => String(a.questionId) === qIdStr);

      const codeVal = studentAns?.codeAnswer || studentAns?.code || '';
      const maxMarks = q.marks || 10;
      let earnedMarks = 0;
      let isCorrect = false;
      let status = 'unanswered';

      if (!studentAns || studentAns.status === 'unanswered' ||
        (!studentAns.selectedOptionIds?.length && !codeVal.trim() && !studentAns.descriptiveAnswer?.trim())) {
        unattemptedCount += 1;
        evaluatedAnswers.push({
          questionId: qIdStr,
          questionTitle: q.title || `Question`,
          type: q.type,
          status: 'unanswered',
          score: 0,
          isCorrect: false,
          timeSpentSeconds: studentAns?.timeSpentSeconds || 0
        });
        continue;
      }

      status = 'answered';

      if (q.type === 'mcq') {
        const correctSet = new Set(q.correctOptionIds || []);
        const selectedSet = new Set(studentAns.selectedOptionIds || []);

        let match = correctSet.size === selectedSet.size && [...correctSet].every(id => selectedSet.has(id));
        if (match) {
          isCorrect = true;
          earnedMarks = maxMarks;
          correctCount += 1;
        } else {
          isCorrect = false;
          wrongCount += 1;
          if (exam.negativeMarking) {
            earnedMarks = -(exam.negativeMarksPerQuestion || 0.25) * maxMarks;
          }
        }
      } else if (q.type === 'coding') {
        totalProblems += 1;
        const totalTC = (q.testCases || []).length || 1;
        codingTotalTestCases += totalTC;

        // If student submitted code, evaluate test cases
        if (codeVal.trim().length > 10) {
          try {
            const evalResult = await evaluateSubmission({
              studentId: req.user.id,
              examId,
              attemptId,
              questionId: qIdStr,
              code: codeVal,
              language: studentAns.language || 'cpp'
            });

            earnedMarks = evalResult.earnedMarks;
            codingPassedTestCases += evalResult.passedTestCases;
            if (evalResult.allPassed) {
              isCorrect = true;
              correctCount += 1;
              problemsSolved += 1;
            } else if (evalResult.passedTestCases > 0) {
              isCorrect = false;
              // Partial credit
            } else {
              isCorrect = false;
              wrongCount += 1;
            }
          } catch (e) {
            // Execution timeout or error
            earnedMarks = 0;
            wrongCount += 1;
          }
        } else {
          wrongCount += 1;
        }
      } else if (q.type === 'descriptive') {
        // Descriptive auto-rubric grading
        const text = studentAns.descriptiveAnswer || '';
        const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
        if (wordCount >= (q.minWords || 30)) {
          earnedMarks = Math.round(maxMarks * 0.85); // Evaluated baseline
          isCorrect = true;
          correctCount += 1;
        } else if (wordCount > 10) {
          earnedMarks = Math.round(maxMarks * 0.5);
          correctCount += 1;
        } else {
          wrongCount += 1;
        }
      }

      totalScore += Math.max(0, earnedMarks);
      evaluatedAnswers.push({
        questionId: qIdStr,
        questionTitle: q.title || `Question`,
        type: q.type,
        selectedOptionIds: studentAns.selectedOptionIds,
        codeAnswer: codeVal,
        code: codeVal,
        language: studentAns.language,
        descriptiveAnswer: studentAns.descriptiveAnswer,
        status,
        score: earnedMarks,
        isCorrect,
        timeSpentSeconds: studentAns.timeSpentSeconds || 0
      });
    }

    const totalPossible = exam.totalMarks || 100;
    const attemptedCount = correctCount + wrongCount;
    const accuracyPercentage = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

    // AI Performance Analysis
    const aiAnalysis = generatePerformanceAnalysis({
      attempt: { answers: evaluatedAnswers, codingPerformance: { problemsSolved, totalProblems } },
      questions: rawQuestions
    });

    let isExpired = false;
    if (attempt.expiresAt && new Date() >= new Date(attempt.expiresAt)) {
      isExpired = true;
    }

    const submissionType = isExpired ? 'auto' : 'manual';

    const updatedAttempt = await ExamAttempt.findByIdAndUpdate(attemptId, {
      status: 'evaluated',
      endTime: new Date(),
      submissionType,
      answers: evaluatedAnswers,
      evaluatedAnswers: evaluatedAnswers,
      totalScore: Math.round(totalScore),
      totalPossibleMarks: totalPossible,
      accuracyPercentage,
      correctCount,
      wrongCount,
      unattemptedCount,
      codingPerformance: {
        problemsSolved,
        totalProblems,
        passedTestCases: codingPassedTestCases,
        totalTestCases: codingTotalTestCases,
        compilationErrors: 0,
        submissionCount: 1
      },
      aiAnalysis
    }, { new: true });

    // Run similarity check in background for any coding problems in this exam
    runPlagiarismScanForExam(examId, 65).catch(err => console.warn('[Auto-Plagiarism] Scan notice:', err.message));

    // Calculate integrity metrics for the newly submitted attempt
    const proctorEvents = await ProctoringEvent.find({ examAttemptId: String(attemptId) });
    const integrityMetrics = calculateIntegrityMetrics(updatedAttempt, proctorEvents);

    // Persist final integrity score to attempt
    if (updatedAttempt.proctoringSummary) {
      const summary = {
        ...updatedAttempt.proctoringSummary,
        integrityScore: integrityMetrics.score,
        integrityTier: integrityMetrics.tier === 'High Risk' ? 'High Risk' : (integrityMetrics.tier === 'Review Advised' ? 'Review Advised' : 'Clean')
      };
      await ExamAttempt.findByIdAndUpdate(attemptId, { proctoringSummary: summary });
    }

    // Update student profile streak & statistics
    const user = await User.findById(req.user.id);
    if (user) {
      await User.findByIdAndUpdate(req.user.id, {
        streak: (user.streak || 0) + 1
      });
    }

    return res.json({
      success: true,
      message: 'Examination submitted successfully',
      attemptId,
      attempt: updatedAttempt,
      result: {
        totalScore: Math.round(totalScore),
        totalPossibleMarks: totalPossible,
        accuracyPercentage,
        correctCount,
        wrongCount,
        unattemptedCount,
        codingPerformance: {
          problemsSolved,
          totalProblems,
          passedTestCases: codingPassedTestCases,
          totalTestCases: codingTotalTestCases
        },
        aiAnalysis,
        integrity: integrityMetrics
      }
    });
  } catch (err) {
    console.error('Error submitting exam:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit examination.' });
  }
});

// Get detailed assessment attempt result
router.get('/attempts/:attemptId', authenticate, async (req, res) => {
  try {
    const attempt = await ExamAttempt.findById(req.params.attemptId);
    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Attempt not found.' });
    }

    const exam = await Exam.findById(attempt.examId);
    const questions = await Question.find({ _id: { $in: exam?.questionIds || [] } });

    // Proctoring incident events for this attempt
    const proctorEvents = await ProctoringEvent.find({ examAttemptId: String(attempt._id || attempt.id) });

    // Compute composite integrity metrics
    const integrityMetrics = calculateIntegrityMetrics(attempt, proctorEvents);

    return res.json({
      success: true,
      attempt,
      exam,
      questions,
      proctorEvents,
      integrity: integrityMetrics
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve attempt result.' });
  }
});

export default router;
