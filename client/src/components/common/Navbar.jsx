import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, LogOut, User as UserIcon, Bell, Sparkles, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAuthenticated, isStudent, isFaculty, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (isStudent) return '/student/dashboard';
    if (isFaculty) return '/faculty/dashboard';
    if (isAdmin) return '/admin/dashboard';
    return '/';
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-slate-50/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-violet-500 shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="h-6 w-6 text-slate-900" />
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-dark-950 animate-pulse"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
              EduProctor <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-violet-400">AI</span>
            </span>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-600 -mt-1">
              Autonomous Exam Shield
            </span>
          </div>
        </Link>

        {/* Navigation & User Menu */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link
                to={getDashboardLink()}
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100/70 hover:bg-slate-100 text-slate-800 transition"
              >
                <LayoutDashboard className="h-3.5 w-3.5 text-brand-400" />
                Dashboard
              </Link>

              {/* Role Badge */}
              <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                isAdmin
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : isFaculty
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-brand-500/10 border-brand-500/30 text-brand-300'
              }`}>
                {user?.role}
              </span>

              {/* User Avatar & Info */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <img
                  src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                  alt={user?.name}
                  className="h-8 w-8 rounded-full border border-slate-300 bg-slate-100 object-cover"
                />
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-800 truncate max-w-[120px]">{user?.name}</span>
                  <span className="text-[10px] text-slate-600 truncate max-w-[120px]">{user?.email}</span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-2 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                to="/login"
                className="text-xs font-semibold px-3.5 py-1.5 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100/60 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-slate-900 shadow-md shadow-brand-500/20 transition"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
