import React from 'react';
import { cn } from '../../lib/utils';

export function Card({ className, children, ...props }) {
  return (
    <div 
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white/70 backdrop-blur-xl shadow-sm overflow-hidden",
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
}
