import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';
import {
  Sliders,
  Code2,
  ShieldCheck,
  Bell,
  Lock,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Sparkles,
  Eye,
  EyeOff,
  Monitor,
  Laptop,
  Check,
  VolumeX,
  Play,
  KeyRound,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Default user settings structure
const DEFAULT_SETTINGS = {
  // 1. Code Editor Defaults
  editorTheme: 'vs-dark', // 'vs-dark' | 'one-dark' | 'monokai' | 'light'
  fontFamily: 'JetBrains Mono',
  fontSize: '14',
  tabSize: '4',
  autoCloseBrackets: true,
  minimap: true,
  formatOnSave: true,
  autocomplete: true,

  // 2. Proctoring & Sensory
  audioAlerts: true,
  chimeVolume: 75,
  cameraGuideOverlay: true,
  preExamCalibrationPrompt: true,
  noiseSuppressionLevel: 'Medium', // 'Low' | 'Medium' | 'High'
  tabSwitchTolerance: 'Strict',

  // 3. Notification Channels
  emailExam24h: true,
  emailExam1h: true,
  emailResultsPublished: true,
  competitionMedalAlerts: true,
  dailyStreakReminder: false,
};

export default function StudentSettingsPage() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('editor'); // 'editor' | 'proctor' | 'notifications' | 'security'
  
  // Settings loaded from localStorage with default fallbacks
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('eduproctor_student_settings');
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_SETTINGS;
  });

  const [savedNotification, setSavedNotification] = useState(false);

  // Password change state
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdStatus, setPwdStatus] = useState({ loading: false, success: '', error: '' });
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });

  // Play test audio chime using native Web Audio API
  const playTestChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5

      const vol = (settings.chimeVolume / 100) * 0.3;
      gain.gain.setValueAtTime(vol, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (err) {
      console.warn('AudioContext not supported or blocked:', err);
    }
  };

  const handleToggle = (key) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      saveToStorage(updated);
      return updated;
    });
  };

  const handleSelect = (key, value) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      saveToStorage(updated);
      return updated;
    });
  };

  const saveToStorage = (newSettings) => {
    try {
      localStorage.setItem('eduproctor_student_settings', JSON.stringify(newSettings));
      setSavedNotification(true);
      setTimeout(() => setSavedNotification(false), 2000);
    } catch (e) {}
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all preferences to factory defaults?')) {
      setSettings(DEFAULT_SETTINGS);
      saveToStorage(DEFAULT_SETTINGS);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdStatus({ loading: true, success: '', error: '' });

    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdStatus({ loading: false, success: '', error: 'New passwords do not match' });
      return;
    }
    if (pwdForm.newPassword.length < 6) {
      setPwdStatus({ loading: false, success: '', error: 'New password must be at least 6 characters long' });
      return;
    }

    try {
      const res = await authApi.changePassword({
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword
      });
      if (res.success) {
        setPwdStatus({ loading: false, success: 'Password changed successfully!', error: '' });
        setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPwdStatus({ loading: false, success: '', error: res.message || 'Failed to change password' });
      }
    } catch (err) {
      setPwdStatus({ loading: false, success: '', error: err.message || 'Server error occurred' });
    }
  };

  const navItems = [
    { id: 'editor', label: 'Code Editor & IDE', icon: Code2, desc: 'Syntax theme, fonts, formatting' },
    { id: 'proctor', label: 'AI Proctoring & Sensors', icon: ShieldCheck, desc: 'Audio alerts, camera guides, baseline' },
    { id: 'notifications', label: 'Alerts & Reminders', icon: Bell, desc: 'Exam notifications, medals, results' },
    { id: 'security', label: 'Security & Sessions', icon: Lock, desc: 'Password change, active sessions' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in duration-300">
      
      {/* ── Top Header Banner ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-500/10 text-brand-600">
              <Sliders className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Preferences & Settings</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Customize your exam sandbox, code editor theme, AI proctoring alarms, and notification channels.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedNotification && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5 animate-in fade-in">
              <Check className="h-3.5 w-3.5" /> Synced to Browser
            </span>
          )}
          <button
            onClick={handleResetDefaults}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 transition flex items-center gap-1.5"
            title="Restore Defaults"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
            Reset Defaults
          </button>
        </div>
      </div>

      {/* ── Main Layout: Sidebar Nav + Content Canvas ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Navigation Column (4 cols) */}
        <div className="lg:col-span-4 space-y-2 bg-white rounded-2xl border border-slate-200 p-3 shadow-sm">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full text-left p-3.5 rounded-xl transition flex items-start gap-3.5 ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className={`p-2 rounded-lg mt-0.5 ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-900'}`}>
                    {item.label}
                  </h3>
                  <p className={`text-[11px] mt-0.5 ${isActive ? 'text-brand-100' : 'text-slate-400'}`}>
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">

          {/* ════════════ 1. CODE EDITOR & IDE SETTINGS ════════════ */}
          {activeSection === 'editor' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-8 animate-in fade-in">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-brand-600" />
                  Code Sandbox & Editor Defaults
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure Monaco code editor themes and typography used across all coding exam challenges.
                </p>
              </div>

              {/* Theme Picker */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 block">Editor Color Theme</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'vs-dark', name: 'VS Code Dark', bg: '#1e1e1e', fg: '#9cdcfe', tag: 'Dark+' },
                    { id: 'one-dark', name: 'One Dark Pro', bg: '#282c34', fg: '#61afef', tag: 'Atom' },
                    { id: 'monokai', name: 'Monokai', bg: '#272822', fg: '#a6e22e', tag: 'Vibrant' },
                    { id: 'light', name: 'GitHub Light', bg: '#ffffff', fg: '#0969da', tag: 'Light' }
                  ].map((t) => {
                    const isSelected = settings.editorTheme === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => handleSelect('editorTheme', t.id)}
                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between h-24 ${
                          isSelected
                            ? 'border-brand-600 ring-2 ring-brand-500/20 shadow-md'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                        }`}
                        style={{ backgroundColor: isSelected ? undefined : '#f8fafc' }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                            {t.tag}
                          </span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-brand-600" />}
                        </div>
                        <div className="p-2 rounded border" style={{ backgroundColor: t.bg, borderColor: '#cbd5e1' }}>
                          <span className="text-[10px] font-mono font-bold block" style={{ color: t.fg }}>
                            def solve():
                          </span>
                        </div>
                        <span className="text-xs font-bold text-slate-800 truncate">{t.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Typography: Font Family, Size, Tab Size */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Font Family</label>
                  <select
                    value={settings.fontFamily}
                    onChange={(e) => handleSelect('fontFamily', e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-white"
                  >
                    <option value="JetBrains Mono">JetBrains Mono</option>
                    <option value="Fira Code">Fira Code</option>
                    <option value="Source Code Pro">Source Code Pro</option>
                    <option value="Consolas">Consolas</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Font Size</label>
                  <select
                    value={settings.fontSize}
                    onChange={(e) => handleSelect('fontSize', e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-white"
                  >
                    <option value="12">12px (Compact)</option>
                    <option value="13">13px (Default)</option>
                    <option value="14">14px (Recommended)</option>
                    <option value="16">16px (Large)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Tab Indentation</label>
                  <select
                    value={settings.tabSize}
                    onChange={(e) => handleSelect('tabSize', e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-white"
                  >
                    <option value="2">2 Spaces</option>
                    <option value="4">4 Spaces (Standard)</option>
                  </select>
                </div>
              </div>

              {/* IDE Feature Toggles */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 block">Editor Assistance Toggles</label>
                
                {[
                  { key: 'autoCloseBrackets', title: 'Auto-Close Brackets & Quotes', desc: 'Automatically insert matching pair for (), {}, [], and strings' },
                  { key: 'autocomplete', title: 'IntelliSense Code Auto-Completion', desc: 'Show syntax hints, function prototypes, and standard library completions' },
                  { key: 'minimap', title: 'Display Code Minimap', desc: 'Render miniature code outline on the right side of the editor' },
                  { key: 'formatOnSave', title: 'Auto-Format On Run / Autosave', desc: 'Indent and clean whitespace automatically before submitting test cases' }
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/70">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{item.title}</p>
                      <p className="text-[11px] text-slate-500">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => handleToggle(item.key)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                        settings[item.key] ? 'bg-brand-600 justify-end' : 'bg-slate-300 justify-start'
                      }`}
                    >
                      <span className="bg-white w-4 h-4 rounded-full shadow-md"></span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════ 2. AI PROCTORING & SENSORS ════════════════ */}
          {activeSection === 'proctor' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-8 animate-in fade-in">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  AI Vision & Proctoring Calibration
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure sensor tolerances, audio warning chimes, and pre-test calibration guidance.
                </p>
              </div>

              {/* Audio Chime with Live Test */}
              <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Volume2 className="h-5 w-5 text-brand-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Audio Warning Chime</p>
                      <p className="text-[11px] text-slate-500">Play a discrete audio ping when gaze drifts or on exam timer warnings</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle('audioAlerts')}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      settings.audioAlerts ? 'bg-brand-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <span className="bg-white w-4 h-4 rounded-full shadow-md"></span>
                  </button>
                </div>

                {settings.audioAlerts && (
                  <div className="pt-3 border-t border-indigo-100/60 flex items-center justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-bold text-slate-600">Volume</span>
                        <span className="font-mono text-slate-500">{settings.chimeVolume}%</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        value={settings.chimeVolume}
                        onChange={(e) => handleSelect('chimeVolume', Number(e.target.value))}
                        className="w-full accent-brand-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>
                    <button
                      onClick={playTestChime}
                      className="px-3 py-1.5 rounded-xl bg-white border border-brand-200 hover:bg-brand-50 text-brand-700 text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                    >
                      <Play className="h-3 w-3 fill-brand-600 text-brand-600" />
                      Test Sound
                    </button>
                  </div>
                )}
              </div>

              {/* Camera & Vision Options */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 block">Vision Guidance & Calibration</label>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/70">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Face Alignment Bounding Box Overlay</p>
                    <p className="text-[11px] text-slate-500">Show subtle green/amber boundary box over camera feed during test</p>
                  </div>
                  <button
                    onClick={() => handleToggle('cameraGuideOverlay')}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      settings.cameraGuideOverlay ? 'bg-brand-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <span className="bg-white w-4 h-4 rounded-full shadow-md"></span>
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/70">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Pre-Exam Auto-Calibration Prompt</p>
                    <p className="text-[11px] text-slate-500">Require 3-second face centering check before questions unlock</p>
                  </div>
                  <button
                    onClick={() => handleToggle('preExamCalibrationPrompt')}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      settings.preExamCalibrationPrompt ? 'bg-brand-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <span className="bg-white w-4 h-4 rounded-full shadow-md"></span>
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/70">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Microphone Ambient Noise Filter</p>
                    <p className="text-[11px] text-slate-500">Suppresses fan humming and room echo in acoustic proctor audits</p>
                  </div>
                  <select
                    value={settings.noiseSuppressionLevel}
                    onChange={(e) => handleSelect('noiseSuppressionLevel', e.target.value)}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium (Recommended)</option>
                    <option value="High">Aggressive</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ════════════ 3. NOTIFICATIONS & ALERTS ═════════════════ */}
          {activeSection === 'notifications' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Bell className="h-5 w-5 text-amber-500" />
                  Alert Channels & Examination Reminders
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select which notifications are delivered to your institutional email: <span className="font-semibold text-slate-700">{user?.email}</span>
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'emailExam24h', title: 'Upcoming Exam Alert (24 Hours Prior)', desc: 'Notification with exam syllabus, duration, and question format overview' },
                  { key: 'emailExam1h', title: '1-Hour Countdown Notification', desc: 'Urgent reminder before examination slot opens and check-in unlocks' },
                  { key: 'emailResultsPublished', title: 'Results & Integrity Audit Published', desc: 'Detailed report with test case accuracy, marks obtained, and trust score' },
                  { key: 'competitionMedalAlerts', title: 'Competition Medal & Honor Unlocks', desc: 'Instant email alert when you win Fastest Solver, Platinum Champion, or Code Optimizer' },
                  { key: 'dailyStreakReminder', title: 'Daily Coding Streak Reminder', desc: 'Gentle nudge to maintain your active practice streak in the arena' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/70">
                    <div className="pr-4">
                      <p className="text-xs font-bold text-slate-800">{item.title}</p>
                      <p className="text-[11px] text-slate-500">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => handleToggle(item.key)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors flex-shrink-0 ${
                        settings[item.key] ? 'bg-brand-600 justify-end' : 'bg-slate-300 justify-start'
                      }`}
                    >
                      <span className="bg-white w-4 h-4 rounded-full shadow-md"></span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════ 4. SECURITY & SESSIONS ═══════════════════ */}
          {activeSection === 'security' && (
            <div className="space-y-6 animate-in fade-in">
              
              {/* Change Password Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-indigo-600" />
                    Change Examination Password
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Your password protects your academic record, exam submissions, and biometric integrity passport.
                  </p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
                  {pwdStatus.error && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{pwdStatus.error}</span>
                    </div>
                  )}
                  {pwdStatus.success && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>{pwdStatus.success}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPwd.current ? 'text' : 'password'}
                        required
                        value={pwdForm.currentPassword}
                        onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                        placeholder="••••••••"
                        className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd(p => ({ ...p, current: !p.current }))}
                        className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPwd.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">New Password</label>
                    <div className="relative">
                      <input
                        type={showPwd.new ? 'text' : 'password'}
                        required
                        value={pwdForm.newPassword}
                        onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                        placeholder="At least 6 characters"
                        className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd(p => ({ ...p, new: !p.new }))}
                        className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPwd.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showPwd.confirm ? 'text' : 'password'}
                        required
                        value={pwdForm.confirmPassword}
                        onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                        placeholder="Repeat new password"
                        className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd(p => ({ ...p, confirm: !p.confirm }))}
                        className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPwd.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={pwdStatus.loading}
                    className="py-2.5 px-5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
                  >
                    {pwdStatus.loading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>

              {/* Active Device Session */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Current Login Session</h3>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
                      <Laptop className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">Windows PC &bull; Chrome Browser</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">THIS DEVICE</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">EduProctor v2.6 Shield &bull; Active JWT Session</p>
                    </div>
                  </div>
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

    </div>
  );
}
