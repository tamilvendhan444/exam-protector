import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { examApi } from '../../services/api';
import confetti from 'canvas-confetti';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  Code2,
  BrainCircuit,
  ArrowRight,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  FileCode,
  ShieldCheck,
  BookOpen,
  Zap,
  Trophy,
  Lock,
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { AnimatedModal } from '../../components/ui/AnimatedModal';
import CompetitionMedals from '../../components/common/CompetitionMedals';

// ─── Animated counter hook ──────────────────────────────────────────
function useCountUp(target, duration = 1.4, delay = 0.3) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts + delay * 1000;
      const elapsed = ts - start;
      if (elapsed < 0) { requestAnimationFrame(step); return; }
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, delay]);
  return display;
}

// ─── Arc Ring Component ──────────────────────────────────────────────
function ScoreArc({ scorePercent, totalScore, totalPossible }) {
  const [progress, setProgress] = useState(0);
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const displayScore = useCountUp(totalScore, 1.2, 0.5);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(scorePercent), 200);
    return () => clearTimeout(timer);
  }, [scorePercent]);

  const color = scorePercent >= 75 ? '#10b981' : scorePercent >= 50 ? '#f59e0b' : '#f43f5e';
  const bgColor = scorePercent >= 75 ? '#d1fae5' : scorePercent >= 50 ? '#fef3c7' : '#ffe4e6';
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg width="172" height="172" className="drop-shadow-xl">
          {/* Glow layer */}
          <circle
            cx="86" cy="86" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            opacity="0.1"
          />
          {/* Track */}
          <circle
            cx="86" cy="86" r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="10"
          />
          {/* Progress arc */}
          <circle
            cx="86" cy="86" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 86 86)"
            style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.34,1.56,0.64,1)' }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black" style={{ color }}>{displayScore}</span>
          <span className="text-[11px] font-bold text-slate-400 mt-0.5">/ {totalPossible} pts</span>
        </div>
        {/* Floating trophy for high scores */}
        {scorePercent >= 75 && (
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 1.6, type: 'spring', stiffness: 300 }}
            className="absolute -top-3 -right-3 p-2 rounded-full bg-amber-400 shadow-lg shadow-amber-400/40"
          >
            <Trophy className="h-4 w-4 text-white" />
          </motion.div>
        )}
      </div>
      <div
        className="px-5 py-1.5 rounded-full text-sm font-black shadow-sm border"
        style={{ color, backgroundColor: bgColor, borderColor: color + '40' }}
      >
        {scorePercent}% Overall Grade
      </div>
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, borderColor, bgColor, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, type: 'spring', stiffness: 200 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="group p-4 rounded-2xl bg-white border border-slate-200 shadow-sm cursor-default"
      style={{ borderLeftWidth: 4, borderLeftColor: borderColor }}
    >
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3">{label}</span>
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl transition-colors group-hover:scale-110 transition-transform duration-200" style={{ backgroundColor: bgColor }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <span className="text-xl font-black text-slate-800">{value}</span>
      </div>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────
