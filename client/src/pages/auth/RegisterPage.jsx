import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isValidRollNumber } from '../../../../shared/validation.js';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  GraduationCap,
  BookOpen,
  ChevronDown,
  Hash,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Floating Label Input ─────────────────────────────────────────────
function FloatingInput({ id, label, type = 'text', value, onChange, onBlur, icon: Icon, rightSlot, autoComplete, required = true, placeholder }) {
  const [focused, setFocused] = useState(false);
  const lifted = focused || (value && value.length > 0);

  return (
    <div
      className={`relative flex items-center rounded-xl border-2 bg-white transition-all duration-200 ${
        focused ? 'border-indigo-500 shadow-[0_0_0_4px_rgba(99,102,241,0.12)]' : 'border-slate-200'
      }`}
    >
      <div className={`absolute left-4 transition-colors duration-200 shrink-0 ${focused ? 'text-indigo-500' : 'text-slate-400'}`}>
        <Icon className="h-4 w-4" />
      </div>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={(e) => { setFocused(false); onBlur && onBlur(e); }}
        onFocus={() => setFocused(true)}
        autoComplete={autoComplete}
        required={required}
        placeholder={placeholder || label}
        className="w-full pl-11 pr-10 pt-5 pb-2 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder-transparent peer"
      />
      <label
        htmlFor={id}
        className={`absolute left-11 transition-all duration-200 pointer-events-none font-medium ${
          lifted ? 'text-[10px] top-2 text-indigo-500' : 'text-sm top-1/2 -translate-y-1/2 text-slate-400'
        }`}
      >
        {label}
      </label>
      {rightSlot && <div className="absolute right-3">{rightSlot}</div>}
    </div>
  );
}

// ── Styled Select ────────────────────────────────────────────────────
function FloatingSelect({ id, label, value, onChange, icon: Icon, children }) {
  const [focused, setFocused] = useState(false);

  return (
    <div
      className={`relative rounded-xl border-2 bg-white transition-all duration-200 ${
        focused ? 'border-indigo-500 shadow-[0_0_0_4px_rgba(99,102,241,0.12)]' : 'border-slate-200'
      }`}
    >
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
        <Icon className="h-4 w-4" />
      </div>
      <label htmlFor={id} className="absolute left-11 top-2 text-[10px] font-medium text-indigo-500 pointer-events-none">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full pl-11 pr-8 pt-5 pb-2 bg-transparent text-sm font-medium text-slate-900 outline-none appearance-none"
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
    </div>
  );
}

// ── Password Strength Bar ─────────────────────────────────────────────
function PasswordStrength({ password }) {
  const strength = password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 10 ? 2
    : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4
    : 3;

  const labels = ['', 'Too short', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#f43f5e', '#f59e0b', '#10b981', '#6366f1'];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1,2,3,4].map(i => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: i <= strength ? colors[strength] : '#e2e8f0' }}
          />
        ))}
      </div>
      <p className="text-[10px] font-bold" style={{ color: colors[strength] }}>{labels[strength]}</p>
    </div>
  );
}

