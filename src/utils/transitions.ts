import type {
  EmailRecord,
  OboPermission,
  Task,
  Transition,
  TransitionKind,
  TransitionTask } from
'../types';
import { formatDate } from './format';

export function toTransitionTask(task: Task, id: string, dueDate: string | null): TransitionTask {
  return {
    id,
    taskId: task.id,
    name: task.name,
    description: task.description,
    department: task.department,
    priority: task.priority,
    optional: task.optional,
    showInCandidateEvents: task.showInCandidateEvents,
    dueDate,
    calculatedDueDate: dueDate,
    dueSource: 'calculated',
    ownerIds: task.ownerIds,
    status: 'Open',
    parentTaskId: task.parentId,
    parentCompletionRequired: task.parentCompletionRequired,
    restricted: task.ownerOnlyVisible
  };
}

const CLOSED_TASK_STATUSES = new Set<TransitionTask['status']>(['Completed', 'Cancelled']);

export function isTaskOpen(task: TransitionTask): boolean {
  return !CLOSED_TASK_STATUSES.has(task.status);
}

export function blockingTask(transition: Transition, task: TransitionTask): TransitionTask | undefined {
  if (!task.parentTaskId || !task.parentCompletionRequired) return undefined;
  const parent = transition.tasks.find((candidate) => candidate.taskId === task.parentTaskId);
  return parent && parent.status !== 'Completed' ? parent : undefined;
}

export type TransitionStatusGroup = 'Active' | 'Completed' | 'Cancelled';

export function statusGroup(transition: Transition): TransitionStatusGroup {
  if (transition.status === 'Completed' || transition.status === 'Cancelled') return transition.status;
  return 'Active';
}

export function transitionProgress(transition: Transition): {done: number;total: number;percent: number;} {
  const done = transition.tasks.filter((task) => task.status === 'Completed').length;
  const total = transition.tasks.length;
  return { done, total, percent: Math.round(done / Math.max(1, total) * 100) };
}

/** The prototype runs on a fixed "today" so the seeded transitions keep sensible days remaining. */
export const PROTOTYPE_TODAY = '2026-09-16';

const DAY_MS = 24 * 60 * 60 * 1000;

/** The latest due date among the transition's tasks. Falls back to the stored date when no task has one. */
export function transitionTargetDate(transition: Transition): string {
  const dueDates = transition.tasks.
  map((task) => task.dueDate?.slice(0, 10)).
  filter((date): date is string => Boolean(date));
  if (dueDates.length === 0) return transition.targetDate;
  return dueDates.reduce((latest, date) => date > latest ? date : latest);
}

/** Days from today to the target date. Negative once the target date has passed. */
export function daysRemaining(transition: Transition): number {
  const target = new Date(transitionTargetDate(transition)).getTime();
  if (Number.isNaN(target)) return 0;
  return Math.round((target - new Date(PROTOTYPE_TODAY).getTime()) / DAY_MS);
}

export function isOverdue(transition: Transition): boolean {
  return statusGroup(transition) === 'Active' && daysRemaining(transition) < 0;
}

export const FORM_LINK_EXPIRY_DAYS = 14;

export type EmailStatus = 'Sent' | 'Submitted' | 'Expired' | 'Revoked' | 'Replaced' | 'Closed';

/** The current moment on the prototype's fixed date, so new records sit beside the seeded ones. */
export function prototypeNow(): string {
  return `${PROTOTYPE_TODAY}T${new Date().toTimeString().slice(0, 8)}`;
}

/** True once the form's expiry date is behind the prototype's today. It stays open all of its last day. */
export function isFormExpired(email: EmailRecord): boolean {
  if (email.expiredAt) return true;
  return Boolean(email.linkExpiresAt) && (email.linkExpiresAt as string).slice(0, 10) < PROTOTYPE_TODAY;
}

export function emailStatus(transition: Transition, email: EmailRecord): EmailStatus | null {
  if (email.content === 'reminder') return null;
  if (email.linkRevoked) return 'Revoked';
  // A form with one part still to submit stays open.
  if (
  transition.submissions.some(
    (submission) => submission.emailId === email.id && !submission.pendingParts?.length
  ))

  return 'Submitted';
  if (email.replacedBy) return 'Replaced';
  if (statusGroup(transition) !== 'Active') return 'Closed';
  if (isFormExpired(email)) return 'Expired';
  return 'Sent';
}

/** A form the candidate can still open, save and submit. */
export function isOpenFormEmail(transition: Transition, email: EmailRecord): boolean {
  return email.content === 'form' && emailStatus(transition, email) === 'Sent';
}

export function canRevokeEmail(transition: Transition, emailId: string): boolean {
  const email = transition.emails.find((item) => item.id === emailId);
  return Boolean(email && isOpenFormEmail(transition, email));
}

