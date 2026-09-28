import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from './Button';

export function Dialog({
  open,
  title,
  body,
  confirmLabel = 'Submit',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel








}: {open: boolean;title: string;body: React.ReactNode;confirmLabel?: string;cancelLabel?: string;onConfirm: () => void;onCancel: () => void;}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open &&
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          className="absolute inset-0 bg-slate-900/40"
          onClick={onCancel} />
        
          <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 4 }}
          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-pop">
          
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            <div className="mt-2 text-sm leading-relaxed text-muted">{body}</div>
            <div className="mt-6 flex justify-end gap-2">
              <Button onClick={onCancel}>{cancelLabel}</Button>
              <Button variant="primary" onClick={onConfirm}>
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      }
    </AnimatePresence>);

}