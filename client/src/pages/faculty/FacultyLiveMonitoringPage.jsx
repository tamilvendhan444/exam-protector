import React, { useEffect, useState, useMemo } from 'react';
import { useSocket } from '../../context/SocketContext';
import { facultyApi, examApi } from '../../services/api';
import StudentIncidentModal from './StudentIncidentModal';
import {
  Video,
  ShieldCheck,
  AlertTriangle,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Send,
  Sparkles,
  RefreshCw,
  Bell,
  Volume2,
  VolumeX,
  Radio,
  Search,
  Megaphone,
  X,
  Play,
  Pause,
  Award,
  Wifi,
  WifiOff,
  AlertOctagon
} from 'lucide-react';

export default function FacultyLiveMonitoringPage() {
  const { socket, joinMonitoring, sendWarning } = useSocket();

  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [examData, setExamData] = useState(null);
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState({
    activeStudents: 0,
    normal: 0,
    warnings: 0,
    incidents: 0,
    offline: 0
  });

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedSlot, setSelectedSlot] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Live Proctoring Controls
  const [audioChimeEnabled, setAudioChimeEnabled] = useState(true);
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);
  const [simulationMode, setSimulationMode] = useState(false);

  // 1. Fetch available exams
  useEffect(() => {
    async function loadExams() {
      try {
        setLoading(true);
        const res = await examApi.getAll();
        if (res.success && res.exams.length > 0) {
          setExams(res.exams);
          // Prioritize active exam if available
          const activeExam = res.exams.find((e) => e.status === 'active') || res.exams[0];
          setSelectedExamId(activeExam._id || activeExam.id);
        }
      } catch (err) {
        console.error('Failed to load exams:', err);
      } finally {
        setLoading(false);
      }
    }
    loadExams();
  }, []);

  // 2. Fetch monitoring data for selected exam
  const fetchMonitoringData = async (examId) => {
    if (!examId) return;
    try {
      const res = await facultyApi.getLiveMonitoring(examId);
      if (res.success) {
        setExamData(res.exam);
        setStudents(res.students || []);
        setSummary(res.summary || {});
      }
    } catch (err) {
      console.error('Error fetching live monitoring data:', err);
    }
  };

  useEffect(() => {
    if (!selectedExamId) return;
    fetchMonitoringData(selectedExamId);
    joinMonitoring(selectedExamId);
  }, [selectedExamId]);

  // Audio Chime notification
  const playAlertSound = () => {
    if (!audioChimeEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      // AudioContext muted/unsupported
    }
  };

  // 3. Socket.IO Real-Time Listeners
  useEffect(() => {
    if (!socket) return;

    const handleStudentFeed = (data) => {
      setStudents((prev) => {
        return prev.map((s) => {
          if (s.studentId === data.studentId) {
            return {
              ...s,
              snapshot: data.snapshot || s.snapshot,
              status: data.status || s.status,
              incidentsCount: data.incidentsCount !== undefined ? data.incidentsCount : s.incidentsCount,
              remainingSeconds: data.remainingSeconds !== undefined ? data.remainingSeconds : s.remainingSeconds
            };
          }
          return s;
        });
      });
    };

    const handleStudentJoined = (data) => {
      setStudents((prev) => {
        const exists = prev.some((s) => s.studentId === data.studentId);
        if (exists) return prev;
        return [...prev, data];
      });
      setSummary((prev) => ({
        ...prev,
        activeStudents: prev.activeStudents + 1,
        normal: prev.normal + 1
      }));
    };

    const handleNewIncident = (data) => {
      playAlertSound();
      setStudents((prev) => {
        return prev.map((s) => {
          if (s.studentId === data.studentId) {
            return {
              ...s,
              status: data.status,
              incidentsCount: data.incidentsCount,
              lastIncident: data.event
            };
          }
          return s;
        });
      });
    };

    const handleStatsUpdate = (data) => {
      setSummary({
        activeStudents: data.activeStudentsCount,
        normal: data.normalCount,
        warnings: data.warningsCount,
        incidents: data.incidentsCount,
        offline: data.offlineCount || 0
      });
    };

    socket.on('faculty:student_feed', handleStudentFeed);
    socket.on('faculty:student_joined', handleStudentJoined);
    socket.on('faculty:new_incident', handleNewIncident);
    socket.on('faculty:stats_update', handleStatsUpdate);

    return () => {
      socket.off('faculty:student_feed', handleStudentFeed);
      socket.off('faculty:student_joined', handleStudentJoined);
      socket.off('faculty:new_incident', handleNewIncident);
      socket.off('faculty:stats_update', handleStatsUpdate);
    };
  }, [socket, audioChimeEnabled]);

  // Demo / Simulation Feeds when no live candidates are in session
  const simulatedStudents = useMemo(() => {
    return [
      {
        studentId: 'sim-1',
        studentName: 'Alex Johnson (Simulated)',
        studentEmail: 'alex.j@demo.edu',
        rollNumber: 'CS-2026-081',
        slotName: 'Slot A (09:00 - 11:00)',
        status: 'Normal',
        incidentsCount: 0,
        attemptStatus: 'in_progress',
        remainingSeconds: 3200,
        score: '35 / 100',
        questionsAttempted: '3 of 5 Solved',
        snapshot: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
      },
      {
        studentId: 'sim-2',
        studentName: 'Sophia Chen (Simulated)',
        studentEmail: 'sophia.c@demo.edu',
        rollNumber: 'CS-2026-104',
        slotName: 'Slot A (09:00 - 11:00)',
        status: 'Warning',
        incidentsCount: 2,
        attemptStatus: 'in_progress',
        remainingSeconds: 2750,
        score: '60 / 100',
        questionsAttempted: '4 of 5 Solved',
        snapshot: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        lastIncident: {
          type: 'looking_away',
          severity: 'medium',
          timestamp: new Date().toISOString(),
          description: 'Gaze deviation detected away from primary monitor.'
        }
      },
      {
        studentId: 'sim-3',
        studentName: 'Rahul Sharma (Simulated)',
        studentEmail: 'rahul.s@demo.edu',
        rollNumber: 'CS-2026-142',
        slotName: 'Slot B (11:30 - 13:30)',
        status: 'Incident',
        incidentsCount: 5,
        attemptStatus: 'in_progress',
        remainingSeconds: 1980,
        score: '20 / 100',
        questionsAttempted: '2 of 5 Solved',
        snapshot: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        lastIncident: {
          type: 'tab_switch',
          severity: 'high',
          timestamp: new Date().toISOString(),
          description: 'Window blur detected: Unauthorized browser tab switch recorded.'
        }
      }
    ];
  }, []);

  const activeRoster = simulationMode && students.length === 0 ? simulatedStudents : students;

  // Filtered Roster
  const filteredStudents = useMemo(() => {
    return activeRoster.filter((s) => {
      if (selectedSlot !== 'All' && s.slotName && s.slotName !== selectedSlot) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (s.studentName || '').toLowerCase().includes(q);
        const rollMatch = (s.rollNumber || '').toLowerCase().includes(q);
        const emailMatch = (s.studentEmail || '').toLowerCase().includes(q);
        if (!nameMatch && !rollMatch && !emailMatch) return false;
      }
      return true;
    });
  }, [activeRoster, selectedSlot, searchQuery]);

  // Handle Broadcast Announcement
  const handleSendBroadcast = () => {
    if (!broadcastMessage.trim()) return;
    if (socket && selectedExamId) {
      socket.emit('faculty:broadcast_announcement', {
        examId: selectedExamId,
        message: broadcastMessage,
        sender: 'Proctoring Sentinel Hub',
        timestamp: new Date().toISOString()
      });
    }
    setBroadcastSuccess(true);
    setTimeout(() => {
      setBroadcastSuccess(false);
      setBroadcastMessage('');
      setBroadcastModalOpen(false);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* ─── Executive Header & Controls ────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-black tracking-wider uppercase text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300">
              Live Examination Sentinel Active
            </span>
            {socket?.connected ? (
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <Wifi className="h-3 w-3 text-emerald-500" /> Gateway Synced
              </span>
            ) : (
              <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1">
                <WifiOff className="h-3 w-3 text-amber-500" /> Reconnecting
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Faculty Proctoring Hub</h1>
          <p className="text-xs text-slate-600 font-medium max-w-2xl">
            Real-time candidate telemetry, automated computer vision infraction detection, and instant incident response suite.
          </p>
        </div>

        {/* Assessment Selector & Quick Commands */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl">
            <Radio className="h-3.5 w-3.5 text-brand-600 animate-pulse" />
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="bg-transparent text-slate-900 text-xs font-bold focus:outline-none cursor-pointer"
            >
              {exams.map((ex) => {
                const isLive = ex.status === 'active';
                return (
                  <option key={ex._id || ex.id} value={ex._id || ex.id}>
                    {isLive ? '🟢 [LIVE] ' : '⚪ '} {ex.title}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Broadcast Announcement Button */}
          <button
            onClick={() => setBroadcastModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition"
            title="Broadcast emergency announcement to all candidates"
          >
            <Megaphone className="h-3.5 w-3.5 text-amber-400" />
            <span>Broadcast</span>
          </button>

          {/* Audio Chime Toggle */}
          <button
            onClick={() => setAudioChimeEnabled(!audioChimeEnabled)}
            className={`p-2 rounded-xl border text-xs font-bold transition ${
              audioChimeEnabled
                ? 'bg-brand-50 text-brand-700 border-brand-200'
                : 'bg-slate-100 text-slate-400 border-slate-200'
            }`}
            title={audioChimeEnabled ? 'Audio Chime Enabled' : 'Audio Chime Muted'}
          >
            {audioChimeEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => fetchMonitoringData(selectedExamId)}
            title="Refresh Roster"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ─── 5 Real-Time Status Counters (WCAG AAA High Contrast) ────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Active Students */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-brand-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Active Feeds</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900">
              {simulationMode ? activeRoster.length : summary.activeStudents || students.length}
            </span>
            <span className="text-[11px] font-semibold text-slate-500">Live</span>
          </div>
          <p className="text-[11px] text-slate-600 font-medium mt-0.5">Streaming candidate feeds</p>
        </div>

        {/* Normal Status */}
        <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-sm hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider">Normal Status</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-800">
              {simulationMode ? 1 : summary.normal || 0}
            </span>
            <span className="text-[11px] font-bold text-emerald-700">Compliant</span>
          </div>
          <p className="text-[11px] text-slate-600 font-medium mt-0.5">Zero active infractions</p>
        </div>

        {/* Warnings */}
        <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-sm hover:border-amber-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-amber-900 font-bold uppercase tracking-wider">Warnings</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-900">
              {simulationMode ? 1 : summary.warnings || 0}
            </span>
            <span className="text-[11px] font-bold text-amber-700">Flagged</span>
          </div>
          <p className="text-[11px] text-slate-600 font-medium mt-0.5">Minor gaze / noise flags</p>
        </div>

        {/* Critical Incidents */}
        <div className="p-4 rounded-2xl bg-white border border-rose-200 shadow-sm hover:border-rose-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-rose-800 font-bold uppercase tracking-wider">Critical Incidents</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-700">
              <AlertOctagon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-rose-800">
              {simulationMode ? 1 : summary.incidents || 0}
            </span>
            <span className="text-[11px] font-bold text-rose-700">High Risk</span>
          </div>
          <p className="text-[11px] text-slate-600 font-medium mt-0.5">Phone, tab switch, multi-face</p>
        </div>

        {/* Offline / Idle */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Offline</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-700">{summary.offline || 0}</span>
            <span className="text-[11px] font-bold text-slate-500">Stalled</span>
          </div>
          <p className="text-[11px] text-slate-600 font-medium mt-0.5">Dropped socket or heartbeat</p>
        </div>
      </div>

      {/* ─── Monitoring Toolbar & Roster Controls ─────────────────────── */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Student Monitoring Roster ({filteredStudents.length})
            </h3>
            {simulationMode && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-200">
                Demo Simulation Feeds Active
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Slot Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-bold">Slot:</span>
              <select
                value={selectedSlot}
                onChange={(e) => setSelectedSlot(e.target.value)}
                className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
              >
                <option value="All">All Examination Slots</option>
                {Array.from(new Set(activeRoster.map((s) => s.slotName)))
                  .filter(Boolean)
                  .map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
              </select>
            </div>

            {/* Candidate Search */}
            <div className="relative w-48 sm:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidates..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-brand-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Grid vs Table View Mode */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
                  viewMode === 'grid'
                    ? 'bg-white shadow-sm text-slate-900'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Grid View
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
                  viewMode === 'table'
                    ? 'bg-white shadow-sm text-slate-900'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Table View
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Student Video Grid / Table ─────────────────────────────── */}
      {filteredStudents.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="h-16 w-16 rounded-3xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
            <Video className="h-8 w-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h4 className="text-base font-black text-slate-900">
              No students currently streaming in this session
            </h4>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Examinees will appear here with live camera thumbnails, audio waveforms, and AI infraction tags as soon as they start their attempt.
            </p>
          </div>

          {/* Test Sentinel Demo Feed Button */}
          <div className="pt-2">
            <button
              onClick={() => setSimulationMode(!simulationMode)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs border border-brand-200 shadow-sm transition"
            >
              <Sparkles className="h-4 w-4 text-brand-600" />
              <span>{simulationMode ? 'Turn Off Demo Feeds' : 'Preview Simulated Demo Feeds'}</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        <div className="overflow-x-auto bg-white rounded-3xl border border-slate-200 shadow-sm">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-700 border-b border-slate-200 font-extrabold">
              <tr>
                <th className="py-3.5 px-4">Student Candidate</th>
                <th className="py-3.5 px-4">Roll Number</th>
                <th className="py-3.5 px-4">Slot</th>
                <th className="py-3.5 px-4">Attempt Status</th>
                <th className="py-3.5 px-4">Remaining</th>
                <th className="py-3.5 px-4">Score</th>
                <th className="py-3.5 px-4">Proctoring Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => {
                const status = student.status || 'Normal';
                const isWarning = status === 'Warning';
                const isIncident = status === 'Incident';

                return (
                  <tr key={student.studentId} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-900">{student.studentName}</div>
                      <div className="text-[10px] text-slate-500 font-medium">{student.studentEmail}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {student.rollNumber || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-600">{student.slotName || 'Global'}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          student.attemptStatus === 'submitted' || student.attemptStatus === 'evaluated'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-blue-50 text-blue-800 border-blue-300'
                        }`}
                      >
                        {student.attemptStatus || 'In Progress'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-600">
                      {Math.floor((student.remainingSeconds || 2400) / 60)}m left
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{student.score || '-'}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          isIncident
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : isWarning
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isIncident ? 'bg-rose-600 animate-ping' : isWarning ? 'bg-amber-600' : 'bg-emerald-600'
                          }`}
                        ></span>
                        {status} {student.incidentsCount > 0 ? `(${student.incidentsCount})` : ''}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-brand-600 text-white transition shadow-sm"
                      >
                        Audit Feed
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStudents.map((student) => {
            const status = student.status || 'Normal';
            const isWarning = status === 'Warning';
            const isIncident = status === 'Incident';

            return (
              <div
                key={student.studentId}
                className={`rounded-3xl bg-white border overflow-hidden flex flex-col justify-between transition-all hover:shadow-lg ${
                  isIncident
                    ? 'border-rose-400 ring-2 ring-rose-200/50'
                    : isWarning
                    ? 'border-amber-400 ring-2 ring-amber-200/50'
                    : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {/* Camera Thumbnail Feed */}
                <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
                  {student.snapshot ? (
                    <img
                      src={student.snapshot}
                      alt={student.studentName}
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-slate-400 text-xs">
                      <Video className="h-6 w-6 text-slate-500 animate-pulse" />
                      <span className="font-semibold">Feed Syncing...</span>
                    </div>
                  )}

                  {/* Status Badge Overlay */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-md shadow-sm border border-slate-200/50 text-[10px] font-black">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isIncident ? 'bg-rose-600 animate-ping' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    ></span>
                    <span
                      className={
                        isIncident ? 'text-rose-800' : isWarning ? 'text-amber-900' : 'text-emerald-800'
                      }
                    >
                      {status}
                    </span>
                  </div>

                  {/* Incidents Count Pill */}
                  {student.incidentsCount > 0 && (
                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-extrabold shadow-sm">
                      {student.incidentsCount} Flags
                    </div>
                  )}

                  {/* Bottom Slot Badge */}
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold">
                    {student.slotName || 'Main Slot'}
                  </div>
                </div>

                {/* Candidate Details & Actions */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-sm font-black text-slate-900 truncate">{student.studentName}</h4>
                      {student.rollNumber && (
                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {student.rollNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium truncate">{student.studentEmail}</p>

                    <div className="flex items-center justify-between text-xs text-slate-600 pt-2.5 border-t border-slate-100 mt-2 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {Math.floor((student.remainingSeconds || 2400) / 60)}m left
                      </span>
                      <span className="font-bold text-slate-800">
                        {student.questionsAttempted || 'In Progress'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedStudent(student)}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-brand-600 text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>View Details & Audit</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Emergency Broadcast Announcement Modal ─────────────────── */}
      {broadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                  <Megaphone className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">Broadcast Proctor Announcement</h3>
                  <p className="text-xs text-slate-500">Pushes an urgent banner to all active examinees in this slot.</p>
                </div>
              </div>
              <button
                onClick={() => setBroadcastModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">Announcement Message</label>
              <textarea
                rows={3}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="e.g. 10 minutes remaining in this slot. Please ensure all answers and code test cases are finalized."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-brand-500 leading-relaxed"
              />
            </div>

            {broadcastSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Announcement dispatched to examinee terminals!</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setBroadcastModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSendBroadcast}
                disabled={!broadcastMessage.trim()}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/20 disabled:opacity-50 transition"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send Broadcast</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Student Incident & Audit Modal ─────────────────────────── */}
      {selectedStudent && (
        <StudentIncidentModal
          student={selectedStudent}
          exam={examData}
          onClose={() => setSelectedStudent(null)}
          onUpdateStatus={() => fetchMonitoringData(selectedExamId)}
        />
      )}
    </div>
  );
}
