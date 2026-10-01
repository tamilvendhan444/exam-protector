import express from 'express';
import { Exam, ExamAttempt, ProctoringEvent, User, Question } from '../models/schemas.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { runPlagiarismScanForExam } from '../services/plagiarismService.js';
import { getAttemptIntegrityProfile, calculateIntegrityMetrics } from '../services/integrityService.js';
import { generateExamResultsPDF } from '../services/pdfReportService.js';

const router = express.Router();

// Faculty dashboard overview
router.get('/dashboard', authenticate, requireRole('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const exams = await Exam.find({});
    const attempts = await ExamAttempt.find({});
    const incidents = await ProctoringEvent.find({});
    const students = await User.find({ role: 'STUDENT' });

    const activeExams = exams.filter(e => e.status === 'Active');

    return res.json({
      success: true,
      stats: {
        totalExams: exams.length,
        activeExams: activeExams.length,
        totalStudents: students.length,
        totalAttempts: attempts.length,
        totalIncidents: incidents.length,
        flaggedIncidents: incidents.filter(i => i.status === 'Confirmed' || i.severity === 'critical').length
      },
      recentExams: exams.slice(0, 5),
      recentIncidents: incidents.slice(-10).reverse()
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch faculty dashboard.' });
  }
});

// Live Monitoring Data for an Exam
router.get('/monitoring/:examId', authenticate, requireRole('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    const attempts = await ExamAttempt.find({ examId: req.params.examId });
    const incidents = await ProctoringEvent.find({ examId: req.params.examId });
    const studentIds = attempts.map(a => a.studentId);
    const users = await User.find({ _id: { $in: studentIds } });
    const { ExamSlot } = await import('../models/schemas.js');
    const slots = await ExamSlot.find({ examId: req.params.examId });

    const inProgress = attempts.filter(a => a.status === 'in_progress');

    // Aggregate status for in-progress only
    let normalCount = 0;
    let warningCount = 0;
    let incidentCount = 0;

    const studentCards = attempts.map(att => {
      const studentIncidents = incidents.filter(i => String(i.examAttemptId) === String(att._id || att.id));
      const status = att.proctoringSummary?.overallStatus || (studentIncidents.length >= 2 ? 'Warning' : 'Normal');

      if (att.status === 'in_progress') {
        if (status === 'Normal') normalCount++;
        else if (status === 'Warning') warningCount++;
        else incidentCount++;
      }

      const attemptedCount = (att.answers || []).filter(a => a.status === 'answered').length;
      const totalQ = (att.answers || []).length || 10;
      const progressPercent = Math.round((attemptedCount / totalQ) * 100);

      const user = users.find(u => String(u._id || u.id) === String(att.studentId));
      const slot = slots.find(s => String(s._id || s.id) === String(att.slotId));

      return {
        attemptId: att._id || att.id,
        studentId: att.studentId,
        studentName: att.studentName,
        studentEmail: att.studentEmail,
        rollNumber: user ? user.rollNumber : 'N/A',
        slotName: slot ? slot.slotName : 'Global',
        attemptStatus: att.status,
        startedTime: att.startTime || att.examStartedAt,
        submittedTime: att.endTime,
        score: att.totalScore || 0,
        status, // proctoring status
        incidentsCount: studentIncidents.length,
        remainingSeconds: att.remainingSeconds || (exam.durationMinutes * 60),
        progressPercent,
        questionsAttempted: `${attemptedCount}/${totalQ}`,
        lastIncident: studentIncidents.length > 0 ? studentIncidents[studentIncidents.length - 1] : null,
        proctoringBreakdown: {
          faceMissing: att.proctoringSummary?.faceMissingCount || 0,
          multipleFaces: att.proctoringSummary?.multipleFacesCount || 0,
          mobilePhone: att.proctoringSummary?.mobilePhoneCount || 0,
          lookingAway: att.proctoringSummary?.lookingAwayCount || 0,
          tabSwitches: att.proctoringSummary?.tabSwitchesCount || 0
        },
        livenessCheck: att.livenessCheck || null
      };
    });

    return res.json({
      success: true,
      exam,
      summary: {
        activeStudents: inProgress.length,
        normal: normalCount,
        warnings: warningCount,
        incidents: incidentCount,
        offline: 0
      },
      students: studentCards,
      recentIncidents: incidents.slice(-15).reverse()
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve monitoring feed.' });
  }
});

// Class Exam Analytics
router.get('/analytics/:examId', authenticate, requireRole('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    const attempts = await ExamAttempt.find({ examId: req.params.examId });
    const evaluated = attempts.filter(a => a.status === 'evaluated' || a.status === 'submitted');

    let totalScore = 0;
    let highestScore = 0;
    let lowestScore = 100;
    let passedCount = 0;

    const scoreDistribution = [
      { range: '0-40', count: 0 },
      { range: '41-60', count: 0 },
      { range: '61-80', count: 0 },
      { range: '81-100', count: 0 }
    ];

    evaluated.forEach(a => {
      const score = a.totalScore || 0;
      totalScore += score;
      if (score > highestScore) highestScore = score;
      if (score < lowestScore) lowestScore = score;
      if (score >= (exam.passingMarks || 40)) passedCount++;

      if (score <= 40) scoreDistribution[0].count++;
      else if (score <= 60) scoreDistribution[1].count++;
      else if (score <= 80) scoreDistribution[2].count++;
      else scoreDistribution[3].count++;
    });

    const averageScore = evaluated.length > 0 ? Math.round(totalScore / evaluated.length) : 0;
    const passRate = evaluated.length > 0 ? Math.round((passedCount / evaluated.length) * 100) : 0;

    return res.json({
      success: true,
      exam,
      metrics: {
        totalSubmissions: evaluated.length,
        averageScore,
        highestScore: evaluated.length ? highestScore : 0,
        lowestScore: evaluated.length ? lowestScore : 0,
        passRate,
        scoreDistribution
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve exam analytics.' });
  }
});

// All submissions for an exam with enriched integrity metrics
router.get('/submissions/:examId', authenticate, requireRole('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const attempts = await ExamAttempt.find({ examId: req.params.examId });
    const events = await ProctoringEvent.find({ examId: req.params.examId });

    const enrichedAttempts = attempts.map(att => {
      const attId = String(att._id || att.id);
      const studentEvents = events.filter(e => String(e.examAttemptId) === attId);
      const integrity = calculateIntegrityMetrics(att, studentEvents);

      return {
        ...att,
        integrityScore: integrity.score,
        integrityTier: integrity.tier,
        integrityBadge: integrity.badgeText,
        integrityColor: integrity.tierColor,
        integrityMetrics: integrity
      };
    });

    return res.json({ success: true, attempts: enrichedAttempts });
  } catch (err) {
    console.error('Error fetching submissions:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve submissions.' });
  }
});

// Run Plagiarism / Code Similarity Scan for an Exam
router.post('/similarity-check/:examId', authenticate, requireRole('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const threshold = req.body.threshold ? Number(req.body.threshold) : 65;
    const report = await runPlagiarismScanForExam(req.params.examId, threshold);

    return res.json({
      success: true,
      message: `Similarity scan complete: ${report.flaggedPairsCount} suspect pairs flagged.`,
      report
    });
  } catch (err) {
    console.error('Error running similarity check:', err);
    return res.status(500).json({ success: false, message: 'Plagiarism scan failed: ' + err.message });
  }
});

// Get Plagiarism Report / Flagged Pairs for an Exam
router.get('/similarity-report/:examId', authenticate, requireRole('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const events = await ProctoringEvent.find({
      examId: req.params.examId,
      eventType: 'code_plagiarism'
    });

    return res.json({
      success: true,
      flaggedCount: events.length,
      events
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to load similarity report.' });
  }
});

