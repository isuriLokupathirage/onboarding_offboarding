import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLinkIcon,
  FileTextIcon,
  LinkIcon,
  RotateCcwIcon,
  ShieldOffIcon } from
'lucide-react';
import type { Employee } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Dialog } from '../ui/Dialog';
import { Tooltip } from '../ui/Tooltip';
import { EmptyState } from '../ui/EmptyState';
import { FormStatusBadge } from './FormStatusBadge';
import { ChangeReview } from './ChangeReview';
import { useEmployeeData } from '../../contexts/EmployeeDataContext';
import { formatDate, formatDateTime } from '../../utils/format';

const PERMISSION_NOTE = 'Requires the Send Employee Forms permission';

export function FormAccessPanel({
  employee,
  onSendForm



}: {employee: Employee;onSendForm: () => void;}) {
  const { assignmentsFor, resendForm, revokeForm, canSendForms } = useEmployeeData();
  const [revoking, setRevoking] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const assignments = assignmentsFor(employee.id);

  const handleResend = (assignmentId: string) => {
    resendForm(assignmentId);
    setNotice(
      `A new link was sent to ${employee.officialEmail}. The previous link no longer works and the saved draft was kept.`
    );
  };

  if (assignments.length === 0) {
    return (
      <EmptyState
        icon={FileTextIcon}
        title="No forms have been sent to this employee"
        description={`Send a form to ${employee.firstName} and they will receive a unique link at ${employee.officialEmail}.`}
        action={
        canSendForms ?
        <Button variant="primary" size="sm" onClick={onSendForm}>
              Send Form
            </Button> :

        <Tooltip label={PERMISSION_NOTE}>
              <span>
                <Button variant="primary" size="sm" disabled>
                  Send Form
                </Button>
              </span>
            </Tooltip>

        } />);


  }

  return (
    <div className="space-y-3">
      {notice &&
      <div className="rounded-lg bg-emerald-50 px-3.5 py-3 text-[13px] text-emerald-900 ring-1 ring-inset ring-emerald-200">
          {notice}
        </div>
      }

      {assignments.map((assignment) => {
        const actionable = assignment.status === 'Sent' || assignment.status === 'In Progress';
        const canSendAgain = assignment.status === 'Revoked' || assignment.status === 'Expired';

        return (
          <article key={assignment.id} className="rounded-xl border border-line bg-white">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-5 py-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[13px] font-medium text-ink">{assignment.formName}</h3>
                  <FormStatusBadge status={assignment.status} />
                  {assignment.draftSaved && assignment.status !== 'Submitted' &&
                  <Badge className="bg-slate-50 text-slate-600 ring-slate-200">Draft saved</Badge>
                  }
                </div>
                <dl className="mt-2.5 flex flex-wrap gap-x-6 gap-y-1.5 text-[12px]">
                  <div className="flex gap-1.5">
                    <dt className="text-subtle">Sent</dt>
                    <dd className="text-ink">{formatDateTime(assignment.sentAt)}</dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt className="text-subtle">Expires</dt>
                    <dd className={assignment.status === 'Expired' ? 'text-red-600' : 'text-ink'}>
                      {formatDate(assignment.expiresAt)}
                    </dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt className="text-subtle">Submitted</dt>
                    <dd className="text-ink">
                      {assignment.submittedAt ? formatDateTime(assignment.submittedAt) : '—'}
                    </dd>
                  </div>
                </dl>
                <p className="mt-2 inline-flex items-center gap-1.5 font-mono text-[11px] text-subtle">
                  <LinkIcon className="h-3 w-3" />
                  accxis.lk/form/{assignment.linkToken}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Link to={`/employee-form/${assignment.id}`}>
                  <Button size="sm" variant="ghost">
                    <ExternalLinkIcon className="h-3.5 w-3.5" />
                    Open employee view
                  </Button>
                </Link>

                {actionable && (
                canSendForms ?
                <>
                      <Button size="sm" onClick={() => handleResend(assignment.id)}>
                        <RotateCcwIcon className="h-3.5 w-3.5" />
                        Resend
                      </Button>
                      <Button
                    size="sm"
                    onClick={() => setRevoking(assignment.id)}
                    className="text-red-600 ring-red-200 hover:bg-red-50">
                    
                        <ShieldOffIcon className="h-3.5 w-3.5" />
                        Revoke
                      </Button>
                    </> :

                <Tooltip label={PERMISSION_NOTE}>
                      <span className="flex gap-2">
                        <Button size="sm" disabled>
                          Resend
                        </Button>
                        <Button size="sm" disabled>
                          Revoke
                        </Button>
                      </span>
                    </Tooltip>)
                }

                {canSendAgain && canSendForms &&
                <Button size="sm" variant="primary" onClick={onSendForm}>
                    Send again
                  </Button>
                }

                {assignment.status === 'Submitted' &&
                <span className="text-[12px] text-muted">
                    Resend and revoke are closed once submitted
                  </span>
                }
              </div>
            </div>

            {assignment.status === 'Submitted' &&
            <div className="border-b border-line px-5 py-4">
                <ChangeReview assignment={assignment} />
                {Object.keys(assignment.responses).length > 0 &&
              <details className="mt-3">
                    <summary className="cursor-pointer text-[12px] font-medium text-brand-700">
                      View submitted responses
                    </summary>
                    <dl className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {Object.entries(assignment.responses).map(([fieldId, value]) =>
                  <div key={fieldId} className="rounded-lg bg-slate-50 px-3 py-2">
                          <dt className="text-[11px] uppercase tracking-wide text-subtle">
                            {assignment.changes.find((change) => change.fieldId === fieldId)?.label ??
                      fieldId}
                          </dt>
                          <dd className="mt-0.5 text-[13px] text-ink">{value}</dd>
                        </div>
                  )}
                    </dl>
                  </details>
              }
              </div>
            }

            <div className="px-5 py-4">
              <h4 className="text-[12px] font-medium text-ink">Activity</h4>
              <ol className="mt-2 space-y-2">
                {[...assignment.activity].reverse().map((entry) =>
                <li key={entry.id} className="flex flex-wrap items-baseline gap-x-2 text-[12px]">
                    <span className="font-medium text-ink">{entry.action}</span>
                    <span className="text-muted">by {entry.actor}</span>
                    <span className="text-subtle">· {formatDateTime(entry.at)}</span>
                    {entry.detail && <span className="text-muted">— {entry.detail}</span>}
                  </li>
                )}
              </ol>
            </div>
          </article>);

      })}

      <Dialog
        open={Boolean(revoking)}
        title="Revoke form access"
        body={
        <>
            This will immediately stop {employee.firstName} {employee.lastName} from using their link to{' '}
            {assignments.find((item) => item.id === revoking)?.formName}. They will be told to contact HR
            if they open it. You can send the form again later.
          </>
        }
        confirmLabel="Revoke access"
        onCancel={() => setRevoking(null)}
        onConfirm={() => {
          if (revoking) revokeForm(revoking);
          setRevoking(null);
          setNotice(`Access revoked. ${employee.firstName}'s link no longer works.`);
        }} />
      
    </div>);

}