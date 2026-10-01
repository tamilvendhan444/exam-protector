import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function PlaceholderView({ title, description, badge = 'Feature Portal' }) {
  const { isStudent, isFaculty } = useAuth();
  const dashboardLink = isStudent ? '/student/dashboard' : isFaculty ? '/faculty/dashboard' : '/admin/dashboard';

  return (
    <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 text-center max-w-2xl mx-auto my-12 space-y-5 animate-in fade-in duration-300">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold">
        <Sparkles className="h-3.5 w-3.5" />
        <span>{badge}</span>
      </div>

      <h1 className="text-2xl font-black text-slate-900">{title}</h1>
      <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
        {description || 'This module is fully integrated into the EduProctor AI ecosystem.'}
      </p>

      <div className="pt-2 flex items-center justify-center gap-3">
        <Link
          to={dashboardLink}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-slate-900 text-xs font-bold transition"
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