// Get Complete Post-Exam Integrity Dossier for a Student Attempt
router.get('/integrity-dossier/:attemptId', authenticate, requireRole('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const dossier = await getAttemptIntegrityProfile(req.params.attemptId);
    if (!dossier) {
      return res.status(404).json({ success: false, message: 'Attempt not found.' });
    }

    const exam = await Exam.findById(dossier.attempt.examId);
    const questions = await Question.find({ _id: { $in: exam?.questionIds || [] } });

    return res.json({
      success: true,
      exam,
      attempt: dossier.attempt,
      events: dossier.events,
      integrity: dossier.integrity,
      questions
    });
  } catch (err) {
    console.error('Error retrieving integrity dossier:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate integrity dossier.' });
  }
});

// Generate Class Results Report
router.get('/reports/:examId', authenticate, requireRole('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const { examId } = req.params;
    const { department, classSection, slotId, format } = req.query;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found.' });
    }

    // Role check for faculty
    if (req.user.role === 'FACULTY' && exam.createdBy && exam.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You are only authorized to generate reports for exams you created.' });
    }

    // Query attempts with filters
    const filter = { examId, status: { $in: ['submitted', 'evaluated'] } };
    if (slotId) filter.slotId = slotId;
    
    let attempts = await ExamAttempt.find(filter).lean();
    if (!attempts || attempts.length === 0) {
      return res.status(400).json({ success: false, message: 'No submissions available for this exam.' });
    }

    // Fetch related users to get roll numbers and apply dept/class filters
    const userIds = attempts.map(a => a.studentId);
    const users = await User.find({ _id: { $in: userIds } }).lean();
    const userMap = {};
    users.forEach(u => userMap[u._id.toString()] = u);

    // Filter attempts by user attributes
    if (department || classSection) {
      attempts = attempts.filter(a => {
        const u = userMap[a.studentId];
        if (!u) return false;
        if (department && u.department !== department) return false;
        if (classSection && u.classSection !== classSection) return false;
        return true;
      });
    }

    if (attempts.length === 0) {
      return res.status(400).json({ success: false, message: 'No submissions match the specified filters.' });
    }

    const totalQuestions = exam.questionIds?.length || 0;

    // Compute raw data
    let reportData = attempts.map(a => {
      const u = userMap[a.studentId];
      let attempted = 0;
      let marksScored = 0;
      let penalty = 0;

      if (a.answers && a.answers.length > 0) {
        attempted = a.answers.filter(ans => ans.status === 'answered').length;
        for (const ans of a.answers) {
          if (ans.score > 0) marksScored += ans.score;
          if (ans.score < 0) penalty += Math.abs(ans.score);
        }
      }

      const finalScore = marksScored - penalty;

      return {
        attemptId: a._id,
        studentId: a.studentId,
        rollNumber: u?.rollNumber || 'Unknown',
        name: u?.name || 'Unknown',
        department: u?.department || 'N/A',
        classSection: u?.classSection || 'N/A',
        questionsAttempted: attempted,
        totalQuestions: Math.max(attempted, totalQuestions),
        marksScored,
        penalty,
        finalScore,
        endTime: a.endTime || a.updatedAt
      };
    });

    // Sort by Final Score DESC, Penalty ASC, endTime ASC
    reportData.sort((a, b) => {
      if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
      if (a.penalty !== b.penalty) return a.penalty - b.penalty;
      return new Date(a.endTime) - new Date(b.endTime);
    });

    // Assign Rank (handling ties)
    let currentRank = 1;
    let actualRank = 1;
    for (let i = 0; i < reportData.length; i++) {
      if (i > 0) {
        const prev = reportData[i - 1];
        if (prev.finalScore === reportData[i].finalScore && prev.penalty === reportData[i].penalty) {
          reportData[i].rank = currentRank;
        } else {
          currentRank = actualRank;
          reportData[i].rank = currentRank;
        }
      } else {
        reportData[i].rank = 1;
      }
      actualRank++;
    }

    if (format === 'pdf') {
      const deptSuffix = department ? `_${department.replace(/\s+/g, '_')}` : '';
      const examDataForPdf = exam.toObject ? exam.toObject() : { ...exam };
      if (department) examDataForPdf.department = department;
      if (classSection) examDataForPdf.classSection = classSection;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${exam.title.replace(/\s+/g, '_')}${deptSuffix}_Report.pdf"`);
      await generateExamResultsPDF(examDataForPdf, reportData, res);
      return;
    }

    return res.json({
      success: true,
      report: reportData
    });

  } catch (err) {
    console.error('Error generating report:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate report.' });
  }
});

