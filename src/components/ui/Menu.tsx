import React, { useEffect, useRef, useState } from 'react';
import { MoreVerticalIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

export interface MenuItem {
  label: string;
  onSelect?: () => void;
  danger?: boolean;
  /** Shown but not selectable, for example when the user lacks the permission. */
  disabled?: boolean;
  /** Why the item is disabled. */
  hint?: string;
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
        onClick={(event) => {
          event.stopPropagation();
          setOpen((prev) => !prev);
        }}
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
          onClick={(event) => event.stopPropagation()}
          className="absolute right-0 top-9 z-30 w-56 overflow-hidden rounded-lg border border-line bg-white py-1 shadow-pop">
          
            {items.map((item) =>
          <button
            key={item.label}
            type="button"
            role="menuitem"
            aria-disabled={item.disabled || undefined}
            title={item.disabled ? item.hint : undefined}
            onClick={() => {
              if (item.disabled) return;
              setOpen(false);
              item.onSelect?.();
            }}
            className={twMerge(
              'block w-full px-3 py-2 text-left text-[13px] transition-colors duration-150 ease-out',
              item.disabled ?
              'cursor-not-allowed text-slate-400' :
              item.danger ?
              'text-red-600 hover:bg-slate-50' :
              'text-ink hover:bg-slate-50'
            )}>
            
                {item.label}
                {item.disabled && item.hint &&
            <span className="mt-0.5 block text-[11px] leading-snug text-subtle">{item.hint}</span>
            }
              </button>
          )}
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}