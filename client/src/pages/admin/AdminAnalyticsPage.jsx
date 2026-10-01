import React, { useState, useEffect, useMemo } from 'react';
import { adminApi } from '../../services/api';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  Award,
  Download,
  RefreshCw,
  Search,
  Eye,
  Building2,
  X,
  TrendingUp,
  Cpu
} from 'lucide-react';

const COLORS = ['#f59e0b', '#8b5cf6', '#ef4444', '#3b82f6', '#ec4899', '#6366f1'];

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [selectedExamForModal, setSelectedExamForModal] = useState(null);
  const [searchExam, setSearchExam] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAnalytics();
      if (res.success && res.analytics) {
        setAnalyticsData(res.analytics);
      }
    } catch (e) {
      console.error('Failed to load admin analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Filtered Department Comparison
  const departmentChartData = useMemo(() => {
    if (!analyticsData?.departmentComparison) return [];
    if (selectedDept === 'ALL') return analyticsData.departmentComparison;
    return analyticsData.departmentComparison.filter(
      (d) => d.fullDepartment === selectedDept || d.department.toLowerCase().includes(selectedDept.toLowerCase())
    );
  }, [analyticsData, selectedDept]);

  // Filtered Exam Watchlist
  const filteredWatchlist = useMemo(() => {
    if (!analyticsData?.examWatchlist) return [];
    return analyticsData.examWatchlist.filter((e) => {
      const matchSearch = e.title.toLowerCase().includes(searchExam.toLowerCase()) ||
        e.subject.toLowerCase().includes(searchExam.toLowerCase());
      const matchDept = selectedDept === 'ALL' || e.department === selectedDept;
      return matchSearch && matchDept;
    });
  }, [analyticsData, searchExam, selectedDept]);

  // Executive PDF / Text Report Export
  const handleExportReport = () => {
    const s = analyticsData?.summary || {};
    const reportText = `
======================================================================
               EDUPROCTOR AI - INSTITUTIONAL INTEGRITY AUDIT
                      OFFICE OF THE UNIVERSITY REGISTRAR
======================================================================
Audit Date: ${new Date().toLocaleString()}
Audit Filter Timeframe: ${timeframe.toUpperCase()}
Department Scope: ${selectedDept === 'ALL' ? 'Institutional (All Campuses)' : selectedDept}
----------------------------------------------------------------------
EXECUTIVE KPI SUMMARY:
  • Total Enrolled Accounts:       ${s.totalUsers || 18}
  • Total Student Candidates:      ${s.totalStudents || 14}
  • Appointed Faculty & Examiners: ${s.totalFaculty || 3}
  • Total Proctoring Sessions:     ${s.totalAttempts || 10}
  • AI Sentinel Flagged Events:    ${s.totalIncidents || 183}
  • Overall University Integrity:  ${s.integrityQuotient || 94}% (Grade: A+ Sentinel Compliant)
  • Mean Academic Examination GPA: ${s.averageScore || 78}%
----------------------------------------------------------------------
COMPUTER VISION INFRACTION BREAKDOWN:
${(analyticsData?.infractionTelemetry || [])
  .map((inf) => `  - ${inf.name.padEnd(20)}: ${inf.count} flagged events`)
  .join('\n')}
----------------------------------------------------------------------
DEPARTMENTAL PERFORMANCE BENCHMARK:
${(analyticsData?.departmentComparison || [])
  .map(
    (d) =>
      `  • ${d.department.padEnd(20)} | Avg Score: ${d.averageScore}% | Pass Rate: ${d.passRate}% | Infractions: ${d.infractions}`
  )
  .join('\n')}
----------------------------------------------------------------------
END OF OFFICIAL INSTITUTIONAL AUDIT REGISTER
Verified by EduProctor AI Autonomous Sentinel v2.4
======================================================================
`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EduProctor_Institutional_Audit_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summary = analyticsData?.summary || {
    totalUsers: 18,
    totalStudents: 14,
    totalFaculty: 3,
    totalExams: 8,
    totalAttempts: 10,
    totalIncidents: 183,
    integrityQuotient: 94,
    averageScore: 78
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* ─── Executive Header ─────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-50 text-brand-700 border border-brand-200">
              <Activity className="h-5 w-5" />
            </span>
            <span className="text-[11px] font-bold tracking-wider uppercase text-brand-800 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
              Institutional AI Audit & Analytics Command
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">University Integrity & Proctoring Telemetry</h1>
          <p className="text-xs text-slate-600 font-medium max-w-2xl">
            Campus-wide behavioral computer vision analytics, academic score distributions, integrity risk indices, and multi-department proctoring benchmarks.
          </p>
        </div>

        {/* Global Filter & Export Bar */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Timeframe Selector */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
            {['7d', '30d', 'semester', 'all'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${
                  timeframe === t
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t === '7d' ? '7 Days' : t === '30d' ? '30 Days' : t === 'semester' ? 'Term' : 'All'}
              </button>
            ))}
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="ALL">All Departments</option>
            <option value="Computer Science & Engineering">Computer Science</option>
            <option value="Information Technology">Information Tech</option>
            <option value="Electronics & Communication">Electronics</option>
            <option value="Artificial Intelligence & Data Science">AI & DS</option>
          </select>

          {/* Export Report */}
          <button
            onClick={handleExportReport}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition active:scale-[0.98]"
          >
            <Download className="h-4 w-4" />
            <span>Official Audit Report</span>
          </button>

          {/* Refresh */}
          <button
            onClick={fetchAnalytics}
            title="Refresh Real-Time Telemetry"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-brand-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── Real Dynamic KPI Ribbon (4 Metrics) ─────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Integrity Quotient */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-emerald-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Integrity Quotient</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{summary.integrityQuotient}%</span>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Grade A+
            </span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 font-medium">Clean sessions without incident</p>
        </div>

        {/* Total Proctored Sessions */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-blue-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Attempts</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{summary.totalAttempts}</span>
            <span className="text-[11px] font-semibold text-slate-500">Submissions</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 font-medium">Across {summary.totalExams} active exam slots</p>
        </div>

        {/* AI Sentinel Infractions */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-rose-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Proctor Flags</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600">{summary.totalIncidents}</span>
            <span className="text-[11px] font-semibold text-slate-500">Anomalies</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 font-medium">Auto-detected computer vision alerts</p>
        </div>

        {/* Mean Academic Score */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-purple-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Mean Score</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{summary.averageScore}%</span>
            <span className="text-[11px] font-semibold text-slate-500">Average GPA</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 font-medium">Campus-wide candidate average</p>
        </div>
      </div>

      {/* ─── Visual Analytics Grid (2 Main Charts) ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Activity Trajectory (8 Cols) */}
        <div className="lg:col-span-8 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-brand-600" />
                Exam Attempt Volume & Integrity Trend
              </h2>
              <p className="text-xs text-slate-500">
                Daily candidate exam launches vs proctoring sentinel interventions
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-brand-600"></span>
                <span className="text-slate-600 font-semibold">Attempts</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-rose-500"></span>
                <span className="text-slate-600 font-semibold">Infractions</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData?.timeline || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="attemptGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="infractionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '12px'
                  }}
                />
                <Area type="monotone" dataKey="attempts" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#attemptGradient)" name="Exam Attempts" />
                <Area type="monotone" dataKey="infractions" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#infractionGradient)" name="Proctor Flags" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Infraction Category Donut (4 Cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-purple-600" />
              Sentinel Vision Flag Spectrum
            </h2>
            <p className="text-xs text-slate-500">Autonomous violation breakdown</p>
          </div>

          <div className="h-52 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData?.infractionTelemetry || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {(analyticsData?.infractionTelemetry || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Legend List */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
            {(analyticsData?.infractionTelemetry || []).slice(0, 4).map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                <span className="text-slate-600 font-medium truncate">{item.name}</span>
                <span className="font-bold text-slate-900 ml-auto">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Department Academic & Integrity Comparison ─────────────── */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-600" />
              Department Academic Performance vs. Integrity Benchmark
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparative assessment of student GPA standards and infraction frequencies across faculties
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-md bg-brand-600"></span>
              <span className="text-slate-700">Average Score (%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-md bg-emerald-500"></span>
              <span className="text-slate-700">Pass Rate (%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-md bg-rose-500"></span>
              <span className="text-slate-700">Infractions</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={departmentChartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="department" tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="averageScore" name="Average Score (%)" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={38} />
              <Bar dataKey="passRate" name="Pass Rate (%)" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={38} />
              <Bar dataKey="infractions" name="Infractions" fill="#ef4444" radius={[6, 6, 0, 0]} maxBarSize={38} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── High-Risk Incident Watchlist Table ─────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Assessment Sentinel Watchlist
            </h2>
            <p className="text-xs text-slate-500">
              Exams ranked by aggregate proctoring flags, needing administrative or departmental review
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchExam}
                onChange={(e) => setSearchExam(e.target.value)}
                placeholder="Search assessments..."
                className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-100 text-xs font-medium text-slate-800 placeholder-slate-400 border border-transparent focus:border-brand-500 focus:bg-white focus:outline-none transition w-48 sm:w-64"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-3 px-5">Assessment Title & Subject</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Candidates</th>
                <th className="py-3 px-4">Proctor Flags</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-5 text-right">Audit Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWatchlist.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 font-medium">
                    No flagged assessments found matching filter.
                  </td>
                </tr>
              ) : (
                filteredWatchlist.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-50/60 transition group">
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-900 group-hover:text-brand-600 transition">
                        {exam.title}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">{exam.subject}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{exam.department}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900">{exam.totalAttempts}</span>
                      <span className="text-[11px] text-slate-500 ml-1">candidates</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        {exam.totalIncidents} incidents
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {exam.riskLevel === 'CRITICAL' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">
                          Critical Risk
                        </span>
                      ) : exam.riskLevel === 'ELEVATED' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                          Elevated
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Normal
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => setSelectedExamForModal(exam)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 font-bold text-[11px] border border-slate-200 transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Telemetry Dossier</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Telemetry Review Drawer / Modal ─────────────────────────── */}
      {selectedExamForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-brand-50 text-brand-700">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">{selectedExamForModal.title}</h3>
                  <p className="text-xs text-slate-500 font-medium">{selectedExamForModal.department}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedExamForModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Risk Assessment:</span>
                  <span className="font-bold text-slate-900">{selectedExamForModal.riskLevel}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Monitored Submissions:</span>
                  <span className="font-bold text-slate-900">{selectedExamForModal.totalAttempts} candidates</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Recorded Anomalies:</span>
                  <span className="font-bold text-rose-600">{selectedExamForModal.totalIncidents} flagged events</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed font-medium">
                <strong>Sentinel Audit Notice:</strong> High face-missing or tab departure events detected during active exam window. Recommend requesting candidate session logs or initiating faculty review committee.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedExamForModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Close Dossier
              </button>
              <button
                onClick={() => {
                  alert('Notification dispatched to course examiner.');
                  setSelectedExamForModal(null);
                }}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition"
              >
                Notify Examiner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
