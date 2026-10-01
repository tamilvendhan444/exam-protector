import React from 'react';
import { Clock, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';

const QuestionWorkspace = React.memo(({
  currentQuestion,
  currentIndex,
  totalQuestions,
  currentAns,
  formatTimer,
  updateCurrentAnswer,
  handleClipboardBlocked
}) => {
  return (
    <div
      onCopy={(e) => { e.preventDefault(); handleClipboardBlocked('copy'); }}
      onCut={(e) => { e.preventDefault(); handleClipboardBlocked('cut'); }}
      onPaste={(e) => { e.preventDefault(); handleClipboardBlocked('paste'); }}
      onContextMenu={(e) => e.preventDefault()}
      className={`p-6 overflow-y-auto border-r border-slate-200/80 space-y-6 select-none ${
        currentQuestion.type === 'coding' ? 'w-full lg:w-5/12' : 'w-full max-w-3xl mx-auto'
      }`}
    >
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-brand-400">
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <span className="text-[11px] font-mono font-medium text-slate-600 bg-slate-100/60 border border-slate-300/50 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Clock className="h-3 w-3 text-slate-600" />
              <span>{formatTimer(currentAns.timeSpentSeconds || 0)}</span>
            </span>
          </div>
          <span className="text-xs font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
            {currentQuestion.marks} Marks
          </span>
        </div>
        <h2 className="text-lg font-bold text-slate-900">{currentQuestion.title}</h2>
      </div>

      {/* Description */}
      <div className="text-xs text-slate-700 leading-relaxed space-y-3 whitespace-pre-wrap">
        {currentQuestion.description}
      </div>

      {/* Constraints & Examples if Coding */}
      {currentQuestion.type === 'coding' && (
        <div className="space-y-4 pt-2">
          {currentQuestion.inputFormat && (
            <div>
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Input Format:</h4>
              <pre className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs whitespace-pre-wrap">
                {currentQuestion.inputFormat}
              </pre>
            </div>
          )}

          {currentQuestion.constraints && (
            <div>
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Constraints:</h4>
              <pre className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs whitespace-pre-wrap font-mono">
                {currentQuestion.constraints}
              </pre>
            </div>
          )}

          {currentQuestion.examples && currentQuestion.examples.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Examples:</h4>
              <div className="space-y-2.5">
                {currentQuestion.examples.map((ex, exIdx) => (
                  <Card key={exIdx} className="p-3 text-xs space-y-1.5 font-mono">
                    <div><span className="text-slate-500">Input:</span> {ex.input}</div>
                    <div><span className="text-slate-500">Output:</span> {ex.output}</div>
                    {ex.explanation && (
                      <div className="text-slate-600 font-sans text-[11px] pt-1 border-t border-slate-200/80">
                        Explanation: {ex.explanation}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MCQ Options */}
      {currentQuestion.type === 'mcq' && (
        <div className="space-y-3 pt-4">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Select Answer:</span>
          <div className="space-y-2.5">
            {(currentQuestion.options || []).map((opt) => {
              const selected = (currentAns.selectedOptionIds || []).includes(opt.id);
              return (
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  key={opt.id}
                  role={currentQuestion.isMultipleChoice ? "checkbox" : "radio"}
                  aria-checked={selected}
                  onClick={() => {
                    if (currentQuestion.isMultipleChoice) {
                      const current = currentAns.selectedOptionIds || [];
                      const next = selected ? current.filter(id => id !== opt.id) : [...current, opt.id];
                      updateCurrentAnswer('selectedOptionIds', next);
                    } else {
                      updateCurrentAnswer('selectedOptionIds', [opt.id]);
                    }
                  }}
                  className={`w-full p-4 rounded-xl border text-left transition-colors flex items-start gap-3.5 text-xs font-medium ${
                    selected
                      ? 'bg-brand-500/15 border-brand-500 text-slate-900 shadow-md shadow-brand-500/10'
                      : 'bg-white/60 border-slate-200 text-slate-700 hover:bg-slate-100/50'
                  }`}
                >
                  <div className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                    selected ? 'border-brand-500 bg-brand-500 text-slate-900' : 'border-slate-400'
                  }`}>
                    {selected && <Check className="h-3 w-3" />}
                  </div>
                  <span className="leading-relaxed">{opt.text}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Descriptive Input */}
      {currentQuestion.type === 'descriptive' && (
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-600 uppercase tracking-wider">Your Written Solution:</span>
            <span className="text-slate-600 font-mono">
              Words: {(currentAns.descriptiveAnswer || '').trim().split(/\s+/).filter(Boolean).length} / {currentQuestion.minWords || 50} min
            </span>
          </div>

          <textarea
            rows={10}
            value={currentAns.descriptiveAnswer || ''}
            onChange={(e) => updateCurrentAnswer('descriptiveAnswer', e.target.value)}
            placeholder="Type your comprehensive explanation and analysis here..."
            className="w-full p-4 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs placeholder-slate-500 focus:outline-none focus:border-brand-500 leading-relaxed font-sans"
          />
        </div>
      )}
    </div>
  );
});

export default QuestionWorkspace;
