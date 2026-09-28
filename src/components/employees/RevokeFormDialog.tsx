import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileTextIcon, InfoIcon, RotateCcwIcon, ShieldOffIcon, UnlinkIcon } from 'lucide-react';
import type { Employee } from '../../types';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { FormStatusBadge } from './FormStatusBadge';
import { useEmployeeData } from '../../contexts/EmployeeDataContext';
import { formatDate, formatDateTime } from '../../utils/format';
import { joinNames } from '../../utils/revoke';

/**
 * Confirmation for revoking one or more of an employee's form links. Behaves as an
 * alert dialog: it names the employee, lists the forms, explains the consequences,
 * and does not close on an outside click.
 *
 * `assignmentIds` holds one id for the row action, or several for a bulk revoke.
 */
export function RevokeFormDialog({
  open,
  employee,
  assignmentIds,
  onCancel,
  onRevoked





}: {open: boolean;employee: Employee;assignmentIds: string[];onCancel: () => void;onRevoked: (revoked: string[], skipped: string[]) => void;}) {
  const { assignmentsFor, revokeForm, canSendForms } = useEmployeeData();
  const [closedNames, setClosedNames] = useState<string[] | null>(null);

  useEffect(() => {
    if (!open) return;
    setClosedNames(null);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  const selected = assignmentsFor(employee.id).filter((item) => assignmentIds.includes(item.id));
  const single = selected.length === 1 ? selected[0] : undefined;
  const plural = selected.length > 1;
  const fullName = `${employee.firstName} ${employee.lastName}`;

  const handleConfirm = () => {
    if (selected.length === 0) return;
    const revoked: string[] = [];
    const skipped: string[] = [];
    selected.forEach((item) => {
      // Each form is revoked and logged on its own, so the audit trail stays per form.
      if (revokeForm(item.id)) revoked.push(item.formName);else
      skipped.push(item.formName);
    });
    if (revoked.length > 0) {
      onRevoked(revoked, skipped);
    } else {
      // Every selected form closed while the dialog was open, usually because the employee submitted it.
      setClosedNames(skipped);
    }
  };

  const closedSubmitted =
  closedNames !== null &&
  selected.length > 0 &&
  selected.every((item) => item.status === 'Submitted');

  return (
    <AnimatePresence>
      {open &&
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          className="absolute inset-0 bg-slate-900/40" />

          <motion.div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="revoke-title"
          aria-describedby="revoke-desc"
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 4 }}
          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          className="relative flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-pop">

            {closedNames ?
          <>
                <div className="flex gap-3.5 px-6 pb-2 pt-5">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-600 ring-1 ring-inset ring-sky-200">
                    <InfoIcon className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <h2 id="revoke-title" className="text-base font-semibold text-ink">
                      {closedSubmitted ?
                  closedNames.length > 1 ?
                  'These forms have just been submitted' :
                  'This form has just been submitted' :
                  closedNames.length > 1 ?
                  'These forms are no longer open' :
                  'This form is no longer open'}
                    </h2>
                    <p id="revoke-desc" className="mt-1 text-[13px] leading-relaxed text-muted">
                      {closedSubmitted ?
                  `${employee.firstName} submitted ${joinNames(closedNames)}, so ${
                  closedNames.length > 1 ? 'they' : 'it'} can't be revoked. Nothing was changed.` :
                  `${joinNames(closedNames)} ${
                  closedNames.length > 1 ? 'are' : 'is'} already closed, so there is no link left to revoke. Nothing was changed.`}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2 px-6 pb-5 pt-4">
                  <Button autoFocus onClick={onCancel}>
                    Close
                  </Button>
                </div>
              </> :

          <>
                <div className="flex gap-3.5 px-6 pb-2 pt-5">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-inset ring-red-200">
                    <ShieldOffIcon className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <h2 id="revoke-title" className="text-base font-semibold text-ink">
                      {plural ? `Revoke access to ${selected.length} forms?` : 'Revoke form access?'}
                    </h2>
                    <p id="revoke-desc" className="mt-1 text-[13px] leading-relaxed text-muted">
                      {fullName} will no longer be able to open {plural ? 'these forms' : 'this form'}.
                    </p>
                  </div>
                </div>

                <div className="scroll-thin flex-1 overflow-y-auto px-6 py-3">
                  <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5 ring-1 ring-inset ring-line">
                    <Avatar name={fullName} size="sm" />
                    <div className="min-w-0 leading-tight">
                      <p className="text-[13px] font-medium text-ink">
                        {fullName} <span className="font-normal text-muted">· {employee.code}</span>
                      </p>
                      <p className="truncate text-[12px] text-muted">{employee.officialEmail}</p>
                    </div>
                  </div>

                  {single &&
              <dl className="mt-4 space-y-1.5 rounded-lg px-3.5 py-3 text-[13px] ring-1 ring-inset ring-line">
                      <div className="flex gap-3">
                        <dt className="w-24 shrink-0 text-muted">Form</dt>
                        <dd className="flex flex-wrap items-center gap-2 font-medium text-ink">
                          {single.formName} <FormStatusBadge status={single.status} />
                        </dd>
                      </div>
                      <div className="flex gap-3">
                        <dt className="w-24 shrink-0 text-muted">Sent</dt>
                        <dd className="text-ink">{formatDateTime(single.sentAt)}</dd>
                      </div>
                      <div className="flex gap-3">
                        <dt className="w-24 shrink-0 text-muted">Link expires</dt>
                        <dd className="text-ink">{formatDate(single.expiresAt)}</dd>
                      </div>
                    </dl>
              }

                  {plural &&
              <ul className="mt-4 divide-y divide-line rounded-lg ring-1 ring-inset ring-line">
                      {selected.map((item) =>
                <li key={item.id} className="px-3.5 py-2.5">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="text-[13px] font-medium text-ink">{item.formName}</span>
                            <FormStatusBadge status={item.status} />
                          </span>
                          <span className="mt-0.5 block text-[12px] text-muted">
                            Sent {formatDateTime(item.sentAt)} · expires {formatDate(item.expiresAt)}
                          </span>
                        </li>
                )}
                    </ul>
              }

                  <ul className="mt-4 space-y-2 text-[13px] text-slate-700">
                    <li className="flex gap-2.5">
                      <UnlinkIcon className="mt-0.5 h-4 w-4 shrink-0 text-subtle" />
                      <span>
                        {plural ? 'The links stop' : 'The link stops'} working{' '}
                        <strong className="font-medium text-ink">as soon as you confirm</strong>.
                      </span>
                    </li>
                    <li className="flex gap-2.5">
                      <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-subtle" />
                      <span>
                        If {employee.firstName} opens {plural ? 'one' : 'it'}, they'll see that the form is no
                        longer available and that they should contact HR.
                      </span>
                    </li>
                    <li className="flex gap-2.5">
                      <FileTextIcon className="mt-0.5 h-4 w-4 shrink-0 text-subtle" />
                      <span>Unsubmitted answers won't be saved to their profile.</span>
                    </li>
                    <li className="flex gap-2.5">
                      <RotateCcwIcon className="mt-0.5 h-4 w-4 shrink-0 text-subtle" />
                      <span>
                        You can send {plural ? 'these forms' : 'this form'} again at any time with Send Form. That
                        issues a new link.
                      </span>
                    </li>
                  </ul>

                </div>

                <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
                  <Button autoFocus onClick={onCancel}>
                    Cancel
                  </Button>
                  <Button
                variant="danger"
                onClick={handleConfirm}
                disabled={selected.length === 0 || !canSendForms}
                className="disabled:bg-red-300">

                    <ShieldOffIcon className="h-4 w-4" />
                    {plural ? `Revoke access (${selected.length})` : 'Revoke access'}
                  </Button>
                </div>
              </>
          }
          </motion.div>
        </div>
      }
    </AnimatePresence>);

}
