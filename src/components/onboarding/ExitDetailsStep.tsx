import { useState } from 'react';
import { AlertCircleIcon, LockIcon, UploadCloudIcon, XIcon } from 'lucide-react';
import type { Employee, ExitDetailsDraft, OffboardingMilestone, OffboardingType } from '../../types';
import { FieldGroup, Input } from '../ui/Field';
import { Segmented } from '../ui/Segmented';
import { SearchableSelect, type SearchableOption } from '../ui/SearchableSelect';
import { FilePreviewButton, FileThumb } from '../ui/FilePreview';
import { offboardingMilestones } from '../../data/people';
import { OFFBOARDING_TYPES, OTHER_EXIT_REASON, exitReasons } from '../../data/exitReasons';
import { rememberFiles } from '../../utils/filePreview';
import {
  EXIT_DOCUMENTS_MAX_BYTES,
  EXIT_DOCUMENT_ACCEPT,
  addExitDocuments,
  employeeFullName,
  formatFileSize,
  type ExitDetailsErrors } from
'../../utils/offboarding';

/**
 * Step 2 of an offboarding: the employee for reference, the exit type and reason, the five exit
 * dates and supporting documents. A date is mandatory only when a template task uses it.
 */
export function ExitDetailsStep({
  employee,
  exit,
  onChange,
  dateUsage,
  templateName,
  errors,
  showErrors,
  showDocuments = true,
  compact = false












}: { /** Omit to hide the read-only employee section. */employee?: Employee;exit: ExitDetailsDraft;onChange: (next: ExitDetailsDraft) => void; /** How many template tasks calculate their due date from each exit date. */dateUsage: Partial<Record<OffboardingMilestone, number>>;templateName: string;errors: ExitDetailsErrors;showErrors: boolean;showDocuments?: boolean; /** One column, for a side panel. */compact?: boolean;}) {
  const [uploadError, setUploadError] = useState<string>();
  const update = (patch: Partial<ExitDetailsDraft>) => onChange({ ...exit, ...patch });
  const reasonOptions: SearchableOption[] = exitReasons[exit.type].map((reason) => ({ value: reason, label: reason }));
  const usedBytes = exit.documents.reduce((total, doc) => total + doc.bytes, 0);

  // A new type has its own reasons, so the previous pick is cleared.
  const changeType = (type: OffboardingType) => {
    if (type === exit.type) return;
    update({ type, reason: '', otherReason: undefined });
  };

  const reasonError = showErrors ? errors.reason : undefined;
  const otherReasonError = showErrors ? errors.otherReason : undefined;
  const grid = compact ? 'grid grid-cols-1 gap-y-5' : 'grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2';

  return (
    <div className="space-y-6">
      {employee &&
      <section>
        <SectionTitle title="Employee" description="From the employee record. Change these in Employee Management." />
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg bg-slate-50 px-4 py-3.5 ring-1 ring-inset ring-line sm:grid-cols-4">
          <ReadOnlyValue label="Employee Name" value={employeeFullName(employee)} />
          <ReadOnlyValue label="Employee ID" value={employee.code} />
          <ReadOnlyValue label="Job Title" value={employee.jobTitle} />
          <ReadOnlyValue label="Department" value={employee.department} />
        </div>
      </section>
      }

      <section>
        <SectionTitle title="Exit" />
        <div className={grid}>
          <FieldGroup label="Offboarding Type" required className="sm:col-span-2">
            <Segmented
              options={OFFBOARDING_TYPES.map((type) => ({ value: type, label: type }))}
              value={exit.type}
              onChange={changeType} />

          </FieldGroup>
          <FieldGroup label="Exit Reason" required>
            <SearchableSelect
              options={reasonOptions}
              value={exit.reason}
              onChange={(reason) =>
              update({ reason, otherReason: reason === OTHER_EXIT_REASON ? exit.otherReason : undefined })
              }
              placeholder="Select an exit reason"
              searchPlaceholder={`Search ${exit.type.toLowerCase()} reasons`}
              invalid={Boolean(reasonError)} />

            <FieldError message={reasonError} />
          </FieldGroup>
          {exit.reason === OTHER_EXIT_REASON &&
          <FieldGroup label="Specify Exit Reason" required>
              <Input
              value={exit.otherReason ?? ''}
              onChange={(event) => update({ otherReason: event.target.value })}
              placeholder="Describe why the employee is leaving"
              aria-invalid={Boolean(otherReasonError)}
              className={otherReasonError ? 'border-red-300' : ''} />

              <FieldError message={otherReasonError} />
            </FieldGroup>
          }
        </div>
      </section>

      <section>
        <SectionTitle
          title="Exit Dates"
          description={`Dates used by a task in ${templateName} are mandatory. Task due dates are calculated from these dates.`} />

        <div className={grid}>
          {offboardingMilestones.map((milestone) => {
            const used = dateUsage[milestone] ?? 0;
            const missing = showErrors && errors.dates.includes(milestone);
            return (
              <FieldGroup
                key={milestone}
                label={milestone}
                required={used > 0}
                hint={
                <span className="text-[11px] text-subtle">
                    {used > 0 ? `Used by ${used} task${used === 1 ? '' : 's'}` : 'Optional'}
                  </span>
                }>

                <Input
                  type="date"
                  value={exit.dates[milestone] ?? ''}
                  onChange={(event) => update({ dates: { ...exit.dates, [milestone]: event.target.value || undefined } })}
                  aria-invalid={missing}
                  className={missing ? 'border-red-300' : ''} />

                <FieldError message={missing ? 'Required by a task in this template' : undefined} />
              </FieldGroup>);

          })}
        </div>
      </section>

      {showDocuments &&
      <section>
        <SectionTitle
          title="Documents"
          description="Resignation letter, termination letter, settlement agreement or any other supporting document." />

        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-line bg-slate-50/60 px-6 py-7 text-center transition-colors duration-150 ease-out hover:border-brand-300 hover:bg-brand-50/40">
          <UploadCloudIcon className="h-5 w-5 text-subtle" />
          <span className="mt-2 text-[13px] text-ink">
            Drag and drop, or <span className="text-brand-600">choose files</span>
          </span>
          <span className="mt-0.5 text-[12px] text-muted">PDF, PNG, JPG, JPEG or DOCX · up to 25 MB in total</span>
          <input
            type="file"
            multiple
            accept={EXIT_DOCUMENT_ACCEPT}
            className="hidden"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              // Clear the input so picking the same file again still counts as a change.
              event.target.value = '';
              if (files.length === 0) return;
              rememberFiles(files);
              const result = addExitDocuments(exit.documents, files);
              setUploadError(result.error);
              update({ documents: result.documents });
            }} />

        </label>
        {uploadError &&
        <p className="mt-2 flex items-start gap-2 text-[12px] leading-relaxed text-red-700">
            <AlertCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {uploadError}
          </p>
        }
        {exit.documents.length > 0 &&
        <>
            <ul className="mt-2.5 space-y-1.5">
              {exit.documents.map((doc) =>
            <li key={doc.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[12px] text-ink">
                  <FileThumb name={doc.name} context="Exit documents" size="sm" />
                  <span className="flex-1 truncate">{doc.name}</span>
                  <span className="text-muted">{formatFileSize(doc.bytes)}</span>
                  <FilePreviewButton name={doc.name} context="Exit documents" fileSize={formatFileSize(doc.bytes)} />
                  <button
                type="button"
                aria-label={`Remove ${doc.name}`}
                onClick={() => {
                  setUploadError(undefined);
                  update({ documents: exit.documents.filter((item) => item.id !== doc.id) });
                }}
                className="rounded p-1 text-subtle transition-colors duration-150 ease-out hover:bg-slate-200 hover:text-ink">

                    <XIcon className="h-3 w-3" />
                  </button>
                </li>
            )}
            </ul>
            <p className="mt-1.5 text-[11px] text-subtle">
              {exit.documents.length} file{exit.documents.length === 1 ? '' : 's'} · {formatFileSize(usedBytes)} of{' '}
              {formatFileSize(EXIT_DOCUMENTS_MAX_BYTES)} used
            </p>
          </>
        }
      </section>
      }
    </div>);

}

function SectionTitle({ title, description }: {title: string;description?: string;}) {
  return (
    <div className="mb-3">
      <h3 className="text-[13px] font-semibold text-ink">{title}</h3>
      {description && <p className="mt-0.5 text-[12px] text-muted">{description}</p>}
    </div>);

}

function ReadOnlyValue({ label, value }: {label: string;value: string;}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1 text-[11px] text-muted">
        {label}
        <LockIcon className="h-3 w-3 text-subtle" aria-label="Read only" />
      </p>
      <p className="mt-0.5 truncate text-[13px] font-medium text-ink">{value || '—'}</p>
    </div>);

}

function FieldError({ message }: {message?: string;}) {
  if (!message) return null;
  return <p className="mt-1 text-[12px] text-red-600">{message}</p>;
}
