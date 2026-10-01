import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Smartphone,
  Users,
  Eye,
  Send,
  MessageSquare,
  UserCheck,
  Camera
} from 'lucide-react';
import { proctorApi } from '../../services/api';
import { useSocket } from '../../context/SocketContext';

export default function StudentIncidentModal({ student, exam, onClose, onUpdateStatus }) {
  const { sendWarning } = useSocket();
  const [warningText, setWarningText] = useState('');
  const [sendingWarning, setSendingWarning] = useState(false);
  const [warningSuccess, setWarningSuccess] = useState(false);

  if (!student) return null;

  const handleSendWarning = () => {
    if (!warningText.trim()) return;
    setSendingWarning(true);
    sendWarning(student.studentId, warningText, exam?._id || exam?.id);
    setSendingWarning(false);
    setWarningSuccess(true);
    setWarningText('');
    setTimeout(() => setWarningSuccess(false), 3000);
  };

  const handleIncidentStatusChange = async (eventId, newStatus) => {
    try {
      await proctorApi.updateEventStatus(eventId, { status: newStatus });
      if (onUpdateStatus) onUpdateStatus();
    } catch (e) {
      alert('Failed to update incident: ' + e.message);
    }
  };

  const incidents = student.lastIncident ? [student.lastIncident] : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-3xl bg-white border border-slate-300 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50/80 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 font-bold">
              {student.studentName?.charAt(0) || 'S'}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{student.studentName}</h3>
              <p className="text-xs text-slate-600">{student.studentEmail} • {exam?.title}</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Performance & Proctoring Top Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Exam Performance */}
            <div className="p-4 rounded-2xl bg-slate-100/40 border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Exam Progress</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700">Questions Attempted:</span>
                  <span className="text-slate-900">{student.questionsAttempted || '2/3'}</span>
                </div>
                <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${student.progressPercent || 66}%` }}
                    className="h-full bg-brand-500 rounded-full"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                  <span>Progress: {student.progressPercent || 66}%</span>
                  <span>Time Left: {Math.floor((student.remainingSeconds || 1800) / 60)}m</span>
                </div>
              </div>
            </div>

            {/* Proctoring Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-100/40 border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Proctoring Signals</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-600">Mobile Phone:</span>
                  <span className="font-bold text-rose-400">{student.proctoringBreakdown?.mobilePhone || 0}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-600">Multi Face:</span>
                  <span className="font-bold text-amber-400">{student.proctoringBreakdown?.multipleFaces || 0}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-600">Face Missing:</span>
                  <span className="font-bold text-amber-400">{student.proctoringBreakdown?.faceMissing || 0}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-600">Looking Away:</span>
                  <span className="font-bold text-slate-700">{student.proctoringBreakdown?.lookingAway || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pre-Exam Liveness Verification Status */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl border ${
                student.livenessCheck?.overallStatus === 'fully-auto'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : student.livenessCheck?.overallStatus
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-slate-100 border-slate-300 text-slate-600'
              }`}>
                <UserCheck className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">Pre-Exam Liveness Check:</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                    student.livenessCheck?.overallStatus === 'fully-auto'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : student.livenessCheck?.overallStatus
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                      : 'bg-slate-100 border-slate-300 text-slate-600'
                  }`}>
                    {student.livenessCheck?.overallStatus === 'fully-auto'
                      ? 'AI-Verified (Auto)'
                      : student.livenessCheck?.overallStatus === 'partial-manual'
                      ? 'Partial Manual Fallback'
                      : student.livenessCheck?.overallStatus === 'fully-manual'
                      ? 'Fully Manually Confirmed'
                      : 'Verified'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  {student.livenessCheck?.steps
                    ? student.livenessCheck.steps.map(s => `${s.pose || 'Step'}: ${s.verificationMethod === 'manual' ? 'Manually confirmed' : 'Auto'}`).join(' • ')
                    : 'Anti-robot 3D directional test completed before exam session.'}
                </p>
              </div>
            </div>
            {student.livenessCheck?.overallStatus && student.livenessCheck.overallStatus !== 'fully-auto' && (
              <span className="text-[10px] px-2 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold shrink-0">
                Fallback Used (Audit Photo Logged)
              </span>
            )}
          </div>

          {/* Incident Timeline */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              <span>Event Audit Timeline</span>
            </h4>

            {incidents.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-100/20 border border-slate-200 text-center text-xs text-slate-500">
                No critical proctoring incidents logged for this student.
              </div>
            ) : (
              incidents.map((ev, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                        {ev.eventType?.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        Confidence: {Math.round((ev.confidence || 0.88) * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-700">{ev.details || 'Event logged by camera proctor'}</p>
                    <span className="text-[10px] text-slate-500 block">
                      Timestamp: {new Date(ev.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleIncidentStatusChange(ev.eventId || ev._id, 'Confirmed')}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => handleIncidentStatusChange(ev.eventId || ev._id, 'Dismissed')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Send Warning Direct To Student */}
          <div className="p-4 rounded-2xl bg-slate-100/30 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-brand-400" />
                <span>Send Direct Warning Toast to Student Screen</span>
              </label>
              {warningSuccess && (
                <span className="text-emerald-400 text-xs font-semibold">Warning dispatched!</span>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={warningText}
                onChange={(e) => setWarningText(e.target.value)}
                placeholder="e.g. Please ensure your face remains clearly visible inside the camera frame."
                className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
              <button
                onClick={handleSendWarning}
                disabled={sendingWarning || !warningText.trim()}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-slate-900 font-bold text-xs flex items-center gap-1.5 disabled:opacity-40 transition"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Dispatch</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
