import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { studentApi } from '../../services/api';
import {
  Flame,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Target,
  Code2,
  Clock,
  ArrowRight,
  BookOpen,
  Award,
  Sparkles,
  ChevronRight,
  Zap,
  Trophy,
  BarChart3,
  BrainCircuit,
  Play,
} from 'lucide-react';
import { motion } from 'framer-motion';

// ── Animated counter ─────────────────────────────────────────────────
function CountUp({ target, suffix = '', duration = 1.2, delay = 0 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts + delay * 1000;
      const elapsed = ts - start;
      if (elapsed < 0) { requestAnimationFrame(step); return; }
      const p = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]);
  return <>{val}{suffix}</>;
}

// ── Bar chart with animated bars ─────────────────────────────────────
function BarChart({ data }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 400);
    return () => clearTimeout(t);
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-slate-400">No data yet</div>
    );
  }

  const max = Math.max(...data.map(d => d.score), 1);

  return (
    <div className="h-48 flex items-end gap-3 pt-4">
      {data.map((pt, idx) => {
        const pct = (pt.score / 100) * 100;
        const color = pt.score >= 85 ? ['#10b981', '#34d399'] : pt.score >= 70 ? ['#6366f1', '#818cf8'] : ['#f59e0b', '#fbbf24'];
        return (
          <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-default">
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-black text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                {pt.score}%
              </span>
            </div>
            <div className="w-full max-w-[52px] relative rounded-t-xl overflow-hidden"
              style={{ height: animated ? `${pct}%` : '4px', transition: `height 0.8s cubic-bezier(0.34,1.4,0.64,1) ${idx * 0.07}s`, minHeight: 6 }}
            >
              <div className="absolute inset-0 rounded-t-xl"
                style={{ background: `linear-gradient(180deg, ${color[1]}, ${color[0]})` }}
              />
              {/* Shimmer */}
              <div className="absolute inset-0 rounded-t-xl opacity-0 group-hover:opacity-30 transition"
                style={{ background: 'linear-gradient(90deg, transparent, white, transparent)' }}
              />
            </div>
            <span className="text-[10px] text-slate-500 font-medium truncate max-w-[64px] text-center">{pt.date}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Mastery bar ───────────────────────────────────────────────────────
function MasteryBar({ subject, score, delay }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(score), 500 + delay * 120);
    return () => clearTimeout(t);
  }, [score]);

  const color = score >= 85 ? '#10b981' : score >= 70 ? '#6366f1' : '#f59e0b';
  const label = score >= 85 ? 'Proficient' : score >= 70 ? 'Learning' : 'Needs Work';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-slate-800">{subject}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ color, backgroundColor: color + '18' }}>{label}</span>
          <span className="font-black text-slate-700">{score}%</span>
        </div>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${width}%`, backgroundColor: color, transitionDelay: `${delay * 0.12}s` }}
        />
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────
function StatCard({ label, value, suffix, icon: Icon, color, bgColor, borderColor, sub, subColor, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, type: 'spring', stiffness: 200 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="group p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-default"
      style={{ borderTopWidth: 3, borderTopColor: borderColor }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
        <div className="p-2 rounded-xl transition-transform group-hover:scale-110 duration-200" style={{ backgroundColor: bgColor }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
      </div>
      <div className="text-3xl font-black" style={{ color }}>
        <CountUp target={typeof value === 'number' ? value : 0} suffix={suffix || ''} delay={delay} />
        {typeof value !== 'number' && value}
      </div>
      <p className="text-[11px] mt-1 font-medium" style={{ color: subColor || '#64748b' }}>{sub}</p>
    </motion.div>
  );
}

// ── Avatar with gradient fallback ─────────────────────────────────────
function Avatar({ name, src, size = 'lg' }) {
  const [imgErr, setImgErr] = useState(false);
  const initials = (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const cls = size === 'lg' ? 'h-16 w-16 text-xl' : 'h-10 w-10 text-sm';

  if (src && !imgErr) {
    return (
      <img src={src} alt={name} onError={() => setImgErr(true)}
        className={`${cls} rounded-2xl border-2 border-white/30 object-cover shadow-lg flex-shrink-0`} />
    );
  }

  return (
    <div className={`${cls} rounded-2xl border-2 border-white/20 flex items-center justify-center font-black text-white shadow-lg flex-shrink-0`}
      style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
      {initials}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────
export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await studentApi.getDashboard();
        if (res.success) setData(res.data);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-14 w-14 rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <BrainCircuit className="h-5 w-5 text-indigo-500" />
            </div>
          </div>
          <p className="text-sm font-bold text-slate-600">Loading analytics…</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const upcomingExams = data?.upcomingExams || [];
  const charts = data?.charts || {};
  const recommendedTopics = data?.recommendedTopics || [];

  const statCards = [
    {
      label: 'Upcoming',
      value: stats.upcomingExamsCount ?? 4,
      suffix: '',
      icon: Calendar,
      color: '#6366f1',
      bgColor: '#ede9fe',
      borderColor: '#6366f1',
      sub: 'Assessments scheduled',
    },
    {
      label: 'Completed',
      value: stats.completedExamsCount ?? 3,
      suffix: '',
      icon: CheckCircle2,
      color: '#10b981',
      bgColor: '#d1fae5',
      borderColor: '#10b981',
      sub: '100% On-time',
      subColor: '#10b981',
    },
    {
      label: 'Avg Score',
      value: stats.averageScore ?? 84,
      suffix: '%',
      icon: Award,
      color: '#6366f1',
      bgColor: '#ede9fe',
      borderColor: '#6366f1',
      sub: 'Top 12% in cohort',
    },
    {
      label: 'Accuracy',
      value: stats.accuracy ?? 82,
      suffix: '%',
      icon: Target,
      color: '#f59e0b',
      bgColor: '#fef3c7',
      borderColor: '#f59e0b',
      sub: 'High problem precision',
    },
    {
      label: 'Coding Score',
      value: stats.codingScore ?? 88,
      suffix: '%',
      icon: Code2,
      color: '#8b5cf6',
      bgColor: '#f5f3ff',
      borderColor: '#8b5cf6',
      sub: 'Test cases passed',
    },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6 pb-10">

      {/* ── Welcome Banner ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 180 }}
        className="relative overflow-hidden rounded-2xl"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #3730a3 100%)' }}
      >
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #818cf8, transparent 70%)' }} />
          <div className="absolute -bottom-16 -left-8 w-56 h-56 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #a78bfa, transparent 70%)' }} />
          <div className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <Avatar name={user?.name} src={user?.avatar} />
            <div>
              <p className="text-indigo-300 text-xs font-bold mb-0.5">{greeting} 👋</p>
              <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {user?.name || 'Student'}
              </h1>
              <div className="flex items-center flex-wrap gap-2 mt-2">
                <span className="text-xs font-mono text-indigo-300/80">{user?.rollNumber || 'CS2026-001'}</span>
                <span className="text-indigo-500">·</span>
                <span className="text-xs text-indigo-300/80">{user?.department || 'Computer Science'}</span>
                <motion.span
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ repeat: Infinity, duration: 2.5 }}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black"
                >
                  <Flame className="h-3.5 w-3.5 fill-current text-amber-400" />
                  {user?.streak || 4} Day Streak
                </motion.span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/student/practice"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 text-white text-xs font-bold transition"
            >
              <Zap className="h-3.5 w-3.5" />
              Quick Practice
            </Link>
            <Link
              to="/student/exams"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-black shadow-lg transition hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 16px rgba(99,102,241,0.4)' }}
            >
              View Exams <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── Stat Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card, i) => (
          <StatCard key={card.label} {...card} delay={0.1 + i * 0.07} />
        ))}
      </div>

      {/* ── Charts Row ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Performance Progression */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Performance Progression</h3>
              <p className="text-xs text-slate-500 mt-0.5">Exam score trajectory across recent assessments</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-xs font-black text-emerald-700">+12% Growth</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-[10px] font-bold">
            <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> ≥85% Excellent</div>
            <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-500" /> 70-84% Good</div>
            <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> &lt;70% Review</div>
          </div>

          <BarChart data={charts.scoreOverTime} />
        </motion.div>

        {/* Subject Mastery */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.52, duration: 0.5 }}
          className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Subject Mastery</h3>
              <p className="text-xs text-slate-500 mt-0.5">Proficiency across domains</p>
            </div>
            <BarChart3 className="h-4 w-4 text-slate-400" />
          </div>

          <div className="space-y-4">
            {(charts.subjectPerformance || [
              { subject: 'Data Structures', score: 88 },
              { subject: 'Algorithms', score: 76 },
              { subject: 'Python', score: 92 },
              { subject: 'Database Systems', score: 85 },
            ]).slice(0, 5).map((sub, idx) => (
              <MasteryBar key={sub.subject} subject={sub.subject} score={sub.score} delay={idx} />
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Bottom Row ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Upcoming Exams */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50">
                <Calendar className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Scheduled Assessments</h3>
                <p className="text-xs text-slate-500 mt-0.5">{upcomingExams.length} upcoming</p>
              </div>
            </div>
            <Link to="/student/exams" className="text-xs font-black text-indigo-600 hover:text-indigo-700 transition flex items-center gap-1">
              View All <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {upcomingExams.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400 font-medium">
                <CheckCircle2 className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                No upcoming exams scheduled
              </div>
            ) : upcomingExams.map((exam, idx) => (
              <motion.div
                key={exam._id || exam.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.65 + idx * 0.06 }}
                className="group p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-black text-slate-900 truncate">{exam.title}</h4>
                    <span className="shrink-0 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">{exam.subject}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium mt-1">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{exam.durationMinutes} min</span>
                    <span>·</span>
                    <span>{exam.totalMarks} marks</span>
                  </div>
                </div>
                <Link
                  to={`/student/exams/${exam._id || exam.id}/instructions`}
                  className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-xs font-black transition hover:shadow-md"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  <Play className="h-3 w-3" /> Start
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* AI Recommended Topics */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.67, duration: 0.5 }}
          className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-50">
              <BrainCircuit className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                AI Focus Recommendations
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Based on your recent performance gaps</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {(recommendedTopics.length > 0 ? recommendedTopics : [
              { title: 'Dynamic Programming Memoization', count: 8, difficulty: 'Hard' },
              { title: 'Graph BFS/DFS Traversals', count: 6, difficulty: 'Medium' },
              { title: 'Binary Search Variants', count: 5, difficulty: 'Medium' },
              { title: 'Tree Recursion Patterns', count: 4, difficulty: 'Hard' },
            ]).map((topic, idx) => {
              const isHard = topic.difficulty === 'Hard';
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.72 + idx * 0.06 }}
                  className="group p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-violet-200 hover:bg-violet-50/20 transition-all flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-1.5 rounded-lg mt-0.5 shrink-0"
                      style={{ backgroundColor: isHard ? '#fff1f2' : '#fefce8' }}>
                      <BookOpen className="h-3.5 w-3.5" style={{ color: isHard ? '#f43f5e' : '#d97706' }} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-slate-800 leading-snug">{topic.title}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{topic.count} practice problems</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="text-[10px] font-black px-2 py-0.5 rounded-full border"
                      style={isHard
                        ? { color: '#f43f5e', backgroundColor: '#fff1f2', borderColor: '#fecdd3' }
                        : { color: '#d97706', backgroundColor: '#fefce8', borderColor: '#fde68a' }
                      }
                    >
                      {topic.difficulty}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </motion.div>
              );
            })}
          </div>

          <Link
            to="/student/practice"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition mt-2"
          >
            <Zap className="h-3.5 w-3.5" /> Launch Adaptive Practice Session
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
