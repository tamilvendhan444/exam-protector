import React, { useState, useEffect, useMemo } from 'react';
import { questionApi } from '../../services/api';
import {
  Database,
  Plus,
  Search,
  Filter,
  Code2,
  FileText,
  CheckSquare,
  Trash2,
  Edit,
  X,
  Check,
  Sparkles,
  Eye,
  Award,
  Tag,
  ChevronDown,
  BookOpen,
  Layers,
  Terminal,
  Copy,
  AlertCircle,
  RefreshCw,
  Hash,
  Clock,
  Cpu
} from 'lucide-react';

export default function FacultyQuestionBankPage() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Modals & Panels
  const [modalOpen, setModalOpen] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState('python');
  const [copiedCode, setCopiedCode] = useState(false);

  // New / Edit Question Form State
  const defaultQuestionState = {
    title: '',
    description: '',
    type: 'coding',
    subject: 'Data Structures',
    topic: 'Arrays & Strings',
    difficulty: 'Medium',
    marks: 20,
    tags: ['algorithms', 'core'],
    inputFormat: 'Standard input format with integer array size N followed by space-separated elements.',
    outputFormat: 'Single line output containing the result.',
    constraints: '1 <= N <= 10^5\n-10^9 <= Arr[i] <= 10^9',
    starterCode: {
      python: 'def solve():\n    # Write your solution here\n    pass\n\nif __name__ == "__main__":\n    solve()',
      java: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Write solution\n    }\n}',
      cpp: '#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    // Write solution\n    return 0;\n}',
      javascript: 'const fs = require("fs");\nconst input = fs.readFileSync(0, "utf-8").trim();\n// Write solution\nconsole.log(input);'
    },
    testCases: [
      { input: '5\n1 2 3 4 5', expectedOutput: '15', isHidden: false },
      { input: '3\n10 20 30', expectedOutput: '60', isHidden: true }
    ],
    options: [
      { id: 'opt_1', text: 'Option A' },
      { id: 'opt_2', text: 'Option B' },
      { id: 'opt_3', text: 'Option C' },
      { id: 'opt_4', text: 'Option D' }
    ],
    correctOptionIds: ['opt_1'],
    explanation: 'Explanation for the correct option choice.',
    minWords: 50,
    maxWords: 300
  };

  const [formData, setFormData] = useState(defaultQuestionState);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const res = await questionApi.getAll({
        type: typeFilter || undefined,
        difficulty: difficultyFilter || undefined,
        subject: subjectFilter || undefined,
        search: search || undefined
      });
      if (res.success) {
        setQuestions(res.questions || []);
      }
    } catch (e) {
      console.error('Error fetching questions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [typeFilter, difficultyFilter, subjectFilter, search]);

  // Dynamic list of subjects from existing questions
  const availableSubjects = useMemo(() => {
    const set = new Set();
    questions.forEach((q) => {
      if (q.subject) set.add(q.subject);
    });
    return Array.from(set);
  }, [questions]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = questions.length;
    const codingCount = questions.filter((q) => q.type === 'coding').length;
    const mcqCount = questions.filter((q) => q.type === 'mcq').length;
    const descriptiveCount = questions.filter((q) => q.type === 'descriptive').length;
    const easyCount = questions.filter((q) => q.difficulty === 'Easy').length;
    const mediumCount = questions.filter((q) => q.difficulty === 'Medium').length;
    const hardCount = questions.filter((q) => q.difficulty === 'Hard').length;
    const totalMarks = questions.reduce((acc, q) => acc + (Number(q.marks) || 0), 0);
    return { total, codingCount, mcqCount, descriptiveCount, easyCount, mediumCount, hardCount, totalMarks };
  }, [questions]);

  // Sorted questions
  const filteredAndSortedQuestions = useMemo(() => {
    const list = [...questions];
    if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortBy === 'title') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'marks-desc') {
      list.sort((a, b) => (b.marks || 0) - (a.marks || 0));
    } else if (sortBy === 'marks-asc') {
      list.sort((a, b) => (a.marks || 0) - (b.marks || 0));
    } else if (sortBy === 'difficulty') {
      const rank = { Easy: 1, Medium: 2, Hard: 3 };
      list.sort((a, b) => (rank[b.difficulty] || 0) - (rank[a.difficulty] || 0));
    }
    return list;
  }, [questions, sortBy]);

  const handleOpenCreateModal = () => {
    setEditingQuestion(null);
    setFormData(defaultQuestionState);
    setModalOpen(true);
  };

  const handleOpenEditModal = (q) => {
    setEditingQuestion(q);
    setFormData({
      ...defaultQuestionState,
      ...q,
      testCases: q.testCases?.length ? q.testCases : defaultQuestionState.testCases,
      options: q.options?.length ? q.options : defaultQuestionState.options,
      correctOptionIds: q.correctOptionIds || (q.options?.[0]?.id ? [q.options[0].id] : ['opt_1']),
      starterCode: q.starterCode || defaultQuestionState.starterCode
    });
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingQuestion) {
        const id = editingQuestion._id || editingQuestion.id;
        const res = await questionApi.update(id, formData);
        if (res.success) {
          setModalOpen(false);
          setEditingQuestion(null);
          loadQuestions();
        } else {
          alert(res.message || 'Failed to update problem.');
        }
      } else {
        const res = await questionApi.create(formData);
        if (res.success) {
          setModalOpen(false);
          loadQuestions();
        } else {
          alert(res.message || 'Failed to create problem.');
        }
      }
    } catch (err) {
      alert('Error saving problem item: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to remove "${title}" from the question bank? This cannot be undone.`)) return;
    try {
      await questionApi.delete(id);
      if (previewQuestion && (previewQuestion._id === id || previewQuestion.id === id)) {
        setPreviewQuestion(null);
      }
      loadQuestions();
    } catch (e) {
      alert('Failed to delete question');
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Add a test case row in modal
  const handleAddTestCase = () => {
    setFormData((prev) => ({
      ...prev,
      testCases: [...(prev.testCases || []), { input: '', expectedOutput: '', isHidden: false }]
    }));
  };

  const handleRemoveTestCase = (index) => {
    setFormData((prev) => ({
      ...prev,
      testCases: prev.testCases.filter((_, i) => i !== index)
    }));
  };

  const handleTestCaseChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.testCases];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, testCases: updated };
    });
  };

  // Add an option row for MCQ
  const handleAddOption = () => {
    const newId = `opt_${Date.now()}`;
    setFormData((prev) => ({
      ...prev,
      options: [...(prev.options || []), { id: newId, text: `Option ${String.fromCharCode(65 + (prev.options?.length || 0))}` }]
    }));
  };

  const handleOptionChange = (id, text) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.map((opt) => (opt.id === id ? { ...opt, text } : opt))
    }));
  };

  const handleRemoveOption = (id) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.filter((opt) => opt.id !== id),
      correctOptionIds: prev.correctOptionIds.filter((cid) => cid !== id)
    }));
  };

  const handleToggleCorrectOption = (id) => {
    setFormData((prev) => ({
      ...prev,
      correctOptionIds: [id] // Single-select standard
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* ─── Executive Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-50 text-brand-600 border border-brand-200">
              <Database className="h-5 w-5" />
            </span>
            <span className="text-[11px] font-bold tracking-wider uppercase text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
              Curriculum Repository
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Question Repository Bank</h1>
          <p className="text-xs text-slate-600 font-medium max-w-2xl">
            Curate and manage reusable algorithmic challenges, multi-choice items, and system prompts ready for deployment into proctored examinations.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] self-start sm:self-auto shrink-0"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Add New Problem</span>
        </button>
      </div>

      {/* ─── Top KPI Ribbon (4 Metrics) ──────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Questions */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-brand-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Repository Pool</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.total}</span>
            <span className="text-[11px] font-semibold text-slate-600">Total Items</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 font-medium">{stats.totalMarks} Total marks pool</p>
        </div>

        {/* Coding Challenges */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-violet-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Code Challenges</span>
            <div className="p-2 rounded-xl bg-violet-50 text-violet-700 border border-violet-100">
              <Code2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-violet-900">{stats.codingCount}</span>
            <span className="text-[11px] font-semibold text-violet-700">Problems</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 font-medium">Auto-graded test case sandbox</p>
        </div>

        {/* MCQs & Theory */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">MCQ & Theory</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <CheckSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-900">{stats.mcqCount + stats.descriptiveCount}</span>
            <span className="text-[11px] font-semibold text-emerald-700">Questions</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 font-medium">{stats.mcqCount} MCQs • {stats.descriptiveCount} Essays</p>
        </div>

        {/* Difficulty Distribution */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-amber-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Difficulty Spread</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span> {stats.easyCount}E
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span> {stats.mediumCount}M
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700">
              <span className="h-2 w-2 rounded-full bg-rose-500"></span> {stats.hardCount}H
            </span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 font-medium">Standard academic gradient</p>
        </div>
      </div>

      {/* ─── Control Bar: Filters, Search, and Sorting ──────────────── */}
      <div className="space-y-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm">
        {/* Problem Type Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {[
              { id: '', label: 'All Items', icon: Database, count: stats.total },
              { id: 'coding', label: 'Coding Challenges', icon: Code2, count: stats.codingCount },
              { id: 'mcq', label: 'MCQs', icon: CheckSquare, count: stats.mcqCount },
              { id: 'descriptive', label: 'Descriptive', icon: FileText, count: stats.descriptiveCount }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = typeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTypeFilter(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
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
            Showing <span className="text-slate-900 font-bold">{filteredAndSortedQuestions.length}</span> matching problems
          </div>
        </div>

        {/* Dropdowns, Search, and Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Difficulty Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <span className="text-slate-600 font-bold">Difficulty:</span>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
              >
                <option value="">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            {/* Subject Filter */}
            {availableSubjects.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                <span className="text-slate-600 font-bold">Subject:</span>
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="">All Subjects</option>
                  {availableSubjects.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <span className="text-slate-600 font-bold">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="title">Title (A - Z)</option>
                <option value="marks-desc">Marks: High to Low</option>
                <option value="marks-asc">Marks: Low to High</option>
                <option value="difficulty">Difficulty: Hard to Easy</option>
              </select>
            </div>

            {/* Reset Filters */}
            {(typeFilter || difficultyFilter || subjectFilter || search) && (
              <button
                onClick={() => {
                  setTypeFilter('');
                  setDifficultyFilter('');
                  setSubjectFilter('');
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
              placeholder="Search problems, topics, tags..."
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

      {/* ─── Question Cards Grid ────────────────────────────────────── */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <RefreshCw className="h-6 w-6 text-brand-500 animate-spin mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-600">Retrieving question bank items...</p>
        </div>
      ) : filteredAndSortedQuestions.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <div className="p-3 bg-slate-100 text-slate-400 rounded-2xl w-fit mx-auto">
            <Database className="h-8 w-8" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No matching problem items found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search criteria or create a new question item in this repository.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-brand-600 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-md shadow-brand-500/20"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Problem</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAndSortedQuestions.map((q) => {
            const isCoding = q.type === 'coding';
            const isMCQ = q.type === 'mcq';
            const qId = q._id || q.id;

            return (
              <div
                key={qId}
                className="p-5 rounded-3xl bg-white border border-slate-200/90 hover:border-brand-300 hover:shadow-md transition-all space-y-4 flex flex-col justify-between group"
              >
                <div className="space-y-2.5">
                  {/* Category Pill & High-Contrast Difficulty Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isCoding ? (
                        <span className="p-1.5 rounded-lg bg-violet-100 text-violet-700 border border-violet-200">
                          <Code2 className="h-3.5 w-3.5 stroke-[2.2]" />
                        </span>
                      ) : isMCQ ? (
                        <span className="p-1.5 rounded-lg bg-brand-100 text-brand-700 border border-brand-200">
                          <CheckSquare className="h-3.5 w-3.5 stroke-[2.2]" />
                        </span>
                      ) : (
                        <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700 border border-amber-200">
                          <FileText className="h-3.5 w-3.5 stroke-[2.2]" />
                        </span>
                      )}
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        {q.subject || 'General'} {q.topic ? `• ${q.topic}` : ''}
                      </span>
                    </div>

                    {/* WCAG High Contrast Badges */}
                    <span
                      className={`text-[11px] font-bold px-3 py-0.5 rounded-full border ${
                        q.difficulty === 'Hard'
                          ? 'bg-rose-50 border-rose-300 text-rose-800'
                          : q.difficulty === 'Medium'
                          ? 'bg-amber-50 border-amber-300 text-amber-900'
                          : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      }`}
                    >
                      {q.difficulty || 'Medium'}
                    </span>
                  </div>

                  {/* Problem Title */}
                  <h3 className="text-base font-extrabold text-slate-900 leading-snug group-hover:text-brand-700 transition">
                    {q.title}
                  </h3>

                  {/* Problem Description */}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
                    {q.description}
                  </p>

                  {/* Tags */}
                  {q.tags && q.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {q.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md"
                        >
                          <Hash className="h-2.5 w-2.5 text-slate-400" />
                          {tag}
                        </span>
                      ))}
                      {q.tags.length > 3 && (
                        <span className="text-[10px] font-bold text-slate-600">
                          +{q.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Metadata & Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2.5 text-slate-700 font-semibold text-[11px]">
                    <span className="flex items-center gap-1 text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                      <Award className="h-3 w-3 text-brand-600" />
                      {q.marks || 10} Marks
                    </span>
                    {isCoding && (
                      <span className="text-slate-600">
                        • {q.testCases?.length || 2} Test Cases
                      </span>
                    )}
                    {isMCQ && (
                      <span className="text-slate-600">
                        • {q.options?.length || 4} Choices
                      </span>
                    )}
                  </div>

                  {/* High-Contrast Action Suite */}
                  <div className="flex items-center gap-1.5">
                    {/* Preview Button */}
                    <button
                      onClick={() => setPreviewQuestion(q)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition"
                      title="Inspect & Test Cases"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-600" />
                      <span>Preview</span>
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleOpenEditModal(q)}
                      className="p-1.5 rounded-xl text-slate-600 hover:text-brand-600 hover:bg-brand-50 transition"
                      title="Edit Problem"
                    >
                      <Edit className="h-4 w-4" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(qId, q.title)}
                      className="p-1.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Remove Problem"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Problem Inspection & Test Cases Preview Modal ────────────── */}
      {previewQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-3xl rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      previewQuestion.difficulty === 'Hard'
                        ? 'bg-rose-50 border-rose-300 text-rose-800'
                        : previewQuestion.difficulty === 'Medium'
                        ? 'bg-amber-50 border-amber-300 text-amber-900'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    }`}
                  >
                    {previewQuestion.difficulty}
                  </span>
                  <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                    {previewQuestion.subject} • {previewQuestion.topic}
                  </span>
                  <span className="text-[11px] font-extrabold text-brand-600 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-md">
                    {previewQuestion.marks} Marks
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900">{previewQuestion.title}</h2>
              </div>

              <button
                onClick={() => setPreviewQuestion(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Problem Statement</h4>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
                {previewQuestion.description}
              </div>
            </div>

            {/* Formats & Constraints (For Coding) */}
            {previewQuestion.type === 'coding' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {previewQuestion.inputFormat && (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Input Format</span>
                    <p className="text-slate-800 font-mono text-[11px] whitespace-pre-wrap">{previewQuestion.inputFormat}</p>
                  </div>
                )}
                {previewQuestion.outputFormat && (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Output Format</span>
                    <p className="text-slate-800 font-mono text-[11px] whitespace-pre-wrap">{previewQuestion.outputFormat}</p>
                  </div>
                )}
              </div>
            )}

            {/* Test Cases (For Coding) */}
            {previewQuestion.type === 'coding' && previewQuestion.testCases && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Test Cases ({previewQuestion.testCases.length})
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {previewQuestion.testCases.filter((tc) => tc.isHidden).length} Hidden •{' '}
                    {previewQuestion.testCases.filter((tc) => !tc.isHidden).length} Public
                  </span>
                </div>

                <div className="space-y-2">
                  {previewQuestion.testCases.map((tc, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">Test Case #{idx + 1}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            tc.isHidden ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {tc.isHidden ? 'Hidden (Grading)' : 'Public (Sample)'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Input:</span>
                          <pre className="p-2 rounded-xl bg-white border border-slate-200 font-mono text-[11px] text-slate-800 overflow-x-auto">
                            {tc.input || '(empty input)'}
                          </pre>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Expected Output:</span>
                          <pre className="p-2 rounded-xl bg-white border border-slate-200 font-mono text-[11px] text-slate-800 overflow-x-auto">
                            {tc.expectedOutput || '(empty output)'}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MCQ Options (For MCQ) */}
            {previewQuestion.type === 'mcq' && previewQuestion.options && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Choice Options</h4>
                <div className="space-y-2">
                  {previewQuestion.options.map((opt, idx) => {
                    const isCorrect = (previewQuestion.correctOptionIds || []).includes(opt.id);
                    return (
                      <div
                        key={opt.id || idx}
                        className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                          isCorrect
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                        {isCorrect && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            <Check className="h-4 w-4" /> Correct Answer
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPreviewQuestion(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  const q = previewQuestion;
                  setPreviewQuestion(null);
                  handleOpenEditModal(q);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/20"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>Edit This Problem</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Add / Edit Problem Modal ───────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-3xl rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {editingQuestion ? 'Edit Problem Item' : 'Create New Repository Problem'}
                </h3>
                <p className="text-xs text-slate-500">
                  Specify problem requirements, grading rubric, and automated test cases.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              {/* Title & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-800 font-bold mb-1">Problem Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Valid Parentheses with Stack Analysis"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-brand-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1">Problem Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-brand-500 focus:bg-white"
                  >
                    <option value="coding">Coding Challenge</option>
                    <option value="mcq">Multiple Choice (MCQ)</option>
                    <option value="descriptive">Descriptive / Essay</option>
                  </select>
                </div>
              </div>

              {/* Subject, Topic, Difficulty & Marks */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Data Structures"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1">Topic</label>
                  <input
                    type="text"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    placeholder="Stacks & Queues"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-brand-500"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1">Marks</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.marks}
                    onChange={(e) => setFormData({ ...formData, marks: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Problem Description */}
              <div>
                <label className="block text-slate-800 font-bold mb-1">Problem Description *</label>
                <textarea
                  rows={4}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed problem statement with input/output guidelines..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-brand-500 leading-relaxed"
                />
              </div>

              {/* Coding Specifics: Input/Output format & Constraints */}
              {formData.type === 'coding' && (
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-extrabold text-slate-800 block">Coding Challenge Parameters</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Input Format</label>
                      <input
                        type="text"
                        value={formData.inputFormat || ''}
                        onChange={(e) => setFormData({ ...formData, inputFormat: e.target.value })}
                        placeholder="Integer N followed by elements"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Output Format</label>
                      <input
                        type="text"
                        value={formData.outputFormat || ''}
                        onChange={(e) => setFormData({ ...formData, outputFormat: e.target.value })}
                        placeholder="Single integer or string output"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs"
                      />
                    </div>
                  </div>

                  {/* Test Cases Editor */}
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Automated Test Cases ({formData.testCases?.length || 0})
                      </span>
                      <button
                        type="button"
                        onClick={handleAddTestCase}
                        className="flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-700"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Test Case</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {formData.testCases?.map((tc, index) => (
                        <div
                          key={index}
                          className="p-3 rounded-xl bg-white border border-slate-200 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700">Case #{index + 1}</span>
                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={tc.isHidden}
                                  onChange={(e) => handleTestCaseChange(index, 'isHidden', e.target.checked)}
                                  className="rounded text-brand-600 focus:ring-0"
                                />
                                <span>Hidden Case</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => handleRemoveTestCase(index)}
                                className="text-slate-400 hover:text-rose-500"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={tc.input}
                              onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                              placeholder="Standard Input"
                              className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-800"
                            />
                            <input
                              type="text"
                              value={tc.expectedOutput}
                              onChange={(e) => handleTestCaseChange(index, 'expectedOutput', e.target.value)}
                              placeholder="Expected Output"
                              className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-800"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* MCQ Options Editor */}
              {formData.type === 'mcq' && (
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-800">Multiple Choice Options</span>
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-700"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Option</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {formData.options?.map((opt, idx) => {
                      const isCorrect = (formData.correctOptionIds || []).includes(opt.id);
                      return (
                        <div
                          key={opt.id || idx}
                          className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200"
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleCorrectOption(opt.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                              isCorrect
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                            title="Set as correct answer"
                          >
                            {String.fromCharCode(65 + idx)} {isCorrect ? '✓' : ''}
                          </button>
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => handleOptionChange(opt.id, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + idx)} text`}
                            className="flex-1 px-2.5 py-1 rounded-lg text-xs text-slate-800 bg-transparent focus:outline-none"
                          />
                          {formData.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(opt.id)}
                              className="p-1 text-slate-400 hover:text-rose-500"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/20 disabled:opacity-50 transition"
                >
                  {submitting
                    ? 'Saving Item...'
                    : editingQuestion
                    ? 'Update Problem Item'
                    : 'Add to Repository'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
