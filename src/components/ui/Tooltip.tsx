import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export function Tooltip({ label, children }: {label: string;children: React.ReactNode;}) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="relative inline-flex"
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
          className="absolute bottom-full left-1/2 z-40 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[11px] font-medium text-white shadow-pop">
          
            {label}
          </motion.span>
        }
      </AnimatePresence>
    </span>);

}