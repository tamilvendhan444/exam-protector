import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { examApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  Clock,
  Award,
  AlertTriangle,
  Camera,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Code2,
  Maximize2,
  Edit3,
  UserCheck,
  Sparkles,
  ChevronRight,
  Eye,
  Scale,
  Lock,
  HelpCircle,
  Laptop
} from 'lucide-react';

export default function ExamInstructionsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [rollNumber, setRollNumber] = useState('');
  const [validating, setValidating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function loadExam() {
      try {
        const res = await examApi.getById(id);
        if (res.success) {
          setExam(res.exam);
        }
      } catch (err) {
        console.error('Failed to load exam details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadExam();
  }, [id]);

  // Pre-fill roll number from logged in user if available
  useEffect(() => {
    if (user?.rollNumber && !rollNumber) {
      setRollNumber(user.rollNumber);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] space-y-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-3 border-brand-200 border-t-brand-600 animate-spin"></div>
          <ShieldCheck className="w-5 h-5 text-brand-600 absolute inset-0 m-auto animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-800">Loading Assessment Environment</p>
          <p className="text-xs text-slate-500 mt-0.5">Fetching guidelines & proctoring parameters...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 mx-auto flex items-center justify-center mb-3">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Assessment Not Found</h2>
        <p className="text-xs text-slate-600 mt-1 mb-6">
          This examination link may have expired or is not available for your enrolled department.
        </p>
        <Link
          to="/student/exams"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
        >
          Return to Exam Catalog
        </Link>
      </div>
    );
  }

  const handleValidateAndProceed = async () => {
    if (!rollNumber.trim()) {
      setErrorMsg('Please enter your registration / roll number to verify your slot.');
      return;
    }
    if (!agreed) {
      setErrorMsg('Please read and agree to the examination protocols before continuing.');
      return;
    }

    setValidating(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/exams/${id}/validate-roll-number`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('eduproctor_token')}`
        },
        body: JSON.stringify({ rollNumber: rollNumber.trim().toUpperCase() })
      });
      const data = await res.json();
      if (data.success) {
        navigate(`/student/exams/${id}/system-check`, {
          state: { rollNumber: rollNumber.trim().toUpperCase() }
        });
      } else {
        setErrorMsg(data.message || 'Validation failed. Your roll number is not assigned to this slot.');
      }
    } catch (err) {
      console.error('Validation error:', err);
      setErrorMsg('Network error while verifying roll number. Please try again.');
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Top Breadcrumbs & Shield Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-500">
          <Link to="/student/dashboard" className="hover:text-slate-800 transition">Portal</Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <Link to="/student/exams" className="hover:text-slate-800 transition">Examinations</Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-semibold text-slate-900">Pre-Flight Briefing</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>AI Computer Vision Sentinel Active</span>
        </div>
      </div>

      {/* Main Hero Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-brand-500/5 via-indigo-500/5 to-transparent rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative space-y-5">
          {/* Metadata pill chips */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-lg bg-brand-50 text-brand-700 border border-brand-200/80 shadow-xs">
                {exam.subject || 'General Assessment'}
              </span>
              <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                Course ID: {exam._id?.slice(-6).toUpperCase() || 'EX-2026'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
              <div className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-[10px]">
                {(exam.createdByName || 'Prof. Turing')[0]}
              </div>
              <span>
                Faculty Lead: <strong className="text-slate-900 font-semibold">{exam.createdByName || 'Prof. Alan Turing'}</strong>
              </span>
            </div>
          </div>

          {/* Assessment Title & Description */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {exam.title}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed mt-2 max-w-3xl">
              {exam.description ||
                'Comprehensive algorithmic assessment evaluating student proficiency in core problem solving, runtime complexity, and data modeling with automated code execution and continuous AI proctoring.'}
            </p>
          </div>

          {/* High-Impact Stat Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4 border-t border-slate-100">
            {/* Duration */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100/90 transition hover:border-indigo-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-indigo-900/70">Duration</span>
                <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
                  <Clock className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-lg font-black text-slate-900">
                  {exam.durationMinutes} <span className="text-xs font-medium text-slate-500">Mins</span>
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">Strict auto-submission</p>
              </div>
            </div>

            {/* Total Marks */}
            <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-100/90 transition hover:border-amber-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-amber-900/70">Total Score</span>
                <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-xs">
                  <Award className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-lg font-black text-slate-900">
                  {exam.totalMarks} <span className="text-xs font-medium text-slate-500">Marks</span>
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">Standard weightage</p>
              </div>
            </div>

            {/* Total Questions */}
            <div className="p-3.5 rounded-2xl bg-sky-50/50 border border-sky-100/90 transition hover:border-sky-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-sky-900/70">Questions</span>
                <div className="w-7 h-7 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shadow-xs">
                  <FileText className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-lg font-black text-slate-900">
                  {exam.questionIds?.length || 3} <span className="text-xs font-medium text-slate-500">Challenges</span>
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">Automated test cases</p>
              </div>
            </div>

            {/* Negative Marking */}
            <div className={`p-3.5 rounded-2xl border transition ${
              exam.negativeMarking
                ? 'bg-rose-50/50 border-rose-100/90 hover:border-rose-200'
                : 'bg-emerald-50/50 border-emerald-100/90 hover:border-emerald-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium ${exam.negativeMarking ? 'text-rose-900/70' : 'text-emerald-900/70'}`}>
                  Negative Marking
                </span>
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center shadow-xs ${
                  exam.negativeMarking ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  <Scale className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="mt-2">
                <span className={`text-lg font-black ${exam.negativeMarking ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {exam.negativeMarking ? `-${exam.negativeMarksPerQuestion || 0.25}x` : 'Zero (None)'}
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {exam.negativeMarking ? 'Applied per wrong test' : 'No penalties applied'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Guidelines Grid (Interactive 2x2 Feature Layout) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">General Assessment Guidelines</h2>
              <p className="text-xs text-slate-500">Read carefully before initiating system verification</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            Mandatory Protocols
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Rule 1 */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:bg-slate-50 transition space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <Clock className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">Continuous Timer & Auto-Submit</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pl-9">
              The exam clock starts immediately when you enter the exam hall. If the countdown reaches 00:00, your current code and answers will automatically lock and submit safely.
            </p>
          </div>

          {/* Rule 2 */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:bg-slate-50 transition space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Code2 className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">Isolated Code Execution Sandbox</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pl-9">
              Execute solutions natively in C++, Java, Python, or JavaScript. All executions run in an isolated serverless sandbox with strict CPU runtime and memory boundaries.
            </p>
          </div>

          {/* Rule 3 */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:bg-slate-50 transition space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <Edit3 className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">Integrated Digital Rough Pad</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pl-9">
              Utilize the built-in digital whiteboard for calculations and dry-runs. Rough notes are preserved locally on your machine and are excluded from final evaluation.
            </p>
          </div>

          {/* Rule 4 */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:bg-slate-50 transition space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Maximize2 className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">Strict Fullscreen & Focus Lock</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pl-9">
              Fullscreen mode is enforced continuously. Window unfocus, tab navigation, or application switches trigger automated anomaly logs for faculty review.
            </p>
          </div>
        </div>
      </div>

      {/* AI Camera Proctoring & Ethical Disclosure Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-dark-900 to-indigo-950 text-white shadow-xl relative overflow-hidden space-y-6">
        {/* Ambient decorative circuit element */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center shadow-inner">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  AI Camera Proctoring & Ethical Transparency Notice
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Ethical AI
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Client-side computer vision ensures fair assessment without compromising student dignity or privacy
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
            <Lock className="h-3.5 w-3.5 text-emerald-400" />
            <span>100% On-Device Privacy Shield</span>
          </div>
        </div>

        {/* 3 Pillar Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
          {/* Pillar 1 */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 hover:bg-white/10 transition">
            <div className="flex items-center gap-2 text-amber-300">
              <Camera className="h-4 w-4 shrink-0" />
              <span className="text-xs font-bold">1. Camera & Audio Stream</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Continuous webcam feed is required. You will complete an automated anti-robot face liveness check before the examination opens.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 hover:bg-white/10 transition">
            <div className="flex items-center gap-2 text-amber-300">
              <Eye className="h-4 w-4 shrink-0" />
              <span className="text-xs font-bold">2. Environmental Sentinel</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Our neural network monitors workspace visibility, detecting additional persons in frame and unauthorized devices like secondary smartphones.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 hover:bg-white/10 transition">
            <div className="flex items-center gap-2 text-emerald-300">
              <UserCheck className="h-4 w-4 shrink-0" />
              <span className="text-xs font-bold">3. Human Review Guarantee</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>AI detections are purely signals for human review, not automated proof.</strong> Faculty members review every flagged event before decisions. Transient glances never auto-fail you.
            </p>
          </div>
        </div>

        {/* Anti-Robot / Liveness Pre-notice */}
        <div className="p-3.5 rounded-2xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-between gap-3 text-xs text-indigo-200">
          <div className="flex items-center gap-2.5">
            <Camera className="h-4 w-4 text-indigo-400 shrink-0" />
            <span>
              <strong>Mandatory Pre-Exam Hardware & Liveness Check:</strong> Next step will calibrate your webcam, test mic levels, and prompt a quick head orientation gesture.
            </span>
          </div>
          <span className="shrink-0 font-mono text-[11px] bg-brand-500/20 text-indigo-300 px-2 py-0.5 rounded-md border border-brand-500/30">
            Step 1 of 2
          </span>
        </div>
      </div>

      {/* Candidate Verification & Launchpad Section */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-brand-100 shadow-md space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-brand-600" />
              <span>Candidate Slot Verification</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify your enrolled slot and authenticate candidate eligibility
            </p>
          </div>

          {/* Active User Card preview */}
          {user && (
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-2xl">
              {user?.avatar || user?.name ? (
                <img
                  src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || 'user')}`}
                  alt={user?.name}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextElementSibling) {
                      e.currentTarget.nextElementSibling.style.display = 'flex';
                    }
                  }}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200 bg-slate-100"
                />
              ) : null}
              <div
                className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center text-xs shadow-xs"
                style={{ display: (user?.avatar || user?.name) ? 'none' : 'flex' }}
              >
                {(user?.name || 'S')[0]}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight">{user.name}</p>
                <p className="text-[11px] text-slate-500">{user.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Roll Number Input & Autofill */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="rollNumberInput" className="text-xs font-bold text-slate-800">
              University / Registration Roll Number <span className="text-rose-500">*</span>
            </label>
            {user?.rollNumber && rollNumber !== user.rollNumber && (
              <button
                type="button"
                onClick={() => {
                  setRollNumber(user.rollNumber);
                  setErrorMsg('');
                }}
                className="text-xs text-brand-600 hover:text-brand-700 font-semibold hover:underline flex items-center gap-1"
              >
                <Sparkles className="h-3 w-3" />
                <span>Autofill with profile roll number: <strong>{user.rollNumber}</strong></span>
              </button>
            )}
          </div>

          <div className="relative max-w-lg">
            <input
              id="rollNumberInput"
              type="text"
              value={rollNumber}
              onChange={(e) => {
                setRollNumber(e.target.value.toUpperCase());
                setErrorMsg('');
              }}
              placeholder="e.g. 24AD235"
              className="w-full px-4 py-3 pl-11 rounded-2xl bg-slate-50 border border-slate-300 text-slate-900 font-mono text-sm tracking-wider font-bold focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 uppercase transition"
            />
            <Laptop className="h-4 w-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 flex items-center gap-2 animate-in fade-in duration-200">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Agreement Checkbox with styled container */}
        <label className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-200/90 hover:bg-slate-100/60 transition cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => {
              setAgreed(e.target.checked);
              if (e.target.checked) setErrorMsg('');
            }}
            className="h-4 w-4 mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer shrink-0"
          />
          <div className="text-xs space-y-0.5">
            <span className="font-bold text-slate-900 block">
              I have read, understood, and agreed to the examination rules and proctoring policy.
            </span>
            <span className="text-slate-500 block leading-relaxed">
              I consent to continuous camera monitoring for academic integrity and understand that exiting fullscreen mode or using external aids will be flagged.
            </span>
          </div>
        </label>

        {/* Bottom Actions Bar */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-2">
          <Link
            to="/student/exams"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5"
          >
            <span>← Return to Examination Catalog</span>
          </Link>

          <button
            onClick={handleValidateAndProceed}
            disabled={!agreed || validating}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none"
          >
            {validating ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Verifying Allocated Slot...</span>
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 text-white" />
                <span>Verify Camera & Proceed to Examination</span>
                <ArrowRight className="h-4 w-4 text-white" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
