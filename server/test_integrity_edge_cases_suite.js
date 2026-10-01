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

async function runEdgeCasesSuite() {
  console.log('===============================================================');
  console.log('  Running EduProctor AI Edge Cases & Time Tracking Test Suite  ');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName, details = '') {
    total++;
    if (condition) {
      console.log(`✓ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${testName} ${details ? '(' + details + ')' : ''}`);
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

  // 2. Fetch Exams and verify or update proctoring policy
  const examsRes = await request('/exams', 'GET', null, studentToken);
  assert(examsRes.status === 200 && examsRes.data.exams?.length > 0, 'Fetched Available Exams');
  const exam = examsRes.data.exams[0];
  const examId = exam._id || exam.id;

  // 3. Faculty updates Exam with explicit Edge-Case Integrity Policy
  const policyUpdateRes = await request(`/exams/${examId}`, 'PUT', {
    proctoringSettings: {
      faceDetection: true,
      multipleFaceDetection: true,
      objectDetection: true,
      headPoseDetection: true,
      tabSwitchDetection: true,
      fullscreenEnforced: true,
      clipboardGuard: true,
      devtoolsDetection: true,
      multiDisplayDetection: true,
      contextMenuBlocked: true,
      idleDetection: true,
      idleTimeoutMinutes: 3,
      networkGapDetection: true,
      networkGapGraceSeconds: 20
    }
  }, facultyToken);

  assert(policyUpdateRes.status === 200, 'Faculty successfully configured Edge-Case Policy');
  const updatedSettings = policyUpdateRes.data.exam?.proctoringSettings || {};
  assert(
    updatedSettings.clipboardGuard === true &&
    updatedSettings.devtoolsDetection === true &&
    updatedSettings.multiDisplayDetection === true &&
    updatedSettings.contextMenuBlocked === true &&
    updatedSettings.idleDetection === true &&
    updatedSettings.idleTimeoutMinutes === 3 &&
    updatedSettings.networkGapDetection === true &&
    updatedSettings.networkGapGraceSeconds === 20,
    'Verified all 7 Sentinel Policy Settings Persisted on Exam Model'
  );

  // 4. Setup Faculty WebSocket listener to verify live broadcast of new incidents
  const facultySocket = io(SOCKET_URL);
  await new Promise(r => facultySocket.on('connect', r));
  facultySocket.emit('faculty:join_monitoring', { examId, facultyId: facultyUser.id });

  const receivedLiveIncidents = [];
  facultySocket.on('faculty:new_incident', (data) => {
    receivedLiveIncidents.push(data);
  });

  // 5. Start Exam Attempt
  const startRes = await request(`/exams/${examId}/start`, 'POST', {
    livenessCheck: { status: 'passed', method: 'auto' }
  }, studentToken);
  assert(startRes.status === 200 && startRes.data.attempt, 'Started Exam Attempt');
  const attempt = startRes.data.attempt;
  const attemptId = attempt._id || attempt.id;
  const questions = startRes.data.questions || [];
  const q1 = questions[0];
  const q1Id = q1._id || q1.id;

  // 6. Test Multiple-Monitor Incident Logging
  const multiDisplayRes = await request('/proctor/event', 'POST', {
    examId,
    attemptId,
    eventType: 'multiple_displays',
    severity: 'critical',
    confidence: 0.95,
    details: 'Secondary monitor detected (Screen Details API: window.screen.isExtended = true)',
    metadata: { screenCount: 2, isExtended: true }
  }, studentToken);
  assert(multiDisplayRes.status === 201, 'Logged multiple_displays incident via POST /api/proctor/event');

  // 7. Test Browser DevTools Incident Logging
  const devToolsRes = await request('/proctor/event', 'POST', {
    examId,
    attemptId,
    eventType: 'devtools_open',
    severity: 'high',
    confidence: 0.92,
    details: 'Browser Developer Tools opened (viewport dimension threshold exceeded: outerWidth - innerWidth = 320px)',
    metadata: { deltaWidth: 320, deltaHeight: 0 }
  }, studentToken);
  assert(devToolsRes.status === 201, 'Logged devtools_open incident via POST /api/proctor/event');

  // 8. Test Right-Click Context Menu Incident Logging
  const contextMenuRes = await request('/proctor/event', 'POST', {
    examId,
    attemptId,
    eventType: 'contextmenu_blocked',
    severity: 'low',
    confidence: 1.0,
    details: 'Right-click context menu triggered and blocked',
    metadata: { clientX: 420, clientY: 310 }
  }, studentToken);
  assert(contextMenuRes.status === 201, 'Logged contextmenu_blocked incident via POST /api/proctor/event');

  // 9. Test Inactivity / Candidate Idle Incident Logging
  const idleRes = await request('/proctor/event', 'POST', {
    examId,
    attemptId,
    eventType: 'candidate_idle',
    severity: 'medium',
    confidence: 0.9,
    details: 'No user input (keystrokes, mouse movement, or scroll) for 3 minutes',
    metadata: { idleSeconds: 180, configuredThresholdMinutes: 3 }
  }, studentToken);
  assert(idleRes.status === 201, 'Logged candidate_idle incident via POST /api/proctor/event');

  // 10. Test Network Gap Incident Logging
  const networkGapRes = await request('/proctor/event', 'POST', {
    examId,
    attemptId,
    eventType: 'network_gap',
    severity: 'high',
    confidence: 0.95,
    details: 'WebSocket disconnected for 28s, exceeding grace period of 20s',
    durationSeconds: 28,
    metadata: { disconnectedSeconds: 28, gracePeriodSeconds: 20 }
  }, studentToken);
  assert(networkGapRes.status === 201, 'Logged network_gap incident via POST /api/proctor/event');

  // Allow socket messages to propagate
  await new Promise(r => setTimeout(r, 600));

  // 11. Verify Socket Broadcast to Faculty
  const eventTypesBroadcast = receivedLiveIncidents.map(i => i.event?.eventType);
  assert(
    eventTypesBroadcast.includes('multiple_displays') &&
    eventTypesBroadcast.includes('devtools_open') &&
    eventTypesBroadcast.includes('contextmenu_blocked') &&
    eventTypesBroadcast.includes('candidate_idle') &&
    eventTypesBroadcast.includes('network_gap'),
    'Faculty Live Socket received real-time broadcast of all 5 edge-case incidents',
    `Found: ${JSON.stringify(eventTypesBroadcast)}`
  );

  // 12. Test Per-Question Time Spent Auto-Save
  const autoSaveRes = await request(`/exams/${examId}/autosave`, 'POST', {
    attemptId,
    questionId: q1Id,
    code: 'function twoSum(nums, target) { return [0, 1]; }',
    language: 'javascript',
    timeSpentSeconds: 145
  }, studentToken);
  assert(autoSaveRes.status === 200, 'Auto-save answer with timeSpentSeconds: 145 succeeded');

  // Verify attempt data has timeSpentSeconds
  const attemptCheckRes = await request(`/exams/attempts/${attemptId}`, 'GET', null, studentToken);
  const savedAnswer = (attemptCheckRes.data.attempt?.answers || []).find(a => a.questionId === q1Id);
  assert(
    savedAnswer && savedAnswer.timeSpentSeconds === 145,
    'Verified timeSpentSeconds (145s) persisted in ExamAttempt answer slot',
    `Received: ${savedAnswer?.timeSpentSeconds}`
  );

  // 13. Test Exam Submission with Per-Question Time Spent
  const submitRes = await request(`/exams/${examId}/submit`, 'POST', {
    attemptId,
    answers: [{
      questionId: q1Id,
      code: 'function twoSum(nums, target) { return [0, 1]; }',
      language: 'javascript',
      timeSpentSeconds: 220
    }]
  }, studentToken);
  assert(submitRes.status === 200, 'Submitted exam with per-question timeSpentSeconds: 220');

  // Verify evaluatedAnswers has timeSpentSeconds
  const evalAnswer = (submitRes.data.attempt?.evaluatedAnswers || []).find(a => a.questionId === q1Id);
  assert(
    evalAnswer && evalAnswer.timeSpentSeconds === 220,
    'EvaluatedAnswers preserved per-question timeSpentSeconds (220s)',
    `Received: ${evalAnswer?.timeSpentSeconds}`
  );

  // 14. Verify Faculty Composite Integrity Dossier includes new signals & deductions
  const dossierRes = await request(`/faculty/integrity-dossier/${attemptId}`, 'GET', null, facultyToken);
  assert(dossierRes.status === 200, 'Retrieved Composite Integrity Dossier');
  const dossier = dossierRes.data;
  const signals = dossier.integrity?.signals || {};
  const deductions = dossier.integrity?.deductions || [];

  assert(
    signals.multipleDisplaysCount >= 1 &&
    signals.devtoolsOpenCount >= 1 &&
    signals.contextMenuBlockedCount >= 1 &&
    signals.candidateIdleCount >= 1 &&
    signals.networkGapCount >= 1,
    'Integrity Dossier Signals accurately aggregated all 5 edge case telemetry counters',
    JSON.stringify(signals)
  );

  const deductionLabels = deductions.map(d => d.label);
  assert(
    deductionLabels.some(l => l.includes('Multi-Display')) &&
    deductionLabels.some(l => l.includes('Developer Tools')) &&
    deductionLabels.some(l => l.includes('Context Menu')) &&
    deductionLabels.some(l => l.includes('Idle')) &&
    deductionLabels.some(l => l.includes('Network Disconnection')),
    'Integrity Index applied tailored penalties and deductions for edge cases',
    JSON.stringify(deductionLabels)
  );

  assert(
    dossier.integrity?.score < 100 &&
    (dossier.integrity?.tier === 'High Risk' || dossier.integrity?.tier === 'Review Advised'),
    `Session Trust Tier downgraded appropriately (Score: ${dossier.integrity?.score}%, Tier: ${dossier.integrity?.tier})`
  );

  facultySocket.disconnect();

  console.log('\n===============================================================');
  console.log(`  Test Suite Completed: ${passed} / ${total} Tests Passed (${Math.round((passed / total) * 100)}%)`);
  console.log('===============================================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runEdgeCasesSuite().catch(err => {
  console.error('Test suite uncaught error:', err);
  process.exit(1);
});
