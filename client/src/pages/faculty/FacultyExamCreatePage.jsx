import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { examApi, questionApi } from '../../services/api';
import {
  FileCode2,
  Calendar,
  Clock,
  Award,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Check,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function FacultyExamCreatePage() {
  const navigate = useNavigate();
  const [bankQuestions, setBankQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    subject: 'Data Structures & Algorithms',
    department: '',
    classSection: '',
    session: 'Morning',
    description: '',
    durationMinutes: 60,
    totalMarks: 50,
    difficulty: 'Intermediate',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    negativeMarking: false,
    negativeMarksPerQuestion: 0.25,
    proctoringEnabled: true,
    proctoringSettings: {
      faceDetection: true,
      multipleFaceDetection: true,
      objectDetection: true,
      headPoseDetection: true,
      tabSwitchDetection: true,
      fullscreenEnforced: true,
      clipboardGuard: true,
      devtoolsDetection: true,
      multiDisplayDetection: true,
      contextMenuBlocked: true,
      idleDetection: true,
      idleTimeoutMinutes: 3,
      networkGapDetection: true,
      networkGapGraceSeconds: 20
    },
    questionIds: [],
    slots: []
  });

  useEffect(() => {
    async function loadBank() {
      try {
        const res = await questionApi.getAll();
        if (res.success) {
          setBankQuestions(res.questions || []);
          // Auto-select first 2-3 questions by default
          const defaultIds = (res.questions || []).slice(0, 3).map(q => q._id || q.id);
          setFormData(prev => ({ ...prev, questionIds: defaultIds }));
        }
      } catch (e) {
        console.error('Error loading question bank:', e);
      } finally {
        setLoading(false);
      }
    }
    loadBank();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleProctorSettingChange = (field) => {
    setFormData(prev => ({
      ...prev,
      proctoringSettings: {
        ...prev.proctoringSettings,
        [field]: !prev.proctoringSettings[field]
      }
    }));
  };

  const handleProctorNumberChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      proctoringSettings: {
        ...prev.proctoringSettings,
        [field]: Math.max(1, Number(value) || 1)
      }
    }));
  };

  const toggleQuestionSelection = (qId) => {
    setFormData(prev => {
      const exists = prev.questionIds.includes(qId);
      const next = exists ? prev.questionIds.filter(id => id !== qId) : [...prev.questionIds, qId];
      return { ...prev, questionIds: next };
    });
  };

  const addSlot = () => {
    setFormData(prev => ({
      ...prev,
      slots: [
        ...prev.slots,
        {
          id: Date.now().toString(),
          slotName: `Slot ${prev.slots.length + 1}`,
          session: prev.session,
          duration: prev.durationMinutes,
          startRollNumber: '',
          endRollNumber: '',
          questionIds: []
        }
      ]
    }));
  };

  const removeSlot = (index) => {
    setFormData(prev => ({
      ...prev,
      slots: prev.slots.filter((_, i) => i !== index)
    }));
  };

  const handleSlotChange = (index, field, value) => {
    setFormData(prev => {
      const newSlots = [...prev.slots];
      newSlots[index] = { ...newSlots[index], [field]: value };
      return { ...prev, slots: newSlots };
    });
  };

  const toggleSlotQuestion = (slotIndex, qId) => {
    setFormData(prev => {
      const newSlots = [...prev.slots];
      const slot = { ...newSlots[slotIndex] };
      const exists = slot.questionIds.includes(qId);
      slot.questionIds = exists ? slot.questionIds.filter(id => id !== qId) : [...(slot.questionIds || []), qId];
      newSlots[slotIndex] = slot;
      return { ...prev, slots: newSlots };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await examApi.create(formData);
      if (res.success) {
        navigate('/faculty/exams');
      }
    } catch (err) {
      alert('Failed to create examination: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 pb-16">
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 space-y-2">
        <h1 className="text-2xl font-black text-slate-900">Create New Assessment</h1>
        <p className="text-xs text-slate-600">Configure parameters, proctoring policies, and attach problems from the repository</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Assessment Basics */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4">
          <h3 className="text-sm font-bold text-slate-800">1. Basic Information</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">Assessment Title</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Advanced Data Structures Mid-Term"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">Subject</label>
              <input
                type="text"
                name="subject"
                required
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g. Computer Science"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">Class/Section</label>
              <input
                type="text"
                name="classSection"
                value={formData.classSection}
                onChange={handleChange}
                placeholder="e.g. 3rd Year Section A"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">Session</label>
              <select
                name="session"
                value={formData.session}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-brand-500"
              >
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1.5 text-xs">Assessment Description</label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide instructions or background context for candidates..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-brand-500 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">Duration (Mins)</label>
              <input
                type="number"
                name="durationMinutes"
                value={formData.durationMinutes}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">Total Marks</label>
              <input
                type="number"
                name="totalMarks"
                value={formData.totalMarks}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">Difficulty</label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-brand-500"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">Negative Marking</label>
              <select
                name="negativeMarking"
                value={formData.negativeMarking ? 'true' : 'false'}
                onChange={(e) => setFormData(prev => ({ ...prev, negativeMarking: e.target.value === 'true' }))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-brand-500"
              >
                <option value="false">No (0 Penalty)</option>
                <option value="true">Yes (-0.25x Penalty)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: AI Proctoring Configuration */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-brand-400" />
              <h3 className="text-sm font-bold text-slate-800">2. AI Proctoring Sentinel Settings</h3>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                name="proctoringEnabled"
                checked={formData.proctoringEnabled}
                onChange={handleChange}
                className="h-4 w-4 rounded bg-slate-50 border-slate-300 text-brand-600 focus:ring-0"
              />
              <span className="text-slate-700">Enable Proctoring</span>
            </label>
          </div>

          {formData.proctoringEnabled && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'faceDetection', label: 'Face Missing Detection', desc: 'Flags if candidate face disappears from frame' },
                  { key: 'multipleFaceDetection', label: 'Multiple Faces Detection', desc: 'Flags additional unauthorized persons in room' },
                  { key: 'objectDetection', label: 'Mobile Phone & Object Detection', desc: 'Identifies cell phones, books, and study aids' },
                  { key: 'headPoseDetection', label: 'Head Pose & Looking Away', desc: 'Monitors sustained off-screen gaze orientation' },
                  { key: 'tabSwitchDetection', label: 'Tab Switch & Focus Lost', desc: 'Logs window blur and browser tab deflections' },
                  { key: 'fullscreenEnforced', label: 'Fullscreen Mode Policy', desc: 'Prompts fullscreen enforcement during exam' },
                  { key: 'clipboardGuard', label: 'Clipboard Guard (Copy/Paste/Cut)', desc: 'Blocks pasting external code or copying exam prompts' },
                  { key: 'devtoolsDetection', label: 'Browser DevTools Detection', desc: 'Detects inspector panels, console tampering, and DOM inspect' },
                  { key: 'multiDisplayDetection', label: 'Multi-Monitor / Auxiliary Display', desc: 'Detects connected secondary screens or extended desktop' },
                  { key: 'contextMenuBlocked', label: 'Disable Right-Click Context Menu', desc: 'Prevents Inspect Element, view-source, and right-click bypasses' },
                  { key: 'idleDetection', label: 'Inactivity & Candidate Idle Watch', desc: 'Alerts candidate if no keystroke/mouse activity for duration' },
                  { key: 'networkGapDetection', label: 'Network Gap & Drop Tracking', desc: 'Monitors dropped WebSockets and logs abnormal offline duration' }
                ].map(opt => (
                  <label
                    key={opt.key}
                    className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition ${
                      formData.proctoringSettings[opt.key]
                        ? 'bg-brand-950/20 border-brand-800/40 text-slate-900'
                        : 'bg-slate-100/30 border-slate-200/80 text-slate-600 hover:bg-slate-100/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(formData.proctoringSettings[opt.key])}
                      onChange={() => handleProctorSettingChange(opt.key)}
                      className="h-4 w-4 rounded bg-slate-50 border-slate-300 text-brand-600 focus:ring-0 mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">{opt.label}</span>
                      <span className="text-[11px] text-slate-600">{opt.desc}</span>
                    </div>
                  </label>
                ))}
              </div>

              {/* Threshold Adjustments for Advanced Integrity Sentinel */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Candidate Idle Timeout (Minutes)
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Triggers interactive "Still There?" verification modal after this period of inactivity.
                  </p>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.proctoringSettings.idleTimeoutMinutes ?? 3}
                    onChange={(e) => handleProctorNumberChange('idleTimeoutMinutes', e.target.value)}
                    disabled={!formData.proctoringSettings.idleDetection}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-brand-500 disabled:opacity-40"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Network Disconnect Grace Period (Seconds)
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Grace buffer before connection loss is flagged as a network gap incident.
                  </p>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={formData.proctoringSettings.networkGapGraceSeconds ?? 20}
                    onChange={(e) => handleProctorNumberChange('networkGapGraceSeconds', e.target.value)}
                    disabled={!formData.proctoringSettings.networkGapDetection}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-brand-500 disabled:opacity-40"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Slots Configuration */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-brand-400" />
              <h3 className="text-sm font-bold text-slate-800">3. Slot Configuration (Optional)</h3>
            </div>
            <button
              type="button"
              onClick={addSlot}
              className="text-xs flex items-center gap-1 text-brand-600 hover:text-brand-500 font-bold bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition"
            >
              <Plus className="h-4 w-4" /> Add Slot
            </button>
          </div>

          <div className="space-y-4">
            {formData.slots.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-xs text-center">
                No slots configured. Exam will use basic start/end date and global question set.
              </div>
            ) : (
              formData.slots.map((slot, index) => (
                <div key={slot.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <h4 className="font-bold text-slate-700 text-xs">{slot.slotName}</h4>
                    <button type="button" onClick={() => removeSlot(index)} className="text-red-500 hover:text-red-600 text-xs font-bold">Remove</button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Start Roll No.</label>
                      <input type="text" value={slot.startRollNumber} onChange={(e) => handleSlotChange(index, 'startRollNumber', e.target.value)} required placeholder="e.g. 1001" className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-brand-500" />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">End Roll No.</label>
                      <input type="text" value={slot.endRollNumber} onChange={(e) => handleSlotChange(index, 'endRollNumber', e.target.value)} required placeholder="e.g. 1050" className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-brand-500" />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="block text-slate-700 font-semibold mb-1.5 text-xs">Select Questions for this Slot ({slot.questionIds.length} Selected)</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                      {bankQuestions.map(q => {
                        const qId = q._id || q.id;
                        const selected = slot.questionIds.includes(qId);
                        return (
                          <div key={qId} onClick={() => toggleSlotQuestion(index, qId)} className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between text-xs ${selected ? 'bg-brand-500/15 border-brand-500 text-slate-900' : 'bg-white border-slate-200 text-slate-700'}`}>
                            <span className="font-semibold truncate pr-2">{q.title}</span>
                            <div className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${selected ? 'bg-brand-500 border-brand-500 text-slate-900' : 'border-slate-400'}`}>
                              {selected && <Check className="h-2.5 w-2.5" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section 4: Select Questions From Bank */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              4. Global/Fallback Questions ({formData.questionIds.length} Selected)
            </h3>
            <Link
              to="/faculty/question-bank"
              className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
            >
              Open Question Bank
            </Link>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto">
            {bankQuestions.map(q => {
              const qId = q._id || q.id;
              const selected = formData.questionIds.includes(qId);
              return (
                <div
                  key={qId}
                  onClick={() => toggleQuestionSelection(qId)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between text-xs ${
                    selected
                      ? 'bg-brand-500/15 border-brand-500 text-slate-900 shadow'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="font-bold block">{q.title}</span>
                    <span className="text-[10px] text-slate-600 uppercase tracking-wider">
                      {q.type} • {q.subject} • {q.marks} Marks
                    </span>
                  </div>

                  <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                    selected ? 'bg-brand-500 border-brand-500 text-slate-900' : 'border-slate-400'
                  }`}>
                    {selected && <Check className="h-3 w-3" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/faculty/exams"
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting || !formData.title || formData.slots.length === 0}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-slate-900 font-bold text-xs shadow-lg shadow-brand-500/25 transition disabled:opacity-40"
          >
            {submitting ? 'Publishing Assessment...' : 'Publish Assessment'}
          </button>
        </div>
      </form>
    </div>
  );
}
