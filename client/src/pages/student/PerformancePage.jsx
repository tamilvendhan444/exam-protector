import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { studentApi } from '../../services/api';
import {
  Trophy, TrendingUp, Target, Code2, Award,
  CheckCircle2, Calendar, Flame, BrainCircuit,
  BarChart3, Globe, Zap, BookOpen, ChevronRight,
  Star, Clock, ArrowRight, Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Animated count-up ────────────────────────────────────────────────
function CountUp({ target, duration = 1.2, delay = 0, suffix = '' }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts + delay * 1000;
      const elapsed = ts - start;
      if (elapsed < 0) { requestAnimationFrame(step); return; }
      const p = Math.min(elapsed / (duration * 1000), 1);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(e * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]);
  return <>{val}{suffix}</>;
}

// ── Rating Line Chart (LeetCode-style) ─────────────────────────────────
function RatingLineChart({ data, currentRating, globalRank, totalRanked, attended }) {
  const [tooltip, setTooltip] = useState(null);
  const [animated, setAnimated] = useState(false);
  const svgRef = React.useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(t);
  }, []);

  if (!data || data.length < 2) {
    // Render placeholder with the current rating
    const placeholderPts = Array.from({ length: 20 }, (_, i) => ({
      date: '', score: 60 + Math.sin(i * 0.5) * 15 + i * 0.8
    }));
    data = placeholderPts;
  }

  const W = 560; const H = 140;
  const PAD = { top: 16, right: 20, bottom: 24, left: 10 };
  const iW = W - PAD.left - PAD.right;
  const iH = H - PAD.top - PAD.bottom;

  const scores = data.map(d => d.score);
  const minS = Math.min(...scores) - 5;
  const maxS = Math.max(...scores) + 5;
  const range = maxS - minS || 1;

  const pts = data.map((d, i) => ({
    x: PAD.left + (i / (data.length - 1)) * iW,
    y: PAD.top + iH - ((d.score - minS) / range) * iH,
    score: d.score,
    date: d.date,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  // Area fill path
  const areaPath = [
    ...pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`),
    `L ${pts[pts.length - 1].x.toFixed(1)} ${(PAD.top + iH).toFixed(1)}`,
    `L ${PAD.left} ${(PAD.top + iH).toFixed(1)}`,
    'Z',
  ].join(' ');

  // Line length for animation
  const totalLen = pts.reduce((sum, p, i) => {
    if (i === 0) return 0;
    const dx = p.x - pts[i-1].x;
    const dy = p.y - pts[i-1].y;
    return sum + Math.sqrt(dx*dx + dy*dy);
  }, 0);

  // Peak point
  const peakIdx = scores.indexOf(Math.max(...scores));
  const peakPt = pts[peakIdx];

  // Date labels
  const firstDate = data[0]?.date ? new Date(data[0].date) : null;
  const lastDate = data[data.length-1]?.date ? new Date(data[data.length-1].date) : null;
  const fmt = (d) => d ? d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';

  return (
    <div className="space-y-3">
      {/* Stats header */}
      <div className="flex items-start gap-8 flex-wrap">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Exam Rating</p>
          <p className="text-3xl font-black text-slate-900">{currentRating?.toLocaleString() ?? '—'}</p>
        </div>
        {globalRank && (
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Global Ranking</p>
            <p className="text-lg font-black text-slate-700">
              {globalRank.toLocaleString()}
              {totalRanked && <span className="text-slate-400 font-bold text-sm">/{totalRanked.toLocaleString()}</span>}
            </p>
          </div>
        )}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Attended</p>
          <p className="text-lg font-black text-slate-700">{attended ?? 0}</p>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative select-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: 150 }}
          onMouseMove={(e) => {
            const rect = svgRef.current?.getBoundingClientRect();
            if (!rect) return;
            const scaleX = W / rect.width;
            const mx = (e.clientX - rect.left) * scaleX - PAD.left;
            const idx = Math.round((mx / iW) * (pts.length - 1));
            const clamped = Math.max(0, Math.min(pts.length - 1, idx));
            setTooltip({ ...pts[clamped], idx: clamped });
          }}
          onMouseLeave={() => setTooltip(null)}
        >
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="strokeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
            <line
              key={i}
              x1={PAD.left} y1={PAD.top + iH * t}
              x2={PAD.left + iW} y2={PAD.top + iH * t}
              stroke="#f1f5f9" strokeWidth="1"
            />
          ))}

          {/* Area fill */}
          <path d={areaPath} fill="url(#lineGrad)" />

          {/* Main line with draw animation */}
          <path
            d={linePath}
            fill="none"
            stroke="url(#strokeGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={totalLen}
            strokeDashoffset={animated ? 0 : totalLen}
            style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)' }}
          />

          {/* Peak label */}
          {peakPt && animated && (
            <g>
              <rect
                x={peakPt.x - 22} y={peakPt.y - 28}
                width={44} height={20}
                rx={6} fill="white" stroke="#e2e8f0" strokeWidth="1"
              />
              <text x={peakPt.x} y={peakPt.y - 14} textAnchor="middle"
                fontSize="9" fontWeight="800" fill="#64748b">
                {Math.round(peakPt.score).toLocaleString()}
              </text>
              <line
                x1={peakPt.x} y1={peakPt.y - 8}
                x2={peakPt.x} y2={peakPt.y}
                stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2,2"
              />
              <circle cx={peakPt.x} cy={peakPt.y} r={4} fill="#f59e0b" />
              <circle cx={peakPt.x} cy={peakPt.y} r={7} fill="#f59e0b" fillOpacity="0.2" />
            </g>
          )}

          {/* Hover crosshair */}
          {tooltip && (
            <g>
              <line
                x1={tooltip.x} y1={PAD.top}
                x2={tooltip.x} y2={PAD.top + iH}
                stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3,3"
              />
              <circle cx={tooltip.x} cy={tooltip.y} r={5} fill="#f59e0b" />
              <circle cx={tooltip.x} cy={tooltip.y} r={9} fill="#f59e0b" fillOpacity="0.2" />
              {/* Tooltip box */}
              <rect
                x={Math.min(tooltip.x + 8, W - 90)} y={tooltip.y - 32}
                width={80} height={28}
                rx={8} fill="#1e1b4b" opacity={0.92}
              />
              <text
                x={Math.min(tooltip.x + 48, W - 50)} y={tooltip.y - 22}
                textAnchor="middle" fontSize="10" fontWeight="800" fill="#f59e0b">
                {Math.round(tooltip.score)}
              </text>
              {tooltip.date && (
                <text
                  x={Math.min(tooltip.x + 48, W - 50)} y={tooltip.y - 10}
                  textAnchor="middle" fontSize="8" fill="#a5b4fc">
                  {new Date(tooltip.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </text>
              )}
            </g>
          )}

          {/* X-axis date labels */}
          {firstDate && (
            <text x={PAD.left} y={H - 4} fontSize="9" fill="#94a3b8" fontWeight="600">{fmt(firstDate)}</text>
          )}
          {lastDate && (
            <text x={PAD.left + iW} y={H - 4} fontSize="9" fill="#94a3b8" fontWeight="600" textAnchor="end">{fmt(lastDate)}</text>
          )}
        </svg>
      </div>
    </div>
  );
}

// ── Donut Ring ────────────────────────────────────────────────────────
function DonutRing({ solved, total, easy, medium, hard, easyTotal, mediumTotal, hardTotal }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 400); return () => clearTimeout(t); }, []);

  const pct = total > 0 ? solved / total : 0;
  const r = 60;
  const circ = 2 * Math.PI * r;
  const offset = circ - (animated ? pct : 0) * circ;

  return (
    <div className="flex items-center gap-8">
      <div className="relative flex-shrink-0">
        <svg width="148" height="148">
          <circle cx="74" cy="74" r={r} fill="none" stroke="#f1f5f9" strokeWidth="10" />
          <circle
            cx="74" cy="74" r={r}
            fill="none"
            stroke="url(#donutGrad)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            transform="rotate(-90 74 74)"
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34,1.2,0.64,1)' }}
          />
          <defs>
            <linearGradient id="donutGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-slate-900">{solved}</span>
          <span className="text-[10px] font-bold text-slate-400 mt-0.5">/ {total}</span>
          <span className="text-[10px] font-black text-indigo-600 mt-0.5">Solved</span>
        </div>
      </div>

      {/* Difficulty breakdown */}
      <div className="space-y-3 flex-1">
        {[
          { label: 'Easy', count: easy, total: easyTotal, color: '#10b981', bg: '#d1fae5' },
          { label: 'Medium', count: medium, total: mediumTotal, color: '#f59e0b', bg: '#fef3c7' },
          { label: 'Hard', count: hard, total: hardTotal, color: '#f43f5e', bg: '#ffe4e6' },
        ].map(({ label, count, total: t, color, bg }) => {
          const w = t > 0 ? (count / t) * 100 : 0;
          return (
            <div key={label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black" style={{ color }}>{label}</span>
                <span className="font-black text-slate-700">{count}<span className="text-slate-400 font-medium">/{t}</span></span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${w}%` }}
                  transition={{ duration: 0.9, delay: 0.5, ease: [0.34, 1.2, 0.64, 1] }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Submission Heatmap ────────────────────────────────────────────────
function Heatmap({ data }) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const today = new Date();
  const cells = [];
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const count = data?.[key] || 0;
    cells.push({ date: key, count, month: d.getMonth(), day: d.getDay() });
  }

  const getColor = (count) => {
    if (!count) return 'bg-slate-100';
    if (count >= 8) return 'bg-indigo-700';
    if (count >= 5) return 'bg-indigo-500';
    if (count >= 3) return 'bg-indigo-400';
    if (count >= 1) return 'bg-indigo-200';
    return 'bg-slate-100';
  };

  // Build weeks
  const weeks = [];
  let week = [];
  // Pad first week
  const firstDay = cells[0]?.day || 0;
  for (let i = 0; i < firstDay; i++) week.push(null);
  for (const cell of cells) {
    week.push(cell);
    if (cell.day === 6) { weeks.push(week); week = []; }
  }
  if (week.length) weeks.push(week);

  const totalSubmissions = Object.values(data || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-black text-slate-700">{totalSubmissions} submissions in the past year</span>
        <div className="flex items-center gap-1.5 text-slate-400 font-medium">
          <span>Less</span>
          {['bg-slate-100','bg-indigo-200','bg-indigo-400','bg-indigo-500','bg-indigo-700'].map(c => (
            <span key={c} className={`h-3 w-3 rounded-sm ${c}`} />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Month labels */}
      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {weeks.map((w, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {Array.from({ length: 7 }).map((_, di) => {
                const cell = w[di];
                if (!cell) return <div key={di} className="h-3 w-3 rounded-sm" />;
                return (
                  <div
                    key={di}
                    title={`${cell.date}: ${cell.count} submission${cell.count !== 1 ? 's' : ''}`}
                    className={`h-3 w-3 rounded-sm cursor-default transition-opacity hover:opacity-70 ${getColor(cell.count)}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Skill Tag ─────────────────────────────────────────────────────────
function SkillTag({ label, count }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition cursor-default">
      {label}
      <span className="text-[10px] text-slate-400 font-black">×{count}</span>
    </span>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────
function StatCard({ label, value, suffix, icon: Icon, color, bgColor, borderColor, sub, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, type: 'spring', stiffness: 200 }}
      className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
      style={{ borderTopWidth: 3, borderTopColor: borderColor }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
        <div className="p-1.5 rounded-lg" style={{ backgroundColor: bgColor }}>
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-black" style={{ color }}>
        <CountUp target={typeof value === 'number' ? value : 0} suffix={suffix || ''} delay={delay} />
        {typeof value !== 'number' && value}
      </div>
      {sub && <p className="text-[10px] text-slate-500 font-medium mt-1">{sub}</p>}
    </motion.div>
  );
}

// ── Recent Attempt Row ────────────────────────────────────────────────
function AttemptRow({ attempt, idx }) {
  const score = attempt.totalScore ?? 0;
  const total = attempt.totalPossibleMarks ?? 100;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const color = pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#f43f5e';

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * idx }}
      className="group flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-slate-900 truncate">{attempt.examTitle || 'Assessment'}</p>
        <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{attempt.subject || 'Subject'}</p>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <span className="text-sm font-black" style={{ color }}>{pct}%</span>
        <span className="text-xs text-slate-400 font-mono hidden sm:block">
          {score}/{total} pts
        </span>
        <Link
          to={`/student/exams/${attempt.examId}/result?attemptId=${attempt._id || attempt.id}`}
          className="opacity-0 group-hover:opacity-100 transition px-3 py-1.5 rounded-lg text-indigo-600 border border-indigo-200 bg-indigo-50 text-xs font-black hover:bg-indigo-100"
        >
          View <ChevronRight className="h-3.5 w-3.5 inline" />
        </Link>
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────
export default function PerformancePage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('recent');

  useEffect(() => {
    studentApi.getPerformance()
      .then(res => { if (res?.success) setData(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-14 w-14 rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-indigo-500" />
            </div>
          </div>
          <p className="text-sm font-bold text-slate-600">Loading performance analytics…</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const charts = data?.charts || {};
  const recentAttempts = data?.recentAttempts || [];
  const skills = data?.skills || {};
  const badges = data?.badges || [];
  const heatmapData = data?.submissionHeatmap || {};

  const solved = stats.totalSolved ?? 0;
  const totalProblems = stats.totalProblems ?? 500;
  const easy = stats.easySolved ?? 0;
  const medium = stats.mediumSolved ?? 0;
  const hard = stats.hardSolved ?? 0;
  const easyTotal = stats.easyTotal ?? 194;
  const mediumTotal = stats.mediumTotal ?? 213;
  const hardTotal = stats.hardTotal ?? 93;

  const rank = stats.globalRank ?? '—';
  const topPct = stats.topPercentile ?? '—';
  const streak = stats.currentStreak ?? 0;
  const avgScore = stats.averageScore ?? 0;
  const examsAttended = stats.examsAttended ?? 0;
  const accuracy = stats.accuracy ?? 0;

  const initials = (user?.name || 'S').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6 pb-10">

      {/* ── Page Title ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-black text-slate-900">Performance Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Your detailed coding & assessment profile
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Live data
        </div>
      </motion.div>

      {/* ── Main Split Layout ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* ── LEFT SIDEBAR ────────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">

          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4"
          >
            {/* Avatar + name */}
            <div className="flex flex-col items-center text-center gap-3">
              <div className="relative">
                {user?.avatar || user?.name ? (
                  <img
                    src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || 'user')}`}
                    alt={user?.name || 'Student'}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.nextElementSibling) {
                        e.currentTarget.nextElementSibling.style.display = 'flex';
                      }
                    }}
                    className="h-20 w-20 rounded-2xl object-cover border-2 border-white shadow-md bg-slate-100 ring-1 ring-slate-200"
                  />
                ) : null}
                <div
                  className="h-20 w-20 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: (user?.avatar || user?.name) ? 'none' : 'flex'
                  }}
                >
                  {initials}
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white"></span>
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">{user?.name || 'Student'}</h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{user?.rollNumber || 'CS2026-001'}</p>
                <p className="text-xs text-slate-500 mt-0.5">{user?.department || 'Computer Science'}</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5">
              <motion.span
                animate={{ scale: [1, 1.07, 1] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-black"
              >
                <Flame className="h-3.5 w-3.5 text-amber-500 fill-current" />
                {streak} Day Streak
              </motion.span>
            </div>

            {rank !== '—' && (
              <div className="pt-3 border-t border-slate-100 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Global Rank</p>
                <p className="text-2xl font-black text-indigo-600">#{typeof rank === 'number' ? rank.toLocaleString() : rank}</p>
              </div>
            )}
          </motion.div>

          {/* Languages */}
          {data?.languageStats?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3"
            >
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Languages</h3>
              <div className="space-y-2.5">
                {data.languageStats.slice(0, 5).map((lang, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">{lang.language}</span>
                    <span className="font-black text-slate-500">{lang.count} solved</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Skills */}
          {(skills.advanced?.length || skills.intermediate?.length || skills.fundamental?.length) ? (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4"
            >
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Skills</h3>
              {skills.advanced?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-rose-500 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    Advanced
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.advanced.map(s => <SkillTag key={s.name} label={s.name} count={s.count} />)}
                  </div>
                </div>
              )}
              {skills.intermediate?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-amber-500 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Intermediate
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.intermediate.map(s => <SkillTag key={s.name} label={s.name} count={s.count} />)}
                  </div>
                </div>
              )}
              {skills.fundamental?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-indigo-500 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    Fundamental
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.fundamental.map(s => <SkillTag key={s.name} label={s.name} count={s.count} />)}
                  </div>
                </div>
              )}
            </motion.div>
          ) : null}
        </div>

        {/* ── RIGHT CONTENT ────────────────────────────── */}
        <div className="lg:col-span-9 space-y-5">

          {/* Stat cards row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Avg Score" value={avgScore} suffix="%" icon={Award} color="#6366f1" bgColor="#ede9fe" borderColor="#6366f1" sub="Across all exams" delay={0.1} />
            <StatCard label="Accuracy" value={accuracy} suffix="%" icon={Target} color="#10b981" bgColor="#d1fae5" borderColor="#10b981" sub="Problem precision" delay={0.17} />
            <StatCard label="Exams Attended" value={examsAttended} icon={Calendar} color="#f59e0b" bgColor="#fef3c7" borderColor="#f59e0b" sub="Total assessments" delay={0.24} />
            <StatCard label="Top Percentile" value={typeof topPct === 'number' ? topPct : 0} suffix="%" icon={Trophy} color="#8b5cf6" bgColor="#f5f3ff" borderColor="#8b5cf6" sub="In your cohort" delay={0.31} />
          </div>

          {/* ── Rating Trend Chart ──────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-black text-slate-900">Exam Rating Progression</h3>
              <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3" />
                Score Over Time
              </span>
            </div>
            <RatingLineChart
              data={charts.scoreOverTime || []}
              currentRating={stats.currentRating ?? avgScore}
              globalRank={rank !== '—' ? rank : null}
              totalRanked={stats.totalRanked ?? null}
              attended={examsAttended}
            />
          </motion.div>

          {/* Problem Solved Donut + Badges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Donut */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900">Problems Solved</h3>
                <span className="text-xs font-black text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
                  {solved} / {totalProblems}
                </span>
              </div>
              <DonutRing
                solved={solved} total={totalProblems}
                easy={easy} medium={medium} hard={hard}
                easyTotal={easyTotal} mediumTotal={mediumTotal} hardTotal={hardTotal}
              />
              {stats.attempting > 0 && (
                <p className="text-[10px] text-slate-400 font-medium text-center">
                  {stats.attempting} currently attempting
                </p>
              )}
            </motion.div>

            {/* Badges */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.27 }}
              className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900">Badges</h3>
                <span className="text-xs font-black text-slate-500">{badges.length} earned</span>
              </div>

              {badges.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="h-14 w-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-3">
                    <Star className="h-7 w-7 text-slate-300" />
                  </div>
                  <p className="text-sm font-black text-slate-400">No badges yet</p>
                  <p className="text-xs text-slate-400 mt-1">Complete assessments to earn badges</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {badges.map((b, i) => (
                    <div key={i} title={b.name}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 transition cursor-default">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/20">
                        <Trophy className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-[10px] font-black text-slate-600 text-center leading-tight">{b.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Subject mastery bars */}
              {charts.subjectPerformance?.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2.5">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Subject Mastery</h4>
                  {charts.subjectPerformance.slice(0, 4).map((sub, i) => {
                    const c = sub.score >= 85 ? '#10b981' : sub.score >= 70 ? '#6366f1' : '#f59e0b';
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-700">{sub.subject}</span>
                          <span className="font-black" style={{ color: c }}>{sub.score}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${sub.score}%` }}
                            transition={{ duration: 0.8, delay: 0.5 + i * 0.1 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: c }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
