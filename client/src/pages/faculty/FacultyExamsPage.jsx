import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { examApi } from '../../services/api';
import {
  FileCode2,
  Plus,
  Clock,
  Award,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Video,
  X,
  Search,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Layers,
  ArrowRight,
  Filter,
  SlidersHorizontal,
  Code2,
  Check
} from 'lucide-react';

export default function FacultyExamsPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'Active' | 'Scheduled' | 'Draft' | 'Completed'
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'duration' | 'marks'

  const [editExam, setEditExam] = useState(null);
  const [saving, setSaving] = useState(false);

  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [editSlot, setEditSlot] = useState(null);
  const [savingSlot, setSavingSlot] = useState(false);

  const loadExams = async () => {
    try {
      setLoading(true);
      const res = await examApi.getAll({ search: search || undefined });
      if (res.success) {
        setExams(res.exams || []);
      }
    } catch (e) {
      console.error('Failed to load exams:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, [search]);

  useEffect(() => {
    if (editExam) {
      const fetchSlots = async () => {
        setLoadingSlots(true);
        try {
          const res = await examApi.getSlots(editExam._id || editExam.id);
          if (res.success) {
            setSlots(res.slots || []);
          }
        } catch (e) {
          console.error('Failed to load slots:', e);
        } finally {
          setLoadingSlots(false);
        }
      };
      fetchSlots();
    } else {
      setSlots([]);
      setEditSlot(null);
    }
  }, [editExam]);

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this assessment? Students will no longer be able to access it.'
      )
    )
      return;
    try {
      await examApi.delete(id);
      loadExams();
    } catch (e) {
      alert('Failed to delete assessment');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editExam) return;
    setSaving(true);
    try {
      const res = await examApi.update(editExam._id || editExam.id, editExam);
      if (res.success) {
        setEditExam(null);
        loadExams();
      }
    } catch (err) {
      alert('Error updating exam: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSlot = async (e) => {
    e.preventDefault();
    if (!editExam || !editSlot) return;

    if (editSlot.completedCount > 0) {
      if (
        !window.confirm(
          `This slot already has ${editSlot.completedCount} completed submission(s). Changing timing will only affect students who haven't started yet. Proceed?`
        )
      ) {
        return;
      }
    }

    setSavingSlot(true);
    try {
      const examId = editExam._id || editExam.id;
      const slotId = editSlot._id || editSlot.id;
      const res = await examApi.updateSlot(examId, slotId, editSlot);
      if (res.success) {
        setEditSlot(null);
        // Refresh slots
        const slotsRes = await examApi.getSlots(examId);
        if (slotsRes.success) setSlots(slotsRes.slots || []);
      }
    } catch (err) {
      alert(err.message || 'Error updating slot');
    } finally {
      setSavingSlot(false);
    }
  };

  // Distinct subjects
  const distinctSubjects = useMemo(() => {
    const set = new Set();
    exams.forEach((ex) => {
      if (ex.subject) set.add(ex.subject);
    });
    return Array.from(set);
  }, [exams]);

  // Filtered & sorted exams
  const filteredExams = useMemo(() => {
    return exams
      .filter((ex) => {
        if (statusFilter !== 'ALL' && ex.status !== statusFilter) return false;
        if (subjectFilter !== 'ALL' && ex.subject !== subjectFilter) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'duration') return (b.durationMinutes || 0) - (a.durationMinutes || 0);
        if (sortBy === 'marks') return (b.totalMarks || 0) - (a.totalMarks || 0);
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
  }, [exams, statusFilter, subjectFilter, sortBy]);

  const activeCount = exams.filter((e) => e.status === 'Active').length;
  const draftCount = exams.filter((e) => e.status === 'Draft').length;
  const scheduledCount = exams.filter((e) => e.status === 'Scheduled').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* ── 1. Header & Quick Creation Bar ───────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
              Curriculum & Examination Suite
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">
              {exams.length} Total Assessments
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Assessment Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Configure examination parameters, manage candidate roll number slot allocations, and supervise live testing halls.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={loadExams}
            disabled={loading}
            className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition border border-slate-200/80 shadow-xs"
            title="Refresh assessments list"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            to="/faculty/exams/create"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-brand-500/25 transition transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="h-4 w-4 text-white" />
            <span>Create New Exam</span>
          </Link>
        </div>
      </div>

      {/* ── 2. Filter & Triage Bar ────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl transition ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All ({exams.length})
          </button>
          <button
            onClick={() => setStatusFilter('Active')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              statusFilter === 'Active'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Active ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('Scheduled')}
            className={`px-3 py-1.5 rounded-xl transition ${
              statusFilter === 'Scheduled'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-indigo-700 hover:bg-indigo-50'
            }`}
          >
            Scheduled ({scheduledCount})
          </button>
          <button
            onClick={() => setStatusFilter('Draft')}
            className={`px-3 py-1.5 rounded-xl transition ${
              statusFilter === 'Draft'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Drafts ({draftCount})
          </button>
        </div>

        {/* Search & Secondary Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative min-w-[220px] flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assessment title..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Subject Filter Dropdown */}
          {distinctSubjects.length > 0 && (
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand-500"
            >
              <option value="ALL">All Subjects</option>
              {distinctSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          )}

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand-500"
          >
            <option value="newest">Sort: Newest Created</option>
            <option value="duration">Sort: Duration</option>
            <option value="marks">Sort: Total Marks</option>
          </select>
        </div>
      </div>

      {/* ── 3. Assessment List Grid ───────────────────────────────────────── */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin mx-auto"></div>
            <p className="text-xs font-semibold text-slate-500">Loading assessments catalog...</p>
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 shadow-xs space-y-3">
            <FileCode2 className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No assessments match your filter</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search query or clear the active status filter to view other tests.
            </p>
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setSubjectFilter('ALL');
                setSearch('');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
            >
              <span>Reset Filters</span>
            </button>
          </div>
        ) : (
          filteredExams.map((ex) => {
            const isActive = ex.status === 'Active';
            return (
              <div
                key={ex._id || ex.id}
                className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-5 group"
              >
                {/* Left Information Section */}
                <div className="space-y-2.5 flex-1 min-w-0">
                  {/* Status, Subject, Difficulty Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : ex.status === 'Scheduled'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                      {ex.status}
                    </span>

                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                      {ex.subject || 'General Assessment'}
                    </span>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${
                        ex.difficulty === 'Advanced'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : ex.difficulty === 'Intermediate'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {ex.difficulty || 'Intermediate'}
                    </span>

                    {ex.proctoringEnabled !== false && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-brand-50 text-brand-700 border border-brand-200/60 flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3 text-brand-600" />
                        AI Shield Active
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 group-hover:text-brand-600 transition">
                      {ex.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {ex.description || 'Comprehensive evaluation testing algorithmic problem solving and runtime efficiency.'}
                    </p>
                  </div>

                  {/* Quick Parameters Strip */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-0.5">
                    <span className="flex items-center gap-1 text-slate-700 font-medium">
                      <Clock className="h-3.5 w-3.5 text-brand-500" />
                      <strong>{ex.durationMinutes}</strong> Mins
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-700 font-medium">
                      <Award className="h-3.5 w-3.5 text-amber-500" />
                      <strong>{ex.totalMarks}</strong> Marks
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-700 font-medium">
                      <Code2 className="h-3.5 w-3.5 text-indigo-500" />
                      <strong>{ex.questionIds?.length || 3}</strong> Challenges
                    </span>
                    {ex.negativeMarking && (
                      <>
                        <span>•</span>
                        <span className="text-rose-600 font-bold text-[11px]">
                          Negative Marking (-{ex.negativeMarksPerQuestion || 0.25}x)
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Action Suite */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <Link
                    to="/faculty/monitoring"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-brand-600 text-white font-bold text-xs shadow-xs transition"
                  >
                    <Video className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Live Monitor</span>
                  </Link>

                  <button
                    onClick={() => setEditExam(ex)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 font-bold text-xs border border-indigo-200/80 transition"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>Edit Assessment</span>
                  </button>

                  <button
                    onClick={() => handleDelete(ex._id || ex.id)}
                    className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition"
                    title="Delete Assessment"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── 4. Quick Edit Assessment Modal ─────────────────────────────────── */}
      {editExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                  <Edit className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Assessment Configuration</h3>
                  <p className="text-xs text-slate-500">Update parameters, duration, and roll number slot access</p>
                </div>
              </div>
              <button
                onClick={() => setEditExam(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-800 font-bold mb-1.5">Assessment Title</label>
                <input
                  type="text"
                  required
                  value={editExam.title}
                  onChange={(e) => setEditExam({ ...editExam, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-800 font-bold mb-1.5">Subject</label>
                  <input
                    type="text"
                    required
                    value={editExam.subject}
                    onChange={(e) => setEditExam({ ...editExam, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1.5">Status</label>
                  <select
                    value={editExam.status}
                    onChange={(e) => setEditExam({ ...editExam, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-brand-500"
                  >
                    <option value="Active">Active (Visible to Students)</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Draft">Draft</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={editExam.description || ''}
                  onChange={(e) => setEditExam({ ...editExam, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-800 font-bold mb-1.5">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={editExam.durationMinutes}
                    onChange={(e) => setEditExam({ ...editExam, durationMinutes: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:bg-white focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1.5">Total Marks</label>
                  <input
                    type="number"
                    value={editExam.totalMarks}
                    onChange={(e) => setEditExam({ ...editExam, totalMarks: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:bg-white focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1.5">Difficulty</label>
                  <select
                    value={editExam.difficulty}
                    onChange={(e) => setEditExam({ ...editExam, difficulty: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-brand-500"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              {/* AI Proctoring Toggle */}
              <label className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-bold text-slate-900 block">AI Camera Proctoring Sentinel</span>
                  <span className="text-[11px] text-slate-500">Enforces continuous face detection and device monitoring</span>
                </div>
                <input
                  type="checkbox"
                  checked={editExam.proctoringEnabled}
                  onChange={(e) => setEditExam({ ...editExam, proctoringEnabled: e.target.checked })}
                  className="h-4 w-4 rounded text-brand-600 focus:ring-0 cursor-pointer"
                />
              </label>

              {/* Slots Configuration */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="font-bold text-slate-900">Assigned Candidate Slots</h4>
                {loadingSlots ? (
                  <p className="text-xs text-slate-400">Loading slot configurations...</p>
                ) : slots.length === 0 ? (
                  <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    No examination slots assigned yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {slots.map((slot) => (
                      <div
                        key={slot._id || slot.id}
                        className="p-3 border border-slate-200/90 rounded-2xl bg-slate-50 flex items-center justify-between"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900">{slot.slotName} ({slot.duration} Mins)</div>
                          <div className="text-[11px] text-slate-600">
                            Roll Range: <strong className="font-mono text-slate-800">{slot.startRollNumber}</strong> → <strong className="font-mono text-slate-800">{slot.endRollNumber}</strong>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Active: {slot.inProgressCount || 0} • Submissions: {slot.completedCount || 0}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditSlot(slot)}
                          className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-xl text-xs font-bold transition shrink-0"
                        >
                          Edit Slot
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditExam(null)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold shadow-md shadow-brand-500/25 disabled:opacity-50 transition"
                >
                  {saving ? 'Publishing Updates...' : 'Save & Publish Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 5. Edit Slot Modal ────────────────────────────────────────────── */}
      {editSlot && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Edit Slot: {editSlot.slotName}</h3>
              <button onClick={() => setEditSlot(null)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            {editSlot.inProgressCount > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 font-medium">
                  {editSlot.inProgressCount} student(s) currently in progress. You cannot change the duration, but you can adjust roll numbers.
                </p>
              </div>
            )}

            <form onSubmit={handleUpdateSlot} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-800 font-bold mb-1.5">Duration (Minutes)</label>
                <input
                  type="number"
                  required
                  value={editSlot.duration}
                  onChange={(e) => setEditSlot({ ...editSlot, duration: Number(e.target.value) })}
                  disabled={editSlot.inProgressCount > 0}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:bg-white focus:border-brand-500 disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-800 font-bold mb-1.5">Start Roll Number</label>
                  <input
                    type="text"
                    required
                    value={editSlot.startRollNumber}
                    onChange={(e) => setEditSlot({ ...editSlot, startRollNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold uppercase focus:outline-none focus:bg-white focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-800 font-bold mb-1.5">End Roll Number</label>
                  <input
                    type="text"
                    required
                    value={editSlot.endRollNumber}
                    onChange={(e) => setEditSlot({ ...editSlot, endRollNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold uppercase focus:outline-none focus:bg-white focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditSlot(null)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSlot}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold shadow-md shadow-brand-500/25 disabled:opacity-50 transition"
                >
                  {savingSlot ? 'Saving...' : 'Save Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
