import React, { useState, useEffect } from 'react';
import { facultyApi, proctorApi } from '../../services/api';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Smartphone,
  Users,
  Eye,
  Copy,
  Zap,
  FileCode2,
  Printer,
  ChevronRight,
  ExternalLink,
  Search,
  UserCheck,
  Camera,
  Monitor,
  Terminal,
  MousePointer,
  WifiOff
} from 'lucide-react';

export default function IntegrityDossierModal({ attemptId, exam, onClose, onRefresh }) {
  const [loading, setLoading] = useState(true);
  const [dossier, setDossier] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'plagiarism' | 'timeline'
  const [selectedPlagEvent, setSelectedPlagEvent] = useState(null);

  useEffect(() => {
    async function loadDossier() {
      if (!attemptId) return;
      try {
        setLoading(true);
        const res = await facultyApi.getIntegrityDossier(attemptId);
        if (res.success) {
          setDossier(res);
          const plagEvent = (res.events || []).find(e => e.eventType === 'code_plagiarism');
          if (plagEvent) setSelectedPlagEvent(plagEvent);
        }
      } catch (err) {
        console.error('Error loading integrity dossier:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDossier();
  }, [attemptId]);

  const handleUpdateStatus = async (eventId, newStatus) => {
    try {
      await proctorApi.updateEventStatus(eventId, { status: newStatus });
      // Update local state
      setDossier(prev => {
        if (!prev) return prev;
        const updatedEvents = prev.events.map(ev => {
          if ((ev.eventId || ev._id) === eventId) {
            return { ...ev, status: newStatus };
          }
          return ev;
        });
        return { ...prev, events: updatedEvents };
      });
      if (onRefresh) onRefresh();
    } catch (e) {
      alert('Failed to update event: ' + e.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getEventMeta = (type) => {
    switch (type) {
      case 'multiple_displays':
        return { label: 'Multi-Display Connected', icon: Monitor, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
      case 'devtools_open':
        return { label: 'DevTools Inspection Opened', icon: Terminal, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
      case 'contextmenu_blocked':
        return { label: 'Right-Click / Context Menu Blocked', icon: MousePointer, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
      case 'candidate_idle':
        return { label: 'Candidate Idle / Inactivity Prompt', icon: Clock, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
      case 'network_gap':
        return { label: 'Network Disconnection Gap', icon: WifiOff, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' };
      case 'fullscreen_exit':
        return { label: 'Fullscreen Mode Exit', icon: AlertTriangle, color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' };
      case 'code_plagiarism':
        return { label: 'Code Plagiarism Match', icon: FileCode2, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
      case 'suspicious_paste':
        return { label: 'Suspicious Code Paste', icon: Copy, color: 'text-violet-400 bg-violet-500/10 border-violet-500/30' };
      case 'mobile_phone':
        return { label: 'Mobile Device Detected', icon: Smartphone, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
      case 'multiple_faces':
        return { label: 'Multiple Faces in Frame', icon: Users, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
      case 'face_missing':
        return { label: 'Candidate Absence / Frame Left', icon: Eye, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
      case 'looking_away':
        return { label: 'Sustained Off-Screen Gaze', icon: Eye, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
      case 'tab_switch':
        return { label: 'Browser Tab Deflection', icon: AlertTriangle, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
      default:
        return { label: type?.replace(/_/g, ' ') || 'Incident', icon: AlertTriangle, color: 'text-slate-700 bg-slate-100 border-slate-300' };
    }
  };

  if (!attemptId) return null;

  const attempt = dossier?.attempt || {};
  const integrity = dossier?.integrity || {};
  const events = dossier?.events || [];
  const signals = integrity.signals || {};
  const deductions = integrity.deductions || [];
  const plagiarismEvents = events.filter(e => e.eventType === 'code_plagiarism');

  const score = integrity.score !== undefined ? integrity.score : 100;
  const tier = integrity.tier || 'Verified Clean';
  const tierColor = integrity.tierColor || 'emerald';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/85 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-5xl rounded-3xl bg-white border border-slate-300 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50/90 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl border ${
              tierColor === 'emerald'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : tierColor === 'amber'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              {tierColor === 'emerald' ? <ShieldCheck className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">{attempt.studentName || 'Candidate Dossier'}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  tierColor === 'emerald'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : tierColor === 'amber'
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                }`}>
                  {integrity.badgeText || tier}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                {attempt.studentEmail} • {exam?.title || dossier?.exam?.title} • ID: {attempt._id || attempt.id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              title="Print / Save PDF Dossier"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition flex items-center gap-1.5 text-xs font-semibold"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 py-2 bg-slate-50/60 border-b border-slate-200 text-xs shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition ${
              activeTab === 'overview'
                ? 'bg-slate-100 text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Integrity Overview
          </button>

          <button
            onClick={() => setActiveTab('plagiarism')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeTab === 'plagiarism'
                ? 'bg-slate-100 text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <span>Code Similarity & Plagiarism</span>
            {plagiarismEvents.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-mono">
                {plagiarismEvents.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'bg-slate-100 text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <span>Full Incident Audit Log</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono">
              {events.length}
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="animate-spin h-7 w-7 border-3 border-brand-500 border-t-transparent rounded-full"></div>
              <span className="text-xs text-slate-600 font-semibold">Generating composite integrity dossier...</span>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Top Twin Hero Scores: Academic vs Integrity */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Academic Score Card */}
                    <div className="p-5 rounded-3xl bg-slate-100/40 border border-slate-200 flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Academic Assessment</span>
                        <div className="text-3xl font-black text-slate-900">
                          {attempt.totalScore || 0} <span className="text-sm font-normal text-slate-600">/ {attempt.totalPossibleMarks || 100}</span>
                        </div>
                        <p className="text-xs text-brand-400 font-semibold">
                          Accuracy: {attempt.accuracyPercentage || 0}% • {attempt.correctCount || 0} Correct
                        </p>
                      </div>

                      <div className="h-16 w-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex flex-col items-center justify-center text-brand-400 font-black">
                        <span className="text-lg">{Math.round(((attempt.totalScore || 0) / Math.max(1, attempt.totalPossibleMarks || 100)) * 100)}%</span>
                        <span className="text-[9px] uppercase font-bold text-slate-600">Grade</span>
                      </div>
                    </div>

                    {/* Composite Integrity Score Card */}
                    <div className={`p-5 rounded-3xl border flex items-center justify-between ${
                      tierColor === 'emerald'
                        ? 'bg-emerald-950/20 border-emerald-800/40'
                        : tierColor === 'amber'
                        ? 'bg-amber-950/20 border-amber-800/40'
                        : 'bg-rose-950/20 border-rose-800/40'
                    }`}>
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Session Integrity Index</span>
                        <div className={`text-3xl font-black ${
                          tierColor === 'emerald' ? 'text-emerald-400' : tierColor === 'amber' ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {score}%
                        </div>
                        <p className="text-xs text-slate-700 font-medium">
                          Trust Status: <strong className={tierColor === 'emerald' ? 'text-emerald-300' : tierColor === 'amber' ? 'text-amber-300' : 'text-rose-300'}>{tier}</strong>
                        </p>
                      </div>

                      <div className={`h-16 w-16 rounded-2xl border flex flex-col items-center justify-center font-black ${
                        tierColor === 'emerald'
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : tierColor === 'amber'
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                          : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                      }`}>
                        <span className="text-lg">{score}</span>
                        <span className="text-[9px] uppercase font-bold">Trust</span>
                      </div>
                    </div>
                  </div>

                  {/* Multi-Signal Telemetry Indicators (8 Metrics) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                        <Smartphone className="h-4 w-4 text-rose-400" />
                        <span>Camera Detections</span>
                      </div>
                      <div className="text-xl font-bold text-slate-900">
                        {signals.cameraIncidentsCount || 0} <span className="text-xs font-normal text-slate-500">events</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                        <Clock className="h-4 w-4 text-amber-400" />
                        <span>Tab Switches</span>
                      </div>
                      <div className="text-xl font-bold text-slate-900">
                        {signals.tabSwitchesCount || 0} <span className="text-xs font-normal text-slate-500">(~{signals.totalDurationAwaySeconds || 0}s)</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                        <Copy className="h-4 w-4 text-violet-400" />
                        <span>Pastes & Bursts</span>
                      </div>
                      <div className="text-xl font-bold text-slate-900">
                        {(signals.pastesCount || 0) + (signals.typingBurstsCount || 0)} <span className="text-xs font-normal text-slate-500">logged</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                        <FileCode2 className="h-4 w-4 text-brand-400" />
                        <span>Plagiarism Match</span>
                      </div>
                      <div className="text-xl font-bold text-slate-900">
                        {signals.plagiarismFlagsCount || 0} <span className="text-xs font-normal text-slate-500">flags</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                        <Monitor className="h-4 w-4 text-rose-400" />
                        <span>Multi-Display</span>
                      </div>
                      <div className="text-xl font-bold text-slate-900">
                        {signals.multipleDisplaysCount || 0} <span className="text-xs font-normal text-slate-500">screens</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                        <Terminal className="h-4 w-4 text-amber-400" />
                        <span>DevTools Open</span>
                      </div>
                      <div className="text-xl font-bold text-slate-900">
                        {signals.devtoolsOpenCount || 0} <span className="text-xs font-normal text-slate-500">times</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                        <Clock className="h-4 w-4 text-orange-400" />
                        <span>Candidate Idle</span>
                      </div>
                      <div className="text-xl font-bold text-slate-900">
                        {signals.candidateIdleCount || 0} <span className="text-xs font-normal text-slate-500">alerts</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                        <WifiOff className="h-4 w-4 text-purple-400" />
                        <span>Network Gaps</span>
                      </div>
                      <div className="text-xl font-bold text-slate-900">
                        {signals.networkGapCount || 0} <span className="text-xs font-normal text-slate-500">gaps</span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions & Risk Factors Breakdown */}
                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-amber-400" />
                      <span>Audit Telemetry & Deductions</span>
                    </h4>

                    {deductions.length === 0 ? (
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <span>Zero integrity infractions detected. Session verified clean under continuous AI camera & editor proctoring.</span>
                      </div>
                    ) : (
                      <div className="space-y-2 text-xs">
                        {deductions.map((d, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-200 border border-slate-200">
                            <span className="text-slate-800">{d.label} (×{d.count})</span>
                            <span className="font-bold font-mono text-rose-400">-{d.penalty} pts</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Per-Question Pacing & Time Spent Breakdown */}
                  {((attempt.evaluatedAnswers && attempt.evaluatedAnswers.length > 0) || (attempt.answers && attempt.answers.length > 0)) && (
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-brand-400" />
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Per-Question Pacing & Time Analytics
                          </h4>
                        </div>
                        <span className="text-[10px] text-slate-600 font-mono">
                          Active Question Time: {Math.round(((attempt.evaluatedAnswers || attempt.answers).reduce((acc, a) => acc + (a.timeSpentSeconds || 0), 0)) / 60)}m logged
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                        {(attempt.evaluatedAnswers && attempt.evaluatedAnswers.length > 0 ? attempt.evaluatedAnswers : attempt.answers).map((ans, idx) => {
                          const spentSec = ans.timeSpentSeconds || 0;
                          const mins = Math.floor(spentSec / 60);
                          const secs = spentSec % 60;
                          return (
                            <div key={idx} className="p-3 rounded-xl bg-slate-200/60 border border-slate-200 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-900 truncate max-w-[140px]">
                                  {ans.questionTitle || `Question ${idx + 1}`}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-brand-500/15 text-brand-300 border border-brand-500/30 font-bold">
                                  {mins}m {secs}s
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-slate-600">
                                <span>Status: <strong className="text-slate-700 capitalize">{ans.status || (ans.isPassed ? 'Passed' : 'Completed')}</strong></span>
                                {ans.score !== undefined && (
                                  <span className="text-emerald-400 font-semibold">{ans.score} / {ans.maxScore || 10} pts</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Pre-Exam Liveness & Anti-Robot Verification Audit Section */}
                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-brand-400" />
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Pre-Exam Liveness & Anti-Robot Verification
                        </h4>
                      </div>
                      {attempt.livenessCheck ? (
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          attempt.livenessCheck.overallStatus === 'fully-auto'
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            : attempt.livenessCheck.overallStatus === 'partial-manual'
                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                            : 'bg-orange-500/15 border-orange-500/30 text-orange-300'
                        }`}>
                          {attempt.livenessCheck.overallStatus === 'fully-auto'
                            ? 'Fully AI-Verified (3/3 Auto)'
                            : attempt.livenessCheck.overallStatus === 'partial-manual'
                            ? 'Partial Manual Fallback (Review Evidence)'
                            : 'Fully Manually Confirmed (Review Evidence)'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">No liveness check record found</span>
                      )}
                    </div>

                    {attempt.livenessCheck?.steps && attempt.livenessCheck.steps.length > 0 ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                          {attempt.livenessCheck.steps.map((step, idx) => (
                            <div key={idx} className={`p-3 rounded-xl border flex flex-col justify-between gap-2.5 ${
                              step.verificationMethod === 'manual'
                                ? 'bg-amber-500/10 border-amber-500/30'
                                : 'bg-slate-200/60 border-slate-200'
                            }`}>
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-900 capitalize">
                                    Step {step.stepIndex || idx + 1}: {step.pose || (idx === 0 ? 'Center' : idx === 1 ? 'Left' : 'Right')}
                                  </span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                                    step.verificationMethod === 'manual'
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  }`}>
                                    {step.verificationMethod === 'manual' ? 'Manually confirmed' : 'AI Auto ✓'}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-600 block font-mono">
                                  {step.timestamp ? new Date(step.timestamp).toLocaleTimeString() : 'Verified'}
                                </span>
                              </div>

                              {/* Evidence Still Frame Thumbnail */}
                              {step.evidenceSnapshot ? (
                                <div className="relative group rounded-lg overflow-hidden border border-slate-300 aspect-video bg-black/40">
                                  <img
                                    src={step.evidenceSnapshot}
                                    alt={`Step ${step.stepIndex || idx + 1} evidence`}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-slate-50/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-[10px] font-bold text-slate-900">
                                    Still Frame Evidence
                                  </div>
                                </div>
                              ) : (
                                <div className="p-2 rounded bg-slate-950/40 text-[10px] text-slate-500 italic text-center">
                                  No frame snapshot captured
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        {attempt.livenessCheck.overallStatus !== 'fully-auto' && (
                          <p className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
                            ⚠️ <strong>Proctor Advisory:</strong> The candidate used the manual fallback confirmation for one or more directional checks. Please audit the captured evidence snapshots above to verify candidate identity.
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-600 italic">Candidate completed standard system check.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: PLAGIARISM & CODE SIMILARITY */}
              {activeTab === 'plagiarism' && (
                <div className="space-y-5">
                  {plagiarismEvents.length === 0 ? (
                    <div className="p-12 rounded-3xl bg-slate-50 border border-slate-200 text-center space-y-2">
                      <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
                      <h4 className="text-sm font-bold text-slate-900">No Code Similarity Detected</h4>
                      <p className="text-xs text-slate-600 max-w-sm mx-auto">
                        This candidate's code submissions were evaluated through the Winnowing AST engine and showed zero suspicious overlap with other candidates.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Flagged Item Selector */}
                      <div className="flex gap-2">
                        {plagiarismEvents.map((ev, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedPlagEvent(ev)}
                            className={`p-3 rounded-2xl border text-left transition flex-1 ${
                              selectedPlagEvent === ev
                                ? 'bg-brand-500/15 border-brand-500 text-slate-900'
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs font-bold mb-1">
                              <span>Match with {ev.metadata?.peerStudentName || 'Candidate'}</span>
                              <span className="text-rose-400 font-mono">{ev.metadata?.similarity || Math.round(ev.confidence * 100)}% Match</span>
                            </div>
                            <span className="text-[11px] text-slate-600 block">{ev.metadata?.questionTitle}</span>
                          </button>
                        ))}
                      </div>

                      {/* Side-by-Side Code Diff Inspector */}
                      {selectedPlagEvent && (
                        <div className="rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden shadow-xl space-y-3 p-4">
                          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">Pairwise AST Token Comparison</h4>
                              <p className="text-[11px] text-slate-600">
                                Question: <strong className="text-slate-800">{selectedPlagEvent.metadata?.questionTitle}</strong>
                              </p>
                            </div>

                            <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-black font-mono">
                              {selectedPlagEvent.metadata?.similarity || Math.round(selectedPlagEvent.confidence * 100)}% Similarity
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Candidate Code */}
                            <div className="space-y-1.5">
                              <span className="text-[11px] font-bold text-slate-600 block">
                                {attempt.studentName} (Submitted):
                              </span>
                              <pre className="p-3 rounded-xl bg-white border border-slate-200 text-slate-800 font-mono text-xs overflow-x-auto max-h-72">
                                {selectedPlagEvent.metadata?.codeA || '// Code sample'}
                              </pre>
                            </div>

                            {/* Peer Candidate Code */}
                            <div className="space-y-1.5">
                              <span className="text-[11px] font-bold text-slate-600 block">
                                {selectedPlagEvent.metadata?.peerStudentName || 'Peer Candidate'} (Submitted):
                              </span>
                              <pre className="p-3 rounded-xl bg-white border border-slate-200 text-slate-800 font-mono text-xs overflow-x-auto max-h-72">
                                {selectedPlagEvent.metadata?.codeB || '// Code sample'}
                              </pre>
                            </div>
                          </div>

                          {/* Action controls */}
                          <div className="flex items-center justify-between pt-3 border-t border-slate-200/80">
                            <span className="text-[11px] text-slate-600">
                              Status: <strong className="text-slate-900">{selectedPlagEvent.status}</strong>
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUpdateStatus(selectedPlagEvent.eventId || selectedPlagEvent._id, 'Confirmed')}
                                className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition"
                              >
                                Confirm Plagiarism Violation
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(selectedPlagEvent.eventId || selectedPlagEvent._id, 'Dismissed')}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                              >
                                Dismiss False Alarm
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: FULL INCIDENT TIMELINE */}
              {activeTab === 'timeline' && (
                <div className="space-y-3">
                  {events.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-600">
                      No proctoring incidents logged during this examination session.
                    </div>
                  ) : (
                    events.map((ev, idx) => {
                      const meta = getEventMeta(ev.eventType);
                      const Icon = meta.icon;
                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1.5 ${meta.color}`}>
                                <Icon className="h-3.5 w-3.5" />
                                <span>{meta.label}</span>
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                Confidence: {Math.round((ev.confidence || 0.85) * 100)}%
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                ev.status === 'Confirmed'
                                  ? 'bg-rose-500/20 text-rose-400'
                                  : ev.status === 'Dismissed'
                                  ? 'bg-slate-100 text-slate-600'
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}>
                                {ev.status}
                              </span>
                            </div>

                            <p className="text-xs text-slate-700">{ev.details}</p>
                            <span className="text-[10px] text-slate-500 block">
                              Logged: {new Date(ev.timestamp).toLocaleTimeString()} • Duration: {ev.durationSeconds || 0}s
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdateStatus(ev.eventId || ev._id, 'Confirmed')}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(ev.eventId || ev._id, 'Dismissed')}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
