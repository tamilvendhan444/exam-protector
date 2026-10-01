import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { examApi } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import {
  FileCode2, Clock, Award, Search, Filter, ArrowRight,
  ShieldCheck, Sparkles, RefreshCw, X, Camera, AlertCircle,
  BookOpen, Zap, BarChart3, Trophy, ChevronRight, Play,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Difficulty config ─────────────────────────────────────────────────
const DIFF = {
  Advanced:     { color: '#f43f5e', bg: '#fff1f2', border: '#fecdd3', topBorder: '#f43f5e', label: 'Advanced' },
  Intermediate: { color: '#f59e0b', bg: '#fefce8', border: '#fde68a', topBorder: '#f59e0b', label: 'Intermediate' },
  Beginner:     { color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', topBorder: '#10b981', label: 'Beginner' },
};

const getDiff = (d) => DIFF[d] || DIFF.Beginner;

// ── Skeleton Card ─────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-5 w-28 rounded-full bg-slate-100" />
        <div className="h-5 w-20 rounded-full bg-slate-100" />
      </div>
      <div className="space-y-2">
        <div className="h-5 w-3/4 rounded bg-slate-100" />
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-5/6 rounded bg-slate-100" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1,2,3].map(i => <div key={i} className="h-10 rounded-xl bg-slate-100" />)}
      </div>
      <div className="h-10 rounded-xl bg-slate-100 mt-4" />
    </div>
  );
}

// ── Stat Chip inside cards ────────────────────────────────────────────
function StatChip({ icon: Icon, label, value, color }) {
  return (
    <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-slate-50 border border-slate-100">
      <Icon className="h-3.5 w-3.5" style={{ color }} />
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm font-black text-slate-800">{value}</span>
    </div>
  );
}

// ── Exam Card ─────────────────────────────────────────────────────────
function ExamCard({ exam, isSuggested, index }) {
  const questionCount = exam.questionIds?.length || 3;
  const diff = getDiff(exam.difficulty);
  const types = exam.questionTypes?.join(' + ') || 'MCQ + Coding';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, type: 'spring', stiffness: 200 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="group flex flex-col rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-900/8 transition-all duration-300 relative"
      style={{ borderTopWidth: 4, borderTopColor: diff.topBorder }}
    >
      {/* Suggested glow */}
      {isSuggested && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none ring-2 ring-indigo-400/30" />
      )}

      <div className="p-6 flex flex-col gap-4 flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wider truncate max-w-[160px]">
            <BookOpen className="h-3 w-3 shrink-0" />
            {exam.subject}
          </span>
          <span
            className="shrink-0 text-[10px] font-black px-2.5 py-1 rounded-full border"
            style={{ color: diff.color, backgroundColor: diff.bg, borderColor: diff.border }}
          >
            {diff.label}
          </span>
        </div>

        {/* Title & description */}
        <div>
          <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors duration-200 line-clamp-1 leading-snug">
            {exam.title}
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
            {exam.description || 'Comprehensive evaluation covering syntax, algorithms, and theory.'}
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <StatChip icon={FileCode2} label="Questions" value={`${questionCount} Qs`} color="#6366f1" />
          <StatChip icon={Clock} label="Duration" value={`${exam.durationMinutes}m`} color="#f59e0b" />
          <StatChip icon={Award} label="Marks" value={exam.totalMarks} color="#10b981" />
        </div>

        {/* Types + proctoring row */}
        <div className="flex items-center justify-between text-[10px] font-medium">
          <span className="text-slate-500 flex items-center gap-1">
            <BarChart3 className="h-3 w-3" />
            {types}
          </span>
          {exam.proctoringEnabled && (
            <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
              <ShieldCheck className="h-3 w-3" />
              Live Proctored
            </span>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-6">
        <Link
          to={`/student/exams/${exam._id || exam.id}/instructions`}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-xs font-black shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #7c3aed 100%)',
            boxShadow: '0 4px 14px rgba(99,102,241,0.35)'
          }}
        >
          <Camera className="h-3.5 w-3.5" />
          Attend Assessment
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </motion.div>
  );
}

