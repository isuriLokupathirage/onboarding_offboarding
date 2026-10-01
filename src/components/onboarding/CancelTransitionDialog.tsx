import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangleIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { FieldGroup, Input, Textarea } from '../ui/Field';
import type { Transition } from '../../types';
import { wordCount } from '../../utils/format';

const MAX_WORDS = 250;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function CancelTransitionDialog({
  open,
  transition,
  client,
  onClose,
  onConfirm
}: {
  open: boolean;
  transition: Transition;
  client: string;
  onClose: () => void;
  onConfirm: (date: string, reason: string) => void;
}) {
  const [date, setDate] = useState(today());
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDate(today());
    setReason('');
    setSubmitted(false);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const words = wordCount(reason);
  const dateError = submitted && !date ? 'Enter the date of cancellation.' : null;
  let reasonError: string | null = null;
  if (words > MAX_WORDS) reasonError = `The reason can be up to ${MAX_WORDS} words.`;else
  if (submitted && words === 0) reasonError = 'Enter the reason for cancelling.';

  const fullName = `${transition.candidate.firstName} ${transition.candidate.lastName}`;
  const kind = transition.kind.toLowerCase();

  const handleConfirm = () => {
    setSubmitted(true);
    if (!date || words === 0 || words > MAX_WORDS) return;
    onConfirm(date, reason.trim());
  };

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
          onClick={onClose} />

          <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Cancel Transition"
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 4 }}
          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          className="relative flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-pop">

            <div className="border-b border-line px-6 py-4">
              <h2 className="text-base font-semibold text-ink">Cancel {kind}?</h2>
              <p className="mt-1 text-[13px] text-muted">
                You are cancelling the {kind} for{' '}
                <span className="font-medium text-ink">{fullName}</span>.
              </p>
            </div>

            <div className="scroll-thin flex-1 overflow-y-auto px-6 py-5">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg bg-slate-50 px-4 py-3 text-[13px]">
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-subtle">Name</dt>
                  <dd className="mt-0.5 text-ink">{fullName}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-subtle">Job title</dt>
                  <dd className="mt-0.5 text-ink">{transition.candidate.position}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-subtle">Client</dt>
                  <dd className="mt-0.5 text-ink">{client}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-subtle">Transition type</dt>
                  <dd className="mt-0.5 text-ink">{transition.kind}</dd>
                </div>
              </dl>

              <div className="mt-5 space-y-4">
                <FieldGroup label="Date of Cancellation" required>
                  <Input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  aria-invalid={Boolean(dateError)}
                  className={dateError ? 'w-48 border-red-300' : 'w-48'} />

                  {dateError && <p className="mt-1.5 text-[12px] text-red-600">{dateError}</p>}
                </FieldGroup>

                <FieldGroup
                label="Cancellation Reason"
                required
                hint={
                <span className={`text-[11px] ${words > MAX_WORDS ? 'text-red-600' : 'text-subtle'}`}>
                      {words}/{MAX_WORDS} words
                    </span>
                }>

                  <Textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="e.g. The candidate declined the offer"
                  aria-invalid={Boolean(reasonError)}
                  className={`min-h-[110px] ${reasonError ? 'border-red-300' : ''}`} />

                  {reasonError && <p className="mt-1.5 text-[12px] text-red-600">{reasonError}</p>}
                </FieldGroup>
              </div>

              <div className="mt-5 flex items-start gap-2.5 rounded-lg bg-red-50 px-3.5 py-3 ring-1 ring-inset ring-red-200">
                <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <p className="text-[13px] leading-relaxed text-red-900">
                  <span className="font-medium">This action cannot be undone.</span> The remaining tasks are
                  cancelled and removed from their owners&apos; My Tasks, and the candidate portal and any open
                  form link stop working.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
              <Button onClick={onClose}>Keep Transition</Button>
              <Button variant="danger" onClick={handleConfirm}>
                Cancel Transition
              </Button>
            </div>
          </motion.div>
        </div>
      }
    </AnimatePresence>);

}
