import React from 'react';
import { Clock, ShieldCheck, PenTool, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '../ui/Button';

const ExamHeader = React.memo(({
  examTitle,
  examSubject,
  remainingSeconds,
  formatTimer,
  autoSaveStatus,
  setPolicyModalOpen,
  setRoughPadOpen,
  toggleFullscreen,
  isFullscreen,
  setSubmitModalOpen
}) => {
  return (
    <header className="h-14 border-b border-slate-200 bg-white/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0 z-30">
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
          {examSubject || 'Assessment'}
        </span>
        <h2 className="text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
          {examTitle}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        <div 
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100/50 border border-slate-200"
          aria-live="polite"
          aria-atomic="true"
        >
          <Clock className={`h-4 w-4 ${remainingSeconds < 300 ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`} aria-hidden="true" />
          <span className={`font-mono text-sm font-bold tracking-tight ${remainingSeconds < 300 ? 'text-rose-600' : 'text-slate-800'}`}>
            {formatTimer(remainingSeconds)}
          </span>
        </div>

        <span className="hidden sm:inline text-[11px] text-slate-600 italic">
          {autoSaveStatus}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setPolicyModalOpen(true)}
          className="gap-1.5"
          title="View Security & Proctoring Policy"
          aria-label="View Security and Proctoring Policy"
        >
          <ShieldCheck className="h-3.5 w-3.5 text-brand-500" aria-hidden="true" />
          <span className="hidden md:inline">Policy</span>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setRoughPadOpen(true)}
          className="gap-1.5"
          title="Open Scratchpad"
          aria-label="Open Scratchpad"
        >
          <PenTool className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
          <span className="hidden sm:inline">Rough Pad</span>
        </Button>

        <Button
          variant="secondary"
          size="icon"
          onClick={toggleFullscreen}
          title="Toggle Fullscreen"
          aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4 text-slate-700" aria-hidden="true" /> : <Maximize2 className="h-4 w-4 text-slate-700" aria-hidden="true" />}
        </Button>

        <Button
          variant="primary"
          onClick={() => setSubmitModalOpen(true)}
        >
          Submit Exam
        </Button>
      </div>
    </header>
  );
});

export default ExamHeader;
