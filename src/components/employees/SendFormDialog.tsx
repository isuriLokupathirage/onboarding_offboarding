import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LockIcon, MailIcon, XIcon } from 'lucide-react';
import type { Employee } from '../../types';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { FormPicker } from './FormPicker';
import { useAppData } from '../../contexts/AppDataContext';
import { EXPIRY_DAYS, useEmployeeData } from '../../contexts/EmployeeDataContext';
import { addDays, formatDate } from '../../utils/format';

export function SendFormDialog({
  open,
  recipients,
  onClose,
  onSent





}: {open: boolean;recipients: Employee[];onClose: () => void;onSent: (formNames: string[], count: number) => void;}) {
  const { forms } = useAppData();
  const { sendForm, canSendForms } = useEmployeeData();
  const activeForms = forms.filter((form) => form.status === 'Active' && !form.isDraft);
  const [formIds, setFormIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) setFormIds([]);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const expiry = addDays(new Date().toISOString(), EXPIRY_DAYS);
  const selectedForms = activeForms.filter((form) => formIds.includes(form.id));
  const several = selectedForms.length > 1;

  const handleSend = () => {
    if (selectedForms.length === 0 || !canSendForms) return;
    const employeeIds = recipients.map((employee) => employee.id);
    selectedForms.forEach((form) => sendForm(employeeIds, form.id, form.name));
    onSent(
      selectedForms.map((form) => form.name),
      recipients.length
    );
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
                {recipients.length === 1 ?
              `${recipients[0].firstName} ${recipients[0].lastName} will get an email naming each form, with the same portal link as any earlier form.` :
              `${recipients.length} employees will each get an email naming each form, with a link to their own portal.`}
              </p>
            </div>

            <div className="scroll-thin flex-1 overflow-y-auto px-6 py-5">
              <label className="text-[13px] font-medium text-ink" htmlFor="send-form-picker">
                Select one or more forms <span className="text-red-500">*</span>
              </label>
              <div className="mt-2">
                <FormPicker multiple forms={activeForms} value={formIds} onChange={setFormIds} />
              </div>
              {selectedForms.length === 1 &&
            <p className="mt-2 text-[12px] leading-relaxed text-muted">
                  {selectedForms[0].description}
                </p>
            }
              {several &&
            <ul className="mt-2 space-y-1.5">
                  {selectedForms.map((form) =>
              <li
                key={form.id}
                className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">

                      <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{form.name}</span>
                      <Badge>{form.employmentType}</Badge>
                      <button
                  type="button"
                  aria-label={`Remove ${form.name}`}
                  onClick={() => setFormIds((prev) => prev.filter((id) => id !== form.id))}
                  className="rounded p-1 text-subtle transition-colors duration-150 ease-out hover:bg-slate-200 hover:text-ink">

                        <XIcon className="h-3.5 w-3.5" />
                      </button>
                    </li>
              )}
                </ul>
            }

              <div className="mt-5">
                <p className="text-[13px] font-medium text-ink">Sent to</p>
                <ul className="mt-2 max-h-40 space-y-1.5 overflow-y-auto">
                  {recipients.map((employee) =>
                <li
                  key={employee.id}
                  className="flex items-center gap-2.5 rounded-lg bg-slate-50 px-3 py-2">
                  
                      <Avatar name={`${employee.firstName} ${employee.lastName}`} size="xs" />
                      <span className="min-w-0 flex-1 leading-tight">
                        <span className="block truncate text-[13px] text-ink">
                          {employee.firstName} {employee.lastName}
                        </span>
                        <span className="block truncate text-[12px] text-muted">
                          {employee.officialEmail}
                        </span>
                      </span>
                    </li>
                )}
                </ul>
                <p className="mt-2 inline-flex items-start gap-1.5 text-[12px] text-muted">
                  <LockIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Forms are always sent to the official email address on the employee record. It cannot
                  be changed here.
                </p>
              </div>

              <div className="mt-5 flex items-start gap-2.5 rounded-lg bg-sky-50 px-3.5 py-3 ring-1 ring-inset ring-sky-200">
                <MailIcon className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                <p className="text-[13px] leading-relaxed text-sky-900">
                  No new link is issued. {several ? 'Each form expires' : 'The form expires'} in{' '}
                  {EXPIRY_DAYS} days, on {formatDate(expiry)}. Fields already held on the record are
                  pre-filled.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
              <Button onClick={onClose}>Cancel</Button>
              <Button variant="primary" onClick={handleSend} disabled={selectedForms.length === 0}>
                {several ? `Send ${selectedForms.length} Forms` : 'Send Form'}
              </Button>
            </div>
          </motion.div>
        </div>
      }
    </AnimatePresence>);

}