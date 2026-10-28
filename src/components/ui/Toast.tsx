import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2Icon, XIcon } from 'lucide-react';

/** A short confirmation shown at the bottom right that closes itself after a few seconds. */
export function Toast({ message, onClose }: {message: string | null;onClose: () => void;}) {
  // The timer restarts only for a new message, not whenever the parent re-renders.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => closeRef.current(), 4500);
    return () => clearTimeout(timer);
  }, [message]);

  return (
    <AnimatePresence>
      {message &&
      <motion.div
        role="status"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-2.5 rounded-xl border border-line bg-white px-4 py-3 shadow-pop">

          <CheckCircle2Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <p className="flex-1 text-[13px] leading-relaxed text-ink">{message}</p>
          <button
          type="button"
          aria-label="Dismiss"
          onClick={onClose}
          className="rounded p-0.5 text-subtle transition-colors duration-150 ease-out hover:bg-slate-100 hover:text-ink">

            <XIcon className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      }
    </AnimatePresence>);

}
