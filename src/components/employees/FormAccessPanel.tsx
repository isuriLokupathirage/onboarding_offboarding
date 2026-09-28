import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLinkIcon,
  FileTextIcon,
  InfoIcon,
  LinkIcon,
  MailIcon,
  ShieldOffIcon,
  UnlinkIcon,
} from 'lucide-react';
import type { Employee, EmployeeFormAssignment } from '../../types';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import { EmptyState } from '../ui/EmptyState';
import { FormStatusBadge } from './FormStatusBadge';
import { ChangeReview } from './ChangeReview';
import { RevokeFormDialog } from './RevokeFormDialog';
import { revokeNotice } from '../../utils/revoke';
import { isOpenAssignment, useEmployeeData } from '../../contexts/EmployeeDataContext';
import { formatDate, formatDateTime } from '../../utils/format';

export const PERMISSION_NOTE = 'You need the Send Employee Forms permission to do this.';

export function FormAccessPanel({
  employee,
  onSendForm,
}: {
  employee: Employee;
  onSendForm: () => void;
}) {
  const { assignmentsFor, canSendForms } = useEmployeeData();
  const [revoking, setRevoking] = useState<string[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const assignments = assignmentsFor(employee.id);
  const openForms = assignments.filter(isOpenAssignment);
  const closedForms = assignments.filter((assignment) => !isOpenAssignment(assignment));

  // Bulk selection only makes sense with more than one open form, and only for users who can revoke.
  const selectable = canSendForms && openForms.length > 1;
  // Ignore ids whose form has closed since they were ticked.
  const selected = selectedIds.filter((id) => openForms.some((item) => item.id === id));
  const allSelected = openForms.length > 0 && selected.length === openForms.length;

  const toggle = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );

  const toggleAll = () => setSelectedIds(allSelected ? [] : openForms.map((item) => item.id));

  const sendFormButton = canSendForms ? (
    <Button variant="primary" size="sm" onClick={onSendForm}>
      <MailIcon className="h-3.5 w-3.5" />
      Send Form
    </Button>
  ) : (
    <Tooltip label={PERMISSION_NOTE}>
      <span>
        <Button variant="primary" size="sm" disabled>
          <MailIcon className="h-3.5 w-3.5" />
          Send Form
        </Button>
      </span>
    </Tooltip>
  );

  if (assignments.length === 0) {
    return (
      <EmptyState
        icon={FileTextIcon}
        title="No forms have been sent to this employee"
        description={`Send a form to ${employee.firstName} and they will receive a unique link at ${employee.officialEmail}.`}
        action={sendFormButton}
      />
    );
  }

  const renderRow = (assignment: EmployeeFormAssignment) => {
    const open = isOpenAssignment(assignment);
    const checked = selected.includes(assignment.id);
    const linkClosed = assignment.status === 'Revoked' || assignment.status === 'Expired';
    const revokedEntry =
      assignment.status === 'Revoked'
        ? [...assignment.activity].reverse().find((entry) => entry.action === 'Revoked')
        : undefined;

    return (
      <article
        key={assignment.id}
        className={`rounded-xl border bg-white transition-colors duration-150 ${
          checked ? 'border-brand-300 bg-brand-50/40' : 'border-line'
        }`}
      >
        <div
          className={`flex flex-wrap items-start justify-between gap-4 px-5 py-4 ${
            assignment.status === 'Submitted' ? 'border-b border-line' : ''
          }`}
        >
          <div className="flex min-w-0 gap-3">
            {selectable && open && (
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(assignment.id)}
                aria-label={`Select ${assignment.formName}`}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-brand-500"
              />
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[13px] font-medium text-ink">{assignment.formName}</h3>
                <FormStatusBadge status={assignment.status} />
              </div>
              <dl className="mt-2.5 flex flex-wrap gap-x-6 gap-y-1.5 text-[12px]">
                <div className="flex gap-1.5">
                  <dt className="text-subtle">Sent</dt>
                  <dd className="text-ink">{formatDateTime(assignment.sentAt)}</dd>
                </div>
                {assignment.status === 'Submitted' ? (
                  <div className="flex gap-1.5">
                    <dt className="text-subtle">Submitted</dt>
                    <dd className="text-ink">{formatDateTime(assignment.submittedAt)}</dd>
                  </div>
                ) : (
                  assignment.status !== 'Revoked' && (
                    <div className="flex gap-1.5">
                      <dt className="text-subtle">
                        {assignment.status === 'Expired' ? 'Expired' : 'Expires'}
                      </dt>
                      <dd className={assignment.status === 'Expired' ? 'text-red-600' : 'text-ink'}>
                        {formatDate(assignment.expiresAt)}
                      </dd>
                    </div>
                  )
                )}
              </dl>
              <p
                className={`mt-2 inline-flex items-center gap-1.5 font-mono text-[11px] text-subtle ${
                  linkClosed ? 'line-through' : ''
                }`}
              >
                {linkClosed ? <UnlinkIcon className="h-3 w-3" /> : <LinkIcon className="h-3 w-3" />}
                accxis.lk/form/{assignment.linkToken}
              </p>
              {revokedEntry && (
                <p className="mt-2 w-fit rounded-md bg-slate-50 px-2.5 py-1.5 text-[12px] text-slate-700 ring-1 ring-inset ring-line">
                  Revoked by <span className="font-medium text-ink">{revokedEntry.actor}</span> ·{' '}
                  {formatDateTime(revokedEntry.at)}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link to={`/employee-form/${assignment.id}`}>
              <Button size="sm" variant="ghost">
                <ExternalLinkIcon className="h-3.5 w-3.5" />
                Employee view
              </Button>
            </Link>

            {open &&
              (canSendForms ? (
                <Button
                  size="sm"
                  onClick={() => setRevoking([assignment.id])}
                  className="text-red-600 ring-red-200 hover:bg-red-50"
                >
                  <ShieldOffIcon className="h-3.5 w-3.5" />
                  Revoke access
                </Button>
              ) : (
                <Tooltip label={PERMISSION_NOTE}>
                  <span>
                    <Button size="sm" disabled className="text-red-600/60 ring-red-100">
                      <ShieldOffIcon className="h-3.5 w-3.5" />
                      Revoke access
                    </Button>
                  </span>
                </Tooltip>
              ))}

            {assignment.status === 'Submitted' && (
              <span className="inline-flex items-center gap-1.5 text-[12px] text-muted">
                <InfoIcon className="h-3.5 w-3.5" />
                Submitted forms can't be revoked
              </span>
            )}
          </div>
        </div>

        {assignment.status === 'Submitted' && (
          <div className="px-5 py-4">
            <ChangeReview assignment={assignment} />
            {Object.keys(assignment.responses).length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-[12px] font-medium text-brand-700">
                  View submitted responses
                </summary>
                <dl className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {Object.entries(assignment.responses).map(([fieldId, value]) => (
                    <div key={fieldId} className="rounded-lg bg-slate-50 px-3 py-2">
                      <dt className="text-[11px] uppercase tracking-wide text-subtle">
                        {assignment.changes.find((change) => change.fieldId === fieldId)?.label ??
                          fieldId}
                      </dt>
                      <dd className="mt-0.5 text-[13px] text-ink">{value}</dd>
                    </div>
                  ))}
                </dl>
              </details>
            )}
          </div>
        )}
      </article>
    );
  };

  return (
    <div>
      <p className="max-w-xl text-[13px] text-muted">
        Forms sent to {employee.firstName}'s official email. Each link is personal to them. To send
        a revoked or expired form again, use Send Form above. It issues a new link.
      </p>

      {notice && (
        <div
          role="status"
          className="mt-4 rounded-lg bg-emerald-50 px-3.5 py-3 text-[13px] text-emerald-900 ring-1 ring-inset ring-emerald-200"
        >
          {notice}
        </div>
      )}

      <div className="mt-5 flex items-center gap-2">
        {selectable && (
          <input
            type="checkbox"
            checked={allSelected}
            ref={(element) => {
              if (element) element.indeterminate = selected.length > 0 && !allSelected;
            }}
            onChange={toggleAll}
            aria-label="Select all open forms"
            className="h-4 w-4 cursor-pointer accent-brand-500"
          />
        )}
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-subtle">
          Open · {openForms.length}
        </h3>
        <span className="h-px flex-1 bg-line" />
      </div>

      {selectable && selected.length > 0 && (
        <div
          role="region"
          aria-label="Bulk actions"
          className="mt-2 flex flex-wrap items-center gap-3 rounded-lg bg-amber-50 px-4 py-2.5 text-[13px] text-amber-900 ring-1 ring-inset ring-amber-200"
        >
          <span className="font-medium">
            {selected.length} of {openForms.length} selected
          </span>
          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="text-amber-800/80 underline-offset-4 hover:text-amber-900 hover:underline"
          >
            Clear
          </button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => setRevoking(selected)}
            className="ml-auto"
          >
            <ShieldOffIcon className="h-3.5 w-3.5" />
            Revoke access ({selected.length})
          </Button>
        </div>
      )}
      <div className="mt-2 space-y-3">
        {openForms.length > 0 ? (
          openForms.map(renderRow)
        ) : (
          <p className="rounded-xl border border-dashed border-line bg-white px-5 py-5 text-center text-[13px] text-muted">
            No open forms. {employee.firstName} has nothing waiting to be filled in.
          </p>
        )}
      </div>

      {closedForms.length > 0 && (
        <>
          <h3 className="mt-6 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-subtle">
            Closed · {closedForms.length}
            <span className="h-px flex-1 bg-line" />
          </h3>
          <div className="mt-2 space-y-3">{closedForms.map(renderRow)}</div>
        </>
      )}

      <RevokeFormDialog
        open={revoking !== null}
        employee={employee}
        assignmentIds={revoking ?? []}
        onCancel={() => setRevoking(null)}
        onRevoked={(revoked, skipped) => {
          setRevoking(null);
          setSelectedIds([]);
          setNotice(revokeNotice(employee.firstName, revoked, skipped));
        }}
      />
    </div>
  );
}
