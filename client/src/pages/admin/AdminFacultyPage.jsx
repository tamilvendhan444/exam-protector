import React, { useState, useEffect, useMemo } from 'react';
import { adminApi, authApi, examApi } from '../../services/api';
import {
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
  Briefcase,
  FileText,
  BookOpen,
  Edit,
  GraduationCap
} from 'lucide-react';

export default function AdminFacultyPage() {
  const [faculty, setFaculty] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [search, setSearch] = useState('');

  // Enroll Faculty Modal State
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [newFaculty, setNewFaculty] = useState({
    name: '',
    email: '',
    password: '',
    department: 'Computer Science & Engineering',
    role: 'FACULTY'
  });

  // Edit Role Modal State
  const [selectedUserForRole, setSelectedUserForRole] = useState(null);
  const [newRole, setNewRole] = useState('FACULTY');
  const [newDept, setNewDept] = useState('');
  const [updatingRole, setUpdatingRole] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [uRes, eRes] = await Promise.all([
        adminApi.getUsers({ role: 'FACULTY', search: search || undefined }),
        examApi.getAll()
      ]);
      if (uRes.success) setFaculty(uRes.users || []);
      if (eRes.success) setExams(eRes.exams || []);
    } catch (e) {
      console.error('Failed to load faculty data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  // Extract unique departments
  const availableDepartments = useMemo(() => {
    const set = new Set();
    faculty.forEach((f) => {
      if (f.department && f.department !== 'General') set.add(f.department);
    });
    return Array.from(set);
  }, [faculty]);

  // Filtered Faculty
  const filteredFaculty = useMemo(() => {
    return faculty.filter((f) => {
      if (statusFilter === 'active' && !f.isActive) return false;
      if (statusFilter === 'suspended' && f.isActive) return false;
      if (deptFilter && f.department !== deptFilter) return false;
      return true;
    });
  }, [faculty, statusFilter, deptFilter]);

  // KPI Calculations
  const stats = useMemo(() => {
    const total = faculty.length;
    const active = faculty.filter((f) => f.isActive).length;
    const suspended = total - active;
    const totalExams = exams.length;
    return { total, active, suspended, totalExams };
  }, [faculty, exams]);

  // Toggle user activation
  const handleToggleStatus = async (user) => {
    const action = user.isActive ? 'suspend' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} faculty member "${user.name}"?`)) return;

    try {
      await adminApi.toggleUserStatus(user.id);
      setFaculty((prev) =>
        prev.map((f) => (f.id === user.id ? { ...f, isActive: !f.isActive } : f))
      );
    } catch (e) {
      alert('Error updating faculty status: ' + e.message);
    }
  };

  // Enroll Faculty Submit
  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    setEnrolling(true);
    try {
      const res = await authApi.register({ ...newFaculty, role: 'FACULTY' });
      if (res.success) {
        setEnrollModalOpen(false);
        setNewFaculty({
          name: '',
          email: '',
          password: '',
          department: 'Computer Science & Engineering',
          role: 'FACULTY'
        });
        loadData();
      } else {
        alert(res.message || 'Failed to enroll faculty');
      }
    } catch (err) {
      alert('Error enrolling faculty: ' + err.message);
    } finally {
      setEnrolling(false);
    }
  };

  // Save Role / Department Edit
  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!selectedUserForRole) return;
    setUpdatingRole(true);
    try {
      const res = await adminApi.updateUserRole(selectedUserForRole.id, {
        role: newRole,
        department: newDept
      });
      if (res.success) {
        setSelectedUserForRole(null);
        loadData();
      } else {
        alert(res.message || 'Failed to update role');
      }
    } catch (err) {
      alert('Error updating role: ' + err.message);
    } finally {
      setUpdatingRole(false);
    }
  };

  // Export Faculty CSV
  const handleExportCSV = () => {
    if (faculty.length === 0) return;
    const headers = ['Name', 'Email', 'Role', 'Department', 'Status', 'AppointedDate'];
    const rows = faculty.map((f) => [
      `"${f.name}"`,
      `"${f.email}"`,
      f.role,
      `"${f.department || 'Computer Science'}"`,
      f.isActive ? 'Active' : 'Suspended',
      f.createdAt || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EduProctor_Faculty_Directory_${new Date().toISOString().split('T')[0]}.csv`);
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
            <span className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Briefcase className="h-5 w-5" />
            </span>
            <span className="text-[11px] font-bold tracking-wider uppercase text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Faculty & Examiner Governance
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Academic Faculty Directory</h1>
          <p className="text-xs text-slate-600 font-medium max-w-2xl">
            Oversee appointed academic professors, course examiners, assessment authors, and departmental proctoring leaders across university faculties.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setEnrollModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition active:scale-[0.98]"
          >
            <UserPlus className="h-4 w-4" />
            <span>Appoint Faculty</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition"
            title="Export Faculty Directory to CSV"
          >
            <Download className="h-4 w-4" />
            <span>Export Roster</span>
          </button>

          <button
            onClick={loadData}
            title="Refresh Faculty Roster"
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-brand-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── Real Dynamic KPI Ribbon (4 Metrics) ─────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Appointed Faculty */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-amber-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Appointed Faculty</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.total}</span>
            <span className="text-[11px] font-semibold text-slate-500">Professors</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 font-medium">Authorized course examiners</p>
        </div>

        {/* Active Standing */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-emerald-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Status</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-800">{stats.active}</span>
            <span className="text-[11px] font-bold text-emerald-700">Accredited</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 font-medium">{stats.suspended} Suspended credentials</p>
        </div>

        {/* Curated Assessments */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-blue-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Curated Exams</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-900">{stats.totalExams}</span>
            <span className="text-[11px] font-bold text-blue-700">Assessments</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 font-medium">Published & scheduled slots</p>
        </div>

        {/* Departments Represented */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-brand-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Departments</span>
            <div className="p-2 rounded-xl bg-brand-50 text-brand-700">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-brand-800">{Math.max(1, availableDepartments.length)}</span>
            <span className="text-[11px] font-bold text-brand-700">Colleges</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 font-medium">Cross-disciplinary coverage</p>
        </div>
      </div>

      {/* ─── Filter & Search Toolbar ─────────────────────────────────── */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {[
              { id: '', label: 'All Faculty', count: faculty.length },
              { id: 'active', label: 'Active Examiners', count: stats.active },
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
            Showing <strong className="text-slate-900 font-black">{filteredFaculty.length}</strong> faculty members
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
              placeholder="Search faculty by name or email..."
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

      {/* ─── High-Contrast Faculty Table ────────────────────────────── */}
      <div className="rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-700 border-b border-slate-200 font-extrabold">
              <tr>
                <th className="py-3.5 px-5">Faculty Member</th>
                <th className="py-3.5 px-4">Academic Role</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Accreditation Status</th>
                <th className="py-3.5 px-4">Appointed Date</th>
                <th className="py-3.5 px-5 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <RefreshCw className="h-6 w-6 text-brand-500 animate-spin mx-auto mb-2" />
                    <span className="font-bold text-xs">Querying faculty registers...</span>
                  </td>
                </tr>
              ) : filteredFaculty.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Briefcase className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">No faculty members found matching your criteria</p>
                    <p className="text-[11px] text-slate-500 mt-1">Try clearing filters or appointing a new faculty member</p>
                  </td>
                </tr>
              ) : (
                filteredFaculty.map((f) => {
                  const avatarSrc =
                    f.avatar ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(f.email || f.name)}`;

                  return (
                    <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Email */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={avatarSrc}
                            alt={f.name}
                            className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 object-cover shrink-0"
                            onError={(e) => {
                              e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                                f.name
                              )}`;
                            }}
                          />
                          <div>
                            <span className="font-extrabold text-slate-900 text-sm block">{f.name}</span>
                            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                              <Mail className="h-3 w-3 text-slate-400" />
                              {f.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Academic Role */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider border bg-amber-50 text-amber-900 border-amber-300">
                          FACULTY EXAMINER
                        </span>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[11px]">
                          {f.department || 'Computer Science & Engineering'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {f.isActive ? (
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

                      {/* Appointed Date */}
                      <td className="py-3.5 px-4 font-medium text-slate-600">
                        {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : 'Active Term'}
                      </td>

                      {/* Action Suite */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedUserForRole(f);
                              setNewRole(f.role);
                              setNewDept(f.department || 'Computer Science & Engineering');
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition"
                            title="Edit Role / Department"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span>Role</span>
                          </button>

                          <button
                            onClick={() => handleToggleStatus(f)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                              f.isActive
                                ? 'bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-200'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            }`}
                            title={f.isActive ? 'Suspend Faculty Credentials' : 'Activate Credentials'}
                          >
                            {f.isActive ? 'Deactivate' : 'Activate'}
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

      {/* ─── Appoint Faculty Modal ───────────────────────────────────── */}
      {enrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Appoint Academic Faculty Member</h3>
                <p className="text-xs text-slate-500">
                  Provision new faculty examiner credentials with course creation authorization.
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
                  <label className="block text-slate-800 font-bold mb-1">Faculty Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newFaculty.name}
                    onChange={(e) => setNewFaculty({ ...newFaculty, name: e.target.value })}
                    placeholder="e.g. Prof. Donald Knuth"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1">Academic Department *</label>
                  <input
                    type="text"
                    required
                    value={newFaculty.department}
                    onChange={(e) => setNewFaculty({ ...newFaculty, department: e.target.value })}
                    placeholder="Computer Science"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">Official Faculty Email *</label>
                <input
                  type="email"
                  required
                  value={newFaculty.email}
                  onChange={(e) => setNewFaculty({ ...newFaculty, email: e.target.value })}
                  placeholder="knuth@eduproctor.ai"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">Account Password *</label>
                <input
                  type="password"
                  required
                  value={newFaculty.password}
                  onChange={(e) => setNewFaculty({ ...newFaculty, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-brand-500"
                />
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
                  {enrolling ? 'Appointing Examiner...' : 'Appoint Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Role / Authorization Edit Modal ─────────────────────────── */}
      {selectedUserForRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Modify Faculty Privileges</h3>
                <p className="text-xs text-slate-500">
                  Update role authorization for {selectedUserForRole.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedUserForRole(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-800 font-bold mb-1">Target Account</label>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold">
                  {selectedUserForRole.name} ({selectedUserForRole.email})
                </div>
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">System Role Access</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:border-brand-500"
                >
                  <option value="FACULTY">FACULTY (Course Examiner & Proctor)</option>
                  <option value="ADMIN">ADMIN (Institutional System Governance)</option>
                  <option value="STUDENT">STUDENT (Demote to Candidate)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">Assigned Department</label>
                <input
                  type="text"
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  placeholder="e.g. Computer Science & Engineering"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedUserForRole(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingRole}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/20 disabled:opacity-50 transition"
                >
                  {updatingRole ? 'Updating Role...' : 'Save Privileges'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
