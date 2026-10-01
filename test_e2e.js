/**
 * Comprehensive Automated End-to-End Test Suite for EduProctor AI
 */

async function runTests() {
  const BASE_URL = 'http://localhost:5000/api';
  console.log('====================================================');
  console.log('🚀 Starting EduProctor AI Automated Verification Suite');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  async function assertTest(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
    }
  }

  // 1. Health Check
  await assertTest('1. Server Health Check', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    if (data.status !== 'healthy') throw new Error('Unhealthy status: ' + data.status);
  });

  // 2. Student Authentication
  let studentToken = null;
  let studentUser = null;
  await assertTest('2. Student Login (Alex Johnson)', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex.student@eduproctor.ai', password: 'password123' })
    });
    const data = await res.json();
    if (!data.success || !data.token) throw new Error(data.message || 'Login failed');
    studentToken = data.token;
    studentUser = data.user;
  });

  // 3. Student Dashboard API
  await assertTest('3. Retrieve Student Dashboard Data & Metrics', async () => {
    const res = await fetch(`${BASE_URL}/student/dashboard`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const data = await res.json();
    if (!data.success || !data.data?.stats) throw new Error('Dashboard stats missing');
    if (!data.data.charts?.scoreOverTime) throw new Error('Score charts missing');
  });

  // 4. Exams Catalog
  let testExam = null;
  await assertTest('4. Exam Discovery & Listing', async () => {
    const res = await fetch(`${BASE_URL}/exams`);
    const data = await res.json();
    if (!data.success || !data.exams?.length) throw new Error('Exams list empty');
    testExam = data.exams.find(e => e.title.includes('Python') || e.title.includes('Algorithms')) || data.exams[0];
  });

  // 5. Code Execution Runner Sandbox (C++ and Python)
  await assertTest('5. Code Execution Sandbox (C++ Two Sum problem)', async () => {
    const res = await fetch(`${BASE_URL}/code/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        language: 'cpp',
        code: `#include <iostream>
using namespace std;
int main() {
    cout << "0 1" << endl;
    return 0;
}`,
        testCases: [
          { input: '2 7 11 15\\n9', expectedOutput: '0 1', isHidden: false }
        ]
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Code execution failed');
    if (!data.results || data.results.length === 0) throw new Error('No test results returned');
    console.log(`   -> C++ Execution Status: ${data.status}, Test Case 1 Passed: ${data.results[0]?.passed}`);
  });

  // 6. Start Exam Attempt
  let attempt = null;
  let questions = [];
  await assertTest('6. Start Exam Attempt (Data Structures)', async () => {
    const res = await fetch(`${BASE_URL}/exams/${testExam._id || testExam.id}/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const data = await res.json();
    if (!data.success || !data.attempt) throw new Error(data.message || 'Failed to start attempt');
    attempt = data.attempt;
    questions = data.questions;
    if (questions.length === 0) throw new Error('No questions returned');
  });

  // 7. Auto-save student draft answer
  await assertTest('7. Auto-save Draft Solution', async () => {
    const q1 = questions[0];
    const res = await fetch(`${BASE_URL}/exams/${testExam._id || testExam.id}/autosave`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        attemptId: attempt._id || attempt.id,
        questionId: q1._id || q1.id,
        codeAnswer: q1.starterCode?.cpp || 'cout << "0 1" << endl;',
        language: 'cpp',
        selectedOptionIds: [],
        remainingSeconds: 3500
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Autosave failed');
  });

  // 8. Log Proctoring Incident Event
  await assertTest('8. Log AI Proctoring Incident (Mobile Phone Detection)', async () => {
    const res = await fetch(`${BASE_URL}/proctor/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        examId: testExam._id || testExam.id,
        attemptId: attempt._id || attempt.id,
        eventType: 'mobile_phone',
        severity: 'high',
        confidence: 0.94,
        details: 'Automated test: Mobile phone object detected in exam environment.',
        evidenceSnapshot: 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
      })
    });
    const data = await res.json();
    if (!data.success || !data.event) throw new Error(data.message || 'Failed to log event');
  });

  // 9. Submit Exam & Automated Evaluation with AI Performance Analytics
  let submissionResult = null;
  await assertTest('9. Submit Exam & Generate AI Performance Analytics', async () => {
    const answersToSubmit = questions.map((q, idx) => ({
      questionId: q._id || q.id,
      type: q.type,
      codeAnswer: q.type === 'coding' ? (q.starterCode?.cpp || 'cout << "0 1";') : '',
      language: 'cpp',
      selectedOptionIds: q.type === 'mcq' ? ['opt_2'] : [],
      descriptiveAnswer: q.type === 'descriptive' ? 'Detailed ACID explanation' : '',
      status: 'answered'
    }));

    const res = await fetch(`${BASE_URL}/exams/${testExam._id || testExam.id}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        attemptId: attempt._id || attempt.id,
        answers: answersToSubmit
      })
    });
    const data = await res.json();
    if (!data.success || !data.result) throw new Error(data.message || 'Submission failed');
    submissionResult = data.result;
    console.log(`   -> Evaluated Score: ${data.result.totalScore} / ${data.result.totalPossibleMarks}`);
    console.log(`   -> AI Strengths: ${data.result.aiAnalysis?.strengths?.join(', ')}`);
    console.log(`   -> AI Practice Recommendations: ${data.result.aiAnalysis?.recommendations?.length} actions recommended`);
  });

  // 10. Faculty Login & Live Proctoring Hub
  let facultyToken = null;
  await assertTest('10. Faculty Login (Prof. Alan Turing)', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'turing@eduproctor.ai', password: 'password123' })
    });
    const data = await res.json();
    if (!data.success || !data.token) throw new Error('Faculty login failed');
    facultyToken = data.token;
  });

  // 11. Faculty Live Monitoring & Student Incidents Roster
  await assertTest('11. Faculty Live Proctoring Roster & Incidents Query', async () => {
    const res = await fetch(`${BASE_URL}/faculty/monitoring/${testExam._id || testExam.id}`, {
      headers: { Authorization: `Bearer ${facultyToken}` }
    });
    const data = await res.json();
    if (!data.success || !data.summary) throw new Error('Failed to retrieve monitoring feed');
    console.log(`   -> Active Monitoring Students: ${data.students?.length}, Incidents Logged: ${data.recentIncidents?.length}`);
  });

  // 12. Tab Switch & Focus Loss Incident Logging
  await assertTest('12. Browser Tab Switch Incident Logging with Duration', async () => {
    const res = await fetch(`${BASE_URL}/proctor/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        examId: testExam._id || testExam.id,
        attemptId: attempt._id || attempt.id,
        eventType: 'tab_switch',
        durationSeconds: 8,
        severity: 'medium',
        confidence: 0.98,
        details: 'Candidate switched away from exam tab for 8 seconds (Incident #1).'
      })
    });
    const data = await res.json();
    if (!data.success || !data.event) throw new Error('Failed to log tab switch incident');
    console.log(`   -> Tab Switch Event Logged: ${data.event.eventType}, Duration: ${data.event.durationSeconds}s`);
  });

  // 13. Keystroke & Clipboard Paste Pattern Telemetry
  await assertTest('13. Editor Clipboard Paste & Typing Burst Telemetry', async () => {
    const res = await fetch(`${BASE_URL}/proctor/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        examId: testExam._id || testExam.id,
        attemptId: attempt._id || attempt.id,
        eventType: 'suspicious_paste',
        severity: 'high',
        confidence: 0.95,
        details: 'Large clipboard paste event: 142 characters (6 lines) inserted instantaneously.'
      })
    });
    const data = await res.json();
    if (!data.success || !data.event) throw new Error('Failed to log paste telemetry event');
    console.log(`   -> Paste Telemetry Logged: ${data.event.eventType}, Severity: ${data.event.severity}`);
  });

  // 14. Adaptive Difficulty & Practice Mode (Auto-generated from Weak Topics)
  await assertTest('14. Adaptive Practice Mode: Generate Set from Weak Topics', async () => {
    const res = await fetch(`${BASE_URL}/student/practice/adaptive-set`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const data = await res.json();
    if (!data.success || !data.questions?.length) throw new Error('Failed to generate adaptive practice set');
    console.log(`   -> Weak Topics Identified: ${data.weakTopics?.join(', ')}`);
    console.log(`   -> Curated Practice Questions: ${data.questions.length} problems with dynamic difficulty calibration`);
  });

  // 15. Adaptive Practice Submission & Mastery Progression
  await assertTest('15. Adaptive Practice Submission & Immediate Mastery Update', async () => {
    const res = await fetch(`${BASE_URL}/student/practice/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        questionId: 'prac_dp_01',
        type: 'coding',
        code: `#include <iostream>\nusing namespace std;\nint main() { cout << "15" << endl; return 0; }`,
        language: 'cpp',
        currentMastery: 48
      })
    });
    const data = await res.json();
    if (!data.success || data.updatedMastery === undefined) throw new Error('Practice evaluation failed');
    console.log(`   -> Mastery Updated: 48% -> ${data.updatedMastery}%, AI Feedback: "${data.aiFeedback?.slice(0, 45)}..."`);
  });

  // 16. Faculty Plagiarism & Code Similarity AST Winnowing Scan
  await assertTest('16. Faculty MOSS-Style Plagiarism Scan & AST Fingerprinting', async () => {
    const res = await fetch(`${BASE_URL}/faculty/similarity-check/${testExam._id || testExam.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${facultyToken}`
      },
      body: JSON.stringify({ threshold: 60 })
    });
    const data = await res.json();
    if (!data.success || !data.report) throw new Error('Plagiarism scan failed');
    console.log(`   -> Scanned Questions: ${data.report.scannedQuestionsCount}, Total Comparisons: ${data.report.totalComparisons}, Flagged Pairs: ${data.report.flaggedPairsCount}`);
  });

  // 17. Post-Exam Integrity Dossier with Composite Score & Audit Timeline
  await assertTest('17. Post-Exam Integrity Dossier Query', async () => {
    const res = await fetch(`${BASE_URL}/faculty/integrity-dossier/${attempt._id || attempt.id}`, {
      headers: { Authorization: `Bearer ${facultyToken}` }
    });
    const data = await res.json();
    if (!data.success || !data.integrity) throw new Error('Integrity dossier retrieval failed');
    console.log(`   -> Student Composite Integrity Score: ${data.integrity.score}%, Trust Tier: ${data.integrity.tier}`);
    console.log(`   -> Total Audit Events: ${data.events?.length}, Tab Switches Count: ${data.integrity.signals?.tabSwitchesCount}`);
  });

  console.log('\n====================================================');
  console.log(`🎯 Test Summary: ${passed} / ${total} Tests Passed (${Math.round((passed / total) * 100)}%)`);
  console.log('====================================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
