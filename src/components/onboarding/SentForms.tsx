import { useState } from 'react';
import { FileTextIcon, RotateCwIcon } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { EmptyState } from '../ui/EmptyState';
import { Tooltip } from '../ui/Tooltip';
import { useAppData } from '../../contexts/AppDataContext';
import type { EmailRecord, Transition } from '../../types';
import { addDays, formatDate } from '../../utils/format';
import {
  FORM_LINK_EXPIRY_DAYS,
  exitFeedbackResendBlock,
  exitFeedbackStatus,
  isExitFeedbackEmail,
  managePermissionFor,
  prototypeNow,
  sentFormClosedAt,
  sentFormClosedReason,
  sentFormEmails,
  sentFormName,
  sentFormStatus,
  type ExitFeedbackStatus,
  type SentFormStatus } from
'../../utils/transitions';

/** Employee forms read a revoked send as Closed; exit feedback forms show Revoked on its own. */
type RowStatus = SentFormStatus | ExitFeedbackStatus;

const statusStyles: Record<RowStatus, string> = {
  Sent: 'bg-sky-50 text-sky-700 ring-sky-200',
  Submitted: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Expired: 'bg-amber-50 text-amber-700 ring-amber-200',
  Revoked: 'bg-red-50 text-red-700 ring-red-200',
  Closed: 'bg-slate-100 text-slate-600 ring-slate-200'
};

const revokeHints: Record<Exclude<RowStatus, 'Sent'>, string> = {
  Submitted: 'The form has been submitted, so it can no longer be revoked.',
  Expired: 'The form has expired, so it is no longer in the portal.',
  Revoked: 'The form has already been revoked.',
  Closed: 'The form is closed, so it is no longer in the portal.'
};

/**
 * Transitions → [Transition] → Sent Forms: every form sent to the candidate, or the exit feedback
 * forms sent to a leaver, newest first. A submitted exit feedback form opens its response; a revoked
 * or expired one can be resent with a new link and a new expiry.
 */