// Get Students with Exam Attempt Aggregation
router.get('/students', authenticate, requireRole('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const { search } = req.query;
    let students = await User.find({ role: 'STUDENT' });

    if (search) {
      const q = search.toLowerCase();
      students = students.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }

    const attempts = await ExamAttempt.find({ studentId: { $in: students.map(s => s._id || s.id) } });
    const exams = await Exam.find({});

    const sanitized = students.map(u => {
      const studentId = String(u._id || u.id);
      const studentAttempts = attempts.filter(a => String(a.studentId) === studentId);
      const completedAttempts = studentAttempts.filter(a => a.status === 'evaluated' || a.status === 'submitted');
      
      let mostRecentExam = null;
      if (completedAttempts.length > 0) {
        // Sort to get most recent
        completedAttempts.sort((a, b) => new Date(b.endTime || b.updatedAt) - new Date(a.endTime || a.updatedAt));
        const recent = completedAttempts[0];
        const examObj = exams.find(e => String(e._id || e.id) === String(recent.examId));
        mostRecentExam = {
          title: examObj ? examObj.title : 'Unknown Exam',
          score: recent.totalScore,
          total: recent.totalPossibleMarks
        };
      }

      return {
        id: studentId,
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department,
        rollNumber: u.rollNumber,
        avatar: u.avatar,
        isActive: u.isActive !== false,
        createdAt: u.createdAt,
        examsCompleted: completedAttempts.length,
        mostRecentExam
      };
    });

    return res.json({ success: true, students: sanitized, count: sanitized.length });
  } catch (err) {
    console.error('Error fetching faculty students:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve students.' });
  }
});