/** The open email for a form, if that form is already waiting in the candidate's portal. */
export function openFormEmail(transition: Transition, formId: string): EmailRecord | undefined {
  return transition.emails.find(
    (email) => email.formId === formId && isOpenFormEmail(transition, email)
  );
}

/** Form emails only; reminders are not forms. */
export function sentFormEmails(transition: Transition): EmailRecord[] {
  return transition.emails.filter((email) => email.content === 'form');
}

/** How the Sent Forms tab reports a form: revoked, replaced and finished-transition forms read as Closed. */
export type SentFormStatus = 'Sent' | 'Submitted' | 'Closed' | 'Expired';

export function sentFormStatus(transition: Transition, email: EmailRecord): SentFormStatus {
  const status = emailStatus(transition, email);
  if (status === 'Sent' || status === 'Submitted' || status === 'Expired') return status;
  return 'Closed';
}

/** Why a closed form closed, for the line under its status. */
export function sentFormClosedReason(transition: Transition, email: EmailRecord): string | undefined {
  const status = emailStatus(transition, email);
  if (status === 'Revoked') {
    const event = transition.emailEvents.find((item) => item.emailId === email.id);
    return event ? `Revoked by ${event.actor}` : 'Revoked';
  }
  if (status === 'Replaced') return 'Replaced when sent again';
  if (status === 'Closed') return `Transition ${statusGroup(transition).toLowerCase()}`;
  return undefined;
}

/**
 * When the form stopped accepting answers: submitted, revoked, replaced by a new send, expired, or
 * the transition was cancelled. Undefined while it is open, or when the date is not recorded.
 */
export function sentFormClosedAt(transition: Transition, email: EmailRecord): string | undefined {
  switch (emailStatus(transition, email)) {
    case 'Submitted':
      return transition.submissions.find((item) => item.emailId === email.id)?.submittedAt;
    case 'Revoked':
      return transition.emailEvents.find((item) => item.emailId === email.id)?.at;
    case 'Replaced':
      return transition.emails.find((item) => item.id === email.replacedBy)?.sentAt;
    case 'Expired':
      return email.expiredAt ?? email.linkExpiresAt;
    case 'Closed':
      return transition.cancellation?.recordedAt;
    default:
      return undefined;
  }
}

/** The subject of the email that sends a form. */
export function formEmailSubject(expiresOn: string): string {
  return `Please complete your employee form by ${formatDate(expiresOn)}`;
}

export function managePermissionFor(kind: TransitionKind): OboPermission {
  return kind === 'Onboarding' ? 'Manage Onboarding Transitions' : 'Manage Offboarding Transitions';
}

export function canReceiveForm(transition: Transition): boolean {
  return (
    statusGroup(transition) === 'Active' &&
    transition.kind === 'Onboarding' &&
    transition.portalAccess === 'Active');

}

export type PortalStatus = 'Active' | 'Closed' | 'Cancelled' | 'Not Issued';

/** The portal is issued with the first form sent to the candidate. */
export function portalIssue(transition: Transition): {issuedAt: string;sentTo: string;} | null {
  const first = sentFormEmails(transition).
  slice().
  sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())[0];
  return first ? { issuedAt: first.sentAt, sentTo: first.recipient } : null;
}

/**
 * Cancelled once HR cancels access; Not Issued until a form is sent; Closed once the transition has
 * ended or the access has lapsed; otherwise Active.
 */
export function portalStatus(transition: Transition): PortalStatus {
  if (transition.portalAccess === 'Revoked') return 'Cancelled';
  if (!portalIssue(transition)) return 'Not Issued';
  if (statusGroup(transition) !== 'Active' || transition.portalAccess === 'Expired') return 'Closed';
  return 'Active';
}

export function daysLabel(transition: Transition): string {
  const group = statusGroup(transition);
  if (group !== 'Active') return group;
  const remaining = daysRemaining(transition);
  const days = Math.abs(remaining);
  const unit = days === 1 ? 'day' : 'days';
  return remaining < 0 ? `${days} ${unit} overdue` : `${days} ${unit} remaining`;
}

export function visibleKinds(permissions: OboPermission[]): TransitionKind[] {
  if (permissions.includes('View All Transitions')) return ['Onboarding', 'Offboarding'];
  const kinds: TransitionKind[] = [];
  if (permissions.includes('Manage Onboarding Transitions')) kinds.push('Onboarding');
  if (permissions.includes('Manage Offboarding Transitions')) kinds.push('Offboarding');
  return kinds;
}

/** Everyone who owns at least one task in the transition, in the order they first appear. */
export function taskOwnerIds(transition: Transition): string[] {
  return [...new Set(transition.tasks.flatMap((task) => task.ownerIds))];
}

export function hasTaskOwnedBy(transition: Transition, userId: string): boolean {
  return transition.tasks.some((task) => task.ownerIds.includes(userId));
}