export function SentForms({
  transition,
  canRevoke,
  onRevoke,
  onViewSubmission,
  resendRecipient,
  resendBlocked,
  onResend,
  onViewResponse
}: {
  transition: Transition;
  canRevoke: boolean;
  onRevoke: (emailId: string) => void;
  onViewSubmission: (emailId: string) => void;
  /** Offboarding: the official email a resent exit feedback form goes to. */
  resendRecipient?: string;
  /** Why this user cannot resend at all (permission, no official email), or undefined when they can. */
  resendBlocked?: string;
  onResend?: (emailId: string) => void;
  onViewResponse?: (emailId: string) => void;
}) {
  const { forms } = useAppData();
  const [confirming, setConfirming] = useState<EmailRecord | null>(null);
  const [resending, setResending] = useState<EmailRecord | null>(null);
  const formOf = (email: EmailRecord) => forms.find((form) => form.id === email.formId);
  const codeOf = (email: EmailRecord) => email.formCode ?? formOf(email)?.code;
  const recipientWord = transition.kind === 'Onboarding' ? 'candidate' : 'employee';
  const revokePermission = managePermissionFor(transition.kind);
  const rows = sentFormEmails(transition).sort(
    (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
  );

  if (rows.length === 0) {
    return (
      <div className="mt-4">
        <EmptyState
          icon={FileTextIcon}
          title="No forms sent yet"
          description={
          transition.kind === 'Onboarding' ?
          'Forms sent to the candidate for this transition are listed here, with their status and dates.' :
          'Exit feedback forms sent to the employee are listed here, with their status, the date sent and who sent them.'
          } />

      </div>);

  }

  return (
    <section className="mt-4 overflow-hidden rounded-xl border border-line bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-[13px]">
          <thead className="border-b border-line bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-subtle">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Form code</th>
              <th className="px-4 py-2.5 font-semibold">Form name</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5 font-semibold">Sent to</th>
              <th className="px-4 py-2.5 font-semibold">Sent</th>
              <th className="px-4 py-2.5 font-semibold">Sent by</th>
              <th className="px-4 py-2.5 font-semibold">Expires</th>
              <th className="px-4 py-2.5 font-semibold">Closed</th>
              <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((email) => {
              const feedback = isExitFeedbackEmail(email);
              const status: RowStatus = feedback ?
              exitFeedbackStatus(transition, email) :
              sentFormStatus(transition, email);
              const closedAt = sentFormClosedAt(transition, email);
              const reason = sentFormClosedReason(transition, email);
              const submission = transition.submissions.find((item) => item.emailId === email.id);
              // One part of a form can be in while the other is still open.
              const partSubmitted = status === 'Sent' && Boolean(submission);
              const resentAs = email.resentAs ?
              transition.emails.find((item) => item.id === email.resentAs) :
              undefined;
              // Selecting a submitted exit feedback form opens the response.
              const opensResponse = feedback && status === 'Submitted' && Boolean(submission) && Boolean(onViewResponse);
              const canResendRow = feedback && (status === 'Revoked' || status === 'Expired');
              return (
                <tr
                  key={email.id}
                  onClick={opensResponse ? () => onViewResponse?.(email.id) : undefined}
                  className={`align-top ${
                  opensResponse ? 'cursor-pointer transition-colors duration-150 ease-out hover:bg-slate-50/70' : ''}`
                  }>

                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] text-subtle">{codeOf(email) ?? '—'}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{sentFormName(email, forms)}</p>
                    {feedback && <p className="mt-0.5 text-[11px] text-muted">Exit feedback</p>}
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
                    {resentAs &&
                    <p className="mt-1 text-[11px] text-muted">Resent {formatDate(resentAs.sentAt)}</p>
                    }
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-muted" title={email.recipient}>
                    {email.recipient}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(email.sentAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{email.sentBy ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {email.linkExpiresAt ? formatDate(email.linkExpiresAt) : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{closedAt ? formatDate(closedAt) : '—'}</td>
                  <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      {submission && !feedback &&
                      <Button size="sm" onClick={() => onViewSubmission(email.id)}>
                          View Submission
                        </Button>
                      }
                      {opensResponse &&
                      <Button size="sm" onClick={() => onViewResponse?.(email.id)}>
                          View Response
                        </Button>
                      }
                      {canResendRow &&
                      <ResendButton
                        hint={
                        resentAs ?
                        'This form has already been resent.' :
                        resendBlocked ?? exitFeedbackResendBlock(transition, email)
                        }
                        onClick={() => setResending(email)} />

                      }
                      {!canResendRow && !(feedback && status === 'Submitted') &&
                      <RevokeButton
                        status={status}
                        canRevoke={canRevoke}
                        permission={revokePermission}
                        onClick={() => setConfirming(email)} />

                      }
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
            <span className="font-medium text-ink">{confirming ? sentFormName(confirming, forms) : ''}</span> is
            removed from the {recipientWord}'s portal immediately and can no longer be submitted. Other forms in the
            portal are not affected.
          </>
        }
        confirmLabel="Revoke form"
        confirmVariant="danger"
        onConfirm={() => {
          if (confirming) onRevoke(confirming.id);
          setConfirming(null);
        }}
        onCancel={() => setConfirming(null)} />


      <Dialog
        open={Boolean(resending)}
        title="Resend this form?"
        body={
        <>
            <span className="font-medium text-ink">{resending ? sentFormName(resending, forms) : ''}</span> is sent
            again to <span className="font-medium text-ink">{resendRecipient}</span> with a new link. The new link
            expires in {FORM_LINK_EXPIRY_DAYS} days, on {formatDate(addDays(prototypeNow(), FORM_LINK_EXPIRY_DAYS))}.
            The earlier send stays {resending ? exitFeedbackStatus(transition, resending).toLowerCase() : ''} in this
            list.
          </>
        }
        confirmLabel="Resend form"
        onConfirm={() => {
          if (resending) onResend?.(resending.id);
          setResending(null);
        }}
        onCancel={() => setResending(null)} />

    </section>);

}

function RevokeButton({
  status,
  canRevoke,
  permission,
  onClick




}: {status: RowStatus;canRevoke: boolean;permission: string;onClick: () => void;}) {
  let hint: string | undefined;
  if (status !== 'Sent') hint = revokeHints[status];else
  if (!canRevoke) hint = `Requires the ${permission} permission`;
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

/** Revoked or expired exit feedback forms: sends the same form again with a new link and expiry. */
function ResendButton({ hint, onClick }: {hint: string | undefined;onClick: () => void;}) {
  const button =
  <Button size="sm" variant="ghost" disabled={Boolean(hint)} onClick={onClick} className="disabled:text-subtle">
      <RotateCwIcon className="h-3.5 w-3.5" />
      Resend
    </Button>;

  if (!hint) return button;
  return (
    <Tooltip label={hint}>
      <span>{button}</span>
    </Tooltip>);

}
