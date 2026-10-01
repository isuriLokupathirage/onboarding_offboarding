import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LinkIcon, MailIcon, ShieldOffIcon } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { EmptyState } from '../ui/EmptyState';
import type { EmailHistoryEvent, EmailRecord, Transition } from '../../types';
import { formatDate, formatDateTime } from '../../utils/format';
import { canRevokeEmail, emailStatus, type EmailStatus } from '../../utils/transitions';
import { portalUrl } from '../../utils/portal';

const statusStyles: Record<EmailStatus, string> = {
  Sent: 'bg-sky-50 text-sky-700 ring-sky-200',
  Submitted: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Expired: 'bg-amber-50 text-amber-700 ring-amber-200',
  Revoked: 'bg-red-50 text-red-700 ring-red-200',
  Replaced: 'bg-slate-100 text-slate-600 ring-slate-200',
  Closed: 'bg-slate-100 text-slate-600 ring-slate-200'
};

type Entry =
{kind: 'email';at: string;email: EmailRecord;} |
{kind: 'event';at: string;event: EmailHistoryEvent;};

export function EmailHistory({
  transition,
  onRevoke,
  onViewSubmission
}: {
  transition: Transition;
  onRevoke: (emailId: string) => void;
  onViewSubmission: (emailId: string) => void;
}) {
  const [confirming, setConfirming] = useState<EmailRecord | null>(null);

  const entries: Entry[] = [
  ...transition.emails.map((email) => ({ kind: 'email' as const, at: email.sentAt, email })),
  ...transition.emailEvents.map((event) => ({ kind: 'event' as const, at: event.at, event }))].
  sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  if (transition.emails.length === 0) {
    return (
      <div className="mt-4">
        <EmptyState
          icon={MailIcon}
          title="No emails sent yet"
          description="Emails sent to the candidate for this transition will be listed here." />

      </div>);

  }

  return (
    <section className="mt-4 overflow-hidden rounded-xl border border-line bg-white">
      <ul className="divide-y divide-line">
        {entries.map((entry) =>
        entry.kind === 'email' ?
        <EmailRow
          key={entry.email.id}
          transition={transition}
          email={entry.email}
          onRevoke={() => setConfirming(entry.email)}
          onViewSubmission={() => onViewSubmission(entry.email.id)} /> :


        <EventRow
          key={entry.event.id}
          event={entry.event}
          subject={transition.emails.find((email) => email.id === entry.event.emailId)?.subject} />

        )}
      </ul>

      <Dialog
        open={Boolean(confirming)}
        title="Revoke this form?"
        body={
        <>
            The form sent in <span className="font-medium text-ink">{confirming?.subject}</span> is removed
            from the candidate's portal immediately. Other forms in the portal are not affected.
          </>
        }
        confirmLabel="Revoke form"
        onConfirm={() => {
          if (confirming) onRevoke(confirming.id);
          setConfirming(null);
        }}
        onCancel={() => setConfirming(null)} />

    </section>);

}

function EmailRow({
  transition,
  email,
  onRevoke,
  onViewSubmission
}: {
  transition: Transition;
  email: EmailRecord;
  onRevoke: () => void;
  onViewSubmission: () => void;
}) {
  const status = emailStatus(transition, email);
  const isForm = email.content === 'form';
  const linkClosed = status !== 'Sent' && status !== 'Submitted';
  // One part of the form can be in while the other is still open.
  const partSubmitted =
  status === 'Sent' && transition.submissions.some((item) => item.emailId === email.id);

  return (
    <li className="flex items-start gap-3 px-4 py-3.5">
      <MailIcon className="mt-0.5 h-4 w-4 shrink-0 text-subtle" />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-ink">{email.subject}</p>
        <p className="mt-0.5 text-[12px] text-muted">
          {email.recipient} · {formatDateTime(email.sentAt)}
        </p>
        {isForm &&
        <Link
          to={`/portal/${transition.portalToken}?form=${email.id}`}
          className={`mt-1 inline-flex items-center gap-1 font-mono text-[11px] ${
          linkClosed ? 'text-subtle line-through' : 'text-brand-600 hover:underline'}`
          }>

            <LinkIcon className="h-3 w-3" />
            {portalUrl(transition.portalToken)}
          </Link>
        }
        {status === 'Sent' && email.linkExpiresAt &&
        <p className="mt-0.5 text-[11px] text-muted">Form expires {formatDate(email.linkExpiresAt)}</p>
        }
        {status === 'Replaced' &&
        <p className="mt-0.5 text-[11px] text-muted">Replaced when the form was sent again</p>
        }
        {email.draftCarriedForward &&
        <p className="mt-0.5 text-[11px] text-muted">Saved draft carried forward from the previous send</p>
        }
      </div>
      {status && <Badge className={statusStyles[status]}>{status}</Badge>}
      <div className="flex items-center gap-1.5">
        {email.content === 'form' && (status === 'Submitted' || partSubmitted) &&
        <Button size="sm" onClick={onViewSubmission}>
            View submission
          </Button>
        }
        {isForm && (status === 'Sent' || status === 'Submitted') &&
        <Button
          size="sm"
          variant="ghost"
          disabled={!canRevokeEmail(transition, email.id)}
          title={
          status === 'Submitted' ?
          'The form has been submitted, so it can no longer be revoked.' :
          undefined
          }
          onClick={onRevoke}
          className="text-red-600 hover:bg-red-50 hover:text-red-700 disabled:text-subtle disabled:hover:bg-transparent">

            Revoke
          </Button>
        }
      </div>
    </li>);

}

function EventRow({ event, subject }: {event: EmailHistoryEvent;subject?: string;}) {
  return (
    <li className="flex items-start gap-3 bg-slate-50/50 px-4 py-3">
      <ShieldOffIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-ink">{event.action}</p>
        <p className="mt-0.5 text-[12px] text-muted">
          {subject ?? 'Email'} · by {event.actor} · {formatDateTime(event.at)}
        </p>
      </div>
    </li>);

}
