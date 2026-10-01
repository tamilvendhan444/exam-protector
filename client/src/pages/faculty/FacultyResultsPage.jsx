import React, { useState, useEffect, useMemo } from 'react';
import { facultyApi, examApi } from '../../services/api';
import IntegrityDossierModal from './IntegrityDossierModal';
import {
  Award,
  Users,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Search,
  Eye,
  Clock,
  ShieldCheck,
  ShieldAlert,
  FileCode2,
  Sparkles,
  FileSearch,
  X,
  Download,
  Filter,
  FileCheck,
  Trophy,
  AlertTriangle,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

export default function FacultyResultsPage() {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttemptId, setSelectedAttemptId] = useState(null);
  const [isScanningPlagiarism, setIsScanningPlagiarism] = useState(false);
  const [scanNotice, setScanNotice] = useState(null);

  // Search & Filtering for Submissions
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [sortBy, setSortBy] = useState('highest-score');

  // Report Tab States
  const [activeTab, setActiveTab] = useState('integrity');
  const [reportData, setReportData] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [filterDept, setFilterDept] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterSlot, setFilterSlot] = useState('');

  useEffect(() => {
    async function loadExams() {
      try {
        setLoading(true);
        const res = await examApi.getAll();
        if (res.success && res.exams.length > 0) {
          setExams(res.exams);
          setSelectedExamId(res.exams[0]._id || res.exams[0].id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadExams();
  }, []);

  async function loadExamResults() {
    if (!selectedExamId) return;
    try {
      const [anaRes, subRes] = await Promise.all([
        facultyApi.getAnalytics(selectedExamId),
        facultyApi.getSubmissions(selectedExamId)
      ]);

      if (anaRes.success) setAnalytics(anaRes.metrics);
      if (subRes.success) setSubmissions(subRes.attempts || []);
    } catch (e) {
      console.error('Error loading results:', e);
    }
  }

  useEffect(() => {
    loadExamResults();
  }, [selectedExamId]);

  const handleRunPlagiarismScan = async () => {
    if (!selectedExamId) return;
    setIsScanningPlagiarism(true);
    setScanNotice(null);
    try {
      const res = await facultyApi.runSimilarityScan(selectedExamId, { threshold: 65 });
      setScanNotice(res.message || 'Plagiarism scan completed successfully.');
      await loadExamResults();
    } catch (err) {
      alert('Plagiarism scan failed: ' + err.message);
    } finally {
      setIsScanningPlagiarism(false);
    }
  };

  async function loadReport() {
    if (!selectedExamId) return;
    setReportLoading(true);
    setReportError(null);
    try {
      const params = {};
      if (filterDept) params.department = filterDept;
      if (filterSection) params.classSection = filterSection;
      if (filterSlot) params.slotId = filterSlot;

      const res = await facultyApi.getResultsReport(selectedExamId, params);
      if (res.success) {
        setReportData(res.report || []);
      } else {
        setReportError(res.message || 'Failed to load report.');
        setReportData([]);
      }
    } catch (e) {
      setReportError(e.message || 'Failed to fetch report.');
      setReportData([]);
    } finally {
      setReportLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === 'report') {
      loadReport();
    }
  }, [selectedExamId, activeTab, filterDept, filterSection, filterSlot]);

  const handleDownloadPDF = () => {
    if (!selectedExamId) return;
    let url = `/api/faculty/reports/${selectedExamId}?format=pdf`;
    if (filterDept) url += `&department=${encodeURIComponent(filterDept)}`;
    if (filterSection) url += `&classSection=${encodeURIComponent(filterSection)}`;
    if (filterSlot) url += `&slotId=${encodeURIComponent(filterSlot)}`;

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
        const ex = exams.find((e) => (e._id || e.id) === selectedExamId);
        a.download = `${ex?.title || 'Exam'}_Report.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch((err) => alert('Failed to download PDF: ' + err.message));
  };

  const selectedExam = exams.find((e) => (e._id || e.id) === selectedExamId);

  // Dynamic submissions count
  const totalSubsCount = analytics?.totalSubmissions !== undefined ? analytics.totalSubmissions : submissions.length;

  // Real Dynamic Metrics (NO hardcoded fake 82%/95% fallback!)
  const displayAverageScore = totalSubsCount > 0 ? (analytics?.averageScore !== undefined ? `${analytics.averageScore}%` : '0%') : '0%';
  const displayHighestScore = totalSubsCount > 0 ? (analytics?.highestScore !== undefined ? `${analytics.highestScore}%` : '-') : '-';
  const displayPassRate = totalSubsCount > 0 ? (analytics?.passRate !== undefined ? `${analytics.passRate}%` : '0%') : '0%';

  // Filtered and Sorted Submissions
  const filteredSubmissions = useMemo(() => {
    return submissions
      .filter((sub) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const nameMatch = (sub.studentName || '').toLowerCase().includes(q);
          const emailMatch = (sub.studentEmail || '').toLowerCase().includes(q);
          if (!nameMatch && !emailMatch) return false;
        }

        const score = sub.integrityScore !== undefined
          ? sub.integrityScore
          : sub.proctoringSummary?.integrityScore !== undefined
          ? sub.proctoringSummary.integrityScore
          : 95;

        if (riskFilter === 'clean' && score < 88) return false;
        if (riskFilter === 'review' && (score < 65 || score >= 88)) return false;
        if (riskFilter === 'high' && score >= 65) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'highest-score') return (b.totalScore || 0) - (a.totalScore || 0);
        if (sortBy === 'lowest-score') return (a.totalScore || 0) - (b.totalScore || 0);
        if (sortBy === 'integrity-risk') {
          const scoreA = a.integrityScore ?? a.proctoringSummary?.integrityScore ?? 95;
          const scoreB = b.integrityScore ?? b.proctoringSummary?.integrityScore ?? 95;
          return scoreA - scoreB; // Lowest integrity score first (highest risk)
        }
        return 0;
      });
  }, [submissions, searchQuery, riskFilter, sortBy]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* ─── Executive Header & Controls ────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-50 text-brand-600 border border-brand-200">
              <Award className="h-5 w-5" />
            </span>
            <span className="text-[11px] font-bold tracking-wider uppercase text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
              Academic & Anti-Cheating Analytics
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Assessment Results & Integrity Audit</h1>
          <p className="text-xs text-slate-600 font-medium max-w-2xl">
            Class performance metrics, candidate rankings, composite proctoring trust indices, and algorithmic code similarity audits.
          </p>
        </div>

        {/* Assessment Selector & Plagiarism Scan */}
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

          <button
            onClick={handleRunPlagiarismScan}
            disabled={isScanningPlagiarism}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md shadow-brand-500/25 disabled:opacity-50 transition active:scale-[0.98]"
          >
            <FileSearch className={`h-4 w-4 ${isScanningPlagiarism ? 'animate-spin' : ''}`} />
            <span>{isScanningPlagiarism ? 'Scanning AST Similarity...' : 'Run Plagiarism Scan'}</span>
          </button>
        </div>
      </div>

      {/* ─── Scan Notice Banner ─────────────────────────────────────── */}
      {scanNotice && (
        <div className="p-4 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-between gap-3 text-xs text-brand-800 font-medium animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-600 shrink-0" />
            <span>{scanNotice}</span>
          </div>
          <button onClick={() => setScanNotice(null)} className="text-brand-600 hover:text-brand-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ─── Real Dynamic KPI Analytics Cards (4 Metrics) ────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Submissions */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-brand-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Evaluated Attempts</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <FileCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalSubsCount}</span>
            <span className="text-[11px] font-semibold text-slate-500">Submissions</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 font-medium">Logged exam papers</p>
        </div>

        {/* Class Average */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-brand-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Class Average</span>
            <div className="p-2 rounded-xl bg-brand-50 text-brand-700 border border-brand-100">
              <BarChart3 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-brand-800">{displayAverageScore}</span>
            <span className="text-[11px] font-bold text-brand-700">Mean Score</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 font-medium">Overall cohort performance</p>
        </div>

        {/* Highest Score */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-emerald-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Top Benchmark</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Trophy className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-800">{displayHighestScore}</span>
            <span className="text-[11px] font-bold text-emerald-700">Peak Mark</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 font-medium">Highest recorded score</p>
        </div>

        {/* Pass Rate */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-blue-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pass Rate</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-900">{displayPassRate}</span>
            <span className="text-[11px] font-bold text-blue-700">Qualified</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 font-medium">Candidates above passing grade</p>
        </div>
      </div>

      {/* ─── Navigation Tabs ────────────────────────────────────────── */}
      <div className="flex items-center gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('integrity')}
          className={`pb-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition ${
            activeTab === 'integrity'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Integrity & Candidate Submissions
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`pb-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition ${
            activeTab === 'report'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Ranked Class Results Report
        </button>
      </div>

      {/* ─── Tab 1: Integrity & Submissions ─────────────────────────── */}
      {activeTab === 'integrity' && (
        <div className="space-y-4">
          {/* Submissions Filter Toolbar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Risk Filter */}
                <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-bold">Integrity Tier:</span>
                  <select
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value)}
                    className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="">All Tiers</option>
                    <option value="clean">Clean (88 - 100%)</option>
                    <option value="review">Review Advised (65 - 87%)</option>
                    <option value="high">High Risk (&lt; 65%)</option>
                  </select>
                </div>

                {/* Sort Filter */}
                <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-bold">Sort By:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="highest-score">Score: High to Low</option>
                    <option value="lowest-score">Score: Low to High</option>
                    <option value="integrity-risk">Integrity: Highest Risk First</option>
                  </select>
                </div>

                {/* Reset Filters */}
                {(searchQuery || riskFilter) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setRiskFilter('');
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-brand-600 hover:text-brand-700 hover:bg-brand-50 font-bold text-xs transition"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* Search with Clear Icon */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search candidate by name or email..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs font-medium focus:outline-none focus:border-brand-500 focus:bg-white transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 text-slate-500"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Submissions Table (WCAG AAA High Contrast) */}
          <div className="rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Student Examination & Integrity Records</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Verified candidate submissions and computer vision proctoring indices
                </p>
              </div>
              <span className="text-xs text-slate-700 font-bold bg-slate-100 px-3 py-1 rounded-xl">
                Showing {filteredSubmissions.length} of {submissions.length} candidates
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-700 border-b border-slate-200 font-extrabold">
                  <tr>
                    <th className="py-3.5 px-4">Student Candidate</th>
                    <th className="py-3.5 px-4">Attempt Status</th>
                    <th className="py-3.5 px-4">Academic Score</th>
                    <th className="py-3.5 px-4">Accuracy</th>
                    <th className="py-3.5 px-4">Integrity Index</th>
                    <th className="py-3.5 px-4">Proctoring Telemetry</th>
                    <th className="py-3.5 px-4 text-right">Audit Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {submissions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        <div className="max-w-sm mx-auto space-y-2">
                          <Users className="h-8 w-8 text-slate-300 mx-auto" />
                          <h4 className="text-sm font-bold text-slate-700">
                            No student submissions logged for this assessment yet
                          </h4>
                          <p className="text-xs text-slate-500">
                            Submissions will populate here once candidates complete and submit their attempts.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No submissions match the current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredSubmissions.map((sub) => {
                      const integrityScore =
                        sub.integrityScore !== undefined
                          ? sub.integrityScore
                          : sub.proctoringSummary?.integrityScore !== undefined
                          ? sub.proctoringSummary.integrityScore
                          : 95;

                      const isClean = integrityScore >= 88;
                      const isReview = integrityScore >= 65 && integrityScore < 88;
                      const integrityTier =
                        sub.integrityTier || (integrityScore < 65 ? 'High Risk' : isReview ? 'Review Advised' : 'Clean');

                      return (
                        <tr key={sub._id || sub.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5 px-4">
                            <span className="font-extrabold text-slate-900 text-sm block">{sub.studentName}</span>
                            <span className="text-[10px] text-slate-500 font-medium">{sub.studentEmail}</span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300 uppercase">
                              {sub.status}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                            {sub.totalScore || 0}{' '}
                            <span className="text-[11px] font-semibold text-slate-500">
                              / {sub.totalPossibleMarks || 50} pts
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                              {sub.accuracyPercentage || 85}%
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-black font-mono border ${
                                  isClean
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                    : isReview
                                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                                    : 'bg-rose-50 border-rose-300 text-rose-800'
                                }`}
                              >
                                {integrityScore}%
                              </span>
                              <span className="text-[11px] font-bold text-slate-600 capitalize hidden sm:inline">
                                {integrityTier}
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                                sub.proctoringSummary?.overallStatus === 'Incident'
                                  ? 'bg-rose-50 text-rose-800 border-rose-300'
                                  : sub.proctoringSummary?.overallStatus === 'Warning'
                                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              }`}
                            >
                              {sub.proctoringSummary?.overallStatus || 'Normal'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setSelectedAttemptId(sub._id || sub.id)}
                              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-brand-600 text-white text-xs font-bold transition flex items-center gap-1.5 ml-auto shadow-sm"
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              <span>View Dossier</span>
                            </button>
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
      )}

      {/* ─── Tab 2: Ranked Class Results Report ─────────────────────── */}
      {activeTab === 'report' && (
        <div className="rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-sm animate-in fade-in">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Ranked Class Results Report</h3>
              <p className="text-xs text-slate-500 font-medium">
                Official grading register sorted by final scores, penalties, and submission timestamps.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Department..."
                  className="bg-transparent text-xs text-slate-800 font-medium outline-none w-24"
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Section..."
                  className="bg-transparent text-xs text-slate-800 font-medium outline-none w-24"
                  value={filterSection}
                  onChange={(e) => setFilterSection(e.target.value)}
                />
              </div>

              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md shadow-slate-900/20 transition"
              >
                <Download className="h-4 w-4" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-700 border-b border-slate-200 font-extrabold">
                <tr>
                  <th className="py-3.5 px-4">Rank</th>
                  <th className="py-3.5 px-4">Roll Number</th>
                  <th className="py-3.5 px-4">Student Candidate</th>
                  <th className="py-3.5 px-4">Department / Sec</th>
                  <th className="py-3.5 px-4">Attempted</th>
                  <th className="py-3.5 px-4">Raw Marks</th>
                  <th className="py-3.5 px-4">Infraction Penalty</th>
                  <th className="py-3.5 px-4 text-right">Final Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-500 font-bold">
                      <RefreshCw className="h-5 w-5 text-brand-500 animate-spin mx-auto mb-2" />
                      Loading class report...
                    </td>
                  </tr>
                ) : reportError ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-rose-600 font-bold">
                      {reportError}
                    </td>
                  </tr>
                ) : reportData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-500">
                      No report data found for this assessment.
                    </td>
                  </tr>
                ) : (
                  reportData.map((row) => (
                    <tr key={row.attemptId} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-black text-xs px-2 py-0.5 rounded-md ${
                            row.rank === 1
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : row.rank === 2
                              ? 'bg-slate-200 text-slate-800'
                              : row.rank === 3
                              ? 'bg-amber-50 text-amber-700'
                              : 'text-slate-600'
                          }`}
                        >
                          #{row.rank}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{row.rollNumber}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{row.name}</td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {row.department} {row.classSection !== 'N/A' ? `- ${row.classSection}` : ''}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {row.questionsAttempted} / {row.totalQuestions}
                      </td>
                      <td className="py-3.5 px-4 text-emerald-700 font-bold">{row.marksScored?.toFixed(2)}</td>
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
      )}

      {/* ─── Post-Exam Integrity Dossier Modal ──────────────────────── */}
      {selectedAttemptId && (
        <IntegrityDossierModal
          attemptId={selectedAttemptId}
          exam={selectedExam}
          onClose={() => setSelectedAttemptId(null)}
          onRefresh={loadExamResults}
        />
      )}
    </div>
  );
}