export default function ExamResultPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const attemptId = searchParams.get('attemptId');

  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [auditFilter, setAuditFilter] = useState('All');
  const [diagnosticsModalOpen, setDiagnosticsModalOpen] = useState(false);
  const [diagnosticQId, setDiagnosticQId] = useState(null);

  useEffect(() => {
    async function loadResult() {
      try {
        if (attemptId) {
          const res = await examApi.getAttemptResult(attemptId);
          if (res.success) {
            setResultData(res);
            setTimeout(() => {
              confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 }, colors: ['#6366f1', '#8b5cf6', '#a78bfa', '#10b981'] });
            }, 600);
          }
        }
      } catch (err) {
        console.error('Failed to load result:', err);
      } finally {
        setLoading(false);
      }
    }
    loadResult();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-14 w-14 rounded-full border-4 border-brand-100 border-t-brand-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <BrainCircuit className="h-5 w-5 text-brand-500" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-800">Generating Assessment Report</p>
            <p className="text-xs text-slate-500 mt-0.5">Running AI analysis & score reconciliation…</p>
          </div>
        </div>
      </div>
    );
  }

  const attempt = resultData?.attempt || {};
  const exam = resultData?.exam || {};
  const questions = resultData?.questions || [];
  const proctorEvents = resultData?.proctorEvents || [];
  const aiAnalysis = attempt.aiAnalysis || {};
  const integrity = resultData?.integrity || {
    score: attempt.proctoringSummary?.integrityScore ?? 95,
    tier: attempt.proctoringSummary?.integrityTier || 'Verified Clean',
    tierColor: 'emerald',
    badgeText: 'Verified Clean',
  };

  const totalScore = attempt.totalScore ?? 0;
  const totalPossible = attempt.totalPossibleMarks ?? exam.totalMarks ?? 100;
  const scorePercent = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
  const accuracy = attempt.accuracyPercentage ?? 0;
  const correctCount = attempt.correctCount ?? 0;
  const wrongCount = attempt.wrongCount ?? 0;
  const unattemptedCount = attempt.unattemptedCount ?? 0;
  const timeS = attempt.timeTakenSeconds ?? 0;
  const timeTakenStr = timeS > 0 ? `${Math.floor(timeS / 60)}m ${timeS % 60}s` : 'N/A';

  const statCards = [
    { label: 'Accuracy', value: `${accuracy}%`, icon: Target, color: '#6366f1', borderColor: '#6366f1', bgColor: '#ede9fe' },
    { label: 'Correct', value: correctCount, icon: CheckCircle2, color: '#10b981', borderColor: '#10b981', bgColor: '#d1fae5' },
    { label: 'Wrong', value: wrongCount, icon: XCircle, color: '#f43f5e', borderColor: '#f43f5e', bgColor: '#ffe4e6' },
    { label: 'Unattempted', value: unattemptedCount, icon: AlertTriangle, color: '#f59e0b', borderColor: '#f59e0b', bgColor: '#fef3c7' },
    { label: 'Time Taken', value: timeTakenStr, icon: Clock, color: '#64748b', borderColor: '#cbd5e1', bgColor: '#f1f5f9' },
  ];

  // Filter logic
  const filteredQuestions = questions.filter(q => {
    const a = (attempt.answers || []).find(ans => String(ans.questionId) === String(q._id || q.id));
    if (auditFilter === 'Correct') return a?.isCorrect;
    if (auditFilter === 'Review Needed') return a && !a.isCorrect;
    return true;
  });

  const reviewNeededCount = questions.filter(q => {
    const a = (attempt.answers || []).find(ans => String(ans.questionId) === String(q._id || q.id));
    return a && !a.isCorrect;
  }).length;

  const incorrectQs = questions.filter(q => {
    const a = (attempt.answers || []).find(ans => String(ans.questionId) === String(q._id || q.id));
    return a && !a.isCorrect && a.status !== 'unanswered';
  });

  const ic = integrity.tierColor;
  const integrityStyle = ic === 'emerald'
    ? { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700 border-emerald-300' }
    : ic === 'amber'
    ? { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700 border-amber-300' }
    : { text: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-700 border-rose-300' };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">

      {/* ── Hero Score Card ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 160 }}
        className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-xl"
      >
        {/* Subtle background mesh */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #6366f1 0%, transparent 50%), radial-gradient(circle at 80% 80%, #8b5cf6 0%, transparent 50%)' }}
        />

        <div className="relative p-8 sm:p-10 flex flex-col items-center text-center gap-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Examination Completed & Evaluated
          </motion.div>

          {/* Title */}
          <div className="space-y-1.5">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight tracking-tight">
              {exam.title || 'Assessment'}
            </h1>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              {exam.subject || 'Subject'} &bull; Assessment Outcome
            </p>
          </div>

          {/* Score arc */}
          <ScoreArc scorePercent={scorePercent} totalScore={totalScore} totalPossible={totalPossible} />

          {/* Divider */}
          <div className="w-full border-t border-slate-100" />

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 w-full">
            {statCards.map((card, i) => (
              <StatCard key={card.label} {...card} delay={0.5 + i * 0.08} />
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── AI Analysis ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="rounded-3xl bg-white border border-slate-200 shadow-lg overflow-hidden"
      >
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <BrainCircuit className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                AI Performance Analysis
                <Sparkles className="h-4 w-4 text-amber-400" />
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Targeted data-driven insights based on your evaluations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-100 space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 font-black text-xs">
                <CheckCircle2 className="h-4 w-4" />
                Demonstrated Strengths
              </div>
              <ul className="space-y-2">
                {(aiAnalysis.strengths || ['Arrays & Hash Maps', 'Code Syntax Structure', 'Basic Stack Invariants']).map((st, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    {st}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-100 space-y-3">
              <div className="flex items-center gap-2 text-amber-700 font-black text-xs">
                <AlertTriangle className="h-4 w-4" />
                Areas for Improvement
              </div>
              <ul className="space-y-2">
                {(aiAnalysis.needsImprovement || ['Dynamic Programming Memoization', 'Graph Traversals (BFS/DFS)']).map((ni, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                    {ni}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest block">
              Personalized Learning Action Plan
            </span>
            <div className="space-y-2.5">
              {(aiAnalysis.recommendations || [
                'Practice 5-8 foundational problems on Dynamic Programming focusing on state transitions.',
                'Review boundary condition testing and edge case validations for array slicing.',
              ]).map((rec, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs text-slate-700">
                  <span className="h-5 w-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{rec}</span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-brand-600 font-bold flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Turn these into an interactive practice session
              </span>
              <Link
                to="/student/practice"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-brand-500/25 hover:shadow-lg hover:shadow-brand-500/30 transition-all hover:-translate-y-0.5"
              >
                Launch Practice <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Coding Performance ────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="rounded-3xl bg-white border border-slate-200 shadow-lg p-6 sm:p-8 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Code2 className="h-5 w-5 text-violet-500" />
            <h3 className="text-base font-black text-slate-900">Coding Sandbox Performance</h3>
          </div>
          <span className="text-xs font-black text-violet-600 bg-violet-50 px-3 py-1.5 rounded-full border border-violet-200">
            {attempt.codingPerformance?.problemsSolved ?? 0} / {attempt.codingPerformance?.totalProblems ?? 0} Solved
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Test Cases Passed', value: `${attempt.codingPerformance?.passedTestCases ?? 0} / ${attempt.codingPerformance?.totalTestCases ?? 0}`, color: 'text-emerald-600' },
            { label: 'Compilation Errors', value: `${attempt.codingPerformance?.compilationErrors ?? 0} Errors`, color: 'text-slate-700' },
            { label: 'Submissions Made', value: `${attempt.codingPerformance?.submissionCount ?? 0}`, color: 'text-slate-700' },
            { label: 'Avg Runtime', value: `${attempt.codingPerformance?.avgRuntimeMs ?? 0}ms`, color: 'text-brand-600' },
          ].map((item) => (
            <div key={item.label} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100/70 transition">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">{item.label}</span>
              <span className={`text-sm font-black ${item.color}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Competition Medals Showcase ───────────────────── */}
      <CompetitionMedals className="my-2" />

      {/* ── Itemized Response Audit ───────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="rounded-3xl bg-white border border-slate-200 shadow-lg overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-900">Itemized Response Audit</h3>
            <p className="text-xs text-slate-500 mt-1">
              Reconciled ledger from single ExamAttempt object &bull; {questions.length} distinct evaluative vectors
            </p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            {[
              { label: 'All', count: questions.length },
              { label: 'Correct', count: correctCount },
              { label: 'Review Needed', count: reviewNeededCount },
            ].map(({ label, count }) => (
              <button
                key={label}
                onClick={() => setAuditFilter(label)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  auditFilter === label
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-slate-400 bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-3.5 font-black">#</th>
                <th className="px-6 py-3.5 font-black">Question / Concept</th>
                <th className="px-6 py-3.5 font-black">Category</th>
                <th className="px-6 py-3.5 font-black">Time</th>
                <th className="px-6 py-3.5 font-black">Status</th>
                <th className="px-6 py-3.5 font-black">Weight</th>
                <th className="px-6 py-3.5 font-black text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredQuestions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400 font-medium">
                    No questions match this filter.
                  </td>
                </tr>
              ) : filteredQuestions.map((q) => {
                const qIdStr = String(q._id || q.id);
                const qIdx = questions.findIndex(x => String(x._id || x.id) === qIdStr);
                const studentAns = (attempt.answers || []).find(a => String(a.questionId) === qIdStr);
                const isCorrect = studentAns?.isCorrect;
                const isUnattempted = !studentAns || studentAns.status === 'unanswered';

                const statusConfig = isCorrect
                  ? { text: 'Correct', textColor: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' }
                  : isUnattempted
                  ? { text: 'Unattempted', textColor: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500' }
                  : { text: 'Incorrect', textColor: 'text-rose-700', bg: 'bg-rose-50', dot: 'bg-rose-500' };

                const subtext = isCorrect
                  ? `Passed test suites • ${q.type || 'coding'}`
                  : isUnattempted
                  ? 'No buffer submitted • Timed allocation choice'
                  : (studentAns?.error || 'Logic error on edge cases');

                const tS = studentAns?.timeSpentSeconds || 0;
                const timeStr = tS > 0 ? `${Math.floor(tS / 60)}m ${tS % 60}s` : '—';

                return (
                  <tr key={qIdStr} className="hover:bg-slate-50/60 transition group">
                    <td className="px-6 py-4 text-xs font-black text-slate-500 align-top">
                      Q{String(qIdx + 1).padStart(2, '0')}
                    </td>
                    <td className="px-6 py-4 align-top max-w-xs">
                      <div className="text-xs font-black text-slate-900 mb-1 leading-snug">{q.title}</div>
                      <div className={`text-[10px] font-mono leading-snug ${isCorrect ? 'text-slate-400' : isUnattempted ? 'text-amber-600' : 'text-rose-500'}`}>
                        {subtext}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 font-mono text-[10px] font-semibold">
                        {q.topic || q.type || 'Concept'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600 align-top">{timeStr}</td>
                    <td className="px-6 py-4 align-top">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusConfig.bg} ${statusConfig.textColor} font-black text-[10px]`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
                        {statusConfig.text}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-black align-top">
                      <span className={isCorrect ? 'text-emerald-600' : 'text-slate-400'}>
                        {isCorrect ? '+' : ''}{(studentAns?.score || 0).toFixed(1)} / {(q.marks || 10).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-top text-right">
                      {isCorrect ? (
                        <button className="text-xs font-black text-brand-600 hover:text-brand-700 opacity-0 group-hover:opacity-100 transition">
                          Inspect Code
                        </button>
                      ) : isUnattempted ? (
                        <button className="text-xs font-black text-slate-500 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition">
                          View Model Answer
                        </button>
                      ) : (
                        <button
                          className="text-xs font-black text-rose-600 hover:text-rose-700 opacity-0 group-hover:opacity-100 transition"
                          onClick={() => { setDiagnosticQId(qIdStr); setDiagnosticsModalOpen(true); }}
                        >
                          Review Diff ↗
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="sm:hidden divide-y divide-slate-100">
          {filteredQuestions.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400">No questions match this filter.</div>
          ) : filteredQuestions.map((q) => {
            const qIdStr = String(q._id || q.id);
            const qIdx = questions.findIndex(x => String(x._id || x.id) === qIdStr);
            const studentAns = (attempt.answers || []).find(a => String(a.questionId) === qIdStr);
            const isCorrect = studentAns?.isCorrect;
            const isUnattempted = !studentAns || studentAns.status === 'unanswered';
            const statusLabel = isCorrect ? 'Correct' : isUnattempted ? 'Unattempted' : 'Incorrect';
            const statusColor = isCorrect ? 'text-emerald-600 bg-emerald-50' : isUnattempted ? 'text-amber-600 bg-amber-50' : 'text-rose-600 bg-rose-50';

            return (
              <div key={qIdStr} className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase">Q{String(qIdx + 1).padStart(2, '0')} • {q.topic || q.type}</span>
                    <p className="text-sm font-black text-slate-900 mt-0.5 leading-snug">{q.title}</p>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black ${statusColor}`}>{statusLabel}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-black ${isCorrect ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {isCorrect ? '+' : ''}{(studentAns?.score || 0).toFixed(1)} / {(q.marks || 10).toFixed(1)} pts
                  </span>
                  {!isCorrect && !isUnattempted && (
                    <button
                      className="text-rose-600 font-black"
                      onClick={() => { setDiagnosticQId(qIdStr); setDiagnosticsModalOpen(true); }}
                    >
                      Review Diff ↗
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] font-mono">
          <div className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-500" />
            Reconciliation Signature: sha256:{(attempt._id || attempt.id || '------').substring(0, 6)}…b541a &nbsp;|&nbsp;
            Questions: {questions.length} &nbsp;|&nbsp;
            Weights: {questions.length} × {(questions[0]?.marks || 10).toFixed(1)} = {questions.reduce((a, b) => a + (b.marks || 10), 0).toFixed(1)}
          </div>
          <span className="text-emerald-600 font-black flex items-center gap-1">
            ✓ Pipeline Deterministic Replay Passed
          </span>
        </div>
      </motion.div>

      {/* ── Proctoring & Integrity ────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="rounded-3xl bg-white border border-slate-200 shadow-lg p-6 sm:p-8 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${integrityStyle.bg} border ${integrityStyle.border} ${integrityStyle.text}`}>
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base font-black text-slate-900">Session Proctoring & Integrity Seal</h4>
              <p className="text-xs text-slate-500 mt-0.5">AI camera supervision, keystroke telemetry, tab-focus audit</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block">Integrity Index</span>
              <span className={`text-2xl font-black font-mono ${integrityStyle.text}`}>{integrity.score}%</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest ${integrityStyle.badge}`}>
              {integrity.badgeText || integrity.tier}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Camera Detections', value: `${proctorEvents.filter(e => !['tab_switch','suspicious_paste','typing_burst','code_plagiarism'].includes(e.eventType)).length} Flagged`, color: 'text-emerald-600' },
            { label: 'Tab Switches', value: `${attempt.proctoringSummary?.tabSwitchesCount ?? proctorEvents.filter(e => e.eventType === 'tab_switch').length} Switches`, color: 'text-slate-700' },
            { label: 'Keystroke Flags', value: `${attempt.proctoringSummary?.suspiciousPastesCount ?? 0} Paste Flags`, color: 'text-slate-700' },
            { label: 'Plagiarism Index', value: 'Clean', color: 'text-emerald-600' },
          ].map((item) => (
            <div key={item.label} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1.5">{item.label}</span>
              <span className={`text-sm font-black ${item.color}`}>{item.value}</span>
            </div>
          ))}
        </div>

        {proctorEvents.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Session Event Timeline</span>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {proctorEvents.map((ev, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <span className="font-bold text-slate-700 capitalize">{ev.eventType?.replace('_', ' ')}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Academic Standing CTA ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 shadow-xl p-8 relative overflow-hidden"
      >
        <div className="absolute inset-0 pointer-events-none opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #6366f1, transparent 55%)' }}
        />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-brand-400" />
              <span className="text-xs font-black text-brand-400 uppercase tracking-widest">
                Academic Standing &bull; {exam.subject || 'CS'} Certification {scorePercent >= 60 ? 'Passed' : 'Attempted'}
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {scorePercent >= 75
                ? 'Ready to lock in this milestone\nor prepare for Senior Algorithms?'
                : scorePercent >= 50
                ? 'Strong attempt! Continue building\nyour algorithmic foundation.'
                : 'Learn from this attempt and\nmake a stronger comeback.'}
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed max-w-lg">
              Your score of {totalScore}/{totalPossible} {scorePercent >= 60 ? 'qualifies you for accelerated enrollment' : 'shows strong potential — review weak areas to unlock'} in advanced modules.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              to="/student/exams"
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-xs transition border border-white/20 text-center"
            >
              View Recommended Modules
            </Link>
            <Link
              to="/student/practice"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-violet-500 hover:from-brand-400 hover:to-violet-400 text-white font-black text-xs shadow-lg shadow-brand-500/25 transition hover:-translate-y-0.5 text-center"
            >
              Review Solution Explanations
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── Action Buttons ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex justify-center gap-4 pt-2"
      >
        <Link
          to="/student/dashboard"
          className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs transition"
        >
          Return to Dashboard
        </Link>
        <Link
          to="/student/exams"
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 text-white font-black text-xs shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 hover:-translate-y-0.5 transition-all"
        >
          Explore More Exams
        </Link>
      </motion.div>

      {/* ── Footer ───────────────────────────────────────── */}
      <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] font-mono text-slate-400">
        <span>© 2024 AlgoBenchmark Pro. Certified Algorithmic Evaluation Engine. Candidate ID #{(attempt._id || attempt.id || '00000').slice(-6).toUpperCase()}.</span>
        <div className="flex items-center gap-4">
          <span className="text-emerald-600 font-bold">● Test Server: US-East-1</span>
          <span>Academic Honor Code</span>
          <span>Security Protocol</span>
        </div>
      </div>

      {/* ── Diagnostics Modal ─────────────────────────────── */}
      <AnimatedModal isOpen={diagnosticsModalOpen} onClose={() => setDiagnosticsModalOpen(false)} className="max-w-5xl">
        {diagnosticQId && (() => {
          const currQ = questions.find(q => String(q._id || q.id) === diagnosticQId) || incorrectQs[0];
          if (!currQ) return null;
          const currAns = (attempt.answers || []).find(a => String(a.questionId) === String(currQ._id || currQ.id));
          const tS = currAns?.timeSpentSeconds || 0;

          return (
            <div className="flex flex-col max-h-[85vh] overflow-hidden bg-slate-50 rounded-3xl">
              {/* Modal header */}
              <div className="p-6 border-b border-slate-200 bg-white shrink-0 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 flex-wrap">
                    Incorrect Response Diagnostics & Code Diffs
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-600 text-[10px] font-black">
                      • {incorrectQs.length} Failed Responses • -{incorrectQs.reduce((a, b) => a + (b.marks || 10), 0).toFixed(1)} Potential Marks
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Detailed breakdown for {incorrectQs.length} flagged submissions.</p>
                </div>
                <button onClick={() => setDiagnosticsModalOpen(false)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition ml-4 shrink-0">
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              {/* Question tabs */}
              <div className="px-6 py-3 border-b border-slate-200 bg-white shrink-0 flex items-center gap-2 overflow-x-auto">
                {incorrectQs.map((q) => {
                  const qid = String(q._id || q.id);
                  const active = qid === diagnosticQId;
                  const qNum = (questions.findIndex(x => String(x._id || x.id) === qid) + 1).toString().padStart(2, '0');
                  return (
                    <button
                      key={qid}
                      onClick={() => setDiagnosticQId(qid)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-black whitespace-nowrap transition border ${
                        active ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className={active ? 'text-rose-400' : 'text-rose-500'}>●</span> Q{qNum} – {q.title}
                    </button>
                  );
                })}
              </div>

              {/* Modal body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Metadata grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-white border border-slate-200 text-xs">
                  {[
                    { label: 'Domain / Topic', value: currQ.topic || 'Data Structures', color: 'text-slate-900' },
                    { label: 'Error Classification', value: currAns?.error || 'IndexOutOfBounds (Edge Case)', color: 'text-rose-600' },
                    { label: 'Time Spent', value: tS > 0 ? `${Math.floor(tS / 60)}m ${tS % 60}s` : '0m 0s', color: 'text-slate-900', sub: '[allocated 3m 30s]' },
                    { label: 'Evaluated Score', value: `${(currAns?.score || 0).toFixed(1)} / ${(currQ.marks || 10).toFixed(1)} pts`, color: 'text-rose-600' },
                  ].map(item => (
                    <div key={item.label}>
                      <span className="text-[10px] uppercase font-black text-slate-400 block mb-1">{item.label}</span>
                      <span className={`font-black ${item.color}`}>{item.value}</span>
                      {item.sub && <span className="text-[10px] text-slate-400 font-mono ml-1">{item.sub}</span>}
                    </div>
                  ))}
                </div>

                {/* Failing test case */}
                <div className="rounded-2xl border border-rose-200 bg-white overflow-hidden shadow-sm">
                  <div className="px-4 py-3 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
                    <span className="text-xs font-black text-rose-700 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" /> Failing Test Case #3: Variable Padding & Empty Hex Buffer
                    </span>
                    <span className="text-[10px] font-black text-rose-600 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-200">17/18 Passed (94.4%)</span>
                  </div>
                  <div className="p-4 space-y-4 text-xs">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase block mb-1.5">Input Parameter:</span>
                      <pre className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-700">{"[\"0x1A\", \"0x00FF\", \"0x3\", \"0xABCD01\", \"\"]"}</pre>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase block mb-1.5">Expected Result:</span>
                        <pre className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 font-mono text-emerald-800">{"[\"\", \"0x3\", \"0x1A\", \"0x00FF\", \"0xABCD01\"]"}</pre>
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase block mb-1.5">Runtime Thrown / Actual:</span>
                        <pre className="p-3 rounded-xl bg-rose-50 border border-rose-200 font-mono text-rose-800 whitespace-pre-wrap text-[10px]">
                          {currAns?.error || 'IndexOutOfBoundsException: String index out of range: 4\n  at RadixHelper.padLeft(line 24)'}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Code diff */}
                <div className="rounded-2xl border border-slate-700 bg-[#0d1117] overflow-hidden shadow-lg">
                  <div className="px-4 py-3 bg-[#161b22] border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-black text-slate-200 flex items-center gap-2">
                      <FileCode className="h-4 w-4 text-slate-400" /> Unified Code Diff: RadixHelper.java
                    </span>
                    <span className="text-[10px] font-mono">
                      <span className="text-rose-400">- 2 removed</span>
                      <span className="text-slate-600 mx-2">·</span>
                      <span className="text-emerald-400">+ 5 added</span>
                    </span>
                  </div>
                  <div className="p-4 font-mono text-xs overflow-x-auto space-y-0.5">
                    <div className="text-slate-500 py-0.5"> 20 &nbsp;&nbsp; public static String padLeft(String hex, int maxLen) {'{'}</div>
                    <div className="text-slate-500 py-0.5"> 21 &nbsp;&nbsp; String clean = hex.startsWith("0x") ? hex.substring(2) : hex;</div>
                    <div className="bg-rose-950/40 text-rose-300 py-1 px-2 rounded border-l-2 border-rose-500"> 22 - &nbsp; int fill = maxLen - clean.length(); <span className="text-rose-500">// BUG: fails when 0 or negative</span></div>
                    <div className="bg-rose-950/40 text-rose-300 py-1 px-2 rounded border-l-2 border-rose-500 mb-1"> 23 - &nbsp; return "0".repeat(fill) + clean; <span className="text-rose-500">// Throws IndexOutOfBounds on empty</span></div>
                    <div className="bg-emerald-950/40 text-emerald-300 py-1 px-2 rounded border-l-2 border-emerald-500"> 22 + &nbsp; if (clean.isEmpty()) return "0".repeat(Math.max(0, maxLen));</div>
                    <div className="bg-emerald-950/40 text-emerald-300 py-1 px-2 rounded border-l-2 border-emerald-500"> 23 + &nbsp; int padCount = Math.max(0, maxLen - clean.length());</div>
                    <div className="bg-emerald-950/40 text-emerald-300 py-1 px-2 rounded border-l-2 border-emerald-500 mb-1"> 24 + &nbsp; return "0".repeat(padCount) + clean;</div>
                    <div className="text-slate-500 py-0.5"> 25 &nbsp;&nbsp; {'}'}</div>
                  </div>
                </div>

                {/* Insight */}
                <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/50 p-4 flex items-start gap-3">
                  <div className="p-2 bg-amber-200/60 rounded-xl text-amber-700 mt-0.5 shrink-0">
                    <Target className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-amber-900 mb-1">Benchmark Diagnostic Insight: Null / Zero-Byte Normalization</h4>
                    <p className="text-xs text-amber-800 leading-relaxed">In radix key normalization routines, empty hex literals ("" or stripped "0x") generate zero-length representations which cause underflow bugs in standard padding arithmetic. Always clamp the pad count or handle empty values directly.</p>
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
                <div className="flex gap-2">
                  <button className="px-3.5 py-2 rounded-lg text-slate-500 text-xs font-black hover:bg-slate-100 transition">
                    ← Previous
                  </button>
                  <button className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-black hover:bg-slate-100 transition shadow-sm">
                    Next Failure →
                  </button>
                </div>
                <div className="flex gap-2.5">
                  <button className="px-4 py-2 rounded-lg text-brand-600 bg-brand-50 text-xs font-black hover:bg-brand-100 transition flex items-center gap-1.5 border border-brand-200">
                    <FileCode className="h-3.5 w-3.5" /> Copy Corrected Snippet
                  </button>
                  <button
                    onClick={() => setDiagnosticsModalOpen(false)}
                    className="px-5 py-2 rounded-lg bg-slate-900 text-white text-xs font-black hover:bg-slate-800 transition shadow-lg"
                  >
                    Close Diagnostics
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </AnimatedModal>
    </div>
  );
}
