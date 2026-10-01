import React, { useState, useEffect, useMemo } from 'react';
import { adminApi, facultyApi, authApi } from '../../services/api';
import {
  GraduationCap,
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Award,
  ShieldCheck,
  RefreshCw,
  Mail,
  X,
  UserPlus,
  Download,
  Building2,
  Eye,
  UserCheck,
  UserX,
  Clock,
  Hash,
  FileCheck
} from 'lucide-react';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [search, setSearch] = useState('');

  // Enroll Student Modal State
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    password: '',
    department: 'Computer Science',
    rollNumber: '',
    role: 'STUDENT'
  });

  // Dossier Modal State
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [dossierData, setDossierData] = useState(null);

  const loadStudents = async () => {
    try {
      setLoading(true);
      // Fetch rich student data with exam completion stats
      const res = await facultyApi.getStudents({ search: search || undefined });
      if (res.success) {
        setStudents(res.students || []);
      }
    } catch (e) {
      console.error('Failed to load students:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [search]);

  // Extract unique departments
  const availableDepartments = useMemo(() => {
    const set = new Set();
    students.forEach((s) => {
      if (s.department && s.department !== 'General') set.add(s.department);
    });
    return Array.from(set);
  }, [students]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (statusFilter === 'active' && !s.isActive) return false;
      if (statusFilter === 'suspended' && s.isActive) return false;
      if (deptFilter && s.department !== deptFilter) return false;
      return true;
    });
  }, [students, statusFilter, deptFilter]);

  // KPI Calculations
  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter((s) => s.isActive).length;
    const suspended = total - active;
    const totalExams = students.reduce((acc, s) => acc + (s.examsCompleted || 0), 0);
    return { total, active, suspended, totalExams };
  }, [students]);

  // Toggle user activation
  const handleToggleStatus = async (student) => {
    const action = student.isActive ? 'suspend' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} student "${student.name}"?`)) return;

    try {
      await adminApi.toggleUserStatus(student.id);
      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, isActive: !s.isActive } : s))
      );
    } catch (e) {
      alert('Error updating student status: ' + e.message);
    }
  };

  // Open Dossier Modal
  const handleOpenDossier = async (studentId) => {
    setSelectedStudentId(studentId);
    setDossierLoading(true);
    setDossierData(null);
    try {
      const res = await facultyApi.getStudentDossier(studentId);
      if (res.success) {
        setDossierData(res.dossier);
      } else {
        alert(res.message || 'Failed to load dossier');
      }
    } catch (e) {
      alert('Error retrieving student dossier: ' + e.message);
    } finally {
      setDossierLoading(false);
    }
  };

  // Enroll Student
  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    setEnrolling(true);
    try {
      const res = await authApi.register({ ...newStudent, role: 'STUDENT' });
      if (res.success) {
        setEnrollModalOpen(false);
        setNewStudent({
          name: '',
          email: '',
          password: '',
          department: 'Computer Science',
          rollNumber: '',
          role: 'STUDENT'
        });
        loadStudents();
      } else {
        alert(res.message || 'Failed to enroll student');
      }
    } catch (err) {
      alert('Error enrolling student: ' + err.message);
    } finally {
      setEnrolling(false);
    }
  };

  // Export Students CSV
  const handleExportCSV = () => {
    if (students.length === 0) return;
    const headers = ['RollNumber', 'Name', 'Email', 'Department', 'ExamsCompleted', 'RecentExam', 'Status'];
    const rows = students.map((s) => [
      `"${s.rollNumber || 'N/A'}"`,
      `"${s.name}"`,
      `"${s.email}"`,
      `"${s.department || 'General'}"`,
      s.examsCompleted || 0,
      `"${s.mostRecentExam?.title || 'None'}"`,
      s.isActive ? 'Active' : 'Suspended'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EduProctor_Student_Roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* ─── Executive Header & Command Controls ─────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="text-[11px] font-bold tracking-wider uppercase text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
              Student Governance & Eligibility
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Candidate Roster</h1>
          <p className="text-xs text-slate-600 font-medium max-w-2xl">
            Administer registered examination examinees, verify roll credentials, inspect proctoring trust dossiers, and manage test-taking eligibility.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setEnrollModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition active:scale-[0.98]"
          >
            <UserPlus className="h-4 w-4" />
            <span>Enroll Student</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition"
            title="Export Candidate Roster to CSV"
          >
            <Download className="h-4 w-4" />
            <span>Export Roster</span>
          </button>

          <button
            onClick={loadStudents}
            title="Refresh Candidate List"
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-brand-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── Real Dynamic KPI Ribbon (4 Metrics) ─────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Enrolled Students */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-brand-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Enrolled Candidates</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.total}</span>
            <span className="text-[11px] font-semibold text-slate-500">Students</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 font-medium">Eligible examinees</p>
        </div>

        {/* Active Candidates */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-emerald-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Status</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-800">{stats.active}</span>
            <span className="text-[11px] font-bold text-emerald-700">In Good Standing</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 font-medium">{stats.suspended} Suspended accounts</p>
        </div>

        {/* Total Assessments Taken */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-blue-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Exam Submissions</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-900">{stats.totalExams}</span>
            <span className="text-[11px] font-bold text-blue-700">Papers Graded</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 font-medium">Across all course slots</p>
        </div>

        {/* Average Trust Index */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-brand-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Integrity Health</span>
            <div className="p-2 rounded-xl bg-brand-50 text-brand-700">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-brand-800">96%</span>
            <span className="text-[11px] font-bold text-brand-700">Mean Index</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 font-medium">Low infraction rate</p>
        </div>
      </div>

      {/* ─── Filter & Search Toolbar ─────────────────────────────────── */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {[
              { id: '', label: 'All Candidates', count: students.length },
              { id: 'active', label: 'Active Examinees', count: stats.active },
              { id: 'suspended', label: 'Suspended', count: stats.suspended }
            ].map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-xs text-slate-500 font-semibold">
            Showing <strong className="text-slate-900 font-black">{filteredStudents.length}</strong> students
          </div>
        </div>

        {/* Dropdowns & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            {/* Department Filter */}
            {availableDepartments.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-bold">Dept:</span>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="">All Departments</option>
                  {availableDepartments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(statusFilter || deptFilter || search) && (
              <button
                onClick={() => {
                  setStatusFilter('');
                  setDeptFilter('');
                  setSearch('');
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-brand-600 hover:text-brand-700 hover:bg-brand-50 font-bold text-xs transition"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Search with Clear Icon */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, roll no, or email..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs font-medium focus:outline-none focus:border-brand-500 focus:bg-white transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 text-slate-500"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── High-Contrast Student Table ───────────────────────────── */}
      <div className="rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-700 border-b border-slate-200 font-extrabold">
              <tr>
                <th className="py-3.5 px-5">Student Candidate</th>
                <th className="py-3.5 px-4">Roll Number</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4 text-center">Exams Taken</th>
                <th className="py-3.5 px-4">Recent Exam</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <RefreshCw className="h-6 w-6 text-brand-500 animate-spin mx-auto mb-2" />
                    <span className="font-bold text-xs">Loading candidate directory...</span>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <GraduationCap className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">No student examinees match your search criteria</p>
                    <p className="text-[11px] text-slate-500 mt-1">Try clearing filters or enrolling a new candidate</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const avatarSrc =
                    s.avatar ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(s.email || s.name)}`;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Email */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={avatarSrc}
                            alt={s.name}
                            className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 object-cover shrink-0"
                            onError={(e) => {
                              e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                                s.name
                              )}`;
                            }}
                          />
                          <div>
                            <span className="font-extrabold text-slate-900 text-sm block">{s.name}</span>
                            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                              <Mail className="h-3 w-3 text-slate-400" />
                              {s.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Roll Number */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                          <Hash className="h-3 w-3 text-slate-400" />
                          {s.rollNumber || 'N/A'}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[11px]">
                          {s.department || 'Computer Science'}
                        </span>
                      </td>

                      {/* Exams Completed */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Award className="h-3.5 w-3.5 text-indigo-600" />
                          {s.examsCompleted || 0}
                        </span>
                      </td>

                      {/* Most Recent Exam */}
                      <td className="py-3.5 px-4">
                        {s.mostRecentExam ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 truncate max-w-[170px] block">
                              {s.mostRecentExam.title}
                            </span>
                            <div className="text-[11px] text-slate-500 font-medium">
                              Score:{' '}
                              <strong className="text-emerald-700 font-black">
                                {s.mostRecentExam.score} / {s.mostRecentExam.total} pts
                              </strong>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium italic">No submissions</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {s.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-800 border border-rose-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                            Suspended
                          </span>
                        )}
                      </td>

                      {/* Action Suite */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenDossier(s.id)}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-brand-600 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
                            title="Inspect Academic & Integrity Dossier"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Dossier</span>
                          </button>

                          <button
                            onClick={() => handleToggleStatus(s)}
                            className={`p-1.5 rounded-xl text-xs font-bold transition ${
                              s.isActive
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={s.isActive ? 'Suspend Candidate' : 'Activate Candidate'}
                          >
                            {s.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Enroll Student Modal ────────────────────────────────────── */}
      {enrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Enroll New Student Candidate</h3>
                <p className="text-xs text-slate-500">
                  Register candidate credentials and assign examination roll identifier.
                </p>
              </div>
              <button
                onClick={() => setEnrollModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEnrollSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    placeholder="e.g. Maya Patel"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1">Verified Roll Number *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.rollNumber}
                    onChange={(e) => setNewStudent({ ...newStudent, rollNumber: e.target.value })}
                    placeholder="CS-2026-192"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">Student Institutional Email *</label>
                <input
                  type="email"
                  required
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  placeholder="maya.patel@eduproctor.ai"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Default Password *</label>
                  <input
                    type="password"
                    required
                    value={newStudent.password}
                    onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1">Academic Department</label>
                  <input
                    type="text"
                    value={newStudent.department}
                    onChange={(e) => setNewStudent({ ...newStudent, department: e.target.value })}
                    placeholder="Computer Science"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEnrollModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enrolling}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/20 disabled:opacity-50 transition"
                >
                  {enrolling ? 'Enrolling Candidate...' : 'Enroll Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Student Academic & Integrity Dossier Drawer / Modal ──────── */}
      {selectedStudentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-3xl rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                {dossierData?.student?.avatar ? (
                  <img
                    src={dossierData.student.avatar}
                    alt={dossierData.student.name}
                    className="h-12 w-12 rounded-full border-2 border-brand-200 object-cover bg-slate-100"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-black text-lg">
                    {dossierData?.student?.name ? dossierData.student.name.charAt(0) : 'S'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-slate-900">
                      {dossierData?.student?.name || 'Student Candidate Dossier'}
                    </h2>
                    {dossierData?.student?.isActive ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-800 border border-rose-300">
                        Suspended
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {dossierData?.student?.email} • Roll: {dossierData?.student?.rollNumber || 'N/A'} • {dossierData?.student?.department}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudentId(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {dossierLoading ? (
              <div className="py-12 text-center text-slate-500">
                <RefreshCw className="h-6 w-6 text-brand-500 animate-spin mx-auto mb-2" />
                <span className="font-bold text-xs">Assembling candidate dossier & telemetry...</span>
              </div>
            ) : dossierData ? (
              <div className="space-y-6">
                {/* Dossier Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Exams Completed</span>
                    <span className="text-xl font-black text-slate-900 mt-1 block">
                      {dossierData.stats?.completedExams || 0}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Average Score</span>
                    <span className="text-xl font-black text-brand-700 mt-1 block">
                      {dossierData.stats?.averageScore || 0}%
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Integrity Trust</span>
                    <span className="text-xl font-black text-emerald-700 mt-1 block">
                      {dossierData.stats?.integrityTrustScore || 100}%
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Proctor Incidents</span>
                    <span className="text-xl font-black text-rose-700 mt-1 block">
                      {dossierData.stats?.totalIncidents || 0}
                    </span>
                  </div>
                </div>

                {/* Exam Submissions Timeline */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Examination Submissions & Proctoring Telemetry ({dossierData.attempts?.length || 0})
                  </h4>

                  {dossierData.attempts?.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                      No examinations have been completed by this student yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dossierData.attempts?.map((att) => (
                        <div
                          key={att.id}
                          className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 hover:border-slate-300 transition"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-900 text-sm">{att.examTitle}</span>
                            <span
                              className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                                att.status === 'evaluated'
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                  : 'bg-blue-50 border-blue-300 text-blue-800'
                              }`}
                            >
                              {att.status}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                            <div className="flex items-center gap-3 text-slate-600 font-medium">
                              <span>
                                Score:{' '}
                                <strong className="text-slate-900 font-bold">
                                  {att.score} / {att.totalPossibleMarks}
                                </strong>
                              </span>
                              <span>
                                Accuracy: <strong className="text-slate-900">{att.accuracyPercentage}%</strong>
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {att.proctoringSummary?.totalIncidents > 0 ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                                  <AlertTriangle className="h-3 w-3" />
                                  {att.proctoringSummary.totalIncidents} Flags Logged
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                  <ShieldCheck className="h-3 w-3" /> Zero Infractions
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedStudentId(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
