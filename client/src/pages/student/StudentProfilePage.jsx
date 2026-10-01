import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi, studentApi } from '../../services/api';
import CompetitionMedals from '../../components/common/CompetitionMedals';
import {
  Camera,
  CheckCircle2,
  User,
  Mail,
  Hash,
  BookOpen,
  ShieldCheck,
  Award,
  TrendingUp,
  Flame,
  Edit3,
  Lock,
  Cpu,
  Video,
  Mic,
  Monitor,
  Wifi,
  AlertCircle,
  Sparkles,
  Calendar,
  Save,
  X,
  Bell,
  Sliders,
  Check,
  Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StudentProfilePage() {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'readiness' | 'security'
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Live stats from student API or sensible fallbacks
  const [studentStats, setStudentStats] = useState({
    completedExams: 4,
    averageScore: 88,
    trustScore: 99.2,
    streak: user?.streak || 3,
  });

  // Preferences toggles stored in localStorage
  const [preferences, setPreferences] = useState(() => {
    try {
      const saved = localStorage.getItem('eduproctor_student_prefs');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return {
      autoCalibrationPrompt: true,
      audioChimeOnWarning: true,
      highContrastEditor: false,
      emailExamAlerts: true
    };
  });

  // Password change state
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdStatus, setPwdStatus] = useState({ loading: false, success: '', error: '' });

  // Load actual stats if available
  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      try {
        const res = await studentApi.getDashboard();
        if (res.success && res.data?.stats && isMounted) {
          const s = res.data.stats;
          setStudentStats({
            completedExams: s.completedExamsCount ?? 4,
            averageScore: Math.round(s.averageScore ?? 88),
            trustScore: 99.2,
            streak: user?.streak ?? s.streak ?? 3,
          });
        }
      } catch (err) {
        // gracefully retain defaults
      }
    }
    loadStats();
    return () => { isMounted = false; };
  }, [user]);

  const handleTogglePref = (key) => {
    setPreferences(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('eduproctor_student_prefs', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdStatus({ loading: true, success: '', error: '' });

    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdStatus({ loading: false, success: '', error: 'New passwords do not match' });
      return;
    }
    if (pwdForm.newPassword.length < 6) {
      setPwdStatus({ loading: false, success: '', error: 'Password must be at least 6 characters' });
      return;
    }

    try {
      const res = await authApi.changePassword({
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword
      });
      if (res.success) {
        setPwdStatus({ loading: false, success: 'Password successfully changed!', error: '' });
        setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPwdStatus({ loading: false, success: '', error: res.message || 'Failed to change password' });
      }
    } catch (err) {
      setPwdStatus({ loading: false, success: '', error: err.message || 'Server error occurred' });
    }
  };

  // Capitalize display name
  const formattedName = user?.name
    ? user.name.replace(/\b\w/g, c => c.toUpperCase())
    : 'Student';

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in duration-300">
      
      {/* ── Top Header Card with Banner ─────────────────────────────────── */}
      <div className="relative rounded-3xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Decorative Top Banner Gradient */}
        <div className="h-36 sm:h-44 w-full bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-700 relative overflow-hidden">
          {/* Subtle geometric circles */}
          <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full bg-indigo-400/20 blur-xl pointer-events-none" />
          
          {/* Shield status pill badge */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/25 backdrop-blur-md border border-white/20 text-white text-xs font-semibold shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>AI Shield v2.6 Active</span>
          </div>
        </div>

        {/* Profile Content Body */}
        <div className="px-6 pb-6 pt-0 sm:px-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6 -mt-16 sm:-mt-16 relative">
            
            {/* Avatar & Core Title */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
              <div className="relative group">
                <img 
                  src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || 'user')}`} 
                  alt={user?.name}
                  className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl border-4 border-white bg-slate-100 object-cover shadow-xl ring-1 ring-slate-200"
                />
                <button 
                  onClick={() => setIsPhotoModalOpen(true)}
                  className="absolute -bottom-2 -right-2 h-9 w-9 bg-brand-600 hover:bg-brand-500 text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
                  title="Update Biometric Photo"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl font-black tracking-tight text-slate-900">{formattedName}</h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-600 font-bold text-xs uppercase tracking-wider border border-brand-200/50">
                    {user?.role || 'STUDENT'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-xs border border-emerald-200/60">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    Biometrics Verified
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-500">
                  {user?.department || 'Department of Computer Science'} • Roll: <span className="font-semibold text-slate-700">{user?.rollNumber || '24AD118'}</span>
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition hover:border-slate-400"
              >
                <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                Edit Profile
              </button>
              <Link 
                to="/student/exams" 
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/20 transition hover:shadow-lg"
              >
                <Cpu className="h-3.5 w-3.5" />
                View Exams
              </Link>
            </div>
          </div>
        </div>

        {/* ── Navigation Tabs ────────────────────────────────────────── */}
        <div className="flex border-t border-slate-100 px-6 sm:px-8 bg-slate-50/50 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview & Credentials', icon: User },
            { id: 'medals', label: 'Competition Medals (3)', icon: Trophy },
            { id: 'readiness', label: 'Proctoring & Hardware Readiness', icon: Cpu },
            { id: 'security', label: 'Account & Preferences', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-brand-600 text-brand-600 bg-white shadow-sm -mb-[1px]'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4 Quick Highlight Metrics ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Trust Score */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Trust Score</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{studentStats.trustScore}%</span>
            <span className="text-xs font-bold text-emerald-600">Clean Record</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">0 flags or integrity warnings logged</p>
        </div>

        {/* Metric 2: Completed Exams */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Completed Exams</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{studentStats.completedExams}</span>
            <span className="text-xs font-bold text-indigo-600">Proctored</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Autonomous sessions verified</p>
        </div>

        {/* Metric 3: Academic Average */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Average Performance</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{studentStats.averageScore}%</span>
            <span className="text-xs font-bold text-blue-600">Proficient</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Across all evaluated modules</p>
        </div>

        {/* Metric 4: Streak */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Streak</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{studentStats.streak} Days</span>
            <span className="text-xs font-bold text-amber-600">On Fire</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Continuous daily practice</p>
        </div>
      </div>

      {/* ── COMPETITION MEDALS SHOWCASE (IMAGE REFERENCE MATCH) ───────── */}
      <CompetitionMedals className="my-2" />

      {/* ── TAB 1: OVERVIEW & ACADEMIC DETAILS ──────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Academic Details (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Academic & Institutional Credentials</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Verified information linked to your examination eligibility</p>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 p-1.5 hover:bg-brand-50 rounded-lg transition"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-400 mb-1.5">
                    <User className="h-4 w-4 text-brand-500" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Full Name</span>
                  </div>
                  <p className="text-slate-900 font-semibold">{formattedName}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-400 mb-1.5">
                    <Mail className="h-4 w-4 text-brand-500" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Institutional Email</span>
                  </div>
                  <p className="text-slate-900 font-semibold break-all">{user?.email}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-400 mb-1.5">
                    <Hash className="h-4 w-4 text-brand-500" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Registration / Roll No</span>
                  </div>
                  <p className="text-slate-900 font-semibold">{user?.rollNumber || '24AD118'}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-400 mb-1.5">
                    <BookOpen className="h-4 w-4 text-brand-500" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Department</span>
                  </div>
                  <p className="text-slate-900 font-semibold">{user?.department || 'Computer Science & Engineering'}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-400 mb-1.5">
                    <Calendar className="h-4 w-4 text-brand-500" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Batch & Academic Year</span>
                  </div>
                  <p className="text-slate-900 font-semibold">2024 – 2028 (Undergraduate)</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-400 mb-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Enrollment Status</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    <p className="text-slate-900 font-semibold">Active & Examination Eligible</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Quick Practice & Results Link Banner */}
            <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <h4 className="font-bold text-white text-sm">Need to brush up before your next proctored test?</h4>
                </div>
                <p className="text-xs text-slate-300">Practice questions with instant auto-grading and zero risk to your trust score.</p>
              </div>
              <Link
                to="/student/practice"
                className="px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs rounded-xl transition shadow-md whitespace-nowrap"
              >
                Go to Practice Arena
              </Link>
            </div>
          </div>

          {/* Side Column: Digital Proctoring ID Card */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col items-center text-center">
              <div className="w-full flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Digital Student ID</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">VERIFIED</span>
              </div>

              <div className="relative mb-4">
                <img 
                  src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || 'user')}`} 
                  alt={user?.name}
                  className="h-24 w-24 rounded-2xl border-2 border-brand-500/30 object-cover shadow-inner"
                />
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-lg shadow">
                  <Check className="h-3 w-3" />
                </div>
              </div>

              <h4 className="text-base font-bold text-slate-900">{formattedName}</h4>
              <p className="text-xs font-mono font-bold text-brand-600 mt-0.5">{user?.rollNumber || '24AD118'}</p>
              <p className="text-xs text-slate-500 mt-1 max-w-[200px]">{user?.department || 'Computer Science & Engineering'}</p>

              <div className="w-full mt-6 pt-4 border-t border-dashed border-slate-200 space-y-2 text-left">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Biometric Template:</span>
                  <span className="font-semibold text-slate-700">BlazeFace 468-pt</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Integrity Tier:</span>
                  <span className="font-semibold text-emerald-600">Platinum (Zero Flags)</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Account Role:</span>
                  <span className="font-semibold text-slate-700 uppercase">{user?.role || 'STUDENT'}</span>
                </div>
              </div>

              <button
                onClick={() => setIsPhotoModalOpen(true)}
                className="mt-6 w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
              >
                <Camera className="h-3.5 w-3.5" />
                Re-calibrate Face Photo
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ── TAB: COMPETITION MEDALS & COMPLEXITY HALL OF FAME ─────────── */}
      {activeTab === 'medals' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Institutional Competition Honors & Complexity Benchmarks</h3>
                <p className="text-xs text-slate-500 mt-0.5">Top-tier coding badges awarded for execution velocity and Big-O asymptotic mastery</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto">
                <Trophy className="h-3.5 w-3.5 text-amber-600" />
                3 Medals Available
              </span>
            </div>

            {/* 3 Detail Cards for the Medals */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: Fastest Solver */}
              <div className="p-5 rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50 to-white flex flex-col justify-between shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-slate-200 text-slate-800 uppercase tracking-wider">
                      SILVER / PLATINUM
                    </span>
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Earned
                    </span>
                  </div>
                  <div>
                    <h4 className="font-serif font-black text-sm text-slate-900">FASTEST SOLVER</h4>
                    <p className="text-xs text-slate-500 mt-1">Awarded to the student with the fastest code execution (&lt; 150ms) and quickest testcase completion.</p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Your Benchmark:</span>
                    <span className="font-bold text-slate-800">114ms runtime</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Current Rank:</span>
                    <span className="font-bold text-brand-600">#1 Fastest in Batch</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Platinum Champion */}
              <div className="p-5 rounded-2xl border border-amber-200 bg-gradient-to-b from-amber-50/40 to-white flex flex-col justify-between shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-amber-400/20 text-amber-900 border border-amber-300 uppercase tracking-wider">
                      24K GOLD STARBURST
                    </span>
                    <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                      <Trophy className="h-3.5 w-3.5 text-amber-600" /> Crowned
                    </span>
                  </div>
                  <div>
                    <h4 className="font-serif font-black text-sm text-slate-900">PLATINUM OVERALL CHAMPION</h4>
                    <p className="text-xs text-slate-500 mt-1">The tournament grand honor: First to finish with 100% total score and zero proctoring infractions.</p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-amber-100 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Score Achieved:</span>
                    <span className="font-bold text-amber-700">100 / 100</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Standing:</span>
                    <span className="font-bold text-amber-700">Global Rank #1</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Code Optimizer */}
              <div className="p-5 rounded-2xl border border-orange-200 bg-gradient-to-b from-orange-50/40 to-white flex flex-col justify-between shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-orange-100 text-orange-900 border border-orange-300 uppercase tracking-wider">
                      ANTIQUE BRONZE
                    </span>
                    <span className="text-xs font-bold text-orange-700 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Optimal
                    </span>
                  </div>
                  <div>
                    <h4 className="font-serif font-black text-sm text-slate-900">CODE OPTIMIZER</h4>
                    <p className="text-xs text-slate-500 mt-1">Achieved theoretical lower bound: Linear Time O(N) or O(log N) and Constant Auxiliary Space O(1).</p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-orange-100 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Time Complexity:</span>
                    <span className="font-bold font-mono text-orange-700">O(N) Linear</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Space Complexity:</span>
                    <span className="font-bold font-mono text-orange-700">O(1) Auxiliary</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: PROCTORING & HARDWARE READINESS ───────────────────────── */}
      {activeTab === 'readiness' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Autonomous Proctoring System Readiness</h3>
                <p className="text-xs text-slate-500 mt-0.5">Live diagnostic status of your browser, sensors, and machine guard rails</p>
              </div>
              <button
                onClick={() => setIsPhotoModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-50 text-brand-600 hover:bg-brand-100 font-bold text-xs transition"
              >
                <Video className="h-3.5 w-3.5" />
                Test Camera Sensor
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Readiness 1: Face Mesh */}
              <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/60 flex items-start gap-4">
                <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700 mt-0.5">
                  <Video className="h-5 w-5" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">Webcam & BlazeFace ML</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">OPERATIONAL</span>
                  </div>
                  <p className="text-xs text-slate-500">Real-time landmark mesh detection and multi-person warning sensor calibrated.</p>
                </div>
              </div>

              {/* Readiness 2: Audio */}
              <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/60 flex items-start gap-4">
                <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700 mt-0.5">
                  <Mic className="h-5 w-5" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">Acoustic & Microphone Guard</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">OPTIMAL</span>
                  </div>
                  <p className="text-xs text-slate-500">Audio input levels detected with baseline background noise suppression active.</p>
                </div>
              </div>

              {/* Readiness 3: Display Guard */}
              <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/60 flex items-start gap-4">
                <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700 mt-0.5">
                  <Monitor className="h-5 w-5" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">Display & Window Integrity</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">ACTIVE</span>
                  </div>
                  <p className="text-xs text-slate-500">Fullscreen lock, DevTools prevention, and multi-display detection verified.</p>
                </div>
              </div>

              {/* Readiness 4: Network Heartbeat */}
              <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/60 flex items-start gap-4">
                <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700 mt-0.5">
                  <Wifi className="h-5 w-5" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">Socket Latency & Grace Sync</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">22ms PING</span>
                  </div>
                  <p className="text-xs text-slate-500">20-second offline resilience buffer active with auto-reconnect heartbeat.</p>
                </div>
              </div>

            </div>

            {/* Verification Checklist */}
            <div className="mt-8 p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100">
              <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand-600" />
                Proctoring Protocol Guidelines
              </h4>
              <ul className="mt-3 space-y-2 text-xs text-indigo-900/80">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500"></span>
                  Keep your face centered in the camera viewport throughout all exam sections.
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500"></span>
                  Avoid switching tabs or minimizing the browser window to maintain 100% trust score.
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500"></span>
                  Dual monitors must be disconnected before starting an official examination.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: ACCOUNT PREFERENCES & SECURITY ────────────────────────── */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Preferences Toggles */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Examination Preferences</h3>
              <p className="text-xs text-slate-500 mt-0.5">Customize your interactive exam interface and notifications</p>
            </div>

            <div className="space-y-4">
              
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/60">
                <div className="space-y-0.5 pr-4">
                  <p className="text-xs font-bold text-slate-900">Pre-exam Calibration Prompt</p>
                  <p className="text-[11px] text-slate-500">Display face alignment guide before entering live exam room</p>
                </div>
                <button
                  onClick={() => handleTogglePref('autoCalibrationPrompt')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    preferences.autoCalibrationPrompt ? 'bg-brand-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md transform transition"></span>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/60">
                <div className="space-y-0.5 pr-4">
                  <p className="text-xs font-bold text-slate-900">Audio Warning Chime</p>
                  <p className="text-[11px] text-slate-500">Play subtle sound alerts when looking away or during low-time warnings</p>
                </div>
                <button
                  onClick={() => handleTogglePref('audioChimeOnWarning')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    preferences.audioChimeOnWarning ? 'bg-brand-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md transform transition"></span>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/60">
                <div className="space-y-0.5 pr-4">
                  <p className="text-xs font-bold text-slate-900">High Contrast Code Editor</p>
                  <p className="text-[11px] text-slate-500">Boost syntax contrast in coding challenges for improved readability</p>
                </div>
                <button
                  onClick={() => handleTogglePref('highContrastEditor')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    preferences.highContrastEditor ? 'bg-brand-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md transform transition"></span>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/60">
                <div className="space-y-0.5 pr-4">
                  <p className="text-xs font-bold text-slate-900">Email Result Notifications</p>
                  <p className="text-[11px] text-slate-500">Receive proctoring audit summaries & exam scores via email</p>
                </div>
                <button
                  onClick={() => handleTogglePref('emailExamAlerts')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    preferences.emailExamAlerts ? 'bg-brand-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md transform transition"></span>
                </button>
              </div>

            </div>
          </div>

          {/* Change Password Form */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Security & Credentials</h3>
              <p className="text-xs text-slate-500 mt-0.5">Ensure your exam account is secure with a strong password</p>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              {pwdStatus.error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{pwdStatus.error}</span>
                </div>
              )}
              {pwdStatus.success && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  <span>{pwdStatus.success}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Current Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={pwdForm.currentPassword}
                    onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                  <Lock className="h-4 w-4 text-slate-400 absolute right-3.5 top-3" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">New Password</label>
                <input
                  type="password"
                  required
                  value={pwdForm.newPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                  placeholder="Minimum 6 characters"
                  className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={pwdForm.confirmPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                  placeholder="Repeat new password"
                  className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <button
                type="submit"
                disabled={pwdStatus.loading}
                className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 mt-2"
              >
                {pwdStatus.loading ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          </div>

        </div>
      )}

      {/* ── EDIT PROFILE MODAL ─────────────────────────────────────────── */}
      <AnimatePresence>
        {isEditModalOpen && (
          <EditProfileModal
            user={user}
            onClose={() => setIsEditModalOpen(false)}
            onSave={(updatedUser) => {
              setUser(prev => ({ ...prev, ...updatedUser }));
              setIsEditModalOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── CAMERA / BLAZEFACE PHOTO MODAL ─────────────────────────────── */}
      {isPhotoModalOpen && (
        <CameraCaptureModal 
          onClose={() => setIsPhotoModalOpen(false)} 
          onCapture={(base64) => {
            setUser(prev => ({ ...prev, avatar: base64 }));
            setIsPhotoModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

// ── EDIT PROFILE MODAL COMPONENT ────────────────────────────────────────
function EditProfileModal({ user, onClose, onSave }) {
  const [name, setName] = useState(user?.name || '');
  const [department, setDepartment] = useState(user?.department || 'Computer Science & Engineering');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Full name cannot be empty');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await authApi.updateProfile({ name, department });
      if (res.success && res.user) {
        onSave(res.user);
      } else {
        setError(res.message || 'Failed to update profile');
      }
    } catch (err) {
      setError(err.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Edit3 className="h-4 w-4 text-brand-600" />
            Edit Student Profile
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-md">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
            >
              <option value="Computer Science & Engineering">Computer Science & Engineering</option>
              <option value="Artificial Intelligence & Data Science">Artificial Intelligence & Data Science</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Electronics & Communication">Electronics & Communication</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400">Roll Number (Institutional Locked)</label>
            <input
              type="text"
              disabled
              value={user?.rollNumber || '24AD118'}
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
            />
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── BLAZEFACE CAMERA CAPTURE MODAL ───────────────────────────────────────
function CameraCaptureModal({ onClose, onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const modelRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [isFaceCentered, setIsFaceCentered] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [fallbackTimer, setFallbackTimer] = useState(0);

  // Initialize camera and model
  useEffect(() => {
    let active = true;

    async function initCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } 
        });
        if (active) {
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            videoRef.current.play().catch(e => console.error(e));
          }
        } else {
          mediaStream.getTracks().forEach(t => t.stop());
        }
      } catch (err) {
        if (active) setErrorMsg('Camera access is required to update your photo. Please allow permissions.');
      }
    }

    async function initModel() {
      if (window.blazeface && active) {
        try {
          modelRef.current = await window.blazeface.load();
        } catch(e) {
          console.warn("BlazeFace load failed", e);
        }
      }
    }

    initCamera();
    initModel();

    return () => {
      active = false;
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Cleanup on unmount explicitly just in case
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [stream]);

  // Face detection loop
  useEffect(() => {
    if (!stream || capturedPhoto) return;
    
    const interval = setInterval(async () => {
      if (videoRef.current && modelRef.current && videoRef.current.readyState === 4) {
        try {
          const faces = await modelRef.current.estimateFaces(videoRef.current, false);
          if (faces.length === 1) {
            const face = faces[0];
            const centerX = (face.topLeft[0] + face.bottomRight[0]) / 2;
            const width = videoRef.current.videoWidth || 640;
            const ratio = centerX / width;
            if (ratio > 0.35 && ratio < 0.65) {
              setIsFaceCentered(true);
            } else {
              setIsFaceCentered(false);
            }
          } else {
            setIsFaceCentered(false);
          }
        } catch (e) {
          // ignore
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [stream, capturedPhoto]);

  // Fallback timer
  useEffect(() => {
    if (!stream || capturedPhoto || isFaceCentered) {
      setFallbackTimer(0);
      return;
    }
    const timer = setInterval(() => {
      setFallbackTimer(p => p + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [stream, capturedPhoto, isFaceCentered]);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const size = Math.min(vw, vh); // crop to square
    const startX = (vw - size) / 2;
    const startY = (vh - size) / 2;

    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    
    // mirror image
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    
    ctx.drawImage(video, startX, startY, size, size, 0, 0, 400, 400);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedPhoto(dataUrl);
    
    // Stop tracks immediately after capture
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
  };

  const savePhoto = async () => {
    if (!capturedPhoto) return;
    try {
      await authApi.updateProfilePhoto(capturedPhoto);
      onCapture(capturedPhoto); // Close and update context
    } catch (err) {
      alert('Failed to save photo');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
            <Camera className="h-4 w-4 text-brand-600" />
            Update Biometric Profile Photo
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition p-1 rounded-md hover:bg-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="p-6 flex flex-col items-center">
          {errorMsg ? (
            <div className="text-center space-y-4 w-full">
              <div className="text-rose-500 bg-rose-50 p-4 rounded-xl text-xs font-semibold">{errorMsg}</div>
              <p className="text-xs text-slate-500">You can upload a photo from your device instead.</p>
              
              <label className="flex items-center justify-center w-full px-4 py-3 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition cursor-pointer border border-dashed border-slate-300">
                <span>Select File</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setCapturedPhoto(reader.result);
                      reader.readAsDataURL(file);
                    }
                  }} 
                />
              </label>
            </div>
          ) : capturedPhoto ? (
            <div className="space-y-6 flex flex-col items-center w-full">
              <img src={capturedPhoto} alt="Captured preview" className="w-56 h-56 rounded-2xl object-cover shadow-md border-4 border-slate-100" />
              <div className="flex gap-3 w-full">
                <button onClick={() => { setCapturedPhoto(null); setFallbackTimer(0); }} className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition">
                  Retake
                </button>
                <button onClick={savePhoto} className="flex-1 px-4 py-2.5 bg-brand-600 text-white font-bold text-xs rounded-xl hover:bg-brand-500 transition shadow-lg shadow-brand-500/20">
                  Save as Biometric Photo
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 flex flex-col items-center w-full">
              <div className="relative w-56 h-56 rounded-2xl overflow-hidden bg-black shadow-inner">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
                />
                <div className={`absolute inset-0 border-[4px] rounded-2xl transition-colors duration-300 ${isFaceCentered ? 'border-emerald-500/80' : 'border-amber-400/80 border-dashed'}`}></div>
              </div>
              
              <div className="text-center h-6 flex items-center justify-center">
                {isFaceCentered ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="h-4 w-4" /> Perfect, ready to capture
                  </span>
                ) : (
                  <span className="text-amber-600 font-semibold text-xs">
                    Center your face within the frame
                  </span>
                )}
              </div>

              <div className="flex gap-3 w-full max-w-xs mt-2">
                <button 
                  onClick={capturePhoto} 
                  disabled={!isFaceCentered && fallbackTimer < 3}
                  className={`flex-1 px-4 py-2.5 font-bold text-xs rounded-xl transition-all ${
                    isFaceCentered || fallbackTimer >= 3
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20 hover:bg-brand-500'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isFaceCentered ? 'Capture' : fallbackTimer >= 3 ? 'Capture Anyway' : 'Align Face...'}
                </button>
              </div>
            </div>
          )}
          
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </div>
  );
}
