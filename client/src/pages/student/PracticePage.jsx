import React, { useState, useEffect } from 'react';
import { studentApi } from '../../services/api';
import MonacoCodeEditor from '../../components/editor/MonacoCodeEditor';
import confetti from 'canvas-confetti';
import {
  BrainCircuit, Sparkles, Target, CheckCircle2, XCircle,
  Send, HelpCircle, RefreshCw, Award, BookOpen, Check,
  AlertTriangle, ChevronRight, Zap, Trophy, TrendingUp,
  Lightbulb, ArrowRight, Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Difficulty config ─────────────────────────────────────────────────
const DIFF_CFG = {
  Easy:   { color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', ring: 'ring-emerald-400/30' },
  Medium: { color: '#f59e0b', bg: '#fefce8', border: '#fde68a', ring: 'ring-amber-400/30' },
  Hard:   { color: '#f43f5e', bg: '#fff1f2', border: '#fecdd3', ring: 'ring-rose-400/30' },
};
const getDiff = (d) => DIFF_CFG[d] || DIFF_CFG.Medium;

// ── Animated mastery bar ──────────────────────────────────────────────
function MasteryBar({ pct, delay = 0 }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 300 + delay * 100);
    return () => clearTimeout(t);
  }, [pct]);
  const color = pct >= 75 ? '#10b981' : pct >= 55 ? '#6366f1' : '#f59e0b';
  return (
    <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${width}%`, backgroundColor: color }}
      />
    </div>
  );
}

// ── Topic Mastery Card ────────────────────────────────────────────────
function TopicCard({ tm, idx }) {
  const pct = tm.masteryPercent || 50;
  const color = pct >= 75 ? '#10b981' : pct >= 55 ? '#a78bfa' : '#f59e0b';
  const levelColors = {
    Easy: 'text-emerald-300 bg-emerald-500/10',
    Medium: 'text-amber-300 bg-amber-500/10',
    Hard: 'text-rose-300 bg-rose-500/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + idx * 0.07, type: 'spring', stiffness: 200 }}
      className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm space-y-3 hover:bg-white/15 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-black text-white leading-snug line-clamp-1" title={tm.topic}>
          {tm.topic}
        </span>
        <span className="font-mono text-base font-black shrink-0" style={{ color }}>{pct}%</span>
      </div>
      <MasteryBar pct={pct} delay={idx} />
      <div className="flex items-center justify-between text-[10px]">
        <span className={`px-2 py-0.5 rounded-full font-black ${levelColors[tm.recommendedLevel] || 'text-slate-300 bg-white/10'}`}>
          {tm.recommendedLevel}
        </span>
        <span className="text-white/50 font-medium">
          {tm.problemsCompleted || 1}/{tm.totalTargetProblems || 8} solved
        </span>
      </div>
    </motion.div>
  );
}

// ── Question Tab ──────────────────────────────────────────────────────
function QuestionTab({ q, idx, selected, solved, onClick }) {
  const diff = getDiff(q.difficulty);
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black shrink-0 transition-all border ${
        selected
          ? 'text-white shadow-lg border-transparent'
          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800'
      }`}
      style={selected ? {
        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
        boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
      } : {}}
    >
      {solved && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
      <span>Q{idx + 1}</span>
      <span
        className="text-[10px] font-black px-1.5 py-0.5 rounded-md"
        style={{ color: diff.color, backgroundColor: diff.bg }}
      >
        {q.difficulty}
      </span>
    </motion.button>
  );
}

