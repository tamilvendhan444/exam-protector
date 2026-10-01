import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Sliders,
  ShieldCheck,
  Award,
  Bell,
  User,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Volume2,
  VolumeX,
  Play,
  Building2,
  Mail,
  Lock,
  Sparkles,
  SlidersHorizontal,
  Flame,
  Check,
  Eye,
  FileCheck,
  Terminal,
  Cpu
} from 'lucide-react';

const DEFAULT_FACULTY_SETTINGS = {
  // 1. Grading & Code Rubrics
  codeStrictness: 'moderate', // 'strict' | 'moderate' | 'lenient'
  partialCreditEnabled: true,
  executionTimeoutSeconds: 5,
  negativeMarkingRatio: '0.25', // '0', '0.25', '0.33', '0.5'
  plagiarismThreshold: 65,
  autoGradeOnSubmission: true,

  // 2. AI Sentinel Sensitivity
  multipleFacesTolerance: 'high', // 'high' (strictest), 'medium', 'low'
  gazeDeviationSeconds: 5,
  tabSwitchLimit: 3,
  noiseThreshold: 'medium',
  snapshotIntervalSeconds: 5,
  mirrorCameraFeed: true,
  autoLockOnCriticalViolation: false,

  // 3. Alerts & Notifications
  audioChimeOnIncident: true,
  audioChimeVolume: 80,
  emailOnCriticalIncident: true,
  emailOnSlotCompletion: true,
  browserPushAlerts: true,

  // 4. Academic Profile
  title: 'Professor',
  department: 'Computer Science & Engineering',
  officeHours: 'Mon & Wed: 14:00 - 16:00',
  bio: 'Chair of Department, specializing in Distributed Systems, Algorithm Design, and Autonomous AI Proctoring.'
};

