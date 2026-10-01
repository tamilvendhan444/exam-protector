import React, { useState, useEffect, useMemo } from 'react';
import { facultyApi, adminApi } from '../../services/api';
import {
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Award,
  BookOpen,
  FileCheck,
  AlertTriangle,
  GraduationCap,
  X,
  ExternalLink,
  RefreshCw,
  Eye,
  UserX,
  UserCheck,
  Clock,
  Filter,
  ArrowUpDown,
  Mail,
  Hash,
  ChevronRight
} from 'lucide-react';

export default function FacultyStudentsPage() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');

  // Dossier Modal State
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [dossierData, setDossierData] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sRes, uRes] = await Promise.all([
        facultyApi.getDashboard(),
        facultyApi.getStudents({ search: search || undefined })
      ]);
      if (sRes.success) setStats(sRes.stats);
      if (uRes.success) setUsers(uRes.students || []);
    } catch (e) {
      console.error('Failed to load faculty students data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  // Extract available departments
  const availableDepartments = useMemo(() => {
    const set = new Set();
    users.forEach((u) => {
      if (u.department) set.add(u.department);
    });
    return Array.from(set);
  }, [users]);

  // Filtered and sorted users
  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        if (departmentFilter && u.department !== departmentFilter) return false;
        if (statusFilter === 'active' && !u.isActive) return false;
        if (statusFilter === 'suspended' && u.isActive) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
        if (sortBy === 'exams') return (b.examsCompleted || 0) - (a.examsCompleted || 0);
        if (sortBy === 'recent') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        if (sortBy === 'roll') return (a.rollNumber || '').localeCompare(b.rollNumber || '');
        return 0;
      });
  }, [users, departmentFilter, statusFilter, sortBy]);

  // Open Student Dossier
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
      console.error('Error fetching dossier:', e);
      alert('Could not retrieve student dossier');
    } finally {
      setDossierLoading(false);
    }
  };

  // Toggle user active status
  const handleToggleStatus = async (student) => {
    const action = student.isActive ? 'suspend' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} ${student.name}'s account?`)) return;

    try {
      const res = await adminApi.toggleUserStatus(student.id);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === student.id ? { ...u, isActive: !u.isActive } : u))
        );
      } else {
        alert(res.message || `Failed to ${action} student.`);
      }
    } catch (e) {
      alert(`Error toggling status: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* ─── Executive Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-50 text-brand-600 border border-brand-200">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="text-[11px] font-bold tracking-wider uppercase text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
              Cohort Intelligence
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Directory & Profiles</h1>
          <p className="text-xs text-slate-600 font-medium max-w-2xl">
            Monitor registered examinees, inspect verified roll credentials, track examination completions, and view automated proctoring trust dossiers.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition self-start sm:self-auto shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-brand-600' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* ─── Executive KPI Stat Cards (4 Metrics) ────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-brand-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Enrolled Cohort</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats?.totalStudents || users.length}</span>
            <span className="text-[11px] font-semibold text-slate-600">Students</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 font-medium">All registered examinees</p>
        </div>

        {/* Active Exams */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Exams</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-800">{stats?.activeExams || 0}</span>
            <span className="text-[11px] font-bold text-emerald-700">Live Slots</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 font-medium">Under active AI sentinel</p>
        </div>

        {/* Total Submissions */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Submissions</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
              <FileCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-900">{stats?.totalAttempts || 0}</span>
            <span className="text-[11px] font-bold text-blue-700">Attempts</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 font-medium">Graded & archived attempts</p>
        </div>

        {/* Incidents Logged */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-rose-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Proctor Flags</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-100">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-800">{stats?.totalIncidents || 0}</span>
            <span className="text-[11px] font-bold text-rose-700">Incidents</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 font-medium">Across all exam sessions</p>
        </div>
      </div>

      {/* ─── Control Bar: Filters, Search, and Sorting ──────────────── */}
      <div className="space-y-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {[
              { id: '', label: 'All Candidates', count: users.length },
              { id: 'active', label: 'Active Examinees', count: users.filter((u) => u.isActive).length },
              { id: 'suspended', label: 'Suspended', count: users.filter((u) => !u.isActive).length }
            ].map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
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

          <div className="text-xs text-slate-600 font-semibold">
            Showing <span className="text-slate-900 font-bold">{filteredUsers.length}</span> students
          </div>
        </div>

        {/* Dropdowns, Search, and Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Department Filter */}
            {availableDepartments.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                <span className="text-slate-600 font-bold">Department:</span>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="">All Departments</option>
                  {availableDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sorting */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <span className="text-slate-600 font-bold">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
              >
                <option value="name">Name (A - Z)</option>
                <option value="exams">Exams Completed (High - Low)</option>
                <option value="roll">Roll Number</option>
                <option value="recent">Recently Registered</option>
              </select>
            </div>

            {/* Reset Filters */}
            {(departmentFilter || statusFilter || search) && (
              <button
                onClick={() => {
                  setDepartmentFilter('');
                  setStatusFilter('');
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
              placeholder="Search by name, roll no, email..."
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
                <th className="py-3.5 px-4">Department & Roll</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4 text-center">Exams Completed</th>
                <th className="py-3.5 px-4">Most Recent Assessment</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <RefreshCw className="h-6 w-6 text-brand-500 animate-spin mx-auto mb-2" />
                    <span className="font-bold">Loading student records...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">No students match your search criteria</p>
                    <p className="text-[11px] text-slate-500 mt-1">Try clearing filters or checking spelling</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const avatarSrc =
                    u.avatar ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.email || u.name)}`;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Candidate Name & Email */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={avatarSrc}
                            alt={u.name}
                            className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 object-cover shrink-0"
                            onError={(e) => {
                              e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                                u.name
                              )}`;
                            }}
                          />
                          <div>
                            <span className="font-extrabold text-slate-900 text-sm block">{u.name}</span>
                            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                              <Mail className="h-3 w-3 text-slate-400" />
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Department & Roll No */}
                      <td className="py-4 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[11px]">
                          {u.department || 'Computer Science'}
                        </span>
                        {u.rollNumber && (
                          <span className="text-[11px] text-slate-500 font-medium block mt-1">
                            Roll: <span className="font-mono font-bold text-slate-700">{u.rollNumber}</span>
                          </span>
                        )}
                      </td>

                      {/* Status Badge (WCAG AAA High Contrast) */}
                      <td className="py-4 px-4">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-rose-50 text-rose-800 border border-rose-300">
                            <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                            Suspended
                          </span>
                        )}
                      </td>

                      {/* Exams Completed */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black bg-brand-50 text-brand-700 border border-brand-200">
                          <Award className="h-3.5 w-3.5 text-brand-600" />
                          {u.examsCompleted || 0}
                        </span>
                      </td>

                      {/* Recent Assessment */}
                      <td className="py-4 px-4">
                        {u.mostRecentExam ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 truncate max-w-[180px] block">
                              {u.mostRecentExam.title}
                            </span>
                            <div className="text-[11px] text-slate-500 font-medium">
                              Score:{' '}
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                {u.mostRecentExam.score} / {u.mostRecentExam.total} pts
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium italic">No submissions yet</span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenDossier(u.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-sm transition"
                            title="Inspect Academic & Integrity Dossier"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View Dossier</span>
                          </button>

                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`p-1.5 rounded-xl text-xs font-bold transition ${
                              u.isActive
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={u.isActive ? 'Suspend Examinee' : 'Activate Examinee'}
                          >
                            {u.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
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
                      {dossierData?.student?.name || 'Student Dossier'}
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
