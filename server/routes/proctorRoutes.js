import express from 'express';
import { ProctoringEvent, ExamAttempt } from '../models/schemas.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { processEvidenceSnapshot } from '../services/evidenceStorageService.js';

const router = express.Router();

// Record a detected proctoring incident
router.post('/event', authenticate, async (req, res) => {
  try {
    const {
      eventType,
      severity = 'medium',
      confidence = 0.88,
      details,
      evidenceSnapshot,
      durationSeconds = 0,
      metadata
    } = req.body;

    let targetExamId = req.body.examId;
    const targetAttemptId = req.body.attemptId || req.body.examAttemptId;

    if (!targetExamId && targetAttemptId) {
      const att = await ExamAttempt.findById(targetAttemptId);
      if (att) targetExamId = att.examId;
    }

    if (!targetExamId || !eventType) {
      return res.status(400).json({ success: false, message: 'ExamId and eventType are required.' });
    }

    const eventId = 'ev_' + Math.random().toString(36).substr(2, 9);
    const sanitizedSnapshot = await processEvidenceSnapshot(evidenceSnapshot, eventId);

    const event = await ProctoringEvent.create({
      eventId,
      examId: targetExamId,
      examAttemptId: targetAttemptId,
      studentId: req.user.id,
      studentName: req.user.name,
      eventType,
      severity,
      confidence,
      details: details || `Potential ${eventType.replace(/_/g, ' ')} detected`,
      evidenceSnapshot: sanitizedSnapshot,
      metadata,
      durationSeconds,
      status: 'New'
    });

    // Update attempt statistics
    if (targetAttemptId) {
      const attempt = await ExamAttempt.findById(targetAttemptId);
      if (attempt) {
        const summary = attempt.proctoringSummary || {};
        summary.totalIncidents = (summary.totalIncidents || 0) + 1;
        if (eventType === 'mobile_phone') summary.mobilePhoneCount = (summary.mobilePhoneCount || 0) + 1;
        if (eventType === 'multiple_faces') summary.multipleFacesCount = (summary.multipleFacesCount || 0) + 1;
        if (eventType === 'face_missing') summary.faceMissingCount = (summary.faceMissingCount || 0) + 1;
        if (eventType === 'looking_away') summary.lookingAwayCount = (summary.lookingAwayCount || 0) + 1;
        if (eventType === 'tab_switch') summary.tabSwitchesCount = (summary.tabSwitchesCount || 0) + 1;
        if (eventType === 'fullscreen_exit') summary.fullscreenExitsCount = (summary.fullscreenExitsCount || 0) + 1;
        if (eventType === 'clipboard_blocked') summary.clipboardBlockedCount = (summary.clipboardBlockedCount || 0) + 1;
        if (eventType === 'multiple_displays') summary.multipleDisplaysCount = (summary.multipleDisplaysCount || 0) + 1;
        if (eventType === 'devtools_open') summary.devtoolsOpenCount = (summary.devtoolsOpenCount || 0) + 1;
        if (eventType === 'contextmenu_blocked') summary.contextMenuBlockedCount = (summary.contextMenuBlockedCount || 0) + 1;
        if (eventType === 'candidate_idle') summary.idleCount = (summary.idleCount || 0) + 1;
        if (eventType === 'network_gap') summary.networkDisconnectionsCount = (summary.networkDisconnectionsCount || 0) + 1;
        if (eventType === 'suspicious_paste') summary.suspiciousPastesCount = (summary.suspiciousPastesCount || 0) + 1;
        if (eventType === 'typing_burst') summary.typingBurstsCount = (summary.typingBurstsCount || 0) + 1;
        if (eventType === 'code_plagiarism') summary.plagiarismFlagsCount = (summary.plagiarismFlagsCount || 0) + 1;

        if (summary.totalIncidents >= 3 || severity === 'critical') {
          summary.overallStatus = 'Incident';
        } else if (summary.totalIncidents >= 1) {
          summary.overallStatus = 'Warning';
        }

        // Dynamically recalculate integrity score
        let rawScore = 100
          - ((summary.mobilePhoneCount || 0) * 25)
          - ((summary.multipleFacesCount || 0) * 20)
          - ((summary.faceMissingCount || 0) * 8)
          - ((summary.tabSwitchesCount || 0) * 8)
          - ((summary.fullscreenExitsCount || 0) * 8)
          - ((summary.clipboardBlockedCount || 0) * 10)
          - ((summary.multipleDisplaysCount || 0) * 20)
          - ((summary.devtoolsOpenCount || 0) * 25)
          - ((summary.contextMenuBlockedCount || 0) * 5)
          - ((summary.idleCount || 0) * 8)
          - ((summary.networkDisconnectionsCount || 0) * 10)
          - ((summary.suspiciousPastesCount || 0) * 12)
          - ((summary.typingBurstsCount || 0) * 10)
          - ((summary.plagiarismFlagsCount || 0) * 35);

        summary.integrityScore = Math.max(0, Math.min(100, rawScore));
        summary.integrityTier = summary.integrityScore < 65 ? 'High Risk' : (summary.integrityScore < 88 ? 'Review Advised' : 'Clean');

        await ExamAttempt.findByIdAndUpdate(targetAttemptId, { proctoringSummary: summary });
      }
    }

    // Broadcast to faculty monitoring room
    const io = req.app.get('io');
    if (io) {
      const payload = {
        studentId: req.user.id,
        studentName: req.user.name,
        attemptId: targetAttemptId,
        status: severity === 'critical' ? 'Incident' : 'Warning',
        incidentsCount: 1,
        event
      };
      io.to(`monitoring:${targetExamId}`).emit('faculty:new_incident', payload);
      io.to(`exam:${targetExamId}`).emit('faculty:new_incident', payload);
    }

    return res.status(201).json({ success: true, event });
  } catch (err) {
    console.error('Error recording proctor event:', err);
    return res.status(500).json({ success: false, message: 'Failed to record proctor incident.' });
  }
});

// Get incidents for an attempt
router.get('/events/:attemptId', authenticate, async (req, res) => {
  try {
    const events = await ProctoringEvent.find({ examAttemptId: req.params.attemptId });
    return res.json({ success: true, events, count: events.length });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve proctor events.' });
  }
});

// Update incident review status (Faculty/Admin)
router.put('/events/:eventId/status', authenticate, requireRole('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const { status, notes } = req.body;
    if (!['New', 'Reviewed', 'Dismissed', 'Confirmed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const updated = await ProctoringEvent.findByIdAndUpdate(req.params.eventId, {
      status,
      notes,
      reviewedBy: req.user.name
    });

    if (!updated) {
      // Try searching by custom eventId
      const byCustom = await ProctoringEvent.findOne({ eventId: req.params.eventId });
      if (byCustom) {
        await ProctoringEvent.findByIdAndUpdate(byCustom._id || byCustom.id, {
          status,
          notes,
          reviewedBy: req.user.name
        });
        return res.json({ success: true, message: 'Incident status updated' });
      }
      return res.status(404).json({ success: false, message: 'Incident event not found.' });
    }

    return res.json({ success: true, message: 'Incident status updated', event: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update incident.' });
  }
});

export default router;
