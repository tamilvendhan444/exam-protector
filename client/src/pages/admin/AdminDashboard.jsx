import React, { useState, useEffect, useMemo } from 'react';
import { adminApi, authApi } from '../../services/api';
import {
  Users,
  ShieldAlert,
  FileCode2,
  Award,
  Activity,
  UserCheck,
  UserX,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Server,
  Database,
  Radio,
  RefreshCw,
  Mail,
  X,
  Shield,
  Smartphone,
  Eye,
  Sliders,
  Check,
  Cpu,
  Edit,
  GraduationCap,
  Plus,
  Download,
  Building2,
  Lock,
  UserPlus
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [search, setSearch] = useState('');

  // Role Edit Modal
  const [selectedUserForRole, setSelectedUserForRole] = useState(null);
  const [newRole, setNewRole] = useState('STUDENT');
  const [newDept, setNewDept] = useState('');
  const [updatingRole, setUpdatingRole] = useState(false);

  // Create User Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT',
    department: 'Computer Science',
    rollNumber: ''
  });
  const [creatingUser, setCreatingUser] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sRes, uRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getUsers({ role: roleFilter || undefined, search: search || undefined })
      ]);
      if (sRes.success) setStats(sRes.stats);
      if (uRes.success) setUsers(uRes.users || []);
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [roleFilter, search]);

  const handleToggleStatus = async (id, currentStatus, name) => {
    const action = currentStatus ? 'suspend' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} user "${name}"?`)) return;

    try {
      await adminApi.toggleUserStatus(id);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, isActive: !u.isActive } : u))
      );
    } catch (e) {
      alert('Error updating user status: ' + e.message);
    }
  };

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
        setUsers((prev) =>
          prev.map((u) =>
            u.id === selectedUserForRole.id
              ? { ...u, role: newRole, department: newDept }
              : u
          )
        );
        setSelectedUserForRole(null);
      } else {
        alert(res.message || 'Failed to update role');
      }
    } catch (err) {
      alert('Error changing role: ' + err.message);
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    setCreatingUser(true);
    try {
      const res = await authApi.register(newUser);
      if (res.success) {
        setCreateModalOpen(false);
        setNewUser({
          name: '',
          email: '',
          password: '',
          role: 'STUDENT',
          department: 'Computer Science',
          rollNumber: ''
        });
        loadData();
      } else {
        alert(res.message || 'Failed to create user');
      }
    } catch (err) {
      alert('Error creating user: ' + err.message);
    } finally {
      setCreatingUser(false);
    }
  };

  // Export Users to CSV
  const handleExportCSV = () => {
    if (users.length === 0) return;
    const headers = ['ID', 'Name', 'Email', 'Role', 'Department', 'RollNumber', 'Status', 'CreatedAt'];
    const rows = users.map((u) => [
      u.id,
      `"${u.name}"`,
      `"${u.email}"`,
      u.role,
      `"${u.department || 'General'}"`,
      `"${u.rollNumber || 'N/A'}"`,
      u.isActive ? 'Active' : 'Suspended',
      u.createdAt || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EduProctor_User_Directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Unique departments for filter
  const departmentsList = useMemo(() => {
    const set = new Set();
    users.forEach((u) => {
      if (u.department && u.department !== 'General') set.add(u.department);
    });
    return Array.from(set);
  }, [users]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (statusFilter === 'active' && !u.isActive) return false;
      if (statusFilter === 'suspended' && u.isActive) return false;
      if (deptFilter && u.department !== deptFilter) return false;
      return true;
    });
  }, [users, statusFilter, deptFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* ─── Executive Header & Infrastructure Telemetry ─────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-50 text-brand-600 border border-brand-200">
              <Shield className="h-5 w-5" />
            </span>
            <span className="text-[11px] font-bold tracking-wider uppercase text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
              Institutional Command Center
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Administration Console</h1>
          <p className="text-xs text-slate-600 font-medium max-w-2xl">
            Global access orchestration, role authorization governance, platform telemetry, and campus-wide proctoring audit registers.
          </p>
        </div>

        {/* Live Infrastructure Status Pills & Primary Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold text-slate-700">Cluster:</span>
            <span className="font-black text-emerald-800">Operational</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <Radio className="h-3.5 w-3.5 text-brand-600 animate-pulse" />
            <span className="font-bold text-slate-700">Gateway:</span>
            <span className="font-black text-brand-700">Port 5000 Synced</span>
          </div>

          {/* Create User Button */}
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition active:scale-[0.98]"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Add User</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition"
            title="Export User Directory to CSV"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={loadData}
            title="Refresh System Telemetry"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-brand-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── Real Dynamic KPI Ribbon (WCAG AAA High Contrast) ────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-brand-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Enrolled Users</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats?.totalUsers || users.length}</span>
            <span className="text-[11px] font-semibold text-slate-500">Accounts</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 font-medium">
            {stats?.studentsCount || 0} Students • {stats?.facultyCount || 0} Faculty
          </p>
        </div>

        {/* Active Exams */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-emerald-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Exams</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-800">{stats?.activeExamsCount || 0}</span>
            <span className="text-[11px] font-bold text-emerald-700">Live Slots</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 font-medium">Under active AI sentinel</p>
        </div>

        {/* Total Submissions */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-blue-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Attempt Records</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-900">{stats?.totalAttempts || 0}</span>
            <span className="text-[11px] font-bold text-blue-700">Submissions</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 font-medium">Graded & archived attempts</p>
        </div>

        {/* Incidents Logged */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-rose-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Proctor Flags</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-800">{stats?.totalIncidents || 0}</span>
            <span className="text-[11px] font-bold text-rose-700">Infractions</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 font-medium">University-wide sentinel alerts</p>
        </div>
      </div>

      {/* ─── Incident Telemetry Breakdown Banner ─────────────────────── */}
      {stats?.incidentsByType && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                System-Wide Infraction Telemetry by Category
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">Automated Computer Vision Detections</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200">
              <span className="text-[10px] font-bold uppercase text-rose-700 block">Mobile Phones</span>
              <span className="text-xl font-black text-rose-900 mt-1 block">
                {stats.incidentsByType.mobilePhone || 0}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
              <span className="text-[10px] font-bold uppercase text-amber-700 block">Multiple Faces</span>
              <span className="text-xl font-black text-amber-900 mt-1 block">
                {stats.incidentsByType.multipleFaces || 0}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
              <span className="text-[10px] font-bold uppercase text-amber-700 block">Face Missing</span>
              <span className="text-xl font-black text-amber-900 mt-1 block">
                {stats.incidentsByType.faceMissing || 0}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200">
              <span className="text-[10px] font-bold uppercase text-blue-700 block">Gaze Deviation</span>
              <span className="text-xl font-black text-blue-900 mt-1 block">
                {stats.incidentsByType.lookingAway || 0}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200">
              <span className="text-[10px] font-bold uppercase text-purple-700 block">Tab Departures</span>
              <span className="text-xl font-black text-purple-900 mt-1 block">
                {stats.incidentsByType.tabSwitch || 0}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─── User Management Directory ──────────────────────────────── */}
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
          {/* Role Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {[
                { id: '', label: 'All Accounts', count: users.length },
                { id: 'STUDENT', label: 'Students', count: users.filter((u) => u.role === 'STUDENT').length },
                { id: 'FACULTY', label: 'Faculty', count: users.filter((u) => u.role === 'FACULTY').length },
                { id: 'ADMIN', label: 'Administrators', count: users.filter((u) => u.role === 'ADMIN').length }
              ].map((tab) => {
                const isActive = roleFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setRoleFilter(tab.id)}
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
              Displaying <strong className="text-slate-900 font-black">{filteredUsers.length}</strong> matching accounts
            </div>
          </div>

          {/* Search, Department & Status Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {/* Department Filter */}
              {departmentsList.length > 0 && (
                <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-bold">Dept:</span>
                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="">All Departments</option>
                    {departmentsList.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-bold">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="suspended">Suspended Only</option>
                </select>
              </div>

              {(roleFilter || statusFilter || deptFilter || search) && (
                <button
                  onClick={() => {
                    setRoleFilter('');
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

            {/* Live Search */}
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

        {/* User Table (WCAG AAA High Contrast) */}
        <div className="rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-700 border-b border-slate-200 font-extrabold">
                <tr>
                  <th className="py-3.5 px-5">User Account</th>
                  <th className="py-3.5 px-4">Role Access</th>
                  <th className="py-3.5 px-4">Department & Roll</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      <RefreshCw className="h-6 w-6 text-brand-500 animate-spin mx-auto mb-2" />
                      <span className="font-bold text-xs">Querying administrative user records...</span>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-slate-700">No user accounts found matching your criteria</p>
                      <p className="text-[11px] text-slate-500 mt-1">Try resetting the filters or checking spelling</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const avatarSrc =
                      u.avatar ||
                      `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.email || u.name)}`;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* User Profile */}
                        <td className="py-3.5 px-5">
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

                        {/* Role Badge */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider border ${
                              u.role === 'ADMIN'
                                ? 'bg-rose-50 text-rose-800 border-rose-300'
                                : u.role === 'FACULTY'
                                ? 'bg-amber-50 text-amber-900 border-amber-300'
                                : 'bg-indigo-50 text-indigo-800 border-indigo-300'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>

                        {/* Department */}
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[11px]">
                            {u.department || 'General'}
                          </span>
                          {u.rollNumber && (
                            <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                              Roll: {u.rollNumber}
                            </span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4">
                          {u.isActive ? (
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

                        {/* Action Buttons */}
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Role Edit Button */}
                            <button
                              onClick={() => {
                                setSelectedUserForRole(u);
                                setNewRole(u.role);
                                setNewDept(u.department || 'Computer Science');
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition"
                              title="Edit Role / Department"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              <span>Role</span>
                            </button>

                            {/* Status Toggle Button */}
                            <button
                              onClick={() => handleToggleStatus(u.id, u.isActive, u.name)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                                u.isActive
                                  ? 'bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-200'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              }`}
                            >
                              {u.isActive ? 'Deactivate' : 'Activate'}
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
      </div>

      {/* ─── Add User Account Modal ──────────────────────────────────── */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Enroll New Institutional User</h3>
                <p className="text-xs text-slate-500">
                  Create student, faculty, or administrative credentials.
                </p>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="e.g. Marie Curie"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1">Institutional Email *</label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="curie@eduproctor.ai"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1">System Role Access *</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-brand-500"
                  >
                    <option value="STUDENT">STUDENT (Candidate)</option>
                    <option value="FACULTY">FACULTY (Examiner)</option>
                    <option value="ADMIN">ADMIN (System Governance)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Academic Department</label>
                  <input
                    type="text"
                    value={newUser.department}
                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                    placeholder="Computer Science"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1">Roll / Employee Number</label>
                  <input
                    type="text"
                    value={newUser.rollNumber}
                    onChange={(e) => setNewUser({ ...newUser, rollNumber: e.target.value })}
                    placeholder="CS-2026-99"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/20 disabled:opacity-50 transition"
                >
                  {creatingUser ? 'Creating Account...' : 'Enroll Account'}
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
                <h3 className="text-base font-black text-slate-900">Modify User Authorization</h3>
                <p className="text-xs text-slate-500">
                  Update role privileges for {selectedUserForRole.name}
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
                  <option value="STUDENT">STUDENT (Examination Candidate)</option>
                  <option value="FACULTY">FACULTY (Examiner & Proctor)</option>
                  <option value="ADMIN">ADMIN (Full Platform Governance)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">Department Assignment</label>
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
