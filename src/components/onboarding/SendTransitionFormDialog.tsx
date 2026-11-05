import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LockIcon, MailIcon, RefreshCwIcon } from 'lucide-react';
import type { Transition } from '../../types';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { FormPicker } from '../employees/FormPicker';
import { useAppData } from '../../contexts/AppDataContext';
import { addDays, formatDate } from '../../utils/format';
import { FORM_LINK_EXPIRY_DAYS, formEmailSubject, openFormEmail, prototypeNow } from '../../utils/transitions';
import { companyDetails } from '../../data/company';

export function SendTransitionFormDialog({
  open,
  recipients,
  onClose,
  onSent
}: {
  open: boolean;
  recipients: Transition[];
  onClose: () => void;
  onSent: (formName: string, count: number) => void;
}) {
  const { forms, sendTransitionForm } = useAppData();
  const activeForms = forms.filter((form) => form.status === 'Active' && !form.isDraft);
  const [formId, setFormId] = useState('');

  useEffect(() => {
    if (open) setFormId('');
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const selectedForm = activeForms.find((form) => form.id === formId);
  const expiry = addDays(prototypeNow(), FORM_LINK_EXPIRY_DAYS);
  // Only a copy of the same form that is still open gets replaced. Other forms stay in the portal.
  const openCopy = (transition: Transition) =>
  selectedForm ? openFormEmail(transition, selectedForm.id) : undefined;
  const withOpenCopy = recipients.filter((transition) => openCopy(transition));
  const single = recipients.length === 1;
  const nameOf = (transition: Transition) =>
  `${transition.candidate.firstName} ${transition.candidate.lastName}`;

  const handleSend = () => {
    if (!selectedForm) return;
    sendTransitionForm(
      recipients.map((transition) => transition.id),
      selectedForm.id
    );
    onSent(selectedForm.name, recipients.length);
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
                {single ?
              `${nameOf(recipients[0])} will get an email naming the form, with the link to their portal.` :
              `The same form will be sent to ${recipients.length} candidates. Each email links to that candidate's own portal.`}
              </p>
            </div>

            <div className="scroll-thin flex-1 overflow-y-auto px-6 py-5">
              <p className="text-[13px] font-medium text-ink">
                Select a form <span className="text-red-500">*</span>
              </p>
              <div className="mt-2">
                <FormPicker forms={activeForms} value={formId} onChange={setFormId} />
              </div>
              {selectedForm?.description &&
            <p className="mt-2 text-[12px] leading-relaxed text-muted">{selectedForm.description}</p>
            }

              <div className="mt-5">
                <p className="text-[13px] font-medium text-ink">
                  Sent to{!single && <span className="ml-1.5 text-muted">({recipients.length} candidates)</span>}
                </p>
                <ul className="mt-2 max-h-48 space-y-1.5 overflow-y-auto">
                  {recipients.map((transition) =>
                <li
                  key={transition.id}
                  className="flex items-center gap-2.5 rounded-lg bg-slate-50 px-3 py-2">

                      <Avatar name={nameOf(transition)} size="xs" />
                      <span className="min-w-0 flex-1 leading-tight">
                        <span className="block truncate text-[13px] text-ink">{nameOf(transition)}</span>
                        <span className="block truncate text-[12px] text-muted">
                          {transition.candidate.personalEmail}
                        </span>
                      </span>
                      {openCopy(transition) &&
                  <Badge className="bg-amber-50 text-amber-700 ring-amber-200">
                          <RefreshCwIcon className="h-3 w-3" />
                          {openCopy(transition)?.draft ? 'Resend · draft kept' : 'Resend'}
                        </Badge>
                  }
                    </li>
                )}
                </ul>
                <p className="mt-2 inline-flex items-start gap-1.5 text-[12px] text-muted">
                  <LockIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Forms go to the personal email address held on each transition. It cannot be changed here.
                </p>
              </div>

              {withOpenCopy.length > 0 &&
            <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-amber-50 px-3.5 py-3 ring-1 ring-inset ring-amber-200">
                  <RefreshCwIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                  <p className="text-[13px] leading-relaxed text-amber-900">
                    {single ?
                'This candidate already has this form open in their portal.' :
                `${withOpenCopy.length} of these candidates already have this form open in their portal.`}{' '}
                    Sending again restarts its expiry and keeps any saved draft. The portal link does not
                    change.
                  </p>
                </div>
            }

              <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-sky-50 px-3.5 py-3 ring-1 ring-inset ring-sky-200">
                <MailIcon className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                <p className="text-[13px] leading-relaxed text-sky-900">
                  The form expires {FORM_LINK_EXPIRY_DAYS} days after it is sent, on {formatDate(expiry)}.
                  Other forms in the portal keep their own expiry dates.
                </p>
              </div>

              {selectedForm &&
            <EmailPreview
              candidateName={single ? nameOf(recipients[0]) : null}
              formName={selectedForm.name}
              expiry={expiry} />
            }
            </div>

            <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
              <Button onClick={onClose}>Cancel</Button>
              <Button variant="primary" onClick={handleSend} disabled={!selectedForm}>
                {single ? 'Send Form' : `Send to ${recipients.length} candidates`}
              </Button>
            </div>
          </motion.div>
        </div>
      }
    </AnimatePresence>);

}

/** The email the candidate receives. With several recipients, each email carries that candidate's name. */
function EmailPreview({
  candidateName,
  formName,
  expiry



}: {candidateName: string | null;formName: string;expiry: string;}) {
  const by = formatDate(expiry);
  return (
    <div className="mt-5">
      <p className="text-[13px] font-medium text-ink">Email preview</p>
      <div className="mt-2 overflow-hidden rounded-lg border border-line">
        <p className="border-b border-line bg-slate-50 px-4 py-2.5 text-[12px] text-muted">
          <span className="font-medium text-ink">Subject:</span> {formEmailSubject(expiry)}
        </p>
        <div className="space-y-3 px-4 py-4 text-[13px] leading-relaxed text-ink">
          <p className="text-[15px] font-semibold">Please complete your employee form</p>
          <p>Dear {candidateName ?? "[each candidate's name]"},</p>
          <p>
            To help us prepare your employee record before you join, we kindly ask you to complete the following
            form:
          </p>
          <ul className="list-disc pl-5">
            <li className="font-medium">{formName}</li>
          </ul>
          <p>
            Please use the button below to open your portal and get started. Any details we already hold are filled
            in for you, so you only need to check them and update anything that has changed.
          </p>
          <span className="inline-flex rounded-lg bg-brand-500 px-4 py-2 text-[13px] font-medium text-white">
            Open My Portal
          </span>
          <p>
            We would appreciate it if you could submit by {by}. After this date the link will expire.
          </p>
          <p>
            This link is personal to you, so please do not forward this email. If you have any questions, please
            feel free to contact your HR team.
          </p>
          <p>Thank you for your time and cooperation.</p>
          <p>
            Best regards,
            <br />
            {companyDetails.name}
          </p>
        </div>
      </div>
    </div>);

}
