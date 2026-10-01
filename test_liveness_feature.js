/**
 * Test Suite for Camera Liveness Anti-Robot Check & Fallback Evidence Audit
 */

const BASE_URL = 'http://localhost:5000/api';

async function runLivenessTests() {
  console.log('===============================================================');
  console.log('🧪 Starting Camera Liveness & Evidence Fallback Verification');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  async function assert(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
    }
  }

  // 1. Student Login
  let studentToken = null;
  await assert('1. Student Authentication', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex.student@eduproctor.ai', password: 'password123' })
    });
    const data = await res.json();
    if (!data.success || !data.token) throw new Error(data.message || 'Login failed');
    studentToken = data.token;
  });

  // 2. Fetch an exam
  let testExamId = null;
  await assert('2. Exam Discovery', async () => {
    const res = await fetch(`${BASE_URL}/exams`);
    const data = await res.json();
    if (!data.success || !data.exams || data.exams.length === 0) throw new Error('No exams found');
    testExamId = data.exams[0]._id || data.exams[0].id;
  });

  // Mock Evidence Still Frame (base64 image snippet)
  const mockBase64Frame1 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...mockStillCenter';
  const mockBase64Frame2 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...mockStillLeftManual';
  const mockBase64Frame3 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...mockStillRightAuto';

  // 3. Test Partial-Manual Liveness Check Payload
  const partialManualPayload = {
    status: 'passed',
    overallStatus: 'partial-manual',
    verifiedAt: new Date().toISOString(),
    steps: [
      {
        stepIndex: 1,
        pose: 'center',
        verificationMethod: 'auto',
        timestamp: new Date(Date.now() - 15000).toISOString(),
        evidenceSnapshot: mockBase64Frame1
      },
      {
        stepIndex: 2,
        pose: 'left',
        verificationMethod: 'manual', // Student used 7-second fallback
        timestamp: new Date(Date.now() - 8000).toISOString(),
        evidenceSnapshot: mockBase64Frame2
      },
      {
        stepIndex: 3,
        pose: 'right',
        verificationMethod: 'auto',
        timestamp: new Date().toISOString(),
        evidenceSnapshot: mockBase64Frame3
      }
    ]
  };

  // 4. Test POST /api/exams/:id/liveness-check endpoint
  await assert('3. POST /api/exams/:id/liveness-check API Endpoint', async () => {
    const res = await fetch(`${BASE_URL}/exams/${testExamId}/liveness-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ livenessCheck: partialManualPayload })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Liveness check endpoint failed');
    if (!data.livenessCheck || data.livenessCheck.overallStatus !== 'partial-manual') {
      throw new Error('Returned livenessCheck payload invalid');
    }
  });

  // 5. Test Start Attempt with livenessCheck persistence
  let attemptId = null;
  await assert('4. Start Attempt with Liveness Audit Telemetry', async () => {
    const res = await fetch(`${BASE_URL}/exams/${testExamId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ livenessCheck: partialManualPayload })
    });
    const data = await res.json();
    if (!data.success || !data.attempt) throw new Error(data.message || 'Start attempt failed');
    attemptId = data.attempt._id || data.attempt.id;

    const savedLiveness = data.attempt.livenessCheck;
    if (!savedLiveness) throw new Error('livenessCheck was not saved on ExamAttempt');
    if (savedLiveness.overallStatus !== 'partial-manual') {
      throw new Error(`Expected overallStatus partial-manual, got ${savedLiveness.overallStatus}`);
    }
    if (!savedLiveness.steps || savedLiveness.steps.length !== 3) {
      throw new Error(`Expected 3 steps, got ${savedLiveness.steps?.length}`);
    }
    if (savedLiveness.steps[1].verificationMethod !== 'manual') {
      throw new Error('Step 2 verificationMethod should be manual');
    }
    if (!savedLiveness.steps[1].evidenceSnapshot.includes('mockStillLeftManual')) {
      throw new Error('Step 2 evidenceSnapshot missing or corrupted');
    }
  });

  // 6. Faculty Authentication
  let facultyToken = null;
  await assert('5. Faculty Authentication', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'turing@eduproctor.ai', password: 'password123' })
    });
    const data = await res.json();
    if (!data.success || !data.token) throw new Error(data.message || 'Faculty login failed');
    facultyToken = data.token;
  });

  // 7. Verify Faculty Live Monitoring includes livenessCheck on student card
  await assert('6. Faculty Live Monitoring includes Liveness Check on Student Card', async () => {
    const res = await fetch(`${BASE_URL}/faculty/monitoring/${testExamId}`, {
      headers: { Authorization: `Bearer ${facultyToken}` }
    });
    const data = await res.json();
    if (!data.success || !data.students) throw new Error('Live monitoring fetch failed');
    
    const alexCard = data.students.find(s => s.studentEmail === 'alex.student@eduproctor.ai');
    if (!alexCard) throw new Error('Student card for Alex not found in active session');
    if (!alexCard.livenessCheck) throw new Error('Student card missing livenessCheck');
    if (alexCard.livenessCheck.overallStatus !== 'partial-manual') {
      throw new Error(`Expected partial-manual in student card, got ${alexCard.livenessCheck.overallStatus}`);
    }
  });

  // 8. Verify Integrity Dossier API returns attempt livenessCheck with steps and snapshots
  await assert('7. Faculty Integrity Dossier includes Detailed Liveness Step Evidence', async () => {
    const res = await fetch(`${BASE_URL}/faculty/integrity-dossier/${attemptId}`, {
      headers: { Authorization: `Bearer ${facultyToken}` }
    });
    const data = await res.json();
    if (!data.success || !data.attempt) throw new Error('Integrity dossier fetch failed');

    const check = data.attempt.livenessCheck;
    if (!check) throw new Error('Dossier attempt missing livenessCheck');
    if (check.overallStatus !== 'partial-manual') throw new Error('Dossier overallStatus mismatch');
    if (check.steps.length !== 3) throw new Error('Dossier steps length mismatch');
    const manualStep = check.steps.find(s => s.pose === 'left');
    if (!manualStep || manualStep.verificationMethod !== 'manual') {
      throw new Error('Manual fallback step not correctly represented in dossier');
    }
  });

  // 9. Verify Fully-Auto Status Computation & Persistence
  const fullyAutoPayload = {
    status: 'passed',
    overallStatus: 'fully-auto',
    verifiedAt: new Date().toISOString(),
    steps: [
      { stepIndex: 1, pose: 'center', verificationMethod: 'auto', timestamp: new Date().toISOString() },
      { stepIndex: 2, pose: 'left', verificationMethod: 'auto', timestamp: new Date().toISOString() },
      { stepIndex: 3, pose: 'right', verificationMethod: 'auto', timestamp: new Date().toISOString() }
    ]
  };

  await assert('8. Fully-Auto Liveness Status Persistence & Update', async () => {
    const res = await fetch(`${BASE_URL}/exams/${testExamId}/liveness-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ livenessCheck: fullyAutoPayload })
    });
    const data = await res.json();
    if (!data.success || data.livenessCheck.overallStatus !== 'fully-auto') {
      throw new Error('Failed to update liveness check to fully-auto');
    }
  });

  console.log('\n===============================================================');
  console.log(`🎉 Liveness Verification Results: ${passed}/${total} Passed`);
  console.log('===============================================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runLivenessTests();