// Get Detailed Student Academic & Integrity Dossier
router.get('/students/:id/dossier', authenticate, requireRole('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const studentId = String(student._id || student.id);
    const attempts = await ExamAttempt.find({ studentId }).sort({ createdAt: -1 });
    const exams = await Exam.find({});
    const examMap = {};
    exams.forEach(e => { examMap[String(e._id || e.id)] = e; });

    let totalScore = 0;
    let totalPossible = 0;
    let totalIncidents = 0;

    const enrichedAttempts = attempts.map(a => {
      const exam = examMap[String(a.examId)];
      const incidents = a.proctoringSummary?.totalIncidents || 0;
      totalIncidents += incidents;
      if (a.status === 'evaluated' || a.status === 'submitted') {
        totalScore += (a.totalScore || 0);
        totalPossible += (a.totalPossibleMarks || 100);
      }
      return {
        id: String(a._id || a.id),
        examTitle: exam ? exam.title : 'Assessment',
        status: a.status,
        score: a.totalScore || 0,
        totalPossibleMarks: a.totalPossibleMarks || 100,
        accuracyPercentage: a.accuracyPercentage || 0,
        submittedAt: a.endTime || a.updatedAt,
        proctoringSummary: a.proctoringSummary || {},
        codingPerformance: a.codingPerformance || {}
      };
    });

    const averageScore = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
    const integrityTrustScore = Math.max(0, 100 - (totalIncidents * 4));

    return res.json({
      success: true,
      dossier: {
        student: {
          id: studentId,
          name: student.name,
          email: student.email,
          role: student.role,
          department: student.department || 'Computer Science',
          rollNumber: student.rollNumber || 'N/A',
          avatar: student.avatar,
          isActive: student.isActive !== false,
          createdAt: student.createdAt
        },
        stats: {
          totalAttempts: attempts.length,
          completedExams: attempts.filter(a => a.status === 'evaluated' || a.status === 'submitted').length,
          averageScore,
          totalIncidents,
          integrityTrustScore
        },
        attempts: enrichedAttempts
      }
    });
  } catch (err) {
    console.error('Error fetching student dossier:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve student dossier.' });
  }
});

export default router;
