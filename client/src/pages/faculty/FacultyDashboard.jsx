import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { facultyApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  FileCode2,
  Users,
  AlertTriangle,
  Video,
  Plus,
  ArrowRight,
  Database,
  Award,
  Sparkles,
  Clock,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Layers,
  Eye,
  Smartphone,
  Zap,
  Maximize2,
  Activity,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Calendar
} from 'lucide-react';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await facultyApi.getDashboard();
        if (res.success) {
          setData(res);
        }
      } catch (e) {
        console.error('Error loading faculty dashboard:', e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const stats = data?.stats || {};
  const recentExams = data?.recentExams || [];
  const recentIncidents = data?.recentIncidents || [];

  const getIncidentMeta = (eventType, severity) => {
    switch (eventType) {
      case 'mobile_phone':
        return {
          icon: Smartphone,
          bg: 'bg-rose-50 text-rose-600 border-rose-200',
          badge: 'bg-rose-100 text-rose-700',
          label: 'Mobile Phone Detected'
        };
      case 'multiple_faces':
        return {
          icon: Users,
          bg: 'bg-rose-50 text-rose-600 border-rose-200',
          badge: 'bg-rose-100 text-rose-700',
          label: 'Multiple Persons Detected'
        };
      case 'fullscreen_exit':
      case 'tab_switch':
        return {
          icon: Maximize2,
          bg: 'bg-amber-50 text-amber-600 border-amber-200',
          badge: 'bg-amber-100 text-amber-700',
          label: 'Fullscreen / Tab Switch'
        };
      case 'face_missing':
        return {
          icon: Eye,
          bg: 'bg-amber-50 text-amber-600 border-amber-200',
          badge: 'bg-amber-100 text-amber-700',
          label: 'Candidate Face Missing'
        };
      case 'typing_burst':
        return {
          icon: Zap,
          bg: 'bg-purple-50 text-purple-600 border-purple-200',
          badge: 'bg-purple-100 text-purple-700',
          label: 'Typing Burst Anomaly'
        };
      default:
        return {
          icon: AlertTriangle,
          bg: 'bg-slate-50 text-slate-600 border-slate-200',
          badge: 'bg-slate-100 text-slate-700',
          label: (eventType || 'Proctor Signal').replace(/_/g, ' ')
        };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-3 border-brand-200 border-t-brand-600 animate-spin"></div>
          <Activity className="w-5 h-5 text-brand-600 absolute inset-0 m-auto animate-pulse" />
        </div>
        <p className="text-xs font-semibold text-slate-500">Loading Faculty Command Station...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* ── 1. Hero Command Station Banner ─────────────────────────────────── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-dark-900 to-indigo-950 border border-slate-800 shadow-2xl relative overflow-hidden text-white">
        {/* Ambient atmospheric gradient */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/25 text-[11px] font-bold tracking-wide uppercase">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                Faculty Command Station
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 text-[10px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                AI Sentinel Stream Armed
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Welcome, {user?.name || 'Prof. Alan Turing'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Monitor active examinations in real-time, triage AI proctoring anomalies, and author secure automated question pools.
            </p>
          </div>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/faculty/exams/create"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-brand-500/30 transition transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="h-4 w-4" />
              <span>Create Assessment</span>
            </Link>

            <Link
              to="/faculty/monitoring"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/20 backdrop-blur-md transition shadow-xs"
            >
              <Video className="h-4 w-4 text-emerald-400" />
              <span>Live Monitor</span>
            </Link>

            <Link
              to="/faculty/question-bank"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-semibold text-xs border border-white/10 transition"
            >
              <Database className="h-4 w-4 text-indigo-300" />
              <span>Question Bank</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 2. High-Impact KPI Metrics Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Active Exams */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-indigo-200 transition group space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Active Exams</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition">
              <FileCode2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {stats.activeExams ?? 0}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
              <span>{stats.totalExams ?? 0} total created</span>
              <span className="text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded text-[10px]">
                Live Pool
              </span>
            </div>
          </div>
        </div>

        {/* Metric 2: Total Students */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-emerald-200 transition group space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Students</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {stats.totalStudents ?? 0}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
              <span>Registered candidates</span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                Enrolled
              </span>
            </div>
          </div>
        </div>

        {/* Metric 3: Submissions */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-amber-200 transition group space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Evaluated Attempts</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {stats.totalAttempts ?? 0}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
              <span>Submitted tests</span>
              <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded text-[10px]">
                Auto-Graded
              </span>
            </div>
          </div>
        </div>

        {/* Metric 4: Proctor Incidents */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-rose-200 transition group space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Proctor Incidents</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-rose-600 tracking-tight">
              {stats.totalIncidents ?? 0}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
              <span>{stats.flaggedIncidents ?? 0} critical flags</span>
              <span className="text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded text-[10px]">
                AI Signals
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Split Command Area: Active Examinations & Live Signals ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Examinations (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FileCode2 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Active Examinations</h3>
                <p className="text-[11px] text-slate-500">Live assessments open for student participation</p>
              </div>
            </div>

            <Link
              to="/faculty/exams"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition"
            >
              <span>Manage All ({stats.totalExams ?? recentExams.length})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentExams.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                <FileCode2 className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">No active examinations created yet.</p>
                <Link
                  to="/faculty/exams/create"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold shadow-xs hover:bg-brand-500 transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create First Exam</span>
                </Link>
              </div>
            ) : (
              recentExams.map((ex) => (
                <div
                  key={ex._id || ex.id}
                  className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-slate-50 hover:border-indigo-200 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-brand-600 transition">
                        {ex.title}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Active
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700">{ex.subject || 'Computer Science'}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {ex.durationMinutes}m
                      </span>
                      <span>•</span>
                      <span>{ex.totalMarks} Marks</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/faculty/monitoring`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-brand-600 text-white font-bold text-xs shadow-xs transition"
                    >
                      <Video className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Live Monitor</span>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Live Proctoring Signals Feed (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent Proctoring Signals</h3>
                <p className="text-[11px] text-slate-500">Real-time candidate telemetry</p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              Live AI Stream
            </span>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {recentIncidents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <ShieldCheck className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No anomalies detected</p>
                <p className="text-[11px] text-slate-400 mt-0.5">All active candidate sessions running normally.</p>
              </div>
            ) : (
              recentIncidents.map((inc) => {
                const meta = getIncidentMeta(inc.eventType, inc.severity);
                const MetaIcon = meta.icon;

                return (
                  <div
                    key={inc._id || inc.id}
                    className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 transition space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-6 h-6 rounded-lg ${meta.bg} border flex items-center justify-center shrink-0`}>
                          <MetaIcon className="h-3.5 w-3.5" />
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${meta.badge}`}>
                          {inc.eventType?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {inc.timestamp ? new Date(inc.timestamp).toLocaleTimeString() : 'Just now'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-slate-900 block truncate">
                          {inc.studentName || 'Candidate'}
                        </span>
                        <p className="text-[11px] text-slate-600 truncate mt-0.5">
                          {inc.details || 'Anomaly event triggered during session.'}
                        </p>
                      </div>

                      {inc.evidenceSnapshot && (
                        <button
                          onClick={() => setSelectedIncident(inc)}
                          className="shrink-0 text-[10px] font-bold text-brand-600 hover:text-brand-700 underline"
                        >
                          View Snap
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── 4. Quick Faculty Workflow Navigation Bar ──────────────────────── */}
      <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/90 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Faculty Operations Shortcut</h4>
            <p className="text-[11px] text-slate-500">Quick-access utility suite for curriculum and evaluation</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/faculty/students"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs transition"
          >
            <Users className="h-3.5 w-3.5 text-slate-500" />
            <span>Student Roster</span>
          </Link>

          <Link
            to="/faculty/results"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs transition"
          >
            <Award className="h-3.5 w-3.5 text-slate-500" />
            <span>Results & Grading</span>
          </Link>

          <Link
            to="/faculty/analytics"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs transition"
          >
            <BarChart3 className="h-3.5 w-3.5 text-slate-500" />
            <span>Exam Analytics</span>
          </Link>
        </div>
      </div>

      {/* Snapshot Preview Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-500" />
                <span>Evidence Snapshot</span>
              </h3>
              <button
                onClick={() => setSelectedIncident(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ✕ Close
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl bg-black aspect-video flex items-center justify-center">
              <img
                src={selectedIncident.evidenceSnapshot}
                alt="Proctor evidence"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="text-xs space-y-1">
              <p className="font-bold text-slate-900">{selectedIncident.studentName}</p>
              <p className="text-slate-600">{selectedIncident.details}</p>
              <p className="text-[10px] text-slate-400 font-mono">
                {new Date(selectedIncident.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
