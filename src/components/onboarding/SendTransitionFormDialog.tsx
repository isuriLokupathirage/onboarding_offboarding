import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileQuestionIcon, KeyRoundIcon, LockIcon, MailIcon } from 'lucide-react';
import type { EmployeeForm, Transition } from '../../types';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { SearchInput } from '../ui/SearchInput';
import { useAppData, type TransitionFormSend } from '../../contexts/AppDataContext';
import { addDays, formatDate } from '../../utils/format';
import {
  FORM_LINK_EXPIRY_DAYS,
  formEmailSubject,
  needsNewPortal,
  openFormEmail,
  portalStatus,
  prototypeNow } from
'../../utils/transitions';
import { companyDetails } from '../../data/company';

const nameOf = (transition: Transition) => `${transition.candidate.firstName} ${transition.candidate.lastName}`;

/**
 * Transitions → Send Form, and [Transition] → Send Form: pick one or more active employee details
 * forms and send the same forms to every chosen candidate. Each candidate gets one email at the
 * personal email on their transition. A form a candidate already has open is not sent to them again.
 */
export function SendTransitionFormDialog({
  open,
  recipients,
  onClose,
  onSent
}: {
  open: boolean;
  recipients: Transition[];
  onClose: () => void;
  onSent: (sends: TransitionFormSend[], formNames: string[]) => void;
}) {
  const { forms, sendTransitionForm } = useAppData();
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
    () =>
    forms.
    filter((form) => form.status === 'Active' && !form.isDraft).
    sort((a, b) => a.code.localeCompare(b.code)),
    [forms]
  );
  const term = query.trim().toLowerCase();
  const shown = activeForms.filter(
    (form) => !term || form.name.toLowerCase().includes(term) || form.code.toLowerCase().includes(term)
  );
  const single = recipients.length === 1;
  const expiry = addDays(prototypeNow(), FORM_LINK_EXPIRY_DAYS);

  /** The candidates who already have this form open in their portal. */
  const openFor = (form: EmployeeForm) => recipients.filter((transition) => openFormEmail(transition, form.id));
  // A form open for every recipient could reach nobody, so it cannot be picked.
  const isBlocked = (form: EmployeeForm) => openFor(form).length === recipients.length;
  const selectedForms = activeForms.filter((form) => selected.includes(form.id) && !isBlocked(form));
  /** The selected forms this candidate will get: every selected form they do not already have open. */
  const formsFor = (transition: Transition) =>
  selectedForms.filter((form) => !openFormEmail(transition, form.id));
  const receiving = recipients.filter((transition) => formsFor(transition).length > 0);
  const newPortals = receiving.filter(needsNewPortal);

  const toggle = (id: string) =>
  setSelected((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);

  const handleSend = () => {
    const sends = sendTransitionForm(
      receiving.map((transition) => transition.id),
      selectedForms.map((form) => form.id)
    );
    if (sends.length > 0) onSent(sends, selectedForms.map((form) => form.name));
    onClose();
  };

  const sendLabel = single ?
  selectedForms.length > 1 ? `Send ${selectedForms.length} forms` : 'Send Form' :
  `Send to ${receiving.length} candidate${receiving.length === 1 ? '' : 's'}`;

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
          aria-label="Send Employee Details Form"
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 4 }}
          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          className="relative flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-pop">

            <div className="border-b border-line px-6 py-4">
              <h2 className="text-base font-semibold text-ink">Send Employee Details Form</h2>
              <p className="mt-1 text-[13px] text-muted">
                {single ?
              `Choose the forms to send to ${nameOf(recipients[0])}. They arrive in one email, and each one is completed and submitted on its own in their portal.` :
              `The same forms go to all ${recipients.length} candidates. Each candidate gets one email linking to their own portal.`}
              </p>
            </div>

            <div className="scroll-thin flex-1 overflow-y-auto px-6 py-5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[13px] font-medium text-ink">
                  Employee details forms <span className="text-red-500">*</span>
                </p>
                {selectedForms.length > 0 &&
              <span className="text-[12px] text-muted">{selectedForms.length} selected</span>
              }
              </div>

              {activeForms.length === 0 ?
            <div className="mt-2 flex flex-col items-center rounded-lg border border-dashed border-line px-4 py-8 text-center">
                  <FileQuestionIcon className="h-5 w-5 text-subtle" />
                  <p className="mt-2 text-[13px] font-medium text-ink">No active employee details forms</p>
                  <p className="mt-1 text-[12px] text-muted">
                    Create one, or mark one as active, under Templates → Forms → Employee Details.
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
                  const already = openFor(form);
                  const blocked = isBlocked(form);
                  const checked = selected.includes(form.id) && !blocked;
                  return (
                    <li key={form.id}>
                          <label
                        className={`flex items-start gap-3 px-3.5 py-3 ${
                        blocked ? 'cursor-not-allowed bg-slate-50/70' : 'cursor-pointer hover:bg-slate-50'}`
                        }>

                            <input
                          type="checkbox"
                          checked={checked}
                          disabled={blocked}
                          onChange={() => toggle(form.id)}
                          aria-label={`Select ${form.name}`}
                          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-brand-500 disabled:cursor-not-allowed" />

                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-center gap-2">
                                <span className={`text-[13px] font-medium ${blocked ? 'text-muted' : 'text-ink'}`}>
                                  {form.name}
                                </span>
                                <Badge>{form.employmentType}</Badge>
                                <span className="font-mono text-[11px] text-subtle">{form.code}</span>
                              </span>
                              {form.description &&
                          <span className="mt-0.5 block text-[12px] text-muted">{form.description}</span>
                          }
                              {already.length > 0 &&
                          <span className="mt-1 block text-[12px] text-amber-700">
                                  <OpenFormNote form={form} already={already} recipients={recipients} />
                                </span>
                          }
                            </span>
                            {already.length > 0 &&
                        <Badge className="bg-amber-50 text-amber-700 ring-amber-200">
                                {blocked ? 'Open' : `Open for ${already.length}`}
                              </Badge>
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
                <p className="text-[13px] font-medium text-ink">
                  Sent to{!single && <span className="ml-1.5 text-muted">({recipients.length} candidates)</span>}
                </p>
                <ul className="mt-2 max-h-48 space-y-1.5 overflow-y-auto">
                  {recipients.map((transition) => {
                  const nothingToSend = selectedForms.length > 0 && formsFor(transition).length === 0;
                  return (
                    <li
                      key={transition.id}
                      className={`flex items-center gap-2.5 rounded-lg bg-slate-50 px-3 py-2 ${
                      nothingToSend ? 'opacity-60' : ''}`
                      }>

                        <Avatar name={nameOf(transition)} size="xs" />
                        <span className="min-w-0 flex-1 leading-tight">
                          <span className="block truncate text-[13px] text-ink">{nameOf(transition)}</span>
                          <span className="block truncate text-[12px] text-muted">
                            {transition.candidate.personalEmail}
                          </span>
                        </span>
                        {nothingToSend ?
                      <Badge>Already has these open</Badge> :
                      needsNewPortal(transition) ?
                      <Badge className="bg-sky-50 text-sky-700 ring-sky-200">New portal link</Badge> :
                      portalStatus(transition) === 'Not Issued' ?
                      <Badge className="bg-sky-50 text-sky-700 ring-sky-200">Portal issued</Badge> :
                      null}
                      </li>);

                })}
                </ul>
                <p className="mt-2 inline-flex items-start gap-1.5 text-[12px] text-muted">
                  <LockIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Forms go to the personal email address held on each transition. It cannot be changed here.
                </p>
              </div>

              {newPortals.length > 0 &&
            <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-sky-50 px-3.5 py-3 ring-1 ring-inset ring-sky-200">
                  <KeyRoundIcon className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                  <p className="text-[13px] leading-relaxed text-sky-900">
                    {single ?
                'This candidate’s portal has closed.' :
                `${newPortals.length} of these candidates ${newPortals.length === 1 ? 'has a' : 'have'} closed portal${
                newPortals.length === 1 ? '' : 's'}.`}{' '}
                    Sending issues a new portal and emails the new link. The old link stops working.
                  </p>
                </div>
            }

              <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-sky-50 px-3.5 py-3 ring-1 ring-inset ring-sky-200">
                <MailIcon className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                <p className="text-[13px] leading-relaxed text-sky-900">
                  Each form expires {FORM_LINK_EXPIRY_DAYS} days after it is sent, on {formatDate(expiry)}. Other
                  forms in the portal keep their own expiry dates.
                </p>
              </div>

              {receiving.length > 0 &&
            <EmailPreview
              candidateName={single ? nameOf(recipients[0]) : null}
              formNames={(single ? formsFor(recipients[0]) : selectedForms).map((form) => form.name)}
              expiry={expiry} />
            }
            </div>

            <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
              <Button onClick={onClose}>Cancel</Button>
              <Button variant="primary" onClick={handleSend} disabled={receiving.length === 0}>
                {sendLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      }
    </AnimatePresence>);

}

/** Why a form is marked Open: for whom it is already open, and what happens if it is picked. */
function OpenFormNote({
  form,
  already,
  recipients
}: {form: EmployeeForm;already: Transition[];recipients: Transition[];}) {
  if (already.length < recipients.length) {
    return <>Already open for {already.map(nameOf).join(', ')}, who will not be sent it again.</>;
  }
  if (recipients.length === 1) {
    const sentAt = openFormEmail(recipients[0], form.id)?.sentAt;
    return (
      <>
        Sent{sentAt ? ` on ${formatDate(sentAt)}` : ''} and still open. It can be sent again once it is submitted,
        expires or is revoked.
      </>);

  }
  return (
    <>
      Already open for all {recipients.length} candidates. It can be sent again once it is submitted, expires or is
      revoked.
    </>);

}

/** The email each candidate receives. With several recipients, each email carries that candidate's name. */
function EmailPreview({
  candidateName,
  formNames,
  expiry
}: {candidateName: string | null;formNames: string[];expiry: string;}) {
  const several = formNames.length > 1;
  return (
    <div className="mt-5">
      <p className="text-[13px] font-medium text-ink">Email preview</p>
      <div className="mt-2 overflow-hidden rounded-lg border border-line">
        <p className="border-b border-line bg-slate-50 px-4 py-2.5 text-[12px] text-muted">
          <span className="font-medium text-ink">Subject:</span> {formEmailSubject(expiry, formNames.length)}
        </p>
        <div className="space-y-3 px-4 py-4 text-[13px] leading-relaxed text-ink">
          <p className="text-[15px] font-semibold">Please complete your employee form{several ? 's' : ''}</p>
          <p>Dear {candidateName ?? "[each candidate's name]"},</p>
          <p>
            To help us prepare your employee record before you join, we kindly ask you to complete the following
            form{several ? 's' : ''}:
          </p>
          <ul className="list-disc pl-5">
            {formNames.map((name) =>
            <li key={name} className="font-medium">
                {name}
              </li>
            )}
          </ul>
          <p>
            Please use the button below to open your portal and get started. {several ? 'Each form is' : 'The form is'}{' '}
            submitted on its own, and you can save a draft and come back to it. Any details we already hold are
            filled in for you.
          </p>
          <span className="inline-flex rounded-lg bg-brand-500 px-4 py-2 text-[13px] font-medium text-white">
            Open My Portal
          </span>
          <p>We would appreciate it if you could submit by {formatDate(expiry)}. After this date the link will expire.</p>
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
