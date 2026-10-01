import type { EmployeeForm, EmployeeFormAssignment, SubmittedDocument, Transition } from '../types';
import { emailStatus } from './transitions';

export type PortalFormStatus = 'To complete' | 'Submitted';

/** One form in a recipient's portal, whichever side it was sent from. */
export interface PortalFormItem {
  /** The form email id (transition) or assignment id (employee). */
  id: string;
  formId: string;
  formName: string;
  sentAt: string;
  expiresAt: string;
  submittedAt: string | null;
  status: PortalFormStatus;
}

export function portalUrl(token: string): string {
  return `accxis.lk/portal/${token}`;
}

export function isPast(iso: string | null | undefined, now = Date.now()): boolean {
  return Boolean(iso) && new Date(iso as string).getTime() < now;
}

const newestFirst = (a: PortalFormItem, b: PortalFormItem) =>
new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime();

/** Forms in a transition portal. Revoked, replaced and expired forms are left out. */
export function transitionPortalForms(
transition: Transition,
formName: (formId: string) => string)
: PortalFormItem[] {
  return transition.emails.
  filter((email) => email.content === 'form' && email.formId).
  flatMap((email): PortalFormItem[] => {
    const status = emailStatus(transition, email);
    if (status !== 'Sent' && status !== 'Submitted') return [];
    const submission = transition.submissions.find((item) => item.emailId === email.id);
    return [
    {
      id: email.id,
      formId: email.formId as string,
      formName: formName(email.formId as string),
      sentAt: email.sentAt,
      expiresAt: email.linkExpiresAt ?? '',
      submittedAt: submission?.submittedAt ?? null,
      status: submission ? 'Submitted' : 'To complete'
    }];

  }).
  sort(newestFirst);
}

/** Forms in an employee portal. Revoked and expired forms are left out. */
export function employeePortalForms(assignments: EmployeeFormAssignment[]): PortalFormItem[] {
  return assignments.
  flatMap((assignment): PortalFormItem[] => {
    if (assignment.status === 'Submitted') {
      return [{ ...toItem(assignment), status: 'Submitted' }];
    }
    if (assignment.status !== 'Sent' || isPast(assignment.expiresAt)) return [];
    return [{ ...toItem(assignment), status: 'To complete' }];
  }).
  sort(newestFirst);
}

function toItem(assignment: EmployeeFormAssignment): Omit<PortalFormItem, 'status'> {
  return {
    id: assignment.id,
    formId: assignment.formId,
    formName: assignment.formName,
    sentAt: assignment.sentAt,
    expiresAt: assignment.expiresAt,
    submittedAt: assignment.submittedAt
  };
}

/** Uploaded files grouped by document field, for showing a submission read-only. */
export function uploadsFromSubmission(
form: EmployeeForm,
documents: SubmittedDocument[])
: Record<string, string[]> {
  return Object.fromEntries(
    form.documents.map((doc) => [
    doc.id,
    documents.filter((item) => item.name === doc.name).map((item) => item.fileName)]
    )
  );
}
