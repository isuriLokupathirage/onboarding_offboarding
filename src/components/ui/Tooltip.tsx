import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

/** `multiline` keeps the label's line breaks and aligns it left, for formulas and longer notes. */
export function Tooltip({
  label,
  children,
  className,
  multiline = false
}: {label: string;children: React.ReactNode;className?: string;multiline?: boolean;}) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className={twMerge('relative inline-flex', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}>
      
      {children}
      <AnimatePresence>
        {open &&
        <motion.span
          role="tooltip"
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14, ease: [0.23, 1, 0.32, 1] }}
          className={twMerge(
            'absolute bottom-full left-1/2 z-40 mb-2 -translate-x-1/2 w-max max-w-xs rounded-md text-center leading-snug bg-ink px-2 py-1 text-[11px] font-medium text-white shadow-pop',
            multiline && 'whitespace-pre-line px-2.5 py-1.5 text-left'
          )}>
          
            {label}
          </motion.span>
        }
      </AnimatePresence>
    </span>);

}