import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileCode2,
  BrainCircuit,
  BarChart3,
  Award,
  User,
  Settings,
  HelpCircle,
  Video,
  Database,
  Users,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ShieldAlert,
  Zap
} from 'lucide-react';

export default function Sidebar() {
  const { user, isStudent, isFaculty, isAdmin } = useAuth();

  const studentAcademicLinks = [
    { name: 'Dashboard', to: '/student/dashboard', icon: LayoutDashboard },
    { name: 'Exams', to: '/student/exams', icon: FileCode2 },
    { name: 'Performance', to: '/student/performance', icon: BarChart3 },
    { name: 'Results', to: '/student/results', icon: Award },
  ];

  const studentAccountLinks = [
    { name: 'Profile', to: '/student/profile', icon: User },
    { name: 'Settings', to: '/student/settings', icon: Settings },
  ];

  const facultyLinks = [
    { name: 'Dashboard', to: '/faculty/dashboard', icon: LayoutDashboard },
    { name: 'Exams', to: '/faculty/exams', icon: FileCode2 },
    { name: 'Question Bank', to: '/faculty/question-bank', icon: Database },
    { name: 'Students', to: '/faculty/students', icon: Users },
    { name: 'Live Monitoring', to: '/faculty/monitoring', icon: Video, pulse: true },
    { name: 'Results', to: '/faculty/results', icon: Award },
    { name: 'Analytics', to: '/faculty/analytics', icon: BarChart3 },
    { name: 'Settings', to: '/faculty/settings', icon: Settings },
  ];

  const adminLinks = [
    { name: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Users', to: '/admin/users', icon: Users },
    { name: 'Students', to: '/admin/students', icon: GraduationCap },
    { name: 'Faculty', to: '/admin/faculty', icon: Users },
    { name: 'Exams', to: '/admin/exams', icon: FileCode2 },
    { name: 'Analytics', to: '/admin/analytics', icon: BarChart3 },
    { name: 'System Settings', to: '/admin/settings', icon: Settings },
  ];

  const renderLink = (link) => {
    const Icon = link.icon;
    return (
      <NavLink
        key={link.to}
        to={link.to}
        className={({ isActive }) =>
          `group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all duration-150 ${
            isActive
              ? 'bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-600 text-white shadow-md shadow-brand-500/25 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-semibold'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <div className="flex items-center gap-3">
              <Icon
                className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-600'
                }`}
              />
              <span>{link.name}</span>
            </div>
            {isActive && <ChevronRight className="h-3.5 w-3.5 text-white/80 shrink-0" />}
            {link.pulse && !isActive && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <aside className="w-64 border-r border-slate-200/90 bg-white/70 backdrop-blur-md flex flex-col justify-between p-4 shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        {/* User Profile Card */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-200/90 shadow-xs flex items-center gap-3">
          <div className="relative shrink-0">
            {user?.avatar || user?.name ? (
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || 'user')}`}
                alt={user?.name || 'User'}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.nextElementSibling) {
                    e.currentTarget.nextElementSibling.style.display = 'flex';
                  }
                }}
                className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-xs bg-slate-100"
              />
            ) : null}
            <div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white font-extrabold flex items-center justify-center text-sm shadow-sm shadow-brand-500/20"
              style={{ display: (user?.avatar || user?.name) ? 'none' : 'flex' }}
            >
              {user?.name ? user.name[0].toUpperCase() : 'S'}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
          </div>
          <div className="overflow-hidden flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-900 truncate">{user?.name || 'Candidate'}</h4>
            <p className="text-[10px] text-slate-500 truncate leading-tight mt-0.5">
              {user?.department || (isStudent ? 'Computer Science & Eng' : isFaculty ? 'Faculty Staff' : 'System Admin')}
            </p>
            {user?.rollNumber && (
              <span className="inline-block mt-1 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200/70">
                {user.rollNumber}
              </span>
            )}
          </div>
        </div>

        {/* Navigation links */}
        {isStudent ? (
          <div className="space-y-4">
            <div>
              <p className="px-3 pb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                Academic Portal
              </p>
              <nav className="space-y-1">
                {studentAcademicLinks.map(renderLink)}
              </nav>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <p className="px-3 pb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                Account & Preferences
              </p>
              <nav className="space-y-1">
                {studentAccountLinks.map(renderLink)}
              </nav>
            </div>
          </div>
        ) : (
          <nav className="space-y-1">
            {(isFaculty ? facultyLinks : adminLinks).map(renderLink)}
          </nav>
        )}
      </div>

      {/* Footer System Sentinel Badge */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 via-dark-900 to-indigo-950 border border-slate-800 text-white shadow-sm space-y-2 mt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-brand-300">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>EduProctor AI Sentinel</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Real-time on-device computer vision and continuous integrity shield v2.6 active.
        </p>
      </div>
    </aside>
  );
}
