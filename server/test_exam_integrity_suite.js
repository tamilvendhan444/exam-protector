import { io } from '../client/node_modules/socket.io-client/build/esm/index.js';

const API_BASE = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

async function request(endpoint, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });

  const data = await res.json();
  return { status: res.status, data };
}

async function runIntegritySuite() {
  console.log('====================================================');
  console.log('  Running EduProctor AI Exam Integrity Test Suite   ');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`✓ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${testName}`);
    }
  }

  // 1. Authenticate Student & Faculty
  const studentAuth = await request('/auth/login', 'POST', {
    email: 'alex.student@eduproctor.ai',
    password: 'password123'
  });
  assert(studentAuth.status === 200 && studentAuth.data.token, 'Student Login Successful');
  const studentToken = studentAuth.data.token;
  const studentUser = studentAuth.data.user;

  const facultyAuth = await request('/auth/login', 'POST', {
    email: 'turing@eduproctor.ai',
    password: 'password123'
  });
  assert(facultyAuth.status === 200 && facultyAuth.data.token, 'Faculty Login Successful');
  const facultyToken = facultyAuth.data.token;
  const facultyUser = facultyAuth.data.user;

  // 2. Fetch Exams and pick an exam with coding questions
  const examsRes = await request('/exams', 'GET', null, studentToken);
  assert(examsRes.status === 200 && examsRes.data.exams?.length > 0, 'Fetched Available Exams');
  const exam = examsRes.data.exams[0];
  const examId = exam._id || exam.id;

  // 3. Start Exam Attempt
  const startRes = await request(`/exams/${examId}/start`, 'POST', {
    livenessCheck: { status: 'passed', method: 'auto' }
  }, studentToken);
  assert(startRes.status === 200 && startRes.data.attempt, 'Started Exam Attempt');
  const attempt = startRes.data.attempt;
  const attemptId = attempt._id || attempt.id;
  const questions = startRes.data.questions || [];
  const codingQ = questions.find(q => q.type === 'coding') || questions[0];
  const codingQId = codingQ._id || codingQ.id;

  // 4. Test Proctoring Event: Fullscreen Exit
  const fsEventRes = await request('/proctor/event', 'POST', {
    examId,
    attemptId,
    eventType: 'fullscreen_exit',
    severity: 'medium',
    confidence: 0.95,
    details: 'Candidate exited full-screen view.'
  }, studentToken);
  assert(fsEventRes.status === 201 && fsEventRes.data.event?.eventType === 'fullscreen_exit', 'Logged fullscreen_exit proctoring event');

  // 5. Test Proctoring Event: Clipboard Blocked
  const clipEventRes = await request('/proctor/event', 'POST', {
    examId,
    attemptId,
    eventType: 'clipboard_blocked',
    severity: 'medium',
    confidence: 0.95,
    details: 'Candidate attempted blocked paste action in the exam workspace.'
  }, studentToken);
  assert(clipEventRes.status === 201 && clipEventRes.data.event?.eventType === 'clipboard_blocked', 'Logged clipboard_blocked proctoring event');

  // 6. Test Proctoring Event: Tab Switch with durationSeconds
  const tabEventRes = await request('/proctor/event', 'POST', {
    examId,
    attemptId,
    eventType: 'tab_switch',
    severity: 'high',
    confidence: 0.98,
    durationSeconds: 12,
    details: 'Candidate switched away from exam tab for 12 seconds.'
  }, studentToken);
  assert(tabEventRes.status === 201 && tabEventRes.data.event?.durationSeconds === 12, 'Logged tab_switch event with durationSeconds');

  // 7. Verify Proctoring Summary on Attempt
  const attemptCheck = await request(`/exams/attempts/${attemptId}`, 'GET', null, studentToken);
  assert(attemptCheck.status === 200, 'Fetched Exam Attempt Details');
  const summary = attemptCheck.data.attempt?.proctoringSummary || {};
  assert(summary.fullscreenExitsCount >= 1, 'Proctoring summary tracks fullscreenExitsCount >= 1');
  assert(summary.clipboardBlockedCount >= 1, 'Proctoring summary tracks clipboardBlockedCount >= 1');
  assert(summary.tabSwitchesCount >= 1, 'Proctoring summary tracks tabSwitchesCount >= 1');

  // 8. Test Submit Code against question and verify ExamAttempt.answers slot update
  const sampleSolution = codingQ.starterCode?.cpp || '#include <iostream>\nusing namespace std;\nint main() { cout << 42 << endl; return 0; }';
  const codeSubmitRes = await request('/code/submit', 'POST', {
    examId,
    attemptId,
    questionId: codingQId,
    code: sampleSolution,
    language: 'cpp'
  }, studentToken);
  assert(codeSubmitRes.status === 200 && codeSubmitRes.data.submissionId, 'Code submitted and executed');

  // Check attempt answers updated
  const attemptAfterCode = await request(`/exams/attempts/${attemptId}`, 'GET', null, studentToken);
  const updatedAnswers = attemptAfterCode.data.attempt?.answers || [];
  const ansSlot = updatedAnswers.find(a => String(a.questionId) === String(codingQId));
  assert(ansSlot && ansSlot.status === 'answered', "ExamAttempt answers slot marked as 'answered'");
  assert(ansSlot && ansSlot.totalTestCases !== undefined, 'ExamAttempt answer contains test case results');
  const codingPerf = attemptAfterCode.data.attempt?.codingPerformance || {};
  assert(codingPerf.submissionCount >= 1, 'ExamAttempt tracks codingPerformance.submissionCount >= 1');

  // 9. Test Real-time Socket.IO Communication
  console.log('\n--- Testing Realtime Socket.IO Integrity Handlers ---');
  await new Promise((resolve) => {
    let facultyReceivedIncident = false;
    let facultyReceivedLeave = false;

    const facultySocket = io(SOCKET_URL, { transports: ['websocket'] });
    const studentSocket = io(SOCKET_URL, { transports: ['websocket'] });

    facultySocket.on('connect', () => {
      facultySocket.emit('faculty:join_monitoring', {
        examId,
        facultyId: facultyUser.id || facultyUser._id
      });
    });

    facultySocket.on('faculty:new_incident', (data) => {
      const type = data.event?.eventType || data.eventType;
      if (type === 'clipboard_blocked') {
        facultyReceivedIncident = true;
        assert(true, 'Faculty received live clipboard_blocked incident via WebSocket');
      }
    });

    facultySocket.on('faculty:student_left', (data) => {
      facultyReceivedLeave = true;
      assert(true, 'Faculty received student:leave broadcast via WebSocket');
      facultySocket.disconnect();
      studentSocket.disconnect();
      resolve();
    });

    studentSocket.on('connect', () => {
      studentSocket.emit('student:join', {
        studentId: studentUser.id || studentUser._id,
        studentName: studentUser.name,
        studentEmail: studentUser.email,
        examId,
        attemptId
      });

      // Emit incident after joining
      setTimeout(() => {
        studentSocket.emit('proctor:incident', {
          studentId: studentUser.id || studentUser._id,
          studentName: studentUser.name,
          examId,
          attemptId,
          eventType: 'clipboard_blocked',
          severity: 'medium',
          details: 'Candidate attempted Ctrl+V'
        });
      }, 300);

      // Emit leave after incident
      setTimeout(() => {
        studentSocket.emit('student:leave', {
          studentId: studentUser.id || studentUser._id,
          examId,
          attemptId
        });
      }, 700);
    });

    // Timeout safety
    setTimeout(() => {
      if (!facultyReceivedIncident) assert(false, 'Faculty received live incident via WebSocket (Timed out)');
      if (!facultyReceivedLeave) assert(false, 'Faculty received student:leave broadcast (Timed out)');
      facultySocket.disconnect();
      studentSocket.disconnect();
      resolve();
    }, 2500);
  });

  // 10. Test Opt-in Auto-Submit on Repeated Incidents via Socket
  console.log('\n--- Testing Opt-In Auto-Submit on Repeated Incidents ---');
  // First update exam to enable autoSubmitOnRepeatedIncidents with threshold 2 via REST
  await request(`/exams/${examId}`, 'PUT', {
    proctoringSettings: {
      ...(exam.proctoringSettings || {}),
      autoSubmitOnRepeatedIncidents: true,
      maxAllowedIncidents: 2
    }
  }, facultyToken);

  await new Promise((resolve) => {
    let forceSubmitReceived = false;

    const testSocket = io(SOCKET_URL, { transports: ['websocket'] });

    testSocket.on('student:force_submit', (data) => {
      forceSubmitReceived = true;
      assert(true, 'Student received student:force_submit when exceeding max allowed incidents');
      testSocket.disconnect();
      resolve();
    });

    testSocket.on('connect', () => {
      testSocket.emit('student:join', {
        studentId: studentUser.id || studentUser._id,
        studentName: studentUser.name,
        studentEmail: studentUser.email,
        examId,
        attemptId
      });

      // Trigger incident which exceeds threshold 2
      setTimeout(() => {
        testSocket.emit('proctor:incident', {
          studentId: studentUser.id || studentUser._id,
          studentName: studentUser.name,
          examId,
          attemptId,
          eventType: 'fullscreen_exit',
          severity: 'medium'
        });
      }, 300);
    });

    setTimeout(() => {
      if (!forceSubmitReceived) {
        assert(false, 'student:force_submit event triggered (Timed out)');
      }
      testSocket.disconnect();
      resolve();
    }, 2500);
  });

  // 11. Test Final Exam Submission
  console.log('\n--- Testing Final Exam Submission ---');
  const submitRes = await request(`/exams/${examId}/submit`, 'POST', {
    attemptId,
    answers: [
      {
        questionId: codingQId,
        codeAnswer: sampleSolution,
        language: 'cpp',
        status: 'answered'
      }
    ]
  }, studentToken);
  assert(submitRes.status === 200 && submitRes.data.success, 'Final Exam submitted successfully');
  assert(submitRes.data.attempt?.status === 'evaluated', "Attempt status transitioned to 'evaluated'");

  console.log('\n====================================================');
  console.log(`  Summary: ${passed} / ${total} Tests Passed (${Math.round((passed / total) * 100)}%)`);
  console.log('====================================================\n');

  if (passed === total) {
    console.log('ALL EXAM INTEGRITY TESTS PASSED SUCCESSFULLY! 🎉');
    process.exit(0);
  } else {
    console.error('SOME TESTS FAILED!');
    process.exit(1);
  }
}

runIntegritySuite().catch(err => {
  console.error('Fatal error running test suite:', err);
  process.exit(1);
});