export default function FacultySettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('grading'); // 'grading' | 'sentinel' | 'notifications' | 'profile'
  const [settings, setSettings] = useState(DEFAULT_FACULTY_SETTINGS);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('eduproctor_faculty_settings');
      if (stored) {
        setSettings({ ...DEFAULT_FACULTY_SETTINGS, ...JSON.parse(stored) });
      }
    } catch (e) {
      console.error('Failed to load faculty settings:', e);
    }
  }, []);

  // Update setting helper
  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Save settings handler
  const handleSave = () => {
    setIsSaving(true);
    try {
      localStorage.setItem('eduproctor_faculty_settings', JSON.stringify(settings));
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (e) {
      alert('Failed to save settings: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to defaults
  const handleReset = () => {
    if (window.confirm('Reset all academic configuration settings to recommended system defaults?')) {
      setSettings(DEFAULT_FACULTY_SETTINGS);
      localStorage.removeItem('eduproctor_faculty_settings');
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  // Test Web Audio Chime
  const handleTestChime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
      const vol = (settings.audioChimeVolume / 100) * 0.2;
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // AudioContext unavailable
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* ─── Executive Header & Command Controls ─────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-50 text-brand-600 border border-brand-200">
              <Sliders className="h-5 w-5" />
            </span>
            <span className="text-[11px] font-bold tracking-wider uppercase text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
              Evaluation & Sentinel Configuration
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Faculty Academic Settings</h1>
          <p className="text-xs text-slate-600 font-medium max-w-2xl">
            Configure automated test case grading tolerances, customize AI proctoring sensitivity, manage incident sound chimes, and update faculty credentials.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold text-xs transition border border-slate-200"
            title="Reset to system defaults"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/25 transition active:scale-[0.98] disabled:opacity-50"
          >
            {isSaved ? (
              <>
                <Check className="h-4 w-4 stroke-[3]" />
                <span>Saved Successfully!</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save All Settings</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── Save Confirmation Banner ───────────────────────────────── */}
      {isSaved && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold text-xs flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Settings saved successfully. All changes are active for your upcoming proctored sessions.</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Synced</span>
        </div>
      )}

      {/* ─── Navigation Tabs ────────────────────────────────────────── */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap gap-2">
        {[
          { id: 'grading', label: 'Auto-Grading & Rubrics', icon: Award },
          { id: 'sentinel', label: 'AI Sentinel Sensitivity', icon: ShieldCheck },
          { id: 'notifications', label: 'Alerts & Chimes', icon: Bell },
          { id: 'profile', label: 'Academic Profile', icon: User }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── Section 1: Auto-Grading & Code Rubrics ──────────────────── */}
      {activeTab === 'grading' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Code Evaluation & Test Case Rules</h3>
              <p className="text-xs text-slate-500 font-medium">
                Define automated grading stringency, timeout limits, and proportional test-case awards.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Code Evaluation Strictness */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-900">Code Output Matching</span>
                  <span className="text-[10px] font-bold uppercase text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                    {settings.codeStrictness}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Controls whitespace trimming and case sensitivity during automated test-case evaluation.
                </p>
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {['strict', 'moderate', 'lenient'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => updateSetting('codeStrictness', mode)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold capitalize transition border ${
                        settings.codeStrictness === mode
                          ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Partial Credit Toggle */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900">Partial Credit Scoring</span>
                    <button
                      type="button"
                      onClick={() => updateSetting('partialCreditEnabled', !settings.partialCreditEnabled)}
                      className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                        settings.partialCreditEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-300 ${
                          settings.partialCreditEnabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      ></div>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-1">
                    Award proportional marks for passing test cases (e.g. 15 / 20 if 3 of 4 cases pass).
                  </p>
                </div>
                <span className={`text-[10px] font-bold ${settings.partialCreditEnabled ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {settings.partialCreditEnabled ? '✓ Enabled (Standard Academic Rubric)' : '✕ Disabled (All-or-Nothing)'}
                </span>
              </div>

              {/* Negative Marking Ratio */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="font-extrabold text-xs text-slate-900 block">MCQ Negative Marking Deduction</span>
                <p className="text-[11px] text-slate-500 font-medium">
                  Points deducted for incorrect multi-choice answers to deter random guessing.
                </p>
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[
                    { val: '0', label: 'None (0)' },
                    { val: '0.25', label: '-0.25x' },
                    { val: '0.33', label: '-0.33x' },
                    { val: '0.5', label: '-0.50x' }
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => updateSetting('negativeMarkingRatio', item.val)}
                      className={`py-2 rounded-xl text-xs font-bold transition border ${
                        settings.negativeMarkingRatio === item.val
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Execution Timeout */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-900">Sandbox Code Timeout</span>
                  <span className="text-xs font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono">
                    {settings.executionTimeoutSeconds}s / case
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Max runtime execution time per test case before terminating infinite loops.
                </p>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={settings.executionTimeoutSeconds}
                  onChange={(e) => updateSetting('executionTimeoutSeconds', Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600 mt-2"
                />
              </div>

              {/* Plagiarism Similarity Threshold */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200 md:col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-xs text-slate-900 block">AST Plagiarism Similarity Threshold</span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Code pairs exceeding this similarity index trigger a flag on the integrity audit report.
                    </span>
                  </div>
                  <span className="text-sm font-black text-rose-700 bg-rose-50 px-3 py-1 rounded-xl border border-rose-200 font-mono">
                    {settings.plagiarismThreshold}% Match
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="95"
                  step="5"
                  value={settings.plagiarismThreshold}
                  onChange={(e) => updateSetting('plagiarismThreshold', Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600 mt-2"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Section 2: AI Sentinel Sensitivity ─────────────────────── */}
      {activeTab === 'sentinel' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Anti-Cheating Computer Vision Sensitivity</h3>
              <p className="text-xs text-slate-500 font-medium">
                Adjust tolerances for multi-person intrusion, tab departures, and camera refresh cadences.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Multiple Faces Detection Sensitivity */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-900">Multiple Face Infiltration</span>
                  <span className="text-[10px] font-bold uppercase text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    {settings.multipleFacesTolerance} Strictness
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Sensitivity of bounding box detections when extra individuals enter the webcam view.
                </p>
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {['high', 'medium', 'low'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => updateSetting('multipleFacesTolerance', lvl)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold capitalize transition border ${
                        settings.multipleFacesTolerance === lvl
                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Switch Grace Limit */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-900">Max Permitted Tab Switches</span>
                  <span className="text-xs font-black text-slate-900 bg-white px-2.5 py-0.5 rounded border border-slate-200 font-mono">
                    {settings.tabSwitchLimit} Switches
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Exceeding this count marks attempt as a critical infraction and advises cancellation.
                </p>
                <div className="grid grid-cols-4 gap-2 pt-2">
                  {[1, 2, 3, 5].map((lim) => (
                    <button
                      key={lim}
                      type="button"
                      onClick={() => updateSetting('tabSwitchLimit', lim)}
                      className={`py-2 rounded-xl text-xs font-bold transition border ${
                        settings.tabSwitchLimit === lim
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {lim === 1 ? '1 (Zero)' : lim}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gaze & Head Turn Tolerance */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-900">Gaze Deviation Grace Period</span>
                  <span className="text-xs font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-mono">
                    {settings.gazeDeviationSeconds}s Continuous
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Flag candidate only when head/eyes remain averted continuously past this duration.
                </p>
                <input
                  type="range"
                  min="2"
                  max="12"
                  step="1"
                  value={settings.gazeDeviationSeconds}
                  onChange={(e) => updateSetting('gazeDeviationSeconds', Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600 mt-2"
                />
              </div>

              {/* Camera Snapshot Sampling Frequency */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-900">Snapshot Thumbnail Frequency</span>
                  <span className="text-xs font-black text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200 font-mono">
                    Every {settings.snapshotIntervalSeconds}s
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Cadence at which client webcam frames are synced to the proctoring roster grid.
                </p>
                <input
                  type="range"
                  min="2"
                  max="15"
                  step="1"
                  value={settings.snapshotIntervalSeconds}
                  onChange={(e) => updateSetting('snapshotIntervalSeconds', Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600 mt-2"
                />
              </div>

              {/* Camera Feed Mirror Toggle */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-xs text-slate-900 block">Mirror Camera Video Feeds</span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Horizontally mirrors examinee webcam previews for intuitive spatial orientation.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => updateSetting('mirrorCameraFeed', !settings.mirrorCameraFeed)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                    settings.mirrorCameraFeed ? 'bg-brand-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-300 ${
                      settings.mirrorCameraFeed ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  ></div>
                </button>
              </div>

              {/* Auto-Lock Violation Toggle */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-xs text-slate-900 block">Auto-Lock on Critical Violation</span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Immediately freeze examinee exam terminal if high-risk mobile or tab breach occurs.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => updateSetting('autoLockOnCriticalViolation', !settings.autoLockOnCriticalViolation)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                    settings.autoLockOnCriticalViolation ? 'bg-rose-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-300 ${
                      settings.autoLockOnCriticalViolation ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  ></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Section 3: Alerts & Chimes ─────────────────────────────── */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Audio Alarms & Event Dispatch</h3>
              <p className="text-xs text-slate-500 font-medium">
                Configure real-time workstation audio chimes and automated email digests.
              </p>
            </div>

            <div className="space-y-4">
              {/* Web Audio Chime Toggle & Volume */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-brand-50 text-brand-700">
                      <Volume2 className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="font-extrabold text-xs text-slate-900 block">Workstation Incident Chime</span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Plays a synthesized two-tone chime when an examinee triggers a high-severity infraction.
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => updateSetting('audioChimeOnIncident', !settings.audioChimeOnIncident)}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                      settings.audioChimeOnIncident ? 'bg-brand-600' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-300 ${
                        settings.audioChimeOnIncident ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    ></div>
                  </button>
                </div>

                {settings.audioChimeOnIncident && (
                  <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                        <span>Chime Volume</span>
                        <span>{settings.audioChimeVolume}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={settings.audioChimeVolume}
                        onChange={(e) => updateSetting('audioChimeVolume', Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleTestChime}
                      className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Test Sound</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Email Notifications */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-xs text-slate-900 block">Critical Infraction Email Alerts</span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Send immediate email alerts when multi-device or prolonged absence breaches occur.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => updateSetting('emailOnCriticalIncident', !settings.emailOnCriticalIncident)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                    settings.emailOnCriticalIncident ? 'bg-brand-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-300 ${
                      settings.emailOnCriticalIncident ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  ></div>
                </button>
              </div>

              {/* Slot Completion PDF Digest */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-xs text-slate-900 block">Automated Slot Completion PDF Digest</span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Email an executive summary PDF of class performance as soon as the active slot ends.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => updateSetting('emailOnSlotCompletion', !settings.emailOnSlotCompletion)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                    settings.emailOnSlotCompletion ? 'bg-brand-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-300 ${
                      settings.emailOnSlotCompletion ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  ></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Section 4: Academic Profile ────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Faculty Academic Credentials</h3>
              <p className="text-xs text-slate-500 font-medium">
                Information stamped onto official grade registers, student briefing screens, and PDF reports.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-800 font-bold mb-1">Academic Title & Name</label>
                <input
                  type="text"
                  value={user?.name ? `${settings.title} ${user.name}` : `${settings.title} Alan Turing`}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-semibold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">Official Faculty Email</label>
                <input
                  type="text"
                  value={user?.email || 'turing@eduproctor.ai'}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-semibold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">Assigned Department</label>
                <select
                  value={settings.department}
                  onChange={(e) => updateSetting('department', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-brand-500"
                >
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Artificial Intelligence & Data Science">Artificial Intelligence & Data Science</option>
                  <option value="Electrical & Electronics Engineering">Electrical & Electronics Engineering</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">Office Room & Consultation Hours</label>
                <input
                  type="text"
                  value={settings.officeHours}
                  onChange={(e) => updateSetting('officeHours', e.target.value)}
                  placeholder="e.g. Hall 4, Room 204 | Mon & Wed 2-4 PM"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-800 font-bold mb-1">Faculty Academic Bio / Research Focus</label>
                <textarea
                  rows={3}
                  value={settings.bio}
                  onChange={(e) => updateSetting('bio', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-brand-500 leading-relaxed"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
