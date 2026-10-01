import React, { useState, useEffect, useMemo } from 'react';
import { facultyApi, examApi } from '../../services/api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Download,
  Users,
  Award,
  Trophy,
  Building2,
  GraduationCap,
  BookOpen,
  Filter,
  Search,
  RefreshCw,
  X,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Layers,
  Sparkles,
  PieChart as PieChartIcon,
  Percent,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';

// Custom Tooltip for Recharts
const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1">
        <p className="font-extrabold text-brand-300 text-sm">{label}</p>
        {payload.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4 text-[11px]">
            <span style={{ color: item.color }} className="font-bold">
              {item.name}:
            </span>
            <span className="font-mono font-black">{item.value}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CustomAreaTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1">
        <p className="font-extrabold text-slate-300 text-[11px]">{label}</p>
        <p className="text-sm font-black text-emerald-400">
          Score: {payload[0].value} pts
        </p>
        {payload[0].payload?.name && (
          <p className="text-[10px] text-slate-400">{payload[0].payload.name} ({payload[0].payload.dept})</p>
        )}
      </div>
    );
  }
  return null;
};

export default function FacultyAnalyticsPage() {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);

  // Filters & State
  const [selectedDept, setSelectedDept] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('rank');
  const [downloadingDept, setDownloadingDept] = useState(null);
  const [activeChartTab, setActiveChartTab] = useState('overview'); // 'overview' | 'curve' | 'grades'

  // 1. Fetch available exams
  useEffect(() => {
    async function loadExams() {
      try {
        setLoading(true);
        const res = await examApi.getAll();
        if (res.success && res.exams.length > 0) {
          setExams(res.exams);
          setSelectedExamId(res.exams[0]._id || res.exams[0].id);
        }
      } catch (err) {
        console.error('Failed to load exams:', err);
      } finally {
        setLoading(false);
      }
    }
    loadExams();
  }, []);

  // 2. Fetch analytics & report
  const loadExamAnalytics = async () => {
    if (!selectedExamId) return;
    try {
      setReportLoading(true);
      const [anaRes, repRes] = await Promise.all([
        facultyApi.getAnalytics(selectedExamId),
        facultyApi.getResultsReport(selectedExamId)
      ]);

      if (anaRes.success) setAnalytics(anaRes.metrics || {});
      if (repRes.success) setReportData(repRes.report || []);
    } catch (e) {
      console.error('Error fetching analytics:', e);
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    loadExamAnalytics();
  }, [selectedExamId]);

  const selectedExam = exams.find((e) => (e._id || e.id) === selectedExamId);

  // Unique departments present in submissions
  const departmentsList = useMemo(() => {
    const set = new Set();
    reportData.forEach((row) => {
      if (row.department && row.department !== 'N/A') set.add(row.department);
    });
    return Array.from(set);
  }, [reportData]);

  // Aggregate stats by department
  const departmentStats = useMemo(() => {
    const map = {};
    reportData.forEach((row) => {
      const dept = row.department || 'Computer Science';
      if (!map[dept]) {
        map[dept] = {
          name: dept,
          candidates: 0,
          totalScore: 0,
          maxScore: 0,
          passCount: 0,
          topStudent: null
        };
      }
      map[dept].candidates += 1;
      map[dept].totalScore += row.finalScore || 0;
      if (row.finalScore > map[dept].maxScore) {
        map[dept].maxScore = row.finalScore;
        map[dept].topStudent = row.name;
      }
      if (row.finalScore >= (row.totalQuestions * 0.5 * 10)) {
        map[dept].passCount += 1;
      }
    });

    const totalMarks = selectedExam?.totalMarks || 50;

    return Object.values(map).map((d) => {
      const avgScoreNum = d.candidates > 0 ? (d.totalScore / d.candidates) : 0;
      const avgScorePercent = totalMarks > 0 ? Math.round((avgScoreNum / totalMarks) * 100) : 0;
      const passRate = d.candidates > 0 ? Math.round((d.passCount / d.candidates) * 100) : 0;

      return {
        ...d,
        averageScore: avgScoreNum.toFixed(1),
        averageScorePercent,
        passRate
      };
    });
  }, [reportData, selectedExam]);

  // Recharts Data: Department Comparison Bar Chart
  const barChartData = useMemo(() => {
    if (departmentStats.length === 0) {
      // Default placeholder if empty
      return [
        { dept: 'Computer Science', average: 0, passRate: 0 },
        { dept: 'Information Tech', average: 0, passRate: 0 },
        { dept: 'AI & Data Science', average: 0, passRate: 0 }
      ];
    }
    return departmentStats.map((d) => ({
      dept: d.name.length > 15 ? d.name.substring(0, 13) + '..' : d.name,
      fullName: d.name,
      average: d.averageScorePercent,
      passRate: d.passRate,
      candidates: d.candidates
    }));
  }, [departmentStats]);

  // Recharts Data: Candidate Score Curve (Smoothed Area Chart)
  const scoreCurveData = useMemo(() => {
    if (reportData.length === 0) return [];
    // Sort ascending by final score to create distribution curve
    const sorted = [...reportData].sort((a, b) => (a.finalScore || 0) - (b.finalScore || 0));
    return sorted.map((item, index) => ({
      index: index + 1,
      percentile: `Percentile ${Math.round(((index + 1) / sorted.length) * 100)}%`,
      score: item.finalScore || 0,
      name: item.name,
      dept: item.department
    }));
  }, [reportData]);

  // Grade Spectrum Pie / Donut Data
  const gradePieData = useMemo(() => {
    let distinction = 0; // >= 85%
    let firstClass = 0;  // 70% - 84%
    let secondClass = 0; // 50% - 69%
    let remedial = 0;    // < 50%

    const totalPossible = selectedExam?.totalMarks || 50;

    reportData.forEach((row) => {
      const percent = totalPossible > 0 ? ((row.finalScore || 0) / totalPossible) * 100 : 0;
      if (percent >= 85) distinction++;
      else if (percent >= 70) firstClass++;
      else if (percent >= 50) secondClass++;
      else remedial++;
    });

    return [
      { name: 'Distinction (85%+)', value: distinction, color: '#10b981' },
      { name: 'First Class (70-84%)', value: firstClass, color: '#3b82f6' },
      { name: 'Second Class (50-69%)', value: secondClass, color: '#f59e0b' },
      { name: 'Remedial (< 50%)', value: remedial, color: '#f43f5e' }
    ].filter((item) => item.value > 0);
  }, [reportData, selectedExam]);

  // Leading Department
  const leadingDept = useMemo(() => {
    if (departmentStats.length === 0) return null;
    return [...departmentStats].sort((a, b) => Number(b.averageScore) - Number(a.averageScore))[0];
  }, [departmentStats]);

  // Filtered Leaderboard
  const filteredRoster = useMemo(() => {
    return reportData
      .filter((row) => {
        if (selectedDept !== 'All' && row.department !== selectedDept) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchName = (row.name || '').toLowerCase().includes(q);
          const matchRoll = (row.rollNumber || '').toLowerCase().includes(q);
          if (!matchName && !matchRoll) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rank') return a.rank - b.rank;
        if (sortBy === 'score-desc') return (b.finalScore || 0) - (a.finalScore || 0);
        if (sortBy === 'score-asc') return (a.finalScore || 0) - (b.finalScore || 0);
        if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
        return 0;
      });
  }, [reportData, selectedDept, searchQuery, sortBy]);

  // Department-wise PDF download
  const handleDownloadDeptPDF = (deptToDownload) => {
    if (!selectedExamId) return;
    const targetDept = deptToDownload === 'All' ? '' : deptToDownload;
    setDownloadingDept(deptToDownload);

    let url = `/api/faculty/reports/${selectedExamId}?format=pdf`;
    if (targetDept) {
      url += `&department=${encodeURIComponent(targetDept)}`;
    }

    const token = localStorage.getItem('eduproctor_token');

    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Download failed');
        return res.blob();
      })
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        const deptLabel = targetDept ? `_${targetDept.replace(/\s+/g, '_')}` : '_All_Departments';
        a.download = `${selectedExam?.title || 'Exam'}${deptLabel}_Report.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch((err) => alert('Failed to download Department PDF: ' + err.message))
      .finally(() => setDownloadingDept(null));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* ─── Executive Header & Command Controls ─────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-50 text-brand-600 border border-brand-200">
              <BarChart3 className="h-5 w-5" />
            </span>
            <span className="text-[11px] font-bold tracking-wider uppercase text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
              Academic & Departmental Graphs
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Performance Analytics</h1>
          <p className="text-xs text-slate-600 font-medium max-w-2xl">
            Interactive visual graphs, cross-departmental bar charts, score distribution curves, and certified department PDF downloads.
          </p>
        </div>

        {/* Assessment Selector & Department PDF Download Suite */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="bg-white border border-slate-300 text-slate-900 text-xs font-bold rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-brand-500 shadow-sm cursor-pointer"
          >
            {exams.map((ex) => (
              <option key={ex._id || ex.id} value={ex._id || ex.id}>
                {ex.title}
              </option>
            ))}
          </select>

          {/* Department-Wise PDF Download Button */}
          <div className="flex items-center gap-1.5 bg-slate-900 text-white rounded-2xl p-1 shadow-md shadow-slate-900/20">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-transparent text-white text-xs font-bold px-2 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="All" className="text-slate-900">All Departments</option>
              {departmentsList.map((dept) => (
                <option key={dept} value={dept} className="text-slate-900">
                  {dept}
                </option>
              ))}
            </select>

            <button
              onClick={() => handleDownloadDeptPDF(selectedDept)}
              disabled={downloadingDept !== null}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition disabled:opacity-50"
              title="Download Department-filtered official PDF"
            >
              <Download className={`h-3.5 w-3.5 ${downloadingDept === selectedDept ? 'animate-bounce' : ''}`} />
              <span>{downloadingDept === selectedDept ? 'Generating PDF...' : 'Download Dept PDF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Real Dynamic KPI Ribbon (4 Metrics) ─────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Candidates Assessed */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-brand-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Examinees Assessed</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{reportData.length}</span>
            <span className="text-[11px] font-semibold text-slate-500">Submissions</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 font-medium">Graded candidate papers</p>
        </div>

        {/* Class Average Score */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-brand-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Cohort Average</span>
            <div className="p-2 rounded-xl bg-brand-50 text-brand-700">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-brand-800">
              {reportData.length > 0 && analytics?.averageScore !== undefined
                ? `${analytics.averageScore}%`
                : '0%'}
            </span>
            <span className="text-[11px] font-bold text-brand-700">Mean Score</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 font-medium">Across all enrolled sections</p>
        </div>

        {/* Highest Score */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-emerald-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Highest Score</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Trophy className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-800">
              {reportData.length > 0 && analytics?.highestScore !== undefined
                ? `${analytics.highestScore}%`
                : '-'}
            </span>
            <span className="text-[11px] font-bold text-emerald-700">Top Benchmark</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 font-medium">Highest individual mark</p>
        </div>

        {/* Leading Department */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-amber-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Leading Dept</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-base font-black text-amber-900 truncate">
              {leadingDept ? leadingDept.name : 'N/A'}
            </span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 font-medium">
            {leadingDept ? `Avg ${leadingDept.averageScore} pts (${leadingDept.passRate}% pass)` : 'No submission data'}
          </p>
        </div>
      </div>

      {/* ─── Interactive Graph Command Suite (Recharts Integration) ─── */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-brand-50 text-brand-700">
                <BarChart3 className="h-4 w-4" />
              </span>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Visual Analytics & Comparative Graphs
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Live Recharts vector visualizations of departmental performance and student score distributions.
            </p>
          </div>

          {/* Graph Tab Toggles */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
            <button
              onClick={() => setActiveChartTab('overview')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                activeChartTab === 'overview'
                  ? 'bg-white shadow-sm text-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dept Bar Graph
            </button>
            <button
              onClick={() => setActiveChartTab('curve')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                activeChartTab === 'curve'
                  ? 'bg-white shadow-sm text-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Score Curve Graph
            </button>
            <button
              onClick={() => setActiveChartTab('grades')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                activeChartTab === 'grades'
                  ? 'bg-white shadow-sm text-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Grade Donut Chart
            </button>
          </div>
        </div>

        {/* ─── Graph 1: Department Bar Chart ────────────────────────── */}
        {activeChartTab === 'overview' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-700">
                Department Comparison: Mean Score (%) vs. Pass Rate (%)
              </span>
              <div className="flex items-center gap-4 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-brand-700">
                  <span className="h-3 w-3 rounded bg-brand-600"></span> Mean Score %
                </span>
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="h-3 w-3 rounded bg-emerald-500"></span> Pass Rate %
                </span>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 20, right: 20, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="dept"
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar
                    dataKey="average"
                    name="Mean Score"
                    fill="#6366f1"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  />
                  <Bar
                    dataKey="passRate"
                    name="Pass Rate"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ─── Graph 2: Candidate Score Distribution Area Curve ─────── */}
        {activeChartTab === 'curve' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-700">
                Cohort Score Trajectory Curve ({scoreCurveData.length} Candidates Ranked)
              </span>
              <span className="text-slate-500 font-medium">Smoothed Area Trajectory</span>
            </div>

            <div className="h-72 w-full pt-2">
              {scoreCurveData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs font-semibold">
                  No candidate submissions to plot the curve yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={scoreCurveData} margin={{ top: 20, right: 20, left: -10, bottom: 20 }}>
                    <defs>
                      <linearGradient id="scoreCurveGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="percentile"
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, selectedExam?.totalMarks || 50]}
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomAreaTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#4f46e5"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#scoreCurveGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* ─── Graph 3: Grade Spectrum Donut Chart ──────────────────── */}
        {activeChartTab === 'grades' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="h-64 w-full">
              {gradePieData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs font-semibold">
                  No candidate submissions to plot grade distribution.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={gradePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {gradePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                Cohort Grade Classification
              </h4>
              <div className="space-y-2">
                {[
                  { label: 'Distinction (85%+)', color: '#10b981', desc: 'Outstanding mastery of algorithms & coding specs' },
                  { label: 'First Class (70-84%)', color: '#3b82f6', desc: 'Solid problem solving and verified test passes' },
                  { label: 'Second Class (50-69%)', color: '#f59e0b', desc: 'Meets minimum curriculum competency' },
                  { label: 'Remedial (< 50%)', color: '#f43f5e', desc: 'Requires faculty intervention & practice sessions' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{item.label}</span>
                      <span className="text-[10px] text-slate-500 font-medium">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Department Cards Grid with 1-Click PDF ──────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-brand-600" />
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Department Performance Matrix & PDF Exports
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {departmentStats.length} Academic Departments Assessed
          </span>
        </div>

        {departmentStats.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-2 shadow-sm">
            <Building2 className="h-8 w-8 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No departmental records available</h4>
            <p className="text-xs text-slate-500">
              Department metrics will compile automatically as examinees submit their responses.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departmentStats.map((dept) => (
              <div
                key={dept.name}
                className="p-5 rounded-3xl bg-white border border-slate-200/90 hover:border-brand-300 hover:shadow-md transition space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-slate-900 truncate">{dept.name}</span>
                    <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800">
                      {dept.candidates} Students
                    </span>
                  </div>

                  {/* Progress Bar for Average Score */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-semibold">Mean Score</span>
                      <span className="font-extrabold text-slate-900">{dept.averageScore} pts ({dept.averageScorePercent}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, dept.averageScorePercent)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-500 font-semibold block">Pass Rate</span>
                      <span className="font-extrabold text-emerald-800">{dept.passRate}%</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-500 font-semibold block">Top Mark</span>
                      <span className="font-extrabold text-slate-900">{dept.maxScore} pts</span>
                    </div>
                  </div>

                  {dept.topStudent && (
                    <div className="text-[11px] text-slate-600 font-medium">
                      Leader: <strong className="text-slate-900 font-bold">{dept.topStudent}</strong>
                    </div>
                  )}
                </div>

                {/* Direct 1-Click Department PDF Export */}
                <button
                  onClick={() => handleDownloadDeptPDF(dept.name)}
                  disabled={downloadingDept === dept.name}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 hover:bg-brand-600 hover:text-white text-slate-800 font-bold text-xs transition border border-slate-200"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{downloadingDept === dept.name ? 'Downloading...' : `Download ${dept.name} PDF`}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Candidate Performance Roster with Department Filter ─────── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm space-y-4">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Candidate Performance Leaderboard</h3>
            <p className="text-xs text-slate-500 font-medium">
              Ranked results across departments with raw scores, penalties, and accuracy benchmarks.
            </p>
          </div>

          {/* Table Toolbar */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Department Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-bold">Dept:</span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer"
              >
                <option value="All">All Departments</option>
                {departmentsList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-bold">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer"
              >
                <option value="rank">Rank (#1 First)</option>
                <option value="score-desc">Score: High to Low</option>
                <option value="score-asc">Score: Low to High</option>
                <option value="name">Candidate Name (A-Z)</option>
              </select>
            </div>

            {/* Search */}
            <div className="relative w-48 sm:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidate..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-brand-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-700 border-b border-slate-200 font-extrabold">
              <tr>
                <th className="py-3.5 px-4">Rank</th>
                <th className="py-3.5 px-4">Roll Number</th>
                <th className="py-3.5 px-4">Candidate Name</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Attempted</th>
                <th className="py-3.5 px-4">Raw Marks</th>
                <th className="py-3.5 px-4">Penalty</th>
                <th className="py-3.5 px-4 text-right">Final Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-bold">
                    <RefreshCw className="h-5 w-5 text-brand-500 animate-spin mx-auto mb-2" />
                    Loading performance roster...
                  </td>
                </tr>
              ) : filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    No candidates found for the selected department.
                  </td>
                </tr>
              ) : (
                filteredRoster.map((row) => (
                  <tr key={row.attemptId} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-black text-xs px-2.5 py-0.5 rounded-md ${
                          row.rank === 1
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 font-black'
                            : row.rank === 2
                            ? 'bg-slate-200 text-slate-900 font-bold'
                            : row.rank === 3
                            ? 'bg-amber-50 text-amber-800 font-bold'
                            : 'text-slate-600'
                        }`}
                      >
                        #{row.rank}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{row.rollNumber}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">{row.name}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[11px]">
                        {row.department}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {row.questionsAttempted} / {row.totalQuestions}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-800 font-bold">{row.marksScored?.toFixed(2)}</td>
                    <td className="py-3.5 px-4 font-bold">
                      {row.penalty > 0 ? (
                        <span className="text-rose-700">-{row.penalty.toFixed(2)}</span>
                      ) : (
                        <span className="text-slate-400">0.00</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm">
                      {row.finalScore?.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
