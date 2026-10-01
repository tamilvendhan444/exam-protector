import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { examApi, proctorApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import MonacoCodeEditor from '../../components/editor/MonacoCodeEditor';
import DigitalRoughPad from '../../components/roughpad/DigitalRoughPad';
import LiveCameraProctorPanel from '../../components/proctor/LiveCameraProctorPanel';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import ExamHeader from '../../components/exam/ExamHeader';
import QuestionNavigator from '../../components/exam/QuestionNavigator';
import QuestionWorkspace from '../../components/exam/QuestionWorkspace';
import { useExamTimer } from '../../hooks/useExamTimer';
import { useExamProctoring } from '../../hooks/useExamProctoring';
import { AnimatedModal } from '../../components/ui/AnimatedModal';
import { Button } from '../../components/ui/Button';
import { ChevronLeft, ChevronRight, Bookmark, WifiOff, Maximize2, AlertTriangle, Clock, Check, ShieldCheck, X } from 'lucide-react';
import { getStarterCodeForLanguage } from '../../utils/starterCodeHelper';
import { enableExamDistractionFreeMode, disableExamDistractionFreeMode } from '../../utils/notificationGuard';

export default function ExamInterfacePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const rollNumber = location.state?.rollNumber || '';
  const { user } = useAuth();
  const { joinExam, leaveExam, reportIncident, socket, connectionStatus, disconnectDurationSeconds, lastDisconnectGap } = useSocket();

  const [exam, setExam] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const [answers, setAnswers] = useState({});
  const [autoSaveStatus, setAutoSaveStatus] = useState('All changes saved');

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenBlockedModalOpen, setFullscreenBlockedModalOpen] = useState(false);
  const [fullscreenEntryModalOpen, setFullscreenEntryModalOpen] = useState(false);
  const [roughPadOpen, setRoughPadOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [warningToast, setWarningToast] = useState(null);

  const [idleModalOpen, setIdleModalOpen] = useState(false);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const lastActivityTimeRef = useRef(Date.now());
  const idleModalTriggeredRef = useRef(false);

  const policy = exam?.proctoringSettings || {};
  const currentQuestion = questions[currentIndex];
  const currentAns = currentQuestion ? (answers[currentQuestion._id || currentQuestion.id] || {}) : {};

  // Suppress all in-app and browser notifications/audio during active exam attempt
  useEffect(() => {
    enableExamDistractionFreeMode();
    return () => {
      disableExamDistractionFreeMode();
    };
  }, []);

  // -- INIT EXAM --
  useEffect(() => {
    const isCameraVerified = sessionStorage.getItem(`exam_camera_verified_${id}`);
    if (!isCameraVerified) {
      navigate(`/student/exams/${id}/system-check`, { replace: true });
      return;
    }
    async function initExam() {
      try {
        let livenessCheckData = null;
        try {
          const stored = sessionStorage.getItem(`exam_liveness_result_${id}`);
          if (stored) livenessCheckData = JSON.parse(stored);
        } catch (e) { }

        const res = await examApi.startAttempt(id, { livenessCheck: livenessCheckData || undefined, rollNumber });
        if (res.success) {
          setExam(res.exam);
          setAttempt(res.attempt);
          setQuestions(res.questions);

          const ansMap = {};
          (res.attempt.answers || []).forEach(a => {
            const currentCode = a.codeAnswer || '';
            const isOldPrefilledCode = currentCode.includes('stringstream') || currentCode.includes('getline(cin') || currentCode.includes('int main()') || currentCode.includes('seen[nums[i]]') || currentCode.includes('curr_max = max');
            const relatedQ = (res.questions || []).find(q => String(q._id || q.id) === String(a.questionId));
            const sanitizedCode = isOldPrefilledCode ? (relatedQ?.starterCode?.[a.language || 'cpp'] || '') : currentCode;

            ansMap[a.questionId] = {
              selectedOptionIds: a.selectedOptionIds || [],
              codeAnswer: sanitizedCode,
              language: a.language || 'cpp',
              descriptiveAnswer: a.descriptiveAnswer || '',
              status: isOldPrefilledCode ? 'unanswered' : (a.status || 'unanswered'),
              timeSpentSeconds: a.timeSpentSeconds || 0
            };
          });

          (res.questions || []).forEach(q => {
            const qId = q._id || q.id;
            if (q.type === 'coding') {
              const defaultLang = ansMap[qId]?.language || 'cpp';
              const existingCodes = ansMap[qId]?.codeAnswersByLang || {};
              const defaultCodes = {
                cpp: existingCodes.cpp || getStarterCodeForLanguage(q, 'cpp'),
                c: existingCodes.c || getStarterCodeForLanguage(q, 'c'),
                python: existingCodes.python || getStarterCodeForLanguage(q, 'python'),
                java: existingCodes.java || getStarterCodeForLanguage(q, 'java'),
                javascript: existingCodes.javascript || getStarterCodeForLanguage(q, 'javascript')
              };
              const activeCode = (ansMap[qId]?.codeAnswer && ansMap[qId].codeAnswer.trim().length > 0)
                ? ansMap[qId].codeAnswer
                : defaultCodes[defaultLang];

              ansMap[qId] = {
                ...(ansMap[qId] || {}),
                selectedOptionIds: ansMap[qId]?.selectedOptionIds || [],
                codeAnswer: activeCode,
                language: defaultLang,
                codeAnswersByLang: defaultCodes,
                descriptiveAnswer: ansMap[qId]?.descriptiveAnswer || '',
                status: ansMap[qId]?.status || 'unanswered',
                timeSpentSeconds: ansMap[qId]?.timeSpentSeconds || 0
              };
            } else if (!ansMap[qId]) {
              ansMap[qId] = {
                selectedOptionIds: [],
                codeAnswer: '',
                language: undefined,
                descriptiveAnswer: '',
                status: 'unanswered',
                timeSpentSeconds: 0
              };
            }
          });

          setAnswers(ansMap);
          joinExam(id, res.attempt._id || res.attempt.id);

          if (res.exam?.proctoringSettings?.fullscreenEnforced !== false) {
            if (!document.fullscreenElement) {
              setFullscreenEntryModalOpen(true);
            } else {
              setIsFullscreen(true);
            }
          } else {
            setIsFullscreen(false);
          }
        }
      } catch (err) {
        alert('Could not start examination: ' + err.message);
        navigate('/student/exams');
      } finally {
        setLoading(false);
      }
    }
    initExam();
  }, [id, navigate, joinExam]);

  const answersRef = useRef(answers);
  const attemptRef = useRef(attempt);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    attemptRef.current = attempt;
  }, [attempt]);

  const handleSubmitExam = useCallback(async () => {
    console.log('[DEBUG-FORCE-SUBMIT] handleSubmitExam called!', new Error().stack);
    setSubmitting(true);
    try {
      const currentAttempt = attemptRef.current;
      const currentAnswers = answersRef.current;
      const formattedAnswers = Object.entries(currentAnswers).map(([qId, data]) => ({
        questionId: qId,
        ...data,
        timeSpentSeconds: questionTimeRef.current[qId] ?? data.timeSpentSeconds ?? 0
      }));
      const res = await examApi.submitExam(id, { attemptId: currentAttempt._id || currentAttempt.id, answers: formattedAnswers });
      if (res.success) {
        disableExamDistractionFreeMode();
        if (document.fullscreenElement) try { await document.exitFullscreen(); } catch (e) { }
        if (leaveExam) leaveExam(id, currentAttempt?._id || currentAttempt?.id);
        navigate(`/student/exams/${id}/result?attemptId=${currentAttempt._id || currentAttempt.id}`);
      }
    } catch (err) {
      alert('Failed to submit examination: ' + err.message);
    } finally {
      setSubmitting(false);
      setSubmitModalOpen(false);
    }
  }, [id, leaveExam, navigate]);

  // Use Custom Hooks
  const { remainingSeconds, formatTimer, syncTimer } = useExamTimer({
    initialSeconds: attempt?.remainingSeconds || (exam?.durationMinutes ? exam.durationMinutes * 60 : 3600),
    loading,
    onTimeUp: handleSubmitExam
  });

  const triggerProctorAlert = useCallback((title, message) => {
    setWarningToast({ title, message });
    setTimeout(() => setWarningToast(null), 6000);
  }, []);

  useExamProctoring({
    id, attempt, policy, loading, reportIncident,
    setFullscreenBlockedModalOpen, setFullscreenEntryModalOpen, setIsFullscreen,
    triggerProctorAlert, lastDisconnectGap, setIdleModalOpen, idleModalTriggeredRef, lastActivityTimeRef
  });

  // Per-question time tracking (Optimized via ref to prevent 1-second state-thrashing re-renders)
  const questionTimeRef = useRef({});
  useEffect(() => {
    if (loading || !currentQuestion) return;
    const qId = currentQuestion._id || currentQuestion.id;
    if (questionTimeRef.current[qId] === undefined) {
      questionTimeRef.current[qId] = answersRef.current[qId]?.timeSpentSeconds || 0;
    }
    const qTimer = setInterval(() => {
      questionTimeRef.current[qId] = (questionTimeRef.current[qId] || 0) + 1;
    }, 1000);
    return () => {
      clearInterval(qTimer);
      if (answersRef.current[qId]) {
        answersRef.current[qId].timeSpentSeconds = questionTimeRef.current[qId] || 0;
      }
    };
  }, [loading, currentIndex, currentQuestion?._id || currentQuestion?.id]);

  const handlePasteDetected = async ({ charCount, lineCount, snippet }) => {
    triggerProctorAlert('Large Clipboard Paste Detected', `Pasted ${charCount} characters (${lineCount} lines).`);
    const payload = { examId: id, attemptId: attempt?._id || attempt?.id, eventType: 'suspicious_paste', severity: charCount > 150 ? 'high' : 'medium', confidence: 0.96, details: `Large paste: ${charCount} chars.` };
    if (reportIncident) reportIncident(payload);
    try { await proctorApi.logEvent(payload); } catch (e) { }
  };

  const handleTypingBurstDetected = async ({ charCount, timeDeltaMs }) => {
    triggerProctorAlert('Abnormal Typing Velocity Flagged', `Rapid input velocity of ${charCount} characters in ${timeDeltaMs}ms.`);
    const payload = { examId: id, attemptId: attempt?._id || attempt?.id, eventType: 'typing_burst', severity: 'medium', confidence: 0.90, details: `Abnormal typing burst: ${charCount} characters in ${timeDeltaMs}ms.` };
    if (reportIncident) reportIncident(payload);
    try { await proctorApi.logEvent(payload); } catch (e) { }
  };

  const requestFullscreenMode = async () => {
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      setIsFullscreen(true);
      setFullscreenBlockedModalOpen(false);
      setFullscreenEntryModalOpen(false);
    } catch (err) { }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) requestFullscreenMode();
    else document.exitFullscreen().catch(() => { });
  };

  const handleClipboardBlocked = useCallback((action) => {
    if (policy.clipboardGuard === false) return;
    const actionType = action || 'clipboard';
    triggerProctorAlert(`${actionType.toUpperCase()} Action Blocked`, `Copying, cutting, and pasting are disabled.`);
    const payload = { examId: id, attemptId: attempt?._id || attempt?.id, eventType: 'clipboard_blocked', severity: 'medium', confidence: 0.95, details: `Attempted blocked ${actionType} action.` };
    if (reportIncident) reportIncident(payload);
    proctorApi.logEvent(payload).catch(() => { });
  }, [id, attempt, policy, reportIncident, triggerProctorAlert]);

  const handleCodeSubmitted = useCallback((result) => {
    if (!currentQuestion) return;
    const qId = currentQuestion._id || currentQuestion.id;
    setAnswers(prev => ({ ...prev, [qId]: { ...(prev[qId] || {}), status: 'answered', lastEarnedMarks: result.earnedMarks, lastAllPassed: result.allPassed } }));
    triggerAutoSave(qId, { status: 'answered', codeAnswer: answers[qId]?.codeAnswer, language: answers[qId]?.language });
    triggerProctorAlert(result.allPassed ? 'Code Accepted ✓' : 'Code Evaluated', result.allPassed ? `All ${result.totalTestCases} test cases passed!` : `Passed ${result.passedTestCases}/${result.totalTestCases} test cases.`);
  }, [currentQuestion, answers, triggerProctorAlert]); // triggerAutoSave dependency is omitted to avoid loops

  const updateCurrentAnswer = useCallback((field, value) => {
    if (!currentQuestion) return;
    const qId = currentQuestion._id || currentQuestion.id;
    const updated = { ...(answers[qId] || {}), [field]: value, status: 'answered' };
    setAnswers(prev => ({ ...prev, [qId]: updated }));
    triggerAutoSave(qId, updated);
  }, [currentQuestion, answers]);

  const updateCurrentAnswerBatch = useCallback((updates) => {
    if (!currentQuestion) return;
    const qId = currentQuestion._id || currentQuestion.id;
    const updated = { ...(answers[qId] || {}), ...updates, status: 'answered' };
    setAnswers(prev => ({ ...prev, [qId]: updated }));
    triggerAutoSave(qId, updated);
  }, [currentQuestion, answers]);

  const saveTimeoutRef = useRef(null);
  const triggerAutoSave = (qId, answerData) => {
    setAutoSaveStatus(!navigator.onLine ? 'Saved Offline ⚡' : 'Saving changes...');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      if (!attempt) return;
      try {
        const response = await examApi.autoSaveAnswer(id, { attemptId: attempt._id || attempt.id, questionId: qId, ...answerData, timeSpentSeconds: answers[qId]?.timeSpentSeconds || answerData?.timeSpentSeconds || 0, remainingSeconds });
        if (response?.offline) {
          setAutoSaveStatus('Saved Offline ⚡');
        } else {
          setAutoSaveStatus('Saved just now ✓');
          if (response?.remainingSeconds !== undefined && response.remainingSeconds > 0) {
            syncTimer(response.remainingSeconds);
          }
          if (response?.forceSubmit && (remainingSeconds <= 5 || response?.remainingSeconds === 0)) {
            handleSubmitExam();
          }
        }
      } catch (err) {
        setAutoSaveStatus(!navigator.onLine ? 'Saved Offline ⚡' : 'Failed to save ⚠️');
      }
    }, 1200);
  };

  useEffect(() => {
    const handleOffline = () => setAutoSaveStatus('Offline Mode ⚡');
    const handleOnline = () => setAutoSaveStatus('Syncing... ✓');
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const toggleMarkForReview = () => {
    if (!currentQuestion) return;
    const qId = currentQuestion._id || currentQuestion.id;
    const newStatus = answers[qId]?.status === 'marked_for_review' ? 'answered' : 'marked_for_review';
    updateCurrentAnswer('status', newStatus);
  };

  useEffect(() => {
    if (!socket) return;
    const handleForceSubmit = (data) => {
      // Must verify this force submit is strictly for THIS student and THIS attempt
      const myAttemptId = String(attemptRef.current?._id || attemptRef.current?.id || '');
      const myStudentId = String(user?.id || user?._id || '');
      if (data?.attemptId && myAttemptId && String(data.attemptId) !== myAttemptId) return;
      if (data?.studentId && myStudentId && String(data.studentId) !== myStudentId) return;

      triggerProctorAlert('Exam Auto-Submitted', data?.message || 'Proctoring incident limit reached.');
      handleSubmitExam();
    };
    socket.on('student:force_submit', handleForceSubmit);
    return () => socket.off('student:force_submit', handleForceSubmit);
  }, [socket, user, handleSubmitExam, triggerProctorAlert]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-8 w-8 border-3 border-brand-500 border-t-transparent rounded-full"></div>
          <span className="text-xs text-slate-600 font-semibold">Initializing examination environment...</span>
        </div>
      </div>
    );
  }

  const answeredCount = Object.values(answers).filter(a => a.status === 'answered').length;
  const markedCount = Object.values(answers).filter(a => a.status === 'marked_for_review').length;
  const unattemptedCount = Math.max(0, questions.length - (answeredCount + markedCount));

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 overflow-hidden select-none">
      {connectionStatus !== 'connected' && policy.networkGapDetection !== false && (
        <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-red-700 text-slate-900 px-4 py-2 flex items-center justify-between text-xs font-semibold shadow-xl border-b border-rose-500 z-50 animate-in fade-in slide-in-from-top duration-200 shrink-0">
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4 shrink-0 text-white" />
            <span className="text-white">Real-time proctoring connection interrupted — attempting reconnection ({disconnectDurationSeconds}s elapsed)...</span>
          </div>
          <span className="text-[11px] bg-black/25 text-white px-2.5 py-0.5 rounded-full font-mono border border-white/20">
            Grace Window: {policy.networkGapGraceSeconds || 20}s
          </span>
        </div>
      )}

      {warningToast && (
        <div className="fixed top-16 right-6 z-50 animate-in slide-in-from-right duration-300">
          <div className="bg-rose-500 text-white p-4 rounded-xl shadow-2xl flex items-start gap-3 max-w-sm">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">{warningToast.title}</h4>
              <p className="text-xs opacity-90 mt-1">{warningToast.message}</p>
            </div>
          </div>
        </div>
      )}

      <ExamHeader
        examTitle={exam?.title}
        examSubject={exam?.subject}
        remainingSeconds={remainingSeconds}
        formatTimer={formatTimer}
        autoSaveStatus={autoSaveStatus}
        setPolicyModalOpen={setPolicyModalOpen}
        setRoughPadOpen={setRoughPadOpen}
        toggleFullscreen={toggleFullscreen}
        isFullscreen={isFullscreen}
        setSubmitModalOpen={setSubmitModalOpen}
      />

      <main className="flex-1 flex overflow-hidden">
        <QuestionNavigator
          questions={questions}
          answers={answers}
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
          answeredCount={answeredCount}
          markedCount={markedCount}
          unattemptedCount={unattemptedCount}
        />

        <section className="flex-1 flex flex-col overflow-hidden bg-slate-50">
          {currentQuestion ? (
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              <QuestionWorkspace
                currentQuestion={currentQuestion}
                currentIndex={currentIndex}
                totalQuestions={questions.length}
                currentAns={currentAns}
                formatTimer={formatTimer}
                updateCurrentAnswer={updateCurrentAnswer}
                handleClipboardBlocked={handleClipboardBlocked}
              />

              {currentQuestion.type === 'coding' && (
                <div className="flex-1 p-4 overflow-hidden h-full">
                  <ErrorBoundary fallback={<div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl m-4">Failed to load code editor.</div>}>
                    <MonacoCodeEditor
                      question={currentQuestion}
                      code={currentAns.codeAnswer || getStarterCodeForLanguage(currentQuestion, currentAns.language || 'cpp')}
                      language={currentAns.language || 'cpp'}
                      onCodeChange={(newCode) => {
                        const curLang = currentAns.language || 'cpp';
                        const langCodes = currentAns.codeAnswersByLang || {};
                        updateCurrentAnswerBatch({ codeAnswer: newCode, codeAnswersByLang: { ...langCodes, [curLang]: newCode } });
                      }}
                      onLanguageChange={(newLang) => {
                        const prevLang = currentAns.language || 'cpp';
                        const currentCode = currentAns.codeAnswer || '';
                        const langCodes = currentAns.codeAnswersByLang || {};
                        const updatedCodes = { ...langCodes, [prevLang]: currentCode };
                        let newCode = updatedCodes[newLang];
                        if (!newCode || !newCode.trim()) {
                          newCode = getStarterCodeForLanguage(currentQuestion, newLang);
                        }
                        updateCurrentAnswerBatch({ language: newLang, codeAnswer: newCode, codeAnswersByLang: { ...updatedCodes, [newLang]: newCode } });
                      }}
                      onResetCode={() => {
                        const curLang = currentAns.language || 'cpp';
                        const resetCode = getStarterCodeForLanguage(currentQuestion, curLang);
                        const langCodes = currentAns.codeAnswersByLang || {};
                        updateCurrentAnswerBatch({ codeAnswer: resetCode, codeAnswersByLang: { ...langCodes, [curLang]: resetCode } });
                      }}
                      attemptId={attempt?._id || attempt?.id}
                      examId={id}
                      onPasteDetected={handlePasteDetected}
                      onTypingBurstDetected={handleTypingBurstDetected}
                      onClipboardBlocked={handleClipboardBlocked}
                      onCodeSubmitted={handleCodeSubmitted}
                      onActivity={() => { lastActivityTimeRef.current = Date.now(); }}
                    />
                  </ErrorBoundary>
                </div>
              )}
            </div>
          ) : null}

          <footer className="h-14 border-t border-slate-200 bg-white/90 px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold disabled:opacity-40 transition"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </button>

              <button
                onClick={toggleMarkForReview}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${currentAns.status === 'marked_for_review' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                  }`}
              >
                <Bookmark className="h-3.5 w-3.5 fill-current" />
                <span>{currentAns.status === 'marked_for_review' ? 'Marked for Review' : 'Mark for Review'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const qId = currentQuestion._id || currentQuestion.id;
                  triggerAutoSave(qId, answers[qId]);
                  if (currentIndex < questions.length - 1) setCurrentIndex(i => i + 1);
                }}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-slate-900 text-xs font-bold shadow-md shadow-brand-500/20 transition"
              >
                <span>Save & Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </footer>
        </section>
      </main>

      <ErrorBoundary fallback={<div />}>
        <LiveCameraProctorPanel
          examId={id}
          attemptId={attempt?._id || attempt?.id}
          studentInfo={user}
          remainingSeconds={remainingSeconds}
          onIncidentDetected={(incident) => { console.log('[Proctor Incident]', incident); }}
        />
      </ErrorBoundary>

      <DigitalRoughPad isOpen={roughPadOpen} onClose={() => setRoughPadOpen(false)} />

      <AnimatedModal isOpen={submitModalOpen} onClose={() => setSubmitModalOpen(false)}>
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Confirm Exam Submission</h3>
            <button onClick={() => setSubmitModalOpen(false)} className="text-slate-600 hover:text-slate-900"><X className="h-5 w-5" /></button>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">Are you sure you wish to submit your assessment? Once submitted, your answers will be automatically evaluated by the grading pipeline.</p>
          <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-200 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20"><span className="text-[10px] text-emerald-400 block font-semibold">Answered</span><span className="text-sm font-bold text-emerald-300">{answeredCount}</span></div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20"><span className="text-[10px] text-amber-400 block font-semibold">In Review</span><span className="text-sm font-bold text-amber-300">{markedCount}</span></div>
            <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-300"><span className="text-[10px] text-slate-600 block font-semibold">Unanswered</span><span className="text-sm font-bold text-slate-800">{unattemptedCount}</span></div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setSubmitModalOpen(false)}>Continue Exam</Button>
            <Button variant="primary" onClick={handleSubmitExam} disabled={submitting}>
              {submitting ? 'Submitting & Grading...' : 'Confirm Submission'}
            </Button>
          </div>
        </div>
      </AnimatedModal>

      <AnimatedModal isOpen={fullscreenEntryModalOpen && !isFullscreen} onClose={() => { }}>
        <div className="p-6 text-center space-y-5">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-500"><Maximize2 className="h-7 w-7" /></div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900">Full-Screen Mode Required</h3>
            <p className="text-xs text-slate-700 leading-relaxed">EduProctor AI requires an uninterrupted full-screen environment. Click below to enter full-screen mode and access your assessment questions.</p>
          </div>
          <Button variant="primary" className="w-full gap-2" onClick={requestFullscreenMode}>
            <Maximize2 className="h-4 w-4" /><span>Enter Full-Screen to Begin Assessment</span>
          </Button>
        </div>
      </AnimatedModal>

      <AnimatedModal isOpen={fullscreenBlockedModalOpen && !isFullscreen} onClose={() => { }} className="border-rose-500/50">
        <div className="p-6 text-center space-y-5">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500"><AlertTriangle className="h-7 w-7" /></div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900">Return to Full-Screen to Continue</h3>
            <p className="text-xs text-slate-700 leading-relaxed">Exiting full-screen view is an integrity violation and has been logged on your proctor audit log. Click below to return to full-screen mode and resume your assessment.</p>
          </div>
          <Button variant="danger" className="w-full gap-2" onClick={requestFullscreenMode}>
            <Maximize2 className="h-4 w-4" /><span>Return to Full-Screen</span>
          </Button>
        </div>
      </AnimatedModal>

      <AnimatedModal isOpen={idleModalOpen} onClose={() => { lastActivityTimeRef.current = Date.now(); idleModalTriggeredRef.current = false; setIdleModalOpen(false); }} className="border-amber-500/40">
        <div className="p-6 text-center space-y-5">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500"><Clock className="h-7 w-7" /></div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900">Still There?</h3>
            <p className="text-xs text-slate-700 leading-relaxed">No user activity has been detected for over {policy.idleTimeoutMinutes || 3} minutes. Please confirm you are still actively working on this assessment.</p>
          </div>
          <button onClick={() => { lastActivityTimeRef.current = Date.now(); idleModalTriggeredRef.current = false; setIdleModalOpen(false); }} className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-bold text-xs shadow-lg shadow-amber-500/25 transition flex items-center justify-center gap-2">
            <Check className="h-4 w-4" /><span>I Am Still Working</span>
          </button>
        </div>
      </AnimatedModal>

      <AnimatedModal isOpen={policyModalOpen} onClose={() => setPolicyModalOpen(false)} className="max-w-lg">
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-brand-500" /><h3 className="text-base font-bold text-slate-900">Assessment Integrity Policy</h3></div>
            <button onClick={() => setPolicyModalOpen(false)} className="text-slate-600 hover:text-slate-900"><X className="h-5 w-5" /></button>
          </div>
          <p className="text-xs text-slate-600">This assessment is protected by the following automated integrity rules configured by the faculty instructor:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { label: 'Full-Screen Mode', active: policy.fullscreenEnforced !== false },
              { label: 'Clipboard & Paste Guard', active: policy.clipboardGuard !== false },
              { label: 'DevTools Inspection Monitor', active: policy.devtoolsDetection !== false },
              { label: 'Multi-Display Guard', active: policy.multiDisplayDetection !== false },
              { label: 'Tab Switch Detection', active: policy.tabSwitchDetection !== false },
              { label: 'Right-Click Disabled', active: policy.contextMenuBlocked !== false },
              { label: 'Candidate Idle Monitor', active: policy.idleDetection !== false },
              { label: 'Network Disconnection Sentinel', active: policy.networkGapDetection !== false }
            ].map((rule, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-100/40 border border-slate-200 flex items-center justify-between">
                <span className="text-slate-700 font-medium truncate pr-1">{rule.label}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${rule.active ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-200 text-slate-600'}`}>
                  {rule.active ? 'Enforced' : 'Disabled'}
                </span>
              </div>
            ))}
          </div>
          <div className="pt-2 flex justify-end">
            <Button variant="secondary" onClick={() => setPolicyModalOpen(false)}>Close Policy</Button>
          </div>
        </div>
      </AnimatedModal>
    </div>
  );
}
