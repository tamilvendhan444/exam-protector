import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Code2,
  Camera,
  Cpu,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Lock,
  Zap,
  Users,
  Award,
  Terminal
} from 'lucide-react';

export default function LandingPage() {
  const { demoLogin, isAuthenticated, isStudent, isFaculty, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleQuickDemo = async (email, redirectPath) => {
    try {
      await demoLogin(email);
      navigate(redirectPath);
    } catch (err) {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-slate-200/80 bg-slate-50/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 to-violet-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <ShieldCheck className="h-5 w-5 text-slate-900" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              EduProctor <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-violet-400">AI</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs font-semibold px-4 py-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-slate-900 shadow-md shadow-brand-500/25 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden border-b border-slate-200/60">
        {/* Glow backdrop */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-600/15 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-5xl mx-auto px-6 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-brand-400" />
            <span>Autonomous AI-Assisted Assessment Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Assess Knowledge. <br className="hidden sm:inline" />
            Evaluate Code. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-indigo-300 to-violet-400">
              Ensure Absolute Integrity.
            </span>
          </h1>

          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            EduProctor AI combines an online coding environment with automated multi-language execution,
            real-time computer-vision proctoring, digital scratchpads, and live faculty monitoring.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/student/exams"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-slate-900 font-bold shadow-xl shadow-brand-500/25 transition group"
            >
              <span>Explore Assessments</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/about"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-200/80 hover:bg-slate-100 text-slate-800 font-semibold border border-slate-200 transition"
            >
              <span>Platform Architecture</span>
            </Link>
          </div>

          {/* Instant Demo Role Switcher */}
          <div className="pt-10 max-w-2xl mx-auto">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-600 block mb-3">
              Instant One-Click Demo Role Launcher:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => handleQuickDemo('alex.student@eduproctor.ai', '/student/dashboard')}
                className="p-3.5 rounded-xl bg-slate-200/80 border border-slate-200 hover:border-brand-500/50 hover:bg-slate-100/80 transition text-left group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-brand-300">Student Portal</span>
                  <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 font-bold">Alex</span>
                </div>
                <p className="text-[11px] text-slate-600">Take exams, run code, AI proctoring</p>
              </button>

              <button
                onClick={() => handleQuickDemo('turing@eduproctor.ai', '/faculty/dashboard')}
                className="p-3.5 rounded-xl bg-slate-200/80 border border-slate-200 hover:border-amber-500/50 hover:bg-slate-100/80 transition text-left group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-amber-300">Faculty Hub</span>
                  <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">Turing</span>
                </div>
                <p className="text-[11px] text-slate-600">Live monitoring, exam builder, analytics</p>
              </button>

              <button
                onClick={() => handleQuickDemo('admin@eduproctor.ai', '/admin/dashboard')}
                className="p-3.5 rounded-xl bg-slate-200/80 border border-slate-200 hover:border-rose-500/50 hover:bg-slate-100/80 transition text-left group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-rose-300">Admin Console</span>
                  <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">Connor</span>
                </div>
                <p className="text-[11px] text-slate-600">User management, system stats & settings</p>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Core Feature Pillars */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl font-extrabold text-slate-900">Engineered for High-Stakes Assessments</h2>
          <p className="text-slate-600 text-sm">
            Everything students and faculty need for rigorous, reliable, and fair digital examinations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-slate-200/50 border border-slate-200 hover:border-slate-300 transition space-y-4">
            <div className="h-12 w-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <Code2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Integrated Monaco Editor</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Industrial-grade coding editor supporting C++, Java, Python, and JavaScript with syntax highlighting, custom test cases, and error diagnostics.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-slate-200/50 border border-slate-200 hover:border-slate-300 transition space-y-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Camera className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">AI Vision Proctoring</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Real-time browser vision detecting missing face, multiple faces, mobile devices, and sustained head deflection with non-intrusive warnings.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-slate-200/50 border border-slate-200 hover:border-slate-300 transition space-y-4">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Cpu className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Isolated Code Sandbox</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Secure sandbox runner enforcing execution timeouts, memory caps, and automated output comparison against visible and hidden test suites.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-slate-200/50 border border-slate-200 hover:border-slate-300 transition space-y-4">
            <div className="h-12 w-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">AI Performance Analytics</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Personalized post-exam insights identifying student strengths, weak areas, and targeted problem recommendations without unsupported claims.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-slate-50 py-8 px-6 text-center text-xs text-slate-600">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand-400" />
            <span className="font-semibold text-slate-700">EduProctor AI Assessment Platform</span>
          </div>
          <p>© 2026 EduProctor AI. Designed for high-integrity academic evaluations.</p>
        </div>
      </footer>
    </div>
  );
}
