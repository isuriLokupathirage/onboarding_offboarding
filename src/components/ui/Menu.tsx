import React, { useEffect, useRef, useState } from 'react';
import { MoreVerticalIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

export interface MenuItem {
  label: string;
  onSelect?: () => void;
  danger?: boolean;
}

export function Menu({ items, label = 'More actions' }: {items: MenuItem[];label?: string;}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-subtle transition-colors duration-150 ease-out hover:bg-slate-100 hover:text-ink">
        
        <MoreVerticalIcon className="h-4 w-4" />
      </button>
      <AnimatePresence>
        {open &&
        <motion.div
          role="menu"
          initial={{ opacity: 0, scale: 0.96, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
          className="absolute right-0 top-9 z-30 w-44 overflow-hidden rounded-lg border border-line bg-white py-1 shadow-pop">
          
            {items.map((item) =>
          <button
            key={item.label}
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              item.onSelect?.();
            }}
            className={twMerge(
              'block w-full px-3 py-2 text-left text-[13px] transition-colors duration-150 ease-out hover:bg-slate-50',
              item.danger ? 'text-red-600' : 'text-ink'
            )}>
            
                {item.label}
              </button>
          )}
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}