import React from 'react';
import { FileIcon, XIcon } from 'lucide-react';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import type { EmployeeForm, FormField, FormSubmission } from '../../types';
import { formatDateTime } from '../../utils/format';

function allFields(form: EmployeeForm): {sectionTitle: string;fields: FormField[];}[] {
  return form.sections.map((section) => ({
    sectionTitle: section.title,
    fields: [
    ...section.fields,
    ...(section.conditionalGroups ?? []).flatMap((group) => [
    ...group.fields,
    ...(group.repeating?.fields ?? [])]
    )]

  }));
}

export function SubmissionPanel({
  open,
  candidateName,
  form,
  submission,
  onClose
}: {
  open: boolean;
  candidateName: string;
  form: EmployeeForm | undefined;
  submission: FormSubmission | undefined;
  onClose: () => void;
}) {
  const responses = submission?.responses ?? {};
  const sections = form ?
  allFields(form).
  map(({ sectionTitle, fields }) => ({
    sectionTitle,
    answered: fields.filter((field) => responses[field.id])
  })).
  filter((section) => section.answered.length > 0) :
  [];
  const knownIds = new Set(sections.flatMap((section) => section.answered.map((field) => field.id)));
  const unmatched = Object.entries(responses).filter(([id]) => !knownIds.has(id));

  return (
    <Drawer open={open && Boolean(submission)} label={`Submission from ${candidateName}`} onClose={onClose}>
      {submission &&
      <>
          <div className="flex items-start justify-between gap-3 border-b border-line px-6 py-5">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-ink">Form submission</h2>
              <p className="mt-1 text-[13px] text-muted">
                {form?.name ?? 'Employee form'} · submitted by {candidateName} on{' '}
                {formatDateTime(submission.submittedAt)}
              </p>
            </div>
            <button
            type="button"
            onClick={onClose}
            aria-label="Close submission"
            className="rounded-lg p-1.5 text-subtle transition-colors duration-150 ease-out hover:bg-slate-100 hover:text-ink">

              <XIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="scroll-thin flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {sections.map((section) =>
          <section key={section.sectionTitle}>
                <h3 className="text-[12px] font-semibold uppercase tracking-wider text-subtle">
                  {section.sectionTitle}
                </h3>
                <dl className="mt-2 divide-y divide-line rounded-lg border border-line">
                  {section.answered.map((field) =>
              <ResponseRow key={field.id} label={field.name} value={responses[field.id]} />
              )}
                </dl>
              </section>
          )}

            {unmatched.length > 0 &&
          <section>
                <h3 className="text-[12px] font-semibold uppercase tracking-wider text-subtle">Other</h3>
                <dl className="mt-2 divide-y divide-line rounded-lg border border-line">
                  {unmatched.map(([id, value]) =>
              <ResponseRow key={id} label={id} value={value} />
              )}
                </dl>
              </section>
          }

            <section>
              <h3 className="text-[12px] font-semibold uppercase tracking-wider text-subtle">Documents</h3>
              {submission.documents.length === 0 ?
            <p className="mt-2 text-[13px] text-muted">No documents were uploaded.</p> :

            <ul className="mt-2 divide-y divide-line rounded-lg border border-line">
                  {submission.documents.map((doc) =>
              <li key={doc.name} className="flex items-center gap-3 px-3.5 py-2.5">
                      <FileIcon className="h-4 w-4 shrink-0 text-subtle" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] text-ink">{doc.name}</span>
                        <span className="block truncate font-mono text-[11px] text-subtle">{doc.fileName}</span>
                      </span>
                    </li>
              )}
                </ul>
            }
            </section>
          </div>

          <div className="flex justify-end border-t border-line px-6 py-4">
            <Button onClick={onClose}>Close</Button>
          </div>
        </>
      }
    </Drawer>);

}

function ResponseRow({ label, value }: {label: string;value: string;}) {
  return (
    <div className="grid grid-cols-5 gap-3 px-3.5 py-2.5">
      <dt className="col-span-2 text-[12px] text-muted">{label}</dt>
      <dd className="col-span-3 break-words text-[13px] text-ink">{value}</dd>
    </div>);

}
