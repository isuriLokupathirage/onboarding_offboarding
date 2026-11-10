import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileQuestionIcon, LockIcon, MailIcon } from 'lucide-react';
import type { Transition } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { SearchInput } from '../ui/SearchInput';
import { useAppData } from '../../contexts/AppDataContext';
import { useFeedbackForms } from '../../contexts/FeedbackFormsContext';
import { addDays, formatDate } from '../../utils/format';
import { FORM_LINK_EXPIRY_DAYS, openFeedbackFormEmail, prototypeNow } from '../../utils/transitions';

/**
 * Transitions → [Offboarding Transition] → Send Form: pick one or more active exit feedback forms
 * and send them together to the employee's official email. A form already open on the transition
 * cannot be picked until that send is submitted, revoked or expires.
 */
export function SendExitFeedbackFormDialog({
  open,
  transition,
  recipient,
  onClose,
  onSent
}: {
  open: boolean;
  transition: Transition;
  /** The official email on the employee's record. */
  recipient: string;
  onClose: () => void;
  onSent: (formNames: string[]) => void;
}) {
  const { sendExitFeedbackForms } = useAppData();
  const { feedbackForms, recordFeedbackFormsSent } = useFeedbackForms();
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) return;
    setSelected([]);
    setQuery('');
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const activeForms = useMemo(
    () => feedbackForms.filter((form) => form.status === 'Active').sort((a, b) => a.code.localeCompare(b.code)),
    [feedbackForms]
  );
  const shown = activeForms.filter((form) => {
    const term = query.trim().toLowerCase();
    return !term || form.name.toLowerCase().includes(term) || form.code.toLowerCase().includes(term);
  });
  const fullName = `${transition.candidate.firstName} ${transition.candidate.lastName}`;
  const expiry = addDays(prototypeNow(), FORM_LINK_EXPIRY_DAYS);
  const toggle = (id: string) =>
  setSelected((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);

  const handleSend = () => {
    const sent = sendExitFeedbackForms(
      transition.id,
      activeForms.filter((form) => selected.includes(form.id)),
      recipient
    );
    if (sent.length > 0) {
      recordFeedbackFormsSent(sent.map((form) => form.id));
      onSent(sent.map((form) => form.name));
    }
    onClose();
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
          aria-label="Send Form"
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 4 }}
          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          className="relative flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-pop">

            <div className="border-b border-line px-6 py-4">
              <h2 className="text-base font-semibold text-ink">Send Form</h2>
              <p className="mt-1 text-[13px] text-muted">
                Choose the exit feedback forms to send to {fullName}. They arrive in one email, and each one is
                answered and submitted on its own in their portal.
              </p>
            </div>

            <div className="scroll-thin flex-1 overflow-y-auto px-6 py-5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[13px] font-medium text-ink">
                  Exit feedback forms <span className="text-red-500">*</span>
                </p>
                {selected.length > 0 &&
              <span className="text-[12px] text-muted">{selected.length} selected</span>
              }
              </div>

              {activeForms.length === 0 ?
            <div className="mt-2 flex flex-col items-center rounded-lg border border-dashed border-line px-4 py-8 text-center">
                  <FileQuestionIcon className="h-5 w-5 text-subtle" />
                  <p className="mt-2 text-[13px] font-medium text-ink">No active exit feedback forms</p>
                  <p className="mt-1 text-[12px] text-muted">
                    Create one, or mark one as active, under Templates → Forms → Exit Feedback.
                  </p>
                </div> :

            <>
                  <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search by form name or code"
                className="mt-2" />

                  <ul className="mt-2 max-h-64 divide-y divide-line overflow-y-auto rounded-lg border border-line">
                    {shown.map((form) => {
                  const openSend = openFeedbackFormEmail(transition, form.id);
                  const checked = selected.includes(form.id);
                  return (
                    <li key={form.id}>
                          <label
                        className={`flex items-start gap-3 px-3.5 py-3 ${
                        openSend ? 'cursor-not-allowed bg-slate-50/70' : 'cursor-pointer hover:bg-slate-50'}`
                        }>

                            <input
                          type="checkbox"
                          checked={checked}
                          disabled={Boolean(openSend)}
                          onChange={() => toggle(form.id)}
                          aria-label={`Select ${form.name}`}
                          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-brand-500 disabled:cursor-not-allowed" />

                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-center gap-2">
                                <span className={`text-[13px] font-medium ${openSend ? 'text-muted' : 'text-ink'}`}>
                                  {form.name}
                                </span>
                                <span className="font-mono text-[11px] text-subtle">{form.code}</span>
                              </span>
                              {form.description &&
                          <span className="mt-0.5 block text-[12px] text-muted">{form.description}</span>
                          }
                              <span className="mt-0.5 block text-[11px] text-subtle">
                                {form.questions.length} question{form.questions.length === 1 ? '' : 's'}
                              </span>
                              {openSend &&
                          <span className="mt-1 block text-[12px] text-amber-700">
                                  Already sent on {formatDate(openSend.sentAt)} and still open. It can be sent again
                                  once it is submitted, revoked or expires.
                                </span>
                          }
                            </span>
                            {openSend &&
                        <Badge className="bg-amber-50 text-amber-700 ring-amber-200">Open</Badge>
                        }
                          </label>
                        </li>);

                })}
                    {shown.length === 0 &&
                <li className="px-3.5 py-6 text-center text-[13px] text-muted">
                        No active form matches “{query.trim()}”.
                      </li>
                }
                  </ul>
                </>
            }

              <div className="mt-5">
                <p className="text-[13px] font-medium text-ink">Sent to</p>
                <div className="mt-2 flex items-center gap-2.5 rounded-lg bg-slate-50 px-3 py-2">
                  <Avatar name={fullName} size="xs" />
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block truncate text-[13px] text-ink">{fullName}</span>
                    <span className="block truncate text-[12px] text-muted">{recipient}</span>
                  </span>
                </div>
                <p className="mt-2 inline-flex items-start gap-1.5 text-[12px] text-muted">
                  <LockIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Exit feedback forms go to the official email on the employee's record. It cannot be changed here.
                </p>
              </div>

              <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-sky-50 px-3.5 py-3 ring-1 ring-inset ring-sky-200">
                <MailIcon className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                <p className="text-[13px] leading-relaxed text-sky-900">
                  Each form expires {FORM_LINK_EXPIRY_DAYS} days after it is sent, on {formatDate(expiry)}. Until
                  then you can revoke it from the Sent Forms tab.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
              <Button onClick={onClose}>Cancel</Button>
              <Button variant="primary" onClick={handleSend} disabled={selected.length === 0}>
                {selected.length > 1 ? `Send ${selected.length} forms` : 'Send Form'}
              </Button>
            </div>
          </motion.div>
        </div>
      }
    </AnimatePresence>);

}
