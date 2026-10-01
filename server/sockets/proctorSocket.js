import { ProctoringEvent, ExamAttempt, Exam, Notification, User } from '../models/schemas.js';
import { processEvidenceSnapshot } from '../services/evidenceStorageService.js';

// Map of active student connections: studentId -> { socketId, examId, studentName, lastHeartbeat, status, snapshot }
const activeStudents = new Map();
const unknownHeartbeatWarnThrottle = new Map();

export function setupProctorSockets(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // Student joins exam session
    socket.on('student:join', async (data) => {
      const { studentId, studentName, studentEmail, examId, attemptId } = data;
      if (!studentId || !examId) return;

      socket.join(`exam:${examId}`);
      socket.studentInfo = { studentId, studentName, studentEmail, examId, attemptId };

      activeStudents.set(studentId, {
        socketId: socket.id,
        studentId,
        studentName,
        studentEmail,
        examId,
        attemptId,
        status: 'Normal',
        incidentsCount: 0,
        lastHeartbeat: Date.now(),
        snapshot: null,
        remainingSeconds: null
      });

      // Notify faculty monitoring room
      io.to(`monitoring:${examId}`).emit('faculty:student_joined', {
        studentId,
        studentName,
        studentEmail,
        status: 'Normal',
        incidentsCount: 0,
        connectedAt: new Date().toISOString()
      });

      broadcastStats(io, examId);
    });

    // Student sends periodic heartbeat and live camera snapshot
    socket.on('student:heartbeat', async (data) => {
      const { studentId, examId, snapshot, remainingSeconds, progressPercent } = data;
      if (!studentId) return;

      let student = activeStudents.get(studentId);

      // Auto-recovery mechanism if server restarted or connection dropped
      if (!student && examId) {
        try {
          const attempt = await ExamAttempt.findOne({
            examId,
            studentId,
            attemptStatus: 'in-progress'
          }).sort({ createdAt: -1 });

          if (attempt) {
            const user = await User.findById(studentId).select('name email');
            student = {
              socketId: socket.id,
              studentId,
              studentName: user?.name || 'Verified Candidate',
              studentEmail: user?.email || '',
              examId,
              attemptId: attempt._id,
              status: 'Normal',
              incidentsCount: 0,
              lastHeartbeat: Date.now(),
              snapshot: snapshot || null,
              remainingSeconds: remainingSeconds ?? attempt.remainingSeconds ?? null
            };
            activeStudents.set(studentId, student);
            socket.join(`exam:${examId}`);
            socket.studentInfo = {
              studentId,
              studentName: student.studentName,
              studentEmail: student.studentEmail,
              examId,
              attemptId: attempt._id
            };

            console.log(`[TRIGGER-2-HEARTBEAT] Auto-recovered active student session for ${studentId} (${student.studentName})`);
            io.to(`monitoring:${examId}`).emit('faculty:student_joined', {
              studentId,
              studentName: student.studentName,
              studentEmail: student.studentEmail,
              status: 'Normal',
              incidentsCount: 0,
              connectedAt: new Date().toISOString()
            });
            broadcastStats(io, examId);
          } else {
            // Check if attempt is already submitted
            const finishedAttempt = await ExamAttempt.findOne({
              examId,
              studentId,
              attemptStatus: { $in: ['submitted', 'evaluated'] }
            });

            if (finishedAttempt) {
              // Signal client that exam attempt is finished, so stop heartbeat loop
              socket.emit('student:stop_heartbeat');
            }

            const now = Date.now();
            const lastWarn = unknownHeartbeatWarnThrottle.get(studentId) || 0;
            if (now - lastWarn > 30000) {
              unknownHeartbeatWarnThrottle.set(studentId, now);
              console.warn('[TRIGGER-2-HEARTBEAT] Received heartbeat from inactive/submitted student:', studentId);
            }
            return;
          }
        } catch (recoverErr) {
          console.error('[TRIGGER-2-HEARTBEAT] Auto-recovery error:', recoverErr.message);
        }
      }

      if (student) {
        student.lastHeartbeat = Date.now();
        if (socket.id !== student.socketId) {
          student.socketId = socket.id;
        }
        if (snapshot) student.snapshot = snapshot;
        if (remainingSeconds !== undefined) student.remainingSeconds = remainingSeconds;
        if (progressPercent !== undefined) student.progressPercent = progressPercent;

        // Relay live thumbnail to faculty monitoring
        io.to(`monitoring:${examId}`).emit('faculty:student_feed', {
          studentId,
          snapshot: student.snapshot,
          status: student.status,
          incidentsCount: student.incidentsCount,
          remainingSeconds: student.remainingSeconds,
          progressPercent: student.progressPercent
        });
      }
    });

    // Client reports detected proctoring incident (face missing, multiple faces, mobile phone, looking away)
    socket.on('proctor:incident', async (incidentData) => {
      const {
        eventId,
        examId,
        attemptId,
        studentId,
        studentName,
        eventType,
        severity = 'medium',
        confidence = 0.88,
        details,
        evidenceSnapshot,
        durationSeconds = 0
      } = incidentData;

      try {
        const evId = eventId || 'ev_' + Math.random().toString(36).substr(2, 9);
        const sanitizedSnapshot = await processEvidenceSnapshot(evidenceSnapshot, evId);

        // Save incident to database
        const savedEvent = await ProctoringEvent.create({
          eventId: evId,
          examId,
          examAttemptId: attemptId,
          studentId,
          studentName,
          eventType,
          severity,
          confidence,
          details,
          evidenceSnapshot: sanitizedSnapshot,
          durationSeconds,
          status: 'New'
        });

        // Update active student status
        const student = activeStudents.get(studentId);
        if (student) {
          student.incidentsCount = (student.incidentsCount || 0) + 1;
          if (severity === 'critical' || student.incidentsCount >= 3) {
            student.status = 'Incident';
          } else if (severity === 'high' || student.incidentsCount >= 1) {
            student.status = 'Warning';
          }
        }

        // Update exam attempt summary
        if (attemptId) {
          const attempt = await ExamAttempt.findById(attemptId);
          if (attempt) {
            const summary = attempt.proctoringSummary || {};
            
            // Only critical intentional security infractions count towards auto-termination limits
            // Benign actions like typing fast or minor noise should NEVER prematurely terminate an exam
            const isCriticalSecurityIncident = [
              'mobile_phone',
              'multiple_faces',
              'multiple_displays',
              'devtools_open',
              'tab_switch',
              'fullscreen_exit',
              'code_plagiarism'
            ].includes(eventType);

            if (isCriticalSecurityIncident) {
              summary.totalIncidents = (summary.totalIncidents || 0) + 1;
            }

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
              - ((summary.plagiarismFlagsCount || 0) * 35);

            summary.integrityScore = Math.max(0, Math.min(100, rawScore));
            summary.integrityTier = summary.integrityScore < 65 ? 'High Risk' : (summary.integrityScore < 88 ? 'Review Advised' : 'Clean');

            summary.overallStatus = (student && student.status) || 'Warning';

            // Check opt-in auto-submit on repeated incidents
            const exam = await Exam.findById(examId);
            if (exam?.proctoringSettings?.autoSubmitOnRepeatedIncidents) {
              const maxAllowed = exam.proctoringSettings.maxAllowedIncidents || 5;
              console.log('[TRIGGER-3-SOCKET] Checking repeated incidents policy:', {
                studentId,
                totalIncidents: summary.totalIncidents,
                maxAllowed,
                eventType
              });
              if (summary.totalIncidents >= maxAllowed) {
                summary.overallStatus = 'Incident';
                console.warn('[TRIGGER-3-SOCKET] Emitting student:force_submit! Limit reached:', summary.totalIncidents, '>=', maxAllowed);
                console.log('[DEBUG-FORCE-SUBMIT] student:force_submit emitted from socket!', new Error().stack);
                io.to(`exam:${examId}`).emit('student:force_submit', {
                  studentId,
                  attemptId,
                  reason: 'repeated_incidents_violation',
                  totalIncidents: summary.totalIncidents,
                  maxAllowed
                });
              }
            }

            await ExamAttempt.findByIdAndUpdate(attemptId, { proctoringSummary: summary });
          }
        }

        // Broadcast alert in real-time to faculty monitoring dashboard
        io.to(`monitoring:${examId}`).emit('faculty:new_incident', {
          event: savedEvent,
          studentId,
          studentName,
          status: (student && student.status) || 'Warning',
          incidentsCount: (student && student.incidentsCount) || 1
        });

        broadcastStats(io, examId);
      } catch (err) {
        console.error('[Socket] Error handling proctor incident:', err.message);
      }
    });

    // Student leaves exam session cleanly on final submission
    socket.on('student:leave', (data) => {
      const { studentId, examId } = data || {};
      if (studentId) {
        console.log('[TRIGGER-3-SOCKET] student:leave received for studentId:', studentId);
        activeStudents.delete(studentId);
        if (examId) {
          socket.leave(`exam:${examId}`);
          io.to(`monitoring:${examId}`).emit('faculty:student_left', { studentId });
          broadcastStats(io, examId);
        }
      }
    });

    // Faculty joins monitoring room for an exam
    socket.on('faculty:join_monitoring', (data) => {
      const { examId, facultyId } = data;
      if (!examId) return;

      socket.join(`monitoring:${examId}`);
      console.log(`[Socket] Faculty ${facultyId} joined monitoring for exam ${examId}`);

      // Send initial roster of active students in this exam
      const currentExamStudents = Array.from(activeStudents.values()).filter(s => s.examId === examId);
      socket.emit('faculty:initial_roster', {
        students: currentExamStudents
      });

      broadcastStats(io, examId);
    });

    // Faculty sends warning message to student
    socket.on('faculty:send_warning', async (data) => {
      const { studentId, message, examId } = data;
      const student = activeStudents.get(studentId);

      if (student && student.socketId) {
        io.to(student.socketId).emit('student:receive_warning', {
          title: '⚠ Faculty Proctoring Warning',
          message: message || 'Please maintain focus and ensure your face remains visible inside the camera frame.',
          timestamp: new Date().toISOString()
        });

        // Record in notifications
        await Notification.create({
          userId: studentId,
          title: 'Exam Warning Notice',
          message,
          type: 'urgent'
        });

        // Update warnings sent count
        if (student.attemptId) {
          const attempt = await ExamAttempt.findById(student.attemptId);
          if (attempt) {
            const summary = attempt.proctoringSummary || {};
            summary.warningsSent = (summary.warningsSent || 0) + 1;
            await ExamAttempt.findByIdAndUpdate(student.attemptId, { proctoringSummary: summary });
          }
        }
      }
    });

    // Student submits exam
    socket.on('student:submit_exam', (data) => {
      const { studentId, examId } = data;
      console.log('[TRIGGER-3-SOCKET] student:submit_exam received for studentId:', studentId);
      io.to(`monitoring:${examId}`).emit('faculty:student_submitted', { studentId });
      activeStudents.delete(studentId);
      broadcastStats(io, examId);
    });

    // Disconnection handling
    socket.on('disconnect', (reason) => {
      console.log(`[TRIGGER-3-SOCKET] Server socket disconnect for ${socket.id}. Reason:`, reason);
      if (socket.studentInfo) {
        const { studentId, examId, studentName } = socket.studentInfo;
        const student = activeStudents.get(studentId);
        if (student) {
          student.status = 'Offline';
          io.to(`monitoring:${examId}`).emit('faculty:student_left', {
            studentId,
            studentName,
            status: 'Offline'
          });
          activeStudents.delete(studentId);
          broadcastStats(io, examId);
        }
      }
    });
  });

  // Stale connection cleaner (every 15 seconds)
  setInterval(() => {
    const now = Date.now();
    for (const [studentId, info] of activeStudents.entries()) {
      if (now - info.lastHeartbeat > 30000) { // 30s timeout
        console.warn('[TRIGGER-2-HEARTBEAT] Stale connection cleaner timed out student:', studentId, 'no heartbeat for ms:', now - info.lastHeartbeat);
        info.status = 'Offline';
        io.to(`monitoring:${info.examId}`).emit('faculty:student_left', {
          studentId,
          status: 'Offline'
        });
        activeStudents.delete(studentId);
        broadcastStats(io, info.examId);
      }
    }
  }, 15000);
}

function broadcastStats(io, examId) {
  const students = Array.from(activeStudents.values()).filter(s => s.examId === examId);
  const total = students.length;
  const normal = students.filter(s => s.status === 'Normal').length;
  const warning = students.filter(s => s.status === 'Warning').length;
  const incident = students.filter(s => s.status === 'Incident').length;

  io.to(`monitoring:${examId}`).emit('faculty:stats_update', {
    activeStudentsCount: total,
    normalCount: normal,
    warningsCount: warning,
    incidentsCount: incident,
    offlineCount: 0
  });
}
