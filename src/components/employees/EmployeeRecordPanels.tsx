import { FileTextIcon, HistoryIcon, LogOutIcon } from 'lucide-react';
import type { AuditEntry, Employee, EmployeeFormAssignment, ExitDocument } from '../../types';
import { FilePreviewButton, FileThumb } from '../ui/FilePreview';
import { formatDateTime } from '../../utils/format';
import { formatFileSize } from '../../utils/offboarding';

/**
 * The Documents tab: documents the employee submitted through forms and, for a leaver, the
 * documents uploaded when their offboarding was started.
 */
export function EmployeeDocumentsPanel({
  assignments,
  offboardingDocuments




}: {assignments: EmployeeFormAssignment[]; /** Undefined hides the section: no offboarding, or no permission to see it. */offboardingDocuments?: ExitDocument[];}) {
  const submitted = assignments.flatMap((assignment) =>
  assignment.submittedDocuments.map((doc) => ({ ...doc, formName: assignment.formName, key: `${assignment.id}-${doc.fileName}` }))
  );

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-line bg-white p-5">
        <h3 className="text-[13px] font-semibold text-ink">Employee Documents</h3>
        {submitted.length > 0 ?
        <ul className="mt-3 space-y-1.5">
            {submitted.map((doc) =>
          <li key={doc.key} className="flex items-center gap-2.5 rounded-lg bg-slate-50 px-3 py-2 text-[12px] text-ink">
                <FileThumb name={doc.fileName} context={doc.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{doc.fileName}</span>
                  <span className="block truncate text-[11px] text-muted">
                    {doc.name} · {doc.formName}
                  </span>
                </span>
                <FilePreviewButton name={doc.fileName} context={doc.name} />
              </li>
          )}
          </ul> :

        <p className="mt-3 text-[13px] text-muted">No documents have been submitted for this employee yet.</p>
        }
      </section>

      {offboardingDocuments &&
      <section className="rounded-xl border border-line bg-white p-5">
          <h3 className="flex items-center gap-2 text-[13px] font-semibold text-ink">
            <LogOutIcon className="h-3.5 w-3.5 text-subtle" />
            Offboarding Documents
          </h3>
          <p className="mt-0.5 text-[12px] text-muted">Uploaded when the offboarding was started.</p>
          {offboardingDocuments.length > 0 ?
        <ul className="mt-3 space-y-1.5">
              {offboardingDocuments.map((doc) =>
          <li key={doc.id} className="flex items-center gap-2.5 rounded-lg bg-slate-50 px-3 py-2 text-[12px] text-ink">
                  <FileThumb name={doc.name} context="Offboarding documents" size="sm" />
                  <span className="min-w-0 flex-1 truncate">{doc.name}</span>
                  <span className="text-muted">{formatFileSize(doc.bytes)}</span>
                  <FilePreviewButton name={doc.name} context="Offboarding documents" fileSize={formatFileSize(doc.bytes)} />
                </li>
          )}
            </ul> :

        <p className="mt-3 text-[13px] text-muted">No documents were uploaded when the offboarding was started.</p>
        }
        </section>
      }
    </div>);

}

/** The Additional Info tab. A stand-in for the full tab in Accxis360: the record fields not shown on Basic Info. */
export function AdditionalInfoPanel({ employee }: {employee: Employee;}) {
  return (
    <section className="rounded-xl border border-line bg-white p-5">
      <h3 className="text-[13px] font-semibold text-ink">Additional Information</h3>
      <dl className="mt-3 space-y-2.5">
        <InfoRow label="Tax ID (TIN)" value={employee.record.tin} />
        <InfoRow label="Account Holder Name" value={employee.record.accName} />
        <InfoRow label="Employment Type" value={employee.employmentType} />
      </dl>
    </section>);

}

interface TrailEntry extends AuditEntry {
  source?: string;
}

/**
 * The Audit Trail tab: changes to the employee record (offboarding included) and form activity,
 * newest first, each with who did it and when.
 */
export function EmployeeAuditPanel({
  entries,
  assignments



}: {entries: AuditEntry[];assignments: EmployeeFormAssignment[];}) {
  const formActivity: TrailEntry[] = assignments.flatMap((assignment) =>
  assignment.activity.map((item) => ({
    id: `${assignment.id}-${item.id}`,
    action: `Form ${item.action.toLowerCase()}`,
    actor: item.actor,
    at: item.at,
    detail: item.detail,
    source: assignment.formName
  }))
  );
  const trail: TrailEntry[] = [...entries, ...formActivity].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  );

  return (
    <section className="rounded-xl border border-line bg-white p-5">
      <h3 className="text-[13px] font-semibold text-ink">Audit Trail</h3>
      {trail.length > 0 ?
      <ol className="mt-3 space-y-3">
          {trail.map((entry) =>
        <li key={entry.id} className="flex gap-2.5">
              {entry.source ?
          <FileTextIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-subtle" /> :
          <HistoryIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-subtle" />
          }
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-ink">
                  {entry.action}
                  {entry.source && <span className="font-normal text-muted"> · {entry.source}</span>}
                </p>
                <p className="text-[12px] text-muted">
                  {entry.actor} · {formatDateTime(entry.at)}
                </p>
                {entry.detail && <p className="mt-0.5 break-words text-[12px] text-muted">{entry.detail}</p>}
              </div>
            </li>
        )}
        </ol> :

      <p className="mt-3 text-[13px] text-muted">No changes have been recorded for this employee yet.</p>
      }
    </section>);

}

function InfoRow({ label, value }: {label: string;value?: string;}) {
  return (
    <div className="flex flex-wrap gap-x-3">
      <dt className="w-44 shrink-0 text-[13px] text-muted">{label}</dt>
      <dd className="text-[13px] text-ink">{value || '—'}</dd>
    </div>);

}
