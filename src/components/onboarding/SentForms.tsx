import { useState } from 'react';
import { FileTextIcon } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { EmptyState } from '../ui/EmptyState';
import { Tooltip } from '../ui/Tooltip';
import { useAppData } from '../../contexts/AppDataContext';
import type { EmailRecord, Transition } from '../../types';
import { formatDate } from '../../utils/format';
import {
  sentFormClosedAt,
  sentFormClosedReason,
  sentFormEmails,
  sentFormStatus,
  type SentFormStatus } from
'../../utils/transitions';

const statusStyles: Record<SentFormStatus, string> = {
  Sent: 'bg-sky-50 text-sky-700 ring-sky-200',
  Submitted: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Expired: 'bg-amber-50 text-amber-700 ring-amber-200',
  Closed: 'bg-slate-100 text-slate-600 ring-slate-200'
};

const revokeHints: Record<Exclude<SentFormStatus, 'Sent'>, string> = {
  Submitted: 'The form has been submitted, so it can no longer be revoked.',
  Expired: 'The form has expired, so it is no longer in the portal.',
  Closed: 'The form is closed, so it is no longer in the portal.'
};

/** Transitions → [Transition] → Sent Forms: every form sent to the candidate, newest first. */
export function SentForms({
  transition,
  canRevoke,
  onRevoke,
  onViewSubmission





}: {transition: Transition;canRevoke: boolean;onRevoke: (emailId: string) => void;onViewSubmission: (emailId: string) => void;}) {
  const { forms } = useAppData();
  const [confirming, setConfirming] = useState<EmailRecord | null>(null);
  const formOf = (email: EmailRecord) => forms.find((form) => form.id === email.formId);
  const rows = sentFormEmails(transition).sort(
    (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
  );

  if (rows.length === 0) {
    return (
      <div className="mt-4">
        <EmptyState
          icon={FileTextIcon}
          title="No forms sent yet"
          description="Forms sent to the candidate for this transition are listed here, with their status and dates." />

      </div>);

  }

  return (
    <section className="mt-4 overflow-hidden rounded-xl border border-line bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-[13px]">
          <thead className="border-b border-line bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-subtle">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Form code</th>
              <th className="px-4 py-2.5 font-semibold">Form name</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5 font-semibold">Sent to</th>
              <th className="px-4 py-2.5 font-semibold">Sent</th>
              <th className="px-4 py-2.5 font-semibold">Expires</th>
              <th className="px-4 py-2.5 font-semibold">Closed</th>
              <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((email) => {
              const form = formOf(email);
              const status = sentFormStatus(transition, email);
              const closedAt = sentFormClosedAt(transition, email);
              const reason = sentFormClosedReason(transition, email);
              const submission = transition.submissions.find((item) => item.emailId === email.id);
              // One part of a form can be in while the other is still open.
              const partSubmitted = status === 'Sent' && Boolean(submission);
              return (
                <tr key={email.id} className="align-top">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] text-subtle">{form?.code ?? '—'}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{form?.name ?? email.subject}</p>
                    {partSubmitted &&
                    <p className="mt-0.5 text-[11px] text-muted">One part submitted, the other still to come</p>
                    }
                    {email.draftCarriedForward &&
                    <p className="mt-0.5 text-[11px] text-muted">Saved draft carried forward</p>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={statusStyles[status]}>{status}</Badge>
                    {reason && <p className="mt-1 text-[11px] text-muted">{reason}</p>}
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-muted" title={email.recipient}>
                    {email.recipient}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(email.sentAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {email.linkExpiresAt ? formatDate(email.linkExpiresAt) : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{closedAt ? formatDate(closedAt) : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {submission &&
                      <Button size="sm" onClick={() => onViewSubmission(email.id)}>
                          View Submission
                        </Button>
                      }
                      <RevokeButton
                        status={status}
                        canRevoke={canRevoke}
                        onClick={() => setConfirming(email)} />

                    </div>
                  </td>
                </tr>);

            })}
          </tbody>
        </table>
      </div>

      <Dialog
        open={Boolean(confirming)}
        title="Revoke this form?"
        body={
        <>
            <span className="font-medium text-ink">{confirming ? formOf(confirming)?.name : ''}</span> is removed
            from the candidate's portal immediately and can no longer be submitted. Other forms in the portal are
            not affected.
          </>
        }
        confirmLabel="Revoke form"
        confirmVariant="danger"
        onConfirm={() => {
          if (confirming) onRevoke(confirming.id);
          setConfirming(null);
        }}
        onCancel={() => setConfirming(null)} />

    </section>);

}

function RevokeButton({
  status,
  canRevoke,
  onClick



}: {status: SentFormStatus;canRevoke: boolean;onClick: () => void;}) {
  let hint: string | undefined;
  if (status !== 'Sent') hint = revokeHints[status];else
  if (!canRevoke) hint = 'Requires the Manage Onboarding Transitions permission';
  const button =
  <Button
    size="sm"
    variant="ghost"
    disabled={Boolean(hint)}
    onClick={onClick}
    className="text-red-600 hover:bg-red-50 hover:text-red-700 disabled:text-subtle disabled:hover:bg-transparent">

      Revoke
    </Button>;

  if (!hint) return button;
  return (
    <Tooltip label={hint}>
      <span>{button}</span>
    </Tooltip>);

}
