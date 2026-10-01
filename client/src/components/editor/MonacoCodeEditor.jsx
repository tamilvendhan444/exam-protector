import React, { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import {
  Play,
  Send,
  RotateCcw,
  Sun,
  Moon,
  Type,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  ShieldCheck
} from 'lucide-react';
import { codeApi } from '../../services/api';

const LANGUAGE_MAP = {
  cpp: 'cpp',
  c: 'c',
  python: 'python',
  javascript: 'javascript',
  java: 'java'
};

export default function MonacoCodeEditor({
  question,
  code,
  language = 'cpp',
  onCodeChange,
  onLanguageChange,
  onResetCode,
  attemptId,
  examId,
  onPasteDetected,
  onTypingBurstDetected,
  onClipboardBlocked,
  onCodeSubmitted,
  onActivity
}) {
  const [theme, setTheme] = useState('vs-dark');
  const [fontSize, setFontSize] = useState(14);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('testcases'); // 'testcases' | 'output'
  const [testResult, setTestResult] = useState(null);
  const [selectedCaseIndex, setSelectedCaseIndex] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(true);

  // Keystroke dynamics and paste detection telemetry
  const isPasteEventRef = useRef(false);
  const keystrokeBufferRef = useRef([]);
  const lastAlertTimeRef = useRef({ paste: 0, burst: 0 });

  const handleEditorMount = (editor, monaco) => {
    // Intercept Monaco internal commands for clipboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {
      if (onClipboardBlocked) onClipboardBlocked('paste');
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, () => {
      if (onClipboardBlocked) onClipboardBlocked('copy');
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyX, () => {
      if (onClipboardBlocked) onClipboardBlocked('cut');
    });

    editor.onKeyDown(() => {
      if (onActivity) onActivity();
    });
    editor.onMouseDown(() => {
      if (onActivity) onActivity();
    });

    // 1. Paste Event Interception
    editor.onDidPaste((e) => {
      isPasteEventRef.current = true;
      setTimeout(() => { isPasteEventRef.current = false; }, 350);

      try {
        const model = editor.getModel();
        const pastedText = model ? model.getValueInRange(e.range) : '';
        const charCount = pastedText.length;
        const lineCount = (pastedText.match(/\n/g) || []).length + 1;

        const now = Date.now();
        if (charCount >= 30 || lineCount >= 2) {
          if (now - lastAlertTimeRef.current.paste > 4000) {
            lastAlertTimeRef.current.paste = now;
            if (onPasteDetected) {
              onPasteDetected({
                charCount,
                lineCount,
                snippet: pastedText.slice(0, 100),
                timestamp: now
              });
            }
          }
        }
      } catch (err) { }
    });

    // 2. Typing Velocity & Burst Monitor
    editor.onDidChangeModelContent((e) => {
      if (isPasteEventRef.current) return;

      const now = Date.now();
      let insertedChars = 0;
      (e.changes || []).forEach(ch => {
        if (ch.text && ch.text.length > 0) {
          insertedChars += ch.text.length;
        }
      });
      console.log('[DEBUG-CHECKPOINT-2] editor.onDidChangeModelContent triggered, insertedChars:', insertedChars);

      if (insertedChars === 0) return;

      // Keep only keystrokes from the last 400ms
      keystrokeBufferRef.current = keystrokeBufferRef.current.filter(item => now - item.time <= 400);
      keystrokeBufferRef.current.push({ count: insertedChars, time: now });

      const totalRecent = keystrokeBufferRef.current.reduce((acc, curr) => acc + curr.count, 0);

      // Flag if > 45 characters inserted within 400ms without a paste event (macro / injection)
      if (totalRecent >= 45 && !isPasteEventRef.current) {
        if (now - lastAlertTimeRef.current.burst > 5000) {
          lastAlertTimeRef.current.burst = now;
          if (onTypingBurstDetected) {
            onTypingBurstDetected({
              charCount: totalRecent,
              timeDeltaMs: 400,
              timestamp: now
            });
          }
        }
        keystrokeBufferRef.current = [];
      }
    });
  };

  // Run code against sample test cases
  const handleRunCode = async () => {
    setIsRunning(true);
    setActiveTab('output');
    setDrawerOpen(true);
    console.log('[DEBUG-CHECKPOINT-4] handleRunCode initiated');
    try {
      const sampleCases = question?.testCases || [
        { input: '', expectedOutput: '' }
      ];

      const res = await codeApi.runCode({
        language,
        code,
        testCases: sampleCases
      });

      setTestResult(res);
      setSelectedCaseIndex(0);
    } catch (err) {
      setTestResult({
        status: 'Runtime Error',
        message: err.message || 'Execution failed',
        stderr: err.message || 'Execution failed',
        allPassed: false,
        passedTestCases: 0,
        totalTestCases: 1,
        results: [{
          testCaseIndex: 1,
          status: 'Runtime Error',
          error: err.message || 'Execution failed'
        }]
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Submit code for question
  const handleSubmitCode = async () => {
    setIsSubmitting(true);
    setActiveTab('output');
    setDrawerOpen(true);
    try {
      const res = await codeApi.submitCode({
        examId,
        attemptId,
        questionId: question?._id || question?.id,
        code,
        language
      });

      setTestResult(res);
      setSelectedCaseIndex(0);
      if (onCodeSubmitted) {
        onCodeSubmitted(res);
      }
    } catch (err) {
      alert('Code submission error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sampleCases = question?.testCases || [];

  return (
    <div className="flex flex-col h-full rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xl">
      {/* Editor Header / Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-50/80 border-b border-slate-200 text-xs">
        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 font-medium">Language:</span>
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1 focus:outline-none focus:border-brand-500"
            >
              <option value="cpp">C++ (GCC 9)</option>
              <option value="c">C (GCC 9)</option>
              <option value="python">Python 3</option>
              <option value="java">Java 13</option>
              <option value="javascript">JavaScript (Node.js)</option>
            </select>
          </div>

          {/* Reset Code */}
          <button
            onClick={onResetCode}
            title="Reset to starter template"
            className="flex items-center gap-1 text-slate-600 hover:text-slate-800 transition px-2 py-1 rounded hover:bg-slate-100"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Editor Settings: Theme, Font Size */}
        <div className="flex items-center gap-2.5">
          {/* Font Size */}
          <div className="flex items-center gap-1 bg-slate-100/60 px-2 py-1 rounded-lg border border-slate-300/60">
            <Type className="h-3.5 w-3.5 text-slate-600" />
            <select
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="bg-transparent text-slate-700 text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value={12}>12px</option>
              <option value={14}>14px</option>
              <option value={16}>16px</option>
              <option value={18}>18px</option>
            </select>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark')}
            title="Toggle Editor Theme"
            className="p-1.5 rounded-lg bg-slate-100/60 hover:bg-slate-100 text-slate-700 border border-slate-300/60 transition"
          >
            {theme === 'vs-dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>

          {/* Telemetry Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-[10px] font-semibold text-emerald-400 shadow-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <ShieldCheck className="h-3 w-3" />
            <span>Keystroke &amp; Paste Guard: Active</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <button
              onClick={handleRunCode}
              disabled={isRunning || isSubmitting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold transition disabled:opacity-50 shadow-sm"
            >
              <Play className="h-3.5 w-3.5 fill-current text-emerald-400" />
              <span>{isRunning ? 'Running...' : 'Run Code'}</span>
            </button>

            <button
              onClick={handleSubmitCode}
              disabled={isRunning || isSubmitting}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-slate-900 font-bold transition disabled:opacity-50 shadow-md shadow-brand-500/20"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSubmitting ? 'Evaluating...' : 'Submit Code'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Monaco Code Editor Workspace */}
      <div
        className="flex-1 min-h-[300px] relative select-none"
        onCopy={(e) => {
          e.preventDefault();
          if (onClipboardBlocked) onClipboardBlocked('copy');
        }}
        onCut={(e) => {
          e.preventDefault();
          if (onClipboardBlocked) onClipboardBlocked('cut');
        }}
        onPaste={(e) => {
          e.preventDefault();
          if (onClipboardBlocked) onClipboardBlocked('paste');
        }}
        onContextMenu={(e) => {
          e.preventDefault();
        }}
      >
        <Editor
          height="100%"
          language={LANGUAGE_MAP[language] || 'cpp'}
          value={code}
          onMount={handleEditorMount}
          onChange={(newVal) => onCodeChange(newVal || '')}
          theme={theme}
          options={{
            fontSize,
            fontFamily: "'JetBrains Mono', monospace",
            minimap: { enabled: false },
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            bracketPairColorization: { enabled: true },
            wordWrap: 'on',
            contextmenu: false,
            padding: { top: 12, bottom: 12 }
          }}
        />
      </div>

      {/* Output / Test Case Drawer */}
      <div className={`border-t border-slate-200 bg-slate-50 transition-all ${drawerOpen ? 'h-56' : 'h-10'} flex flex-col shrink-0`}>
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-200/90 border-b border-slate-200/80 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setActiveTab('testcases'); setDrawerOpen(true); }}
              className={`px-3 py-1 rounded-md font-semibold transition ${activeTab === 'testcases' ? 'bg-slate-100 text-brand-400 border border-slate-300' : 'text-slate-600 hover:text-slate-800'}`}
            >
              Test Cases ({sampleCases.length})
            </button>
            <button
              onClick={() => { setActiveTab('output'); setDrawerOpen(true); }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition ${activeTab === 'output' ? 'bg-slate-100 text-brand-400 border border-slate-300' : 'text-slate-600 hover:text-slate-800'}`}
            >
              <span>Execution Result</span>
              {testResult && (
                <span className={`h-2 w-2 rounded-full ${testResult.allPassed ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
              )}
            </button>
          </div>

          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="p-1 rounded text-slate-600 hover:text-slate-900"
          >
            {drawerOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>

        {/* Drawer Body */}
        {drawerOpen && (
          <div className="flex-1 p-3 overflow-y-auto font-mono text-xs">
            {activeTab === 'testcases' ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {sampleCases.map((tc, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedCaseIndex(idx)}
                      className={`px-3 py-1 rounded-lg font-semibold transition ${selectedCaseIndex === idx ? 'bg-brand-600 text-slate-900' : 'bg-slate-100 text-slate-600 hover:text-slate-800'}`}
                    >
                      Case {idx + 1}
                    </button>
                  ))}
                </div>

                {sampleCases[selectedCaseIndex] && (
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <span className="text-[11px] text-slate-600 font-sans block mb-1">Input:</span>
                      <pre className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 whitespace-pre-wrap">
                        {sampleCases[selectedCaseIndex].input}
                      </pre>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-600 font-sans block mb-1">Expected Output:</span>
                      <pre className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 whitespace-pre-wrap">
                        {sampleCases[selectedCaseIndex].expectedOutput}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {isRunning ? (
                  <div className="flex items-center gap-2 text-slate-600 p-4">
                    <div className="animate-spin h-4 w-4 border-2 border-brand-500 border-t-transparent rounded-full"></div>
                    <span>Compiling and running against isolated test sandbox...</span>
                  </div>
                ) : testResult ? (
                  <div className="space-y-3">
                    {/* Status Banner */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {testResult.allPassed ? (
                          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-sm font-sans">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Accepted</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-rose-400 font-bold text-sm font-sans">
                            <XCircle className="h-4 w-4" />
                            <span>{testResult.status || 'Wrong Answer'}</span>
                          </div>
                        )}
                        <span className="text-slate-600 font-sans text-xs">
                          ({testResult.passedTestCases} / {testResult.totalTestCases} Test Cases Passed)
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-slate-600 text-[11px] font-sans">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {testResult.averageExecutionTimeMs || 15}ms
                        </span>
                        <span className="flex items-center gap-1">
                          <Cpu className="h-3 w-3" />
                          {testResult.maxMemoryKb || 4096} KB
                        </span>
                      </div>
                    </div>

                    {/* Case Buttons */}
                    <div className="flex items-center gap-1.5">
                      {(testResult.results || []).map((r, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedCaseIndex(idx)}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition ${selectedCaseIndex === idx
                              ? 'bg-slate-700 text-slate-900'
                              : 'bg-slate-100/80 text-slate-600'
                            }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${r.passed ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                          <span>Case {r.testCaseIndex}</span>
                        </button>
                      ))}
                    </div>

                    {/* Selected Case Detail */}
                    {testResult.results?.[selectedCaseIndex] && (
                      <div className={`grid ${testResult.status === 'Compilation Error' ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
                        <div>
                          <span className={`text-[11px] font-sans font-bold block mb-1 ${testResult.status === 'Compilation Error' || testResult.results[selectedCaseIndex].status === 'Runtime Error' ? 'text-rose-600' : 'text-slate-600'}`}>
                            {testResult.status === 'Compilation Error' ? 'Compiler Error Output:' : 
                             testResult.results[selectedCaseIndex].status === 'Runtime Error' ? 'Runtime Error Trace:' : 'Actual Output:'}
                          </span>
                          <pre className={`p-2.5 rounded-lg border text-xs whitespace-pre-wrap overflow-x-auto ${testResult.results[selectedCaseIndex].passed
                              ? 'bg-emerald-950/20 border-emerald-800/50 text-emerald-300'
                              : (testResult.status === 'Compilation Error' || testResult.results[selectedCaseIndex].status === 'Runtime Error')
                                ? 'bg-rose-950/90 border-rose-800 text-rose-300 font-mono shadow-inner'
                                : 'bg-rose-950/20 border-rose-800/50 text-rose-300'
                            }`}>
                            {(testResult.status === 'Compilation Error')
                                ? (testResult.stderr || testResult.message || testResult.results[selectedCaseIndex].error || 'No compiler output available')
                                : (testResult.results[selectedCaseIndex].status === 'Runtime Error')
                                  ? (testResult.results[selectedCaseIndex].error || testResult.stderr || testResult.message || 'No runtime error trace available')
                                  : (testResult.results[selectedCaseIndex].actualOutput || testResult.results[selectedCaseIndex].error || 'No output')}
                          </pre>
                        </div>
                        {testResult.status !== 'Compilation Error' && (
                          <div>
                            <span className="text-[11px] text-slate-600 font-sans block mb-1">Expected Output:</span>
                            <pre className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 whitespace-pre-wrap overflow-x-auto">
                              {testResult.results[selectedCaseIndex].expectedOutput}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-500 italic p-2">Click "Run Code" to compile and test against sample cases.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
