import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Mail,
  Lock,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Camera,
  Cpu,
  BadgeCheck,
  Zap,
  Users,
  BookOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Floating Label Input ─────────────────────────────────────────────
function FloatingInput({ id, label, type = 'text', value, onChange, icon: Icon, rightSlot, autoComplete }) {
  const [focused, setFocused] = useState(false);
  const lifted = focused || value.length > 0;

  return (
    <div className="relative">
      <div
        className={`relative flex items-center rounded-xl border-2 bg-white transition-all duration-200 ${
          focused ? 'border-indigo-500 shadow-[0_0_0_4px_rgba(99,102,241,0.12)]' : 'border-slate-200'
        }`}
      >
        <div className={`absolute left-4 transition-colors duration-200 ${focused ? 'text-indigo-500' : 'text-slate-400'}`}>
          <Icon className="h-4 w-4" />
        </div>
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete={autoComplete}
          required
          className="w-full pl-11 pr-10 pt-5 pb-2 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder-transparent peer"
          placeholder={label}
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
    </div>
  );
}

// ── Left Panel Feature Row ───────────────────────────────────────────
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

// ── Demo Role Card ───────────────────────────────────────────────────
function DemoCard({ role, name, email, borderColor, badgeColor, badgeBg, avatarBg, avatarText, onLogin, loading }) {
  return (
    <motion.button
      type="button"
      onClick={() => onLogin(email)}
      disabled={loading}
      whileHover={{ x: 3, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.98 }}
      className="w-full flex items-center gap-3.5 p-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all text-left group disabled:opacity-60"
      style={{ borderLeftWidth: 4, borderLeftColor: borderColor }}
    >
      <div
        className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-black shrink-0"
        style={{ backgroundColor: avatarBg, color: avatarText }}
      >
        {name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${badgeBg} ${badgeColor}`}>
          {role}
        </span>
        <p className="text-sm font-black text-slate-800 mt-0.5">{name}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
    </motion.button>
  );
}

// ── Main Page ────────────────────────────────────────────────────────
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();

  const redirectByRole = (user) => {
    if (user.role === 'STUDENT') navigate('/student/dashboard');
    else if (user.role === 'FACULTY') navigate('/faculty/dashboard');
    else if (user.role === 'ADMIN') navigate('/admin/dashboard');
    else navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      redirectByRole(user);
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoEmail) => {
    setError('');
    setLoading(true);
    try {
      const user = await demoLogin(demoEmail);
      redirectByRole(user);
    } catch (err) {
      setError(err.message || 'Quick demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT PANEL ──────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 40%, #3730a3 70%, #1e1b4b 100%)' }}
      >
        {/* Mesh blobs */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #818cf8, transparent 70%)' }} />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #a78bfa, transparent 70%)' }} />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
              backgroundSize: '48px 48px'
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

        {/* Hero text */}
        <div className="relative space-y-8">
          <div className="space-y-4">
            {/* Glowing shield icon */}
            <div className="relative inline-flex">
              <div className="absolute inset-0 rounded-full blur-2xl opacity-40" style={{ background: '#818cf8' }} />
              <div className="relative h-20 w-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                <ShieldCheck className="h-10 w-10 text-white" />
              </div>
            </div>

            <div>
              <h1 className="text-4xl xl:text-5xl font-black text-white leading-[1.1] tracking-tight">
                Secure.<br />Intelligent.<br />Certified.
              </h1>
              <p className="text-indigo-200 text-sm mt-4 leading-relaxed max-w-xs">
                Enterprise-grade AI examination infrastructure trusted by academic institutions worldwide.
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <Feature
              icon={Camera}
              title="AI-Powered Proctoring"
              desc="Real-time facial recognition, gaze tracking, and behavior analysis."
            />
            <Feature
              icon={Cpu}
              title="Intelligent Assessment"
              desc="Adaptive scoring, code sandbox evaluation, and AI-driven feedback."
            />
            <Feature
              icon={BadgeCheck}
              title="Institutional Grade Security"
              desc="SOC 2 certified infrastructure with end-to-end exam integrity."
            />
          </div>

          {/* Trust bar */}
          <div className="space-y-3">
            <p className="text-xs font-black text-indigo-300 uppercase tracking-widest">Trusted by 200+ institutions</p>
            <div className="flex items-center gap-3">
              {['MIT', 'Stanford', 'IIT', 'Oxford', 'ETH'].map((u) => (
                <div key={u} className="h-8 px-3 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
                  <span className="text-[10px] font-black text-white/80">{u}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom tagline */}
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
          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-sm text-slate-500 mt-1.5">Sign in to your examination portal</p>
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <FloatingInput
              id="email"
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={Mail}
              autoComplete="email"
            />

            <FloatingInput
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={Lock}
              autoComplete="current-password"
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

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" className="h-3.5 w-3.5 accent-indigo-600 rounded" />
                <span className="text-slate-500 font-medium">Remember me</span>
              </label>
              <button type="button" className="text-indigo-600 font-bold hover:text-indigo-700 transition">
                Forgot password?
              </button>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-3.5 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: loading ? '#6366f1' : 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #7c3aed 100%)' }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Authenticating…
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="h-4 w-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="my-7 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">or continue with demo</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Demo cards */}
          <div className="space-y-2.5">
            <DemoCard
              role="Student"
              name="Alex Chen"
              email="alex.student@eduproctor.ai"
              borderColor="#6366f1"
              badgeColor="text-indigo-700"
              badgeBg="bg-indigo-50"
              avatarBg="#ede9fe"
              avatarText="#4f46e5"
              onLogin={handleQuickDemo}
              loading={loading}
            />
            <DemoCard
              role="Faculty"
              name="Dr. Turing"
              email="turing@eduproctor.ai"
              borderColor="#10b981"
              badgeColor="text-emerald-700"
              badgeBg="bg-emerald-50"
              avatarBg="#d1fae5"
              avatarText="#059669"
              onLogin={handleQuickDemo}
              loading={loading}
            />
            <DemoCard
              role="Admin"
              name="Connor Webb"
              email="admin@eduproctor.ai"
              borderColor="#f59e0b"
              badgeColor="text-amber-700"
              badgeBg="bg-amber-50"
              avatarBg="#fef3c7"
              avatarText="#d97706"
              onLogin={handleQuickDemo}
              loading={loading}
            />
          </div>

          {/* Register */}
          <p className="mt-7 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-600 font-black hover:text-indigo-700 transition">
              Register here
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
