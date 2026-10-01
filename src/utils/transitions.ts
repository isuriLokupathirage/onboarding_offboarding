import type {
  EmailRecord,
  OboPermission,
  Task,
  Transition,
  TransitionKind,
  TransitionTask } from
'../types';

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
    status: 'Not Started',
    parentTaskId: task.parentId,
    parentCompletionRequired: task.parentCompletionRequired,
    restricted: task.ownerOnlyVisible
  };
}

const CLOSED_TASK_STATUSES = new Set<TransitionTask['status']>(['Completed', 'Skipped', 'Cancelled']);

export function isTaskOpen(task: TransitionTask): boolean {
  return !CLOSED_TASK_STATUSES.has(task.status);
}

export function blockingTask(transition: Transition, task: TransitionTask): TransitionTask | undefined {
  if (!task.parentTaskId || !task.parentCompletionRequired) return undefined;
  const parent = transition.tasks.find((candidate) => candidate.taskId === task.parentTaskId);
  return parent && parent.status !== 'Completed' && parent.status !== 'Skipped' ? parent : undefined;
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

export function isOverdue(transition: Transition): boolean {
  return statusGroup(transition) === 'Active' && transition.daysRemaining < 0;
}

export const FORM_LINK_EXPIRY_DAYS = 14;

export type EmailStatus = 'Sent' | 'Submitted' | 'Expired' | 'Revoked' | 'Replaced' | 'Closed';

export function emailStatus(transition: Transition, email: EmailRecord): EmailStatus | null {
  if (email.content === 'reminder') return null;
  if (email.linkRevoked) return 'Revoked';
  if (transition.submissions.some((submission) => submission.emailId === email.id)) return 'Submitted';
  if (email.replacedBy) return 'Replaced';
  if (statusGroup(transition) !== 'Active') return 'Closed';
  if (email.linkExpiresAt && new Date(email.linkExpiresAt).getTime() < Date.now()) return 'Expired';
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

export function managePermissionFor(kind: TransitionKind): OboPermission {
  return kind === 'Onboarding' ? 'Manage Onboarding Transitions' : 'Manage Offboarding Transitions';
}

export function canReceiveForm(transition: Transition): boolean {
  return statusGroup(transition) === 'Active' && transition.kind === 'Onboarding';
}

export function daysLabel(transition: Transition): string {
  const group = statusGroup(transition);
  if (group !== 'Active') return group;
  const days = Math.abs(transition.daysRemaining);
  const unit = days === 1 ? 'day' : 'days';
  return transition.daysRemaining < 0 ? `${days} ${unit} overdue` : `${days} ${unit} remaining`;
}

export function visibleKinds(permissions: OboPermission[]): TransitionKind[] {
  if (permissions.includes('View All Transitions')) return ['Onboarding', 'Offboarding'];
  const kinds: TransitionKind[] = [];
  if (permissions.includes('Manage Onboarding Transitions')) kinds.push('Onboarding');
  if (permissions.includes('Manage Offboarding Transitions')) kinds.push('Offboarding');
  return kinds;
}

export function hasTaskOwnedBy(transition: Transition, userId: string): boolean {
  return transition.tasks.some((task) => task.ownerIds.includes(userId));
}
