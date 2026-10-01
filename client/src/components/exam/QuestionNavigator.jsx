import React from 'react';
import { Check, Bookmark, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const QuestionNavigator = React.memo(({
  questions,
  answers,
  currentIndex,
  setCurrentIndex,
  answeredCount,
  markedCount,
  unattemptedCount
}) => {
  return (
    <aside aria-label="Question Navigation" className="w-64 border-r border-slate-200 bg-white/60 p-4 flex flex-col justify-between shrink-0 overflow-y-auto hidden md:flex">
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Question Matrix</h3>

        {/* Status Legend */}
        <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-600 p-2 rounded-xl bg-slate-100/30 border border-slate-200">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Answered ({answeredCount})
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500"></span> Review ({markedCount})
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-slate-600"></span> Unvisited ({unattemptedCount})
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-brand-500"></span> Current
          </span>
        </div>

        {/* Question Buttons Grid */}
        <div className="grid grid-cols-4 gap-2 pt-2">
          {questions.map((q, idx) => {
            const qId = q._id || q.id;
            const status = answers[qId]?.status;
            const isCurrent = currentIndex === idx;

            let btnStyle = 'bg-slate-100/60 text-slate-600 border-slate-300/60 hover:bg-slate-200';
            if (status === 'answered') {
              btnStyle = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold';
            } else if (status === 'marked_for_review') {
              btnStyle = 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold';
            }

            if (isCurrent) {
              btnStyle += ' ring-2 ring-brand-500 shadow-md shadow-brand-500/20';
            }

            return (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                key={qId}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Question ${idx + 1}, ${status.replace(/_/g, ' ')}`}
                aria-current={isCurrent ? "step" : undefined}
                className={`h-10 rounded-xl border text-xs font-bold flex items-center justify-center transition-colors relative ${btnStyle}`}
              >
                <span>{idx + 1}</span>
                {status === 'answered' && <Check className="absolute top-1 right-1 h-2.5 w-2.5" aria-hidden="true" />}
                {status === 'marked_for_review' && <Bookmark className="absolute top-1 right-1 h-2.5 w-2.5 fill-current" aria-hidden="true" />}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* AI Proctoring status pill */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1 mt-4" role="status" aria-live="polite">
        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          <span>Camera Proctor Active</span>
        </div>
        <p className="text-[10px] text-slate-500">Face orientation & workspace verified</p>
      </div>
    </aside>
  );
});

export default QuestionNavigator;
