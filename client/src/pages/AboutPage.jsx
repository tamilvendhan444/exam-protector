import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Code2,
  BrainCircuit,
  Eye,
  Server,
  ArrowRight,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-slate-50/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 to-violet-500 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-slate-900" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              EduProctor <span className="text-brand-400">AI</span>
            </span>
          </Link>

          <Link
            to="/student/exams"
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-slate-900 text-xs font-bold transition"
          >
            Go to Assessments
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-12">
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900">Platform Architecture</h1>
          <p className="text-slate-600 text-sm max-w-xl mx-auto">
            A production-ready EdTech assessment environment built on zero-compromise security, client-side vision models, and sandboxed code execution.
          </p>
        </div>

        {/* 3 Technical Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-3">
            <Code2 className="h-6 w-6 text-brand-400" />
            <h3 className="text-base font-bold text-slate-900">Isolated Sandbox</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Untrusted candidate code is executed strictly in sandbox sub-processes with CPU timeouts (3s), memory boundaries (64MB), and standard stream interception.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-3">
            <Eye className="h-6 w-6 text-emerald-400" />
            <h3 className="text-base font-bold text-slate-900">Edge AI Vision</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              BlazeFace and COCO-SSD models operate client-side in WebGL/WASM to compute facial landmarks, head yaw/pitch, and unauthorized objects without streaming raw continuous video.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-3">
            <Server className="h-6 w-6 text-violet-400" />
            <h3 className="text-base font-bold text-slate-900">Real-Time Gateway</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Socket.IO bidirectional channels stream synchronized timers, incident alarms, and low-bandwidth snapshot heartbeats directly to the faculty monitoring console.
            </p>
          </div>
        </div>

        {/* Ethical Proctoring Policy */}
        <div className="p-8 rounded-3xl bg-white border border-slate-200 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <span>Ethical AI & Fair Assessment Charter</span>
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed">
            EduProctor AI follows strict ethical standards in academic computer vision:
          </p>
          <ul className="space-y-2 text-xs text-slate-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Signals, Not Sentences:</strong> AI model predictions are strictly cataloged as signals for human faculty review, never as an automatic disqualification verdict.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Privacy By Design:</strong> Video feeds are processed on-device. The platform only transmits small snapshot thumbnails when a high-confidence incident is detected.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Faculty Direct Appeal:</strong> Candidates can view their recorded proctoring timeline alongside their exam results for complete transparency.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