// ── Feedback Result Banner ────────────────────────────────────────────
function FeedbackBanner({ result, onNext, hasNext }) {
  const ok = result.isCorrect;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 border-t ${ok ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl shrink-0 ${ok ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
            {ok ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          </div>
          <div className="space-y-1 min-w-0">
            <h4 className={`text-xs font-black ${ok ? 'text-emerald-700' : 'text-amber-700'}`}>
              {result.message || (ok ? '✓ Correct! Well done.' : '✗ Incorrect — keep going.')}
            </h4>
            {result.aiFeedback && (
              <p className="text-[11px] text-slate-600 leading-relaxed">{result.aiFeedback}</p>
            )}
            <div className="flex items-center gap-3 text-[10px] font-black">
              <span className="text-indigo-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Mastery → {result.updatedMastery}%
              </span>
              {result.nextStepRecommendation && (
                <span className="text-slate-500">• {result.nextStepRecommendation}</span>
              )}
            </div>
          </div>
        </div>
        {hasNext && (
          <button
            onClick={onNext}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-black transition hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
          >
            Next <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────
export default function PracticePage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weakTopics, setWeakTopics] = useState([]);
  const [topicMastery, setTopicMastery] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedQIndex, setSelectedQIndex] = useState(0);
  const [aiCoachNote, setAiCoachNote] = useState('');
  const [solvedSet, setSolvedSet] = useState(new Set());

  const [answers, setAnswers] = useState({});
  const [showHint, setShowHint] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  const loadPracticeSet = async () => {
    try {
      setRefreshing(true);
      const res = await studentApi.getAdaptivePracticeSet();
      if (res.success) {
        setWeakTopics(res.weakTopics || []);
        setTopicMastery(res.topicMastery || []);
        setQuestions(res.questions || []);
        setAiCoachNote(res.aiCoachNote || '');
        const ansMap = {};
        (res.questions || []).forEach((q) => {
          ansMap[q.id] = {
            code: q.starterCode?.cpp || q.starterCode?.python || '',
            language: 'cpp',
            selectedOptionIds: [],
          };
        });
        setAnswers(ansMap);
        setSelectedQIndex(0);
        setSubmitResult(null);
        setShowHint(false);
        setSolvedSet(new Set());
      }
    } catch (err) {
      console.error('Error loading practice set:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadPracticeSet(); }, []);

  const currentQ = questions[selectedQIndex];
  const currentAns = currentQ ? (answers[currentQ.id] || {}) : {};

  const handleUpdateCode = (newCode) => {
    if (!currentQ) return;
    setAnswers(prev => ({ ...prev, [currentQ.id]: { ...(prev[currentQ.id] || {}), code: newCode } }));
  };
  const handleUpdateLang = (newLang) => {
    if (!currentQ) return;
    const starter = currentQ.starterCode?.[newLang] || '';
    setAnswers(prev => ({ ...prev, [currentQ.id]: { ...(prev[currentQ.id] || {}), language: newLang, code: starter } }));
  };
  const handleSelectOption = (optId) => {
    if (!currentQ) return;
    setAnswers(prev => ({ ...prev, [currentQ.id]: { ...(prev[currentQ.id] || {}), selectedOptionIds: [optId] } }));
  };

  const handleSubmitPractice = async () => {
    if (!currentQ) return;
    setIsSubmitting(true);
    setSubmitResult(null);
    try {
      const topicObj = topicMastery.find(t => t.topic === currentQ.topic);
      const curMastery = topicObj ? topicObj.masteryPercent : 50;
      const res = await studentApi.submitPracticeAnswer({
        questionId: currentQ.id,
        type: currentQ.type,
        code: currentAns.code,
        language: currentAns.language,
        selectedOptionIds: currentAns.selectedOptionIds,
        currentMastery: curMastery,
      });
      setSubmitResult(res);
      if (res.isCorrect) {
        setSolvedSet(prev => new Set([...prev, currentQ.id]));
        confetti({ particleCount: 60, spread: 65, origin: { y: 0.55 }, colors: ['#6366f1', '#10b981', '#a78bfa'] });
        setTopicMastery(prev => prev.map(t =>
          t.topic === currentQ.topic
            ? { ...t, masteryPercent: res.updatedMastery || (t.masteryPercent + 12), problemsCompleted: (t.problemsCompleted || 0) + 1 }
            : t
        ));
      }
    } catch (err) {
      alert('Practice evaluation error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goNext = () => {
    if (selectedQIndex < questions.length - 1) {
      setSelectedQIndex(prev => prev + 1);
      setSubmitResult(null);
      setShowHint(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-14 w-14 rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <BrainCircuit className="h-5 w-5 text-indigo-500" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-black text-slate-800">Calibrating your practice set</p>
            <p className="text-xs text-slate-500 mt-0.5">Analyzing weak topics & synthesizing adaptive questions…</p>
          </div>
        </div>
      </div>
    );
  }

  const diff = currentQ ? getDiff(currentQ.difficulty) : getDiff('Medium');
  const solvedCount = solvedSet.size;

  return (
    <div className="space-y-5 pb-16">

      {/* ── Hero Banner ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 180 }}
        className="relative overflow-hidden rounded-3xl"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #3730a3 100%)' }}
      >
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #818cf8, transparent 70%)' }} />
          <div className="absolute bottom-0 left-10 w-48 h-48 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #a78bfa, transparent 70%)' }} />
          <div className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="relative z-10 p-6 sm:p-8">
          {/* Top row */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 mb-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-indigo-200 text-xs font-black">
                <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                AI Adaptive Coach & Practice Mode
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
                Dynamic Skill Mastery Sandbox
              </h1>
              <p className="text-sm text-indigo-200/80 max-w-xl leading-relaxed">
                {aiCoachNote || 'Personalized problem sets synthesized from your historical test analytics to transform weak topics into verified proficiencies.'}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Progress badge */}
              <div className="hidden sm:flex flex-col items-center px-4 py-2.5 rounded-xl bg-white/10 border border-white/15">
                <span className="text-2xl font-black text-white">{solvedCount}/{questions.length}</span>
                <span className="text-[10px] font-bold text-indigo-300 mt-0.5">Solved Today</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={loadPracticeSet}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-black transition disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Regenerate AI Set
              </motion.button>
            </div>
          </div>

          {/* Topic mastery cards */}
          {topicMastery.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-5 border-t border-white/10">
              {topicMastery.map((tm, idx) => (
                <TopicCard key={idx} tm={tm} idx={idx} />
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Practice Interface ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* ── LEFT: Question Panel ──────────────────────── */}
        <div className="lg:col-span-5 space-y-4">

          {/* Question selector tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {questions.map((q, idx) => (
              <QuestionTab
                key={q.id}
                q={q}
                idx={idx}
                selected={selectedQIndex === idx}
                solved={solvedSet.has(q.id)}
                onClick={() => { setSelectedQIndex(idx); setSubmitResult(null); setShowHint(false); }}
              />
            ))}
          </div>

          {/* Question card */}
          <AnimatePresence mode="wait">
            {currentQ && (
              <motion.div
                key={currentQ.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl bg-white border border-slate-200 shadow-lg overflow-hidden"
              >
                {/* Question header */}
                <div className="p-5 border-b border-slate-100 space-y-3"
                  style={{ borderTopWidth: 4, borderTopColor: diff.color }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border"
                      style={{ color: '#6366f1', backgroundColor: '#ede9fe', borderColor: '#c4b5fd' }}>
                      <BookOpen className="h-3 w-3 inline mr-1" />
                      {currentQ.topic}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border"
                      style={{ color: diff.color, backgroundColor: diff.bg, borderColor: diff.border }}>
                      {currentQ.difficulty}
                    </span>
                    <span className="ml-auto text-xs font-black text-slate-400">
                      {currentQ.marks} pts
                    </span>
                  </div>
                  <h2 className="text-base font-black text-slate-900 leading-snug">{currentQ.title}</h2>

                  {/* AI rationale callout */}
                  {currentQ.aiRationale && (
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-50 border border-indigo-200">
                      <BrainCircuit className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-indigo-700 font-medium leading-relaxed">{currentQ.aiRationale}</p>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="p-5 space-y-4 overflow-y-auto max-h-72">
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {currentQ.description}
                  </p>

                  {/* Examples */}
                  {currentQ.examples?.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Example Cases</h4>
                      {currentQ.examples.map((ex, i) => (
                        <div key={i} className="p-3.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-xs space-y-1.5">
                          <div><span className="text-slate-500">Input: </span><span className="text-slate-200">{ex.input}</span></div>
                          <div><span className="text-slate-500">Output: </span><span className="text-emerald-400 font-black">{ex.output}</span></div>
                          {ex.explanation && (
                            <div className="text-[11px] text-slate-400 font-sans pt-1.5 border-t border-slate-700">
                              {ex.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Hint toggle */}
                <div className="px-5 pb-5">
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className={`flex items-center gap-2 text-xs font-black transition px-3 py-2 rounded-xl border ${
                      showHint
                        ? 'bg-amber-50 border-amber-200 text-amber-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-amber-200 hover:text-amber-600'
                    }`}
                  >
                    <Lightbulb className="h-4 w-4" />
                    {showHint ? 'Hide Hint' : 'Show AI Hint'}
                  </button>

                  <AnimatePresence>
                    {showHint && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
                          <span className="font-black text-[10px] uppercase tracking-widest text-amber-600 block">
                            Algorithmic Hint
                          </span>
                          <p className="leading-relaxed">{currentQ.hint}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── RIGHT: Editor / MCQ ───────────────────────── */}
        <div className="lg:col-span-7 flex flex-col rounded-2xl bg-white border border-slate-200 shadow-lg overflow-hidden" style={{ height: 650 }}>

          {/* Editor header */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-200 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-rose-400" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
              </div>
              <span className="text-xs font-black text-slate-600">
                {currentQ?.type === 'coding' ? 'Code Editor' : 'Answer Selection'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                Adaptive Sandbox Mode
              </span>
            </div>
          </div>

          {currentQ?.type === 'coding' ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <MonacoCodeEditor
                question={currentQ}
                code={currentAns.code || currentQ.starterCode?.[currentAns.language || 'cpp'] || ''}
                language={currentAns.language || 'cpp'}
                onCodeChange={handleUpdateCode}
                onLanguageChange={handleUpdateLang}
                onResetCode={() => handleUpdateLang(currentAns.language || 'cpp')}
                attemptId="practice_mode"
                examId="adaptive_practice"
              />

              {/* Feedback */}
              <AnimatePresence>
                {submitResult && (
                  <FeedbackBanner
                    result={submitResult}
                    onNext={goNext}
                    hasNext={selectedQIndex < questions.length - 1}
                  />
                )}
              </AnimatePresence>

              {/* Action bar */}
              <div className="px-5 py-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Instant unit evaluation
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmitPractice}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-xs font-black shadow-lg disabled:opacity-50 transition"
                  style={{
                    background: isSubmitting ? '#6366f1' : 'linear-gradient(135deg, #4f46e5, #6366f1, #7c3aed)',
                    boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Evaluating…
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Submit & Check Mastery
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          ) : (
            /* MCQ */
            <div className="flex-1 flex flex-col overflow-y-auto">
              <div className="p-6 flex-1 space-y-4">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">
                  Select the Best Answer
                </h3>
                <div className="space-y-2.5">
                  {(currentQ?.options || []).map((opt, i) => {
                    const selected = (currentAns.selectedOptionIds || []).includes(opt.id);
                    const letters = ['A','B','C','D','E'];
                    return (
                      <motion.button
                        key={opt.id}
                        whileHover={{ x: 3 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleSelectOption(opt.id)}
                        className={`w-full p-4 rounded-xl border text-left transition-all flex items-start gap-4 text-sm ${
                          selected
                            ? 'bg-indigo-50 border-indigo-400 shadow-md shadow-indigo-500/10'
                            : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30'
                        }`}
                      >
                        <div className={`h-7 w-7 rounded-full border-2 flex items-center justify-center shrink-0 font-black text-xs transition-all ${
                          selected
                            ? 'border-indigo-500 bg-indigo-500 text-white'
                            : 'border-slate-300 text-slate-500'
                        }`}>
                          {selected ? <Check className="h-3.5 w-3.5" /> : letters[i]}
                        </div>
                        <span className={`leading-relaxed font-mono text-xs pt-0.5 ${selected ? 'text-indigo-800 font-bold' : 'text-slate-700'}`}>
                          {opt.text}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* MCQ feedback */}
              <AnimatePresence>
                {submitResult && (
                  <FeedbackBanner
                    result={submitResult}
                    onNext={goNext}
                    hasNext={selectedQIndex < questions.length - 1}
                  />
                )}
              </AnimatePresence>

              <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-end shrink-0">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmitPractice}
                  disabled={isSubmitting || !currentAns.selectedOptionIds?.length}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-xs font-black shadow-lg disabled:opacity-40 transition"
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}
                >
                  <Send className="h-3.5 w-3.5" />
                  {isSubmitting ? 'Validating…' : 'Submit Answer'}
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