// ── Filter pill ───────────────────────────────────────────────────────
function FilterPill({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 border ${
        active
          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/25'
          : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
      }`}
    >
      {label}
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
        {count}
      </span>
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────
export default function ExamDiscoveryPage() {
  const { socket } = useSocket();
  const [exams, setExams] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [totalAll, setTotalAll] = useState(0);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableDifficulties, setAvailableDifficulties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const hasActiveFilters = Boolean(search || difficultyFilter || subjectFilter);

  const clearAllFilters = () => {
    setSearch('');
    setDifficultyFilter('');
    setSubjectFilter('');
  };

  const fetchExams = useCallback(async () => {
    try {
      const res = await examApi.getAll({
        difficulty: difficultyFilter || undefined,
        subject: subjectFilter || undefined,
        search: search || undefined,
      });
      if (res.success) {
        setExams(res.exams || []);
        setSuggestions(res.suggestions || []);
        setTotalAll(res.totalAll || (res.exams || []).length);
        if (res.availableSubjects) setAvailableSubjects(res.availableSubjects);
        if (res.availableDifficulties) setAvailableDifficulties(res.availableDifficulties);
      }
    } catch (err) {
      console.error('Failed to fetch exams:', err);
    } finally {
      setLoading(false);
    }
  }, [difficultyFilter, subjectFilter, search]);

  useEffect(() => { fetchExams(); }, [fetchExams]);

  useEffect(() => {
    if (!socket) return;
    const sync = () => fetchExams();
    socket.on('exam:created', sync);
    socket.on('exam:updated', sync);
    socket.on('exam:deleted', sync);
    return () => {
      socket.off('exam:created', sync);
      socket.off('exam:updated', sync);
      socket.off('exam:deleted', sync);
    };
  }, [socket, fetchExams]);

  return (
    <div className="space-y-6 pb-10">

      {/* ── Page Header ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-black text-slate-900">Examination Catalog</h1>
          <p className="text-sm text-slate-500 mt-1">
            Discover and attend your scheduled assessments &bull;{' '}
            <span className="font-black text-indigo-600">{totalAll} available</span>
          </p>
        </div>

        {/* Search */}
        <div
          className={`relative min-w-[280px] transition-all duration-200 ${searchFocused ? 'min-w-[340px]' : ''}`}
        >
          <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${searchFocused ? 'text-indigo-500' : 'text-slate-400'}`} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search assessments or topics…"
            className={`w-full pl-10 pr-10 py-2.5 rounded-xl border-2 bg-white text-sm text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 ${
              searchFocused
                ? 'border-indigo-500 shadow-[0_0_0_4px_rgba(99,102,241,0.12)]'
                : 'border-slate-200'
            }`}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </motion.div>

      {/* ── Category Tabs (scrollable) ───────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <FilterPill
          label="All Assessments"
          count={totalAll}
          active={!subjectFilter}
          onClick={() => setSubjectFilter('')}
        />
        {availableSubjects.map((sub) => (
          <FilterPill
            key={sub.name}
            label={sub.name}
            count={sub.count}
            active={subjectFilter === sub.name}
            onClick={() => setSubjectFilter(sub.name === subjectFilter ? '' : sub.name)}
          />
        ))}
      </div>

      {/* ── Filters Bar ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-slate-500 font-bold text-xs pr-1 border-r border-slate-200">
            <Filter className="h-3.5 w-3.5 text-indigo-500" />
            Filters
          </div>

          {/* Difficulty pills */}
          <div className="flex items-center gap-1.5">
            {['', 'Beginner', 'Intermediate', 'Advanced'].map((d) => {
              const cfg = d ? getDiff(d) : null;
              const active = difficultyFilter === d;
              return (
                <button
                  key={d || 'all'}
                  onClick={() => setDifficultyFilter(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all border ${
                    active
                      ? d
                        ? ''
                        : 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                  style={active && cfg ? { backgroundColor: cfg.bg, color: cfg.color, borderColor: cfg.border } : {}}
                >
                  {d || 'All Levels'}
                </button>
              );
            })}
          </div>

          {/* Subject select */}
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:border-indigo-400 hover:border-slate-300 transition max-w-[200px]"
          >
            <option value="">All Subjects</option>
            <option value="Data Structures & Algorithms">Data Structures & Algorithms</option>
            <option value="Algorithm Design & Analysis">Algorithm Design & Analysis</option>
            <option value="Python Development">Python Development</option>
            <option value="Database Management Systems">Database Management Systems</option>
            <option value="Analytical & Quantitative Aptitude">Analytical & Quantitative Aptitude</option>
          </select>
        </div>

        <AnimatePresence>
          {hasActiveFilters && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={clearAllFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-black border border-rose-200 transition"
            >
              <X className="h-3.5 w-3.5" />
              Clear Filters
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Results count + sort ─────────────────────────── */}
      {!loading && exams.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between text-xs"
        >
          <span className="font-medium text-slate-500">
            Showing <span className="font-black text-slate-800">{exams.length}</span> of{' '}
            <span className="font-black text-slate-800">{totalAll}</span> assessments
            {hasActiveFilters && <span className="text-indigo-600 ml-1">(filtered)</span>}
          </span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-500 font-medium">Live catalog</span>
          </div>
        </motion.div>
      )}

      {/* ── Grid ─────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : exams.length === 0 ? (
        <div className="space-y-6">
          {/* Empty state */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-12 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5"
          >
            <div className="mx-auto h-16 w-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">No assessments found</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
                {difficultyFilter && subjectFilter ? (
                  <>No <strong className="text-amber-600">{difficultyFilter}</strong> level assessments in <strong className="text-indigo-600">{subjectFilter}</strong> right now.</>
                ) : (
                  'No assessments match your current filters. Try adjusting or clearing them.'
                )}
              </p>
            </div>
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-black shadow-md shadow-indigo-500/25 transition hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
            >
              <RefreshCw className="h-4 w-4" />
              Show All Assessments ({totalAll})
            </button>
          </motion.div>

          {suggestions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-50">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    Available in {subjectFilter || 'this category'}
                  </h4>
                  <p className="text-xs text-slate-500">These assessments are available to attempt now</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {suggestions.map((sug, idx) => (
                  <ExamCard key={sug._id || sug.id} exam={sug} isSuggested index={idx} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {exams.map((exam, idx) => (
            <ExamCard key={exam._id || exam.id} exam={exam} isSuggested={false} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
}
