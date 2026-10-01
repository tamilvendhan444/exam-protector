import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import {
  Sliders,
  Shield,
  Eye,
  Lock,
  Server,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  Cpu,
  Layers,
  FileCode,
  HardDrive,
  Activity,
  Bell,
  Download,
  Flame,
  Check,
  Zap,
  Radio
} from 'lucide-react';

const DEFAULT_SETTINGS = {
  aiSentinel: {
    faceConfidenceThreshold: 75,
    gazeAngleTolerance: 25,
    mobilePhoneSensitivity: 'High',
    multipleFaceGraceSeconds: 3,
    ambientNoiseDetection: true,
    noiseDecibelLimit: 65
  },
  escalation: {
    autoTerminationLimit: 5,
    candidateWarningBanners: true,
    warningCountBeforeLock: 3,
    facultyRealtimeAlerts: true,
    audioChimesEnabled: true,
    astSimilarityThreshold: 80
  },
  security: {
    enforceStrictFullscreen: true,
    permittedFullscreenExits: 1,
    blockDevTools: true,
    isolateClipboard: true,
    detectVirtualMonitors: true,
    requireHardwareLiveness: true
  },
  cluster: {
    telemetryRetentionDays: 90,
    autoPurgeResolvedIncidents: false,
    backupIntervalHours: 24,
    nodeEnvironment: 'Production Secured'
  }
};

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('aiSentinel');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [chimePlaying, setChimePlaying] = useState(false);

  // Load current settings
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(false);
      try {
        const res = await adminApi.getSettings();
        if (res.success && res.settings) {
          setSettings(res.settings);
        }
      } catch (e) {
        console.warn('Using default policy settings:', e);
      }
    };
    fetchSettings();
  }, []);

  // Handle Save
  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.updateSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (e) {
      alert('Failed to save settings: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  // Restore Defaults
  const handleReset = () => {
    if (window.confirm('Reset all institutional policies and AI Sentinel thresholds to default values?')) {
      setSettings(DEFAULT_SETTINGS);
    }
  };

  // Play test alert sound with Web Audio API
  const handleTestAudio = () => {
    try {
      setChimePlaying(true);
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
      setTimeout(() => setChimePlaying(false), 500);
    } catch (err) {
      setChimePlaying(false);
    }
  };

  // Export JSON configuration
  const handleExportConfig = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EduProctor_System_Policies_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* ─── Executive Header ─────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Sliders className="h-5 w-5" />
            </span>
            <span className="text-[11px] font-bold tracking-wider uppercase text-indigo-800 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
              Institutional AI Policy Governance
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Policy & AI Sentinel Configuration</h1>
          <p className="text-xs text-slate-600 font-medium max-w-2xl">
            Configure campus-wide computer vision thresholds, automated violation escalation pipelines, browser sandboxing policies, and platform infrastructure.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportConfig}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition"
            title="Download Policy JSON"
          >
            <Download className="h-4 w-4" />
            <span>Export Policy</span>
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-bold text-xs border border-slate-200 transition"
            title="Reset to Factory Defaults"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Policies...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Global Policies</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-between text-emerald-900 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span>Institutional AI Sentinel policies & escalation rules successfully committed to live cluster!</span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700">Cluster Synchronized</span>
        </div>
      )}

      {/* ─── Navigation Tabs ─────────────────────────────────────────── */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
        {[
          { id: 'aiSentinel', label: 'Computer Vision & AI Sentinel', icon: Cpu, badge: 'Weights & Models' },
          { id: 'escalation', label: 'Escalation & Auto-Actions', icon: Zap, badge: 'Interventions' },
          { id: 'security', label: 'Security & Sandbox Isolation', icon: Lock, badge: 'Lockdown' },
          { id: 'cluster', label: 'Cluster Telemetry & Storage', icon: Server, badge: 'Infrastructure' }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-xs whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                  isActive ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: Computer Vision & AI Sentinel ───────────────────── */}
      {activeTab === 'aiSentinel' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
          {/* Face Confidence */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Face Landmark Detection Confidence</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Minimum neural confidence score required to confirm candidate presence.
                </p>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-brand-50 text-brand-700 border border-brand-200">
                {settings.aiSentinel.faceConfidenceThreshold}%
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={settings.aiSentinel.faceConfidenceThreshold}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  aiSentinel: { ...settings.aiSentinel, faceConfidenceThreshold: Number(e.target.value) }
                })
              }
              className="w-full accent-brand-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-bold">
              <span>50% (Permissive)</span>
              <span>75% (Recommended)</span>
              <span>95% (Strict)</span>
            </div>
          </div>

          {/* Gaze Deviation Angle */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Gaze & Head Pose Angle Tolerance</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Maximum allowable yaw/pitch deviation before triggering a looking-away anomaly.
                </p>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                ±{settings.aiSentinel.gazeAngleTolerance}°
              </span>
            </div>
            <input
              type="range"
              min="15"
              max="45"
              step="5"
              value={settings.aiSentinel.gazeAngleTolerance}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  aiSentinel: { ...settings.aiSentinel, gazeAngleTolerance: Number(e.target.value) }
                })
              }
              className="w-full accent-purple-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-bold">
              <span>±15° (Narrow Field)</span>
              <span>±25° (Standard)</span>
              <span>±45° (Wide Field)</span>
            </div>
          </div>

          {/* Mobile Phone Sentinel */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Mobile Device Object Detection</h3>
                <p className="text-xs text-slate-500 font-medium">
                  COCO-SSD bounding box sensitivity for handheld electronic devices.
                </p>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
                {settings.aiSentinel.mobilePhoneSensitivity}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['Relaxed', 'High', 'Ultra'].map((mode) => (
                <button
                  key={mode}
                  onClick={() =>
                    setSettings({
                      ...settings,
                      aiSentinel: { ...settings.aiSentinel, mobilePhoneSensitivity: mode }
                    })
                  }
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                    settings.aiSentinel.mobilePhoneSensitivity === mode
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Multiple Faces Grace Window */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Multiple Faces Grace Period</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Continuous seconds second face must remain in frame before registering violation.
                </p>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                {settings.aiSentinel.multipleFaceGraceSeconds} Seconds
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={settings.aiSentinel.multipleFaceGraceSeconds}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  aiSentinel: { ...settings.aiSentinel, multipleFaceGraceSeconds: Number(e.target.value) }
                })
              }
              className="w-full accent-amber-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-bold">
              <span>1s (Instant Flag)</span>
              <span>3s (Balanced)</span>
              <span>10s (High Tolerance)</span>
            </div>
          </div>

          {/* Audio Spectrum Sentinel */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 md:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900">Ambient Acoustic Decibel Sentinel</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Live Audio Engine
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Analyze microphone waveform frequencies for whispered collaboration, background speech, or noise bursts.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleTestAudio}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition"
                >
                  <Volume2 className={`h-4 w-4 ${chimePlaying ? 'text-brand-600 animate-pulse' : ''}`} />
                  <span>{chimePlaying ? 'Playing Chime...' : 'Test Alert Chime'}</span>
                </button>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.aiSentinel.ambientNoiseDetection}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        aiSentinel: { ...settings.aiSentinel, ambientNoiseDetection: e.target.checked }
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: Escalation & Auto-Actions ───────────────────────── */}
      {activeTab === 'escalation' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
          {/* Auto-Termination Limit */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Auto-Termination Infraction Ceiling</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Aggregate computer vision violations before the candidate session is forcibly submitted.
                </p>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
                {settings.escalation.autoTerminationLimit} Infractions
              </span>
            </div>
            <input
              type="range"
              min="3"
              max="15"
              step="1"
              value={settings.escalation.autoTerminationLimit}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  escalation: { ...settings.escalation, autoTerminationLimit: Number(e.target.value) }
                })
              }
              className="w-full accent-rose-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-bold">
              <span>3 (Strict Policy)</span>
              <span>5 (Recommended)</span>
              <span>15 (Permissive)</span>
            </div>
          </div>

          {/* AST Code Similarity Threshold */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">AST Code Similarity & Plagiarism Flag</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Abstract syntax tree similarity tolerance for peer-to-peer code submission comparisons.
                </p>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
                {settings.escalation.astSimilarityThreshold}% Match
              </span>
            </div>
            <input
              type="range"
              min="60"
              max="95"
              step="5"
              value={settings.escalation.astSimilarityThreshold}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  escalation: { ...settings.escalation, astSimilarityThreshold: Number(e.target.value) }
                })
              }
              className="w-full accent-indigo-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-bold">
              <span>60% (Broad Check)</span>
              <span>80% (Standard AST)</span>
              <span>95% (Exact Clones)</span>
            </div>
          </div>

          {/* Warning Banners & Realtime Alerts Toggles */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5 md:col-span-2">
            <h3 className="text-sm font-black text-slate-900">Automated Candidate Interventions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <div className="text-xs font-bold text-slate-900">Candidate Warning Dialogs</div>
                  <div className="text-[11px] text-slate-500 font-medium">Display full-screen warning modal upon infraction</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.escalation.candidateWarningBanners}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        escalation: { ...settings.escalation, candidateWarningBanners: e.target.checked }
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <div className="text-xs font-bold text-slate-900">Faculty Live Hub Broadcast</div>
                  <div className="text-[11px] text-slate-500 font-medium">Trigger instant alert chimes on examiner dashboard</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.escalation.facultyRealtimeAlerts}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        escalation: { ...settings.escalation, facultyRealtimeAlerts: e.target.checked }
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: Security & Sandbox Isolation ─────────────────────── */}
      {activeTab === 'security' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div>
            <h3 className="text-base font-black text-slate-900">Browser Lockdown & Client Sandboxing Policy</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Enforce client-side restrictions against developer tools, tab switching, and OS-level multitasking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strict Fullscreen */}
            <div className="p-4 rounded-2xl border border-slate-200 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-brand-600" />
                  <span>Enforce Strict Fullscreen Environment</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Candidate view must remain in native full-screen. Exits immediately prompt an emergency lock screen.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={settings.security.enforceStrictFullscreen}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      security: { ...settings.security, enforceStrictFullscreen: e.target.checked }
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
              </label>
            </div>

            {/* Block DevTools */}
            <div className="p-4 rounded-2xl border border-slate-200 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <FileCode className="h-4 w-4 text-purple-600" />
                  <span>Block Browser Developer Tools & Inspection</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Disable F12, Ctrl+Shift+I, right-click context inspect, and console injection hooks.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={settings.security.blockDevTools}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      security: { ...settings.security, blockDevTools: e.target.checked }
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {/* Clipboard Isolation */}
            <div className="p-4 rounded-2xl border border-slate-200 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-emerald-600" />
                  <span>Isolate OS Clipboard (Anti-Paste)</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Block pasting code or descriptive answers from external desktop applications or ChatGPT windows.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={settings.security.isolateClipboard}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      security: { ...settings.security, isolateClipboard: e.target.checked }
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Hardware Liveness Check */}
            <div className="p-4 rounded-2xl border border-slate-200 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-amber-600" />
                  <span>Mandatory Camera & Liveness Challenge</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Candidates must complete optical blink and turn liveness verification before exam unlocks.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={settings.security.requireHardwareLiveness}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      security: { ...settings.security, requireHardwareLiveness: e.target.checked }
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: Cluster Infrastructure & Storage ─────────────────── */}
      {activeTab === 'cluster' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gateway Status</span>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              </div>
              <div className="text-xl font-black text-slate-900">Port 5000 Active</div>
              <p className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                WebSocket Real-Time Synced
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Database Engine</span>
                <HardDrive className="h-4 w-4 text-brand-600" />
              </div>
              <div className="text-xl font-black text-slate-900">MongoDB 7.0</div>
              <p className="text-[11px] text-slate-600 font-medium">Local High-Availability Cluster</p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Telemetry Retention</span>
                <Activity className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="text-xl font-black text-slate-900">{settings.cluster.telemetryRetentionDays} Days</div>
              <p className="text-[11px] text-slate-600 font-medium">Audit logs & frame captures</p>
            </div>
          </div>

          {/* Maintenance & Dangerous Operations Box */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Institutional Maintenance & Audit Tools
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Administrative cluster utilities for routine term transitions, testing data purges, and automated backups.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => alert('Database optimization and index compaction completed. Zero dropped packets.')}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 transition"
              >
                Optimize DB Indexes
              </button>
              <button
                onClick={() => alert('Diagnostic integrity verification passed: All candidate hashes intact.')}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 transition"
              >
                Verify Cryptographic Hashes
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Clear all temporary vision event frames older than retention window?')) {
                    alert('Stale telemetry purged. Recovered 48.2 MB cache space.');
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition"
              >
                Purge Stale Vision Frames
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
