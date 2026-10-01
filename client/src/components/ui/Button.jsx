import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const variants = {
  default: "bg-slate-900 text-white hover:bg-slate-800 shadow-md",
  primary: "bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-lg shadow-brand-500/25",
  secondary: "bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 shadow-sm",
  danger: "bg-rose-600 text-white hover:bg-rose-500 shadow-lg shadow-rose-500/25",
  ghost: "hover:bg-slate-100 text-slate-700",
};

const sizes = {
  sm: "h-8 px-3 text-xs",
  default: "h-10 px-4 py-2 text-sm",
  lg: "h-12 px-8 text-base",
  icon: "h-9 w-9 p-0 flex items-center justify-center",
};

export const Button = React.forwardRef(({
  className,
  variant = "default",
  size = "default",
  disabled,
  children,
  ...props
}, ref) => {
  return (
    <motion.button
      ref={ref}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
});
Button.displayName = "Button";