// ── Left Panel Feature ────────────────────────────────────────────────
function Feature({ icon: Icon, title, desc }) {
  return (
    <div className="flex items-start gap-3.5">
      <div className="p-2.5 rounded-xl bg-white/10 text-white shrink-0 mt-0.5">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-black text-white">{title}</p>
        <p className="text-xs text-indigo-200 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// ── Step Indicator ────────────────────────────────────────────────────
function StepDot({ n, active, done }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
          done ? 'bg-indigo-600 text-white' : active ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500' : 'bg-slate-100 text-slate-400'
        }`}
      >
        {done ? '✓' : n}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────
export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT',
    department: 'Computer Science & Engineering',
    rollNumber: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [rollYear, setRollYear] = useState('24');
  const [rollDept, setRollDept] = useState('AD');
  const [rollSeq, setRollSeq] = useState('');
  const [rollError, setRollError] = useState('');

  useEffect(() => {
    if (formData.role === 'STUDENT') {
      setFormData(prev => ({ ...prev, rollNumber: `${rollYear}${rollDept}${rollSeq}` }));
    } else {
      setFormData(prev => ({ ...prev, rollNumber: '' }));
      setRollError('');
    }
  }, [rollYear, rollDept, rollSeq, formData.role]);

  const handleRollBlur = () => {
    if (formData.role !== 'STUDENT') return;
    const roll = `${rollYear}${rollDept}${rollSeq}`;
    if (rollSeq.length > 0 && !isValidRollNumber(roll)) {
      setRollError('Format: YY + Dept Code + 3-digit number, e.g. 24AD007');
    } else {
      setRollError('');
    }
  };

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.role === 'STUDENT' && !isValidRollNumber(formData.rollNumber)) {
      setError('Invalid roll number. Format: YY + Dept Code + 3-digit number, e.g. 24AD007');
      return;
    }

    setLoading(true);
    try {
      const user = await register(formData);
      if (user.role === 'STUDENT') navigate('/student/dashboard');
      else if (user.role === 'FACULTY') navigate('/faculty/dashboard');
      else navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Determine progress step
  const step1Done = formData.name.length > 1 && formData.email.includes('@') && formData.password.length >= 6;
  const step2Done = formData.role !== '' && (formData.role !== 'STUDENT' || rollSeq.length === 3);
  const activeStep = !step1Done ? 1 : !step2Done ? 2 : 3;

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT PANEL ──────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[42%] relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 40%, #3730a3 70%, #1e1b4b 100%)' }}
      >
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #818cf8, transparent 70%)' }} />
          <div className="absolute bottom-0 -left-20 w-80 h-80 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #a78bfa, transparent 70%)' }} />
          <div className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
        </div>

        {/* Logo */}
        <div className="relative">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-black text-white tracking-tight">
              EduProctor <span className="text-indigo-300">AI</span>
            </span>
          </Link>
        </div>

        {/* Hero */}
        <div className="relative space-y-8">
          <div className="space-y-4">
            <div className="relative inline-flex">
              <div className="absolute inset-0 rounded-2xl blur-2xl opacity-40" style={{ background: '#818cf8' }} />
              <div className="relative h-20 w-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                <GraduationCap className="h-10 w-10 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl xl:text-5xl font-black text-white leading-[1.1] tracking-tight">
                Join the<br />Academic<br />Network.
              </h1>
              <p className="text-indigo-200 text-sm mt-4 leading-relaxed max-w-xs">
                Register to access AI-proctored exams, real-time coding assessments, and performance analytics.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Feature icon={BookOpen} title="Adaptive Exam Engine" desc="Personalized question sets with real-time difficulty scaling." />
            <Feature icon={ShieldCheck} title="Zero-Cheat Architecture" desc="Multi-layer integrity system with live proctoring and telemetry." />
            <Feature icon={BadgeCheck} title="Certified Outcomes" desc="Verified digital transcripts recognized by partner institutions." />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { num: '200+', label: 'Institutions' },
              { num: '50K+', label: 'Students' },
              { num: '99.9%', label: 'Uptime' },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-xl bg-white/8 border border-white/15 text-center">
                <p className="text-lg font-black text-white">{s.num}</p>
                <p className="text-[10px] text-indigo-300 font-bold">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative">
          <p className="text-xs text-indigo-300/60 font-mono">© 2024 EduProctor AI. All rights reserved.</p>
        </div>
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 bg-slate-50 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-black text-slate-900">
                EduProctor <span className="text-indigo-500">AI</span>
              </span>
            </Link>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Create account</h2>
            <p className="text-sm text-slate-500 mt-1.5">Join the secure examination and assessment network</p>
          </div>

          {/* Progress Steps */}
          <div className="mb-6 flex items-center gap-2">
            <StepDot n={1} active={activeStep === 1} done={step1Done} />
            <div className={`flex-1 h-0.5 rounded-full transition-all duration-500 ${step1Done ? 'bg-indigo-500' : 'bg-slate-200'}`} />
            <StepDot n={2} active={activeStep === 2} done={step2Done} />
            <div className={`flex-1 h-0.5 rounded-full transition-all duration-500 ${step2Done ? 'bg-indigo-500' : 'bg-slate-200'}`} />
            <StepDot n={3} active={activeStep === 3} done={false} />
            <div className="flex gap-2 ml-3 text-[10px] font-bold text-slate-400">
              <span className={step1Done ? 'text-indigo-600' : activeStep === 1 ? 'text-slate-700' : ''}>Personal</span>
              <span>·</span>
              <span className={step2Done ? 'text-indigo-600' : activeStep === 2 ? 'text-slate-700' : ''}>Role</span>
              <span>·</span>
              <span className={activeStep === 3 ? 'text-slate-700' : ''}>Confirm</span>
            </div>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-rose-700 text-xs font-medium"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">

            {/* Full Name */}
            <FloatingInput
              id="name"
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              icon={User}
              autoComplete="name"
            />

            {/* Email */}
            <FloatingInput
              id="email"
              label="Institutional Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              icon={Mail}
              autoComplete="email"
            />

            {/* Password */}
            <div>
              <FloatingInput
                id="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                icon={Lock}
                autoComplete="new-password"
                rightSlot={
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(v => !v)}
                    className="p-1 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
              <PasswordStrength password={formData.password} />
            </div>

            {/* Role select */}
            <FloatingSelect
              id="role"
              label="Role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              icon={GraduationCap}
            >
              <option value="STUDENT">Student</option>
              <option value="FACULTY">Faculty</option>
            </FloatingSelect>

            {/* Roll Number — students only */}
            <AnimatePresence>
              {formData.role === 'STUDENT' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 pt-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Hash className="h-3 w-3" /> Roll Number
                    </label>
                    <div className="flex gap-2">
                      {/* Year */}
                      <div className="relative w-20">
                        <select
                          value={rollYear}
                          onChange={(e) => setRollYear(e.target.value)}
                          className="w-full px-3 py-3 rounded-xl border-2 border-slate-200 bg-white text-sm font-bold text-slate-900 outline-none appearance-none focus:border-indigo-500 transition"
                        >
                          {['24','25','26','27','28'].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                      </div>

                      {/* Department */}
                      <div className="relative flex-1">
                        <select
                          value={rollDept}
                          onChange={(e) => setRollDept(e.target.value)}
                          className="w-full px-3 py-3 rounded-xl border-2 border-slate-200 bg-white text-xs font-bold text-slate-900 outline-none appearance-none focus:border-indigo-500 transition"
                        >
                          <option value="AD">AI & Data Science (AD)</option>
                          <option value="AM">AI & Machine Learning (AM)</option>
                          <option value="IT">Information Technology (IT)</option>
                          <option value="CS">Computer Science (CS)</option>
                          <option value="CB">CS & Business Systems (CB)</option>
                          <option value="SY">Cyber Security (SY)</option>
                          <option value="EC">Electronics & Comm. (EC)</option>
                          <option value="EE">Electrical & Electronics (EE)</option>
                          <option value="CE">Civil Engineering (CE)</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                      </div>

                      {/* Sequence */}
                      <input
                        type="text"
                        value={rollSeq}
                        onChange={(e) => setRollSeq(e.target.value.replace(/\D/g, '').slice(0, 3))}
                        onBlur={handleRollBlur}
                        placeholder="007"
                        maxLength={3}
                        className="w-16 px-2 py-3 rounded-xl border-2 border-slate-200 bg-white text-sm font-bold text-slate-900 text-center outline-none focus:border-indigo-500 transition placeholder:text-slate-300"
                      />
                    </div>

                    {/* Preview pill */}
                    {rollSeq.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-2"
                      >
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${
                          rollError
                            ? 'bg-rose-50 border-rose-200 text-rose-600'
                            : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                        }`}>
                          <Hash className="h-3 w-3" />
                          {rollYear}{rollDept}{rollSeq}
                        </div>
                        {rollError
                          ? <span className="text-[10px] text-rose-500 font-bold">{rollError}</span>
                          : rollSeq.length === 3 && <span className="text-[10px] text-emerald-600 font-bold">✓ Valid format</span>
                        }
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-3.5 mt-2 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #7c3aed 100%)' }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Creating Account…
                </>
              ) : (
                <>
                  Complete Registration <ArrowRight className="h-4 w-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Sign in link */}
          <p className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 font-black hover:text-indigo-700 transition">
              Sign In
            </Link>
          </p>

          {/* Trust badges */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-center gap-3 flex-wrap">
            {[
              { icon: BadgeCheck, label: 'SOC 2', color: 'text-indigo-600' },
              { icon: Lock, label: '256-bit AES', color: 'text-emerald-600' },
              { icon: ShieldCheck, label: 'GDPR Ready', color: 'text-amber-600' },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm">
                <Icon className={`h-3.5 w-3.5 ${color}`} />
                <span className={`text-[10px] font-black ${color}`}>{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
