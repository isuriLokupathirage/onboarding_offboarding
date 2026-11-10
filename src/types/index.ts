export type TransitionKind = 'Onboarding' | 'Offboarding';

/**
 * Onboarding & Offboarding permissions. The system keys are noted where a story names them:
 * View Templates (obo.template.view), Manage Templates (obo.template.manage),
 * Manage Task Library (obo.task.manage), View Restricted Tasks (obo.task.restricted).
 */
export type OboPermission =
'View All Transitions' |
'Manage Onboarding Transitions' |
'Manage Offboarding Transitions' |
'Update Task Progress' |
'View Restricted Tasks' |
'View Templates' |
'Manage Templates' |
'Manage Task Library' |
/** Employee Management (employee.view). Needed to see a leaver's offboarding details. */
'View Employee Profiles' |
/** Templates → Forms → Exit Feedback (obo.feedback_form.view): open the list and view a form. */
'View Exit Feedback Forms' |
/** obo.feedback_form.manage: create, edit, duplicate, deactivate and delete exit feedback forms. */
'Manage Exit Feedback Forms' |
/** obo.report.view: open Onboarding & Offboarding → Reports. */
'View Reports' |
/**
 * template.exit_feedback_form.send: send exit feedback forms from an offboarding transition.
 * Sending also needs Manage Offboarding Transitions.
 */
'Send Exit Feedback Forms';

export type Priority = 'Low' | 'Medium' | 'High';

export type Department = 'HR' | 'IT Ops' | 'Engineering' | 'Finance' | 'Security';

export type OnboardingMilestone =
'Hire Date' |
'First Working Day' |
'End of First Week' |
'End of First Month' |
'Probation End Date';

export type OffboardingMilestone =
'Resignation Effective Date' |
'Notice Period Start Date' |
'Payroll Cut-off Date' |
'Actual Exit Date' |
'Last Working Date';

export type Milestone = OnboardingMilestone | OffboardingMilestone;

/** Who started the exit. Each type has its own list of exit reasons. */
export type OffboardingType = 'Voluntary' | 'Involuntary' | 'Mutual';

/** A document attached when starting an offboarding. `bytes` counts towards the 25 MB total. */
export interface ExitDocument {
  id: string;
  name: string;
  bytes: number;
}

/** The part of an offboarding's Step 2 that is entered, before it is tied to the employee. */
export type ExitDetailsDraft = Omit<ExitDetails, 'employeeId'>;

/**
 * The leaver's employment details, captured when the offboarding starts. Reports read these, so a
 * later change to the employee record does not alter past reports.
 */
export interface LeaverSnapshot {
  jobTitle: string;
  organizationUnit: Department;
  employmentType: EmploymentType;
  client: string;
  joinedOn: string;
}

/**
 * The joiner's job details, captured when the onboarding starts, so a later change to the template
 * or the employee record does not alter past reports.
 */
export interface JoinerSnapshot {
  jobTitle: string;
  organizationUnit: Department;
  /** From the template. */
  employmentType: EmploymentType;
  /** From the template. */
  client: string;
}

/** What Step 2 of an offboarding records: why the employee is leaving, the exit dates and documents. */
export interface ExitDetails {
  employeeId: string;
  type: OffboardingType;
  reason: string;
  /** Only when the reason is Other. */
  otherReason?: string;
  dates: Partial<Record<OffboardingMilestone, string>>;
  documents: ExitDocument[];
}

export type DueRule =
{
  kind: 'relative';
  amount: number;
  unit: 'days' | 'weeks' | 'months';
  direction: 'before' | 'after';
  milestone: Milestone;
} |
{kind: 'milestone';milestone: Milestone;};

export interface Person {
  id: string;
  name: string;
  role: string;
  department: Department;
  /** Holds Update Task Progress (obo.task.progress), so can own transition tasks. */
  canUpdateTaskProgress: boolean;
  /** False for an employee with no system login: they get task emails but cannot open tasks. */
  hasSignInAccess: boolean;
}

export interface TaskFile {
  id: string;
  name: string;
  size: string;
}

export interface Task {
  id: string;
  code: string;
  kind: TransitionKind;
  name: string;
  description: string;
  department: Department;
  priority: Priority;
  optional: boolean;
  showInCandidateEvents: boolean;
  ownerIds: string[];
  dueRule: DueRule | null;
  parentId: string | null;
  parentCompletionRequired: boolean;
  notifyOnAssignment: 'Yes' | 'No';
  ownerOnlyVisible: boolean;
  files: TaskFile[];
}

export type EmploymentType = 'Permanent' | 'Contract' | 'Internship' | 'Consultant';

/** Only Active templates can be picked when starting a transition. */
export type TemplateStatus = 'Active' | 'Inactive';

export interface Template {
  id: string;
  code: string;
  kind: TransitionKind;
  name: string;
  client: string;
  employmentType: EmploymentType;
  taskIds: string[];
  status: TemplateStatus;
}

export interface RecruitmentCampaign {
  id: string;
  name: string;
  /** From Job Title master data. */
  jobTitle: string;
}

/**
 * A candidate who has completed a recruitment workflow and can be onboarded. Apart from the
 * name, the details are extracted from their application, so any of them can be missing.
 */
export interface RecruitmentCandidate {
  id: string;
  firstName: string;
  lastName: string;
  campaignId: string;
  workflowCompletedOn: string;
  personalEmail?: string;
  mobile?: string;
  /** Start date agreed in the offer. */
  offeredStartDate?: string;
  dateOfBirth?: string;
  gender?: string;
  country?: string;
  address?: string;
}

export type TransitionTaskStatus = 'Open' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';

export interface TransitionTask {
  id: string;
  taskId: string;
  name: string;
  description: string;
  department: Department;
  priority: Priority;
  optional: boolean;
  showInCandidateEvents: boolean;
  dueDate: string | null;
  calculatedDueDate: string | null;
  dueSource: 'calculated' | 'override';
  ownerIds: string[];
  status: TransitionTaskStatus;
  parentTaskId: string | null;
  parentCompletionRequired: boolean;
  restricted: boolean;
}

export interface EmailRecord {
  id: string;
  subject: string;
  recipient: string;
  sentAt: string;
  content: 'form' | 'reminder';
  /** The employee form sent. Absent on an exit feedback form, which sets feedbackFormId instead. */
  formId?: string;
  /** Offboarding only: the exit feedback form sent. */
  feedbackFormId?: string;
  /** The form's name and code when it was sent, so the record reads the same if the form is later renamed. */
  formName?: string;
  formCode?: string;
  /** Who sent the form. */
  sentBy?: string;
  /** Form emails carry the transition's portal link; this is when the form itself closes. */
  linkExpiresAt?: string;
  linkRevoked?: boolean;
  replacedBy?: string;
  /** Set when the form was expired before its expiry date, by cancelling portal access. */
  expiredAt?: string;
  draftCarriedForward?: boolean;
  /** The recipient's unsubmitted entries for this form. Never shown to HR. */
  draft?: FormDraft;
}

export interface EmailHistoryEvent {
  id: string;
  emailId: string;
  action: 'Link revoked';
  actor: string;
  at: string;
}

export interface TransitionCancellation {
  date: string;
  reason: string;
  cancelledBy: string;
  recordedAt: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  at: string;
  detail?: string;
}

/** One report export, kept in the Reports audit trail. */
export interface ReportExportRecord {
  id: string;
  report: string;
  format: 'Excel' | 'PDF';
  period: string;
  filters: string[];
  /** Name of the user who exported. */
  actor: string;
  /** ISO date and time of the export. */
  at: string;
}

export interface FormDraft {
  savedAt: string;
  responses: Record<string, string>;
  documents: Record<string, string[]>;
}

export interface SubmittedDocument {
  name: string;
  fileName: string;
}

/** The two parts of a form. A form with both lets the recipient submit each on its own. */
export type FormPart = 'details' | 'documents';

export interface FormSubmission {
  emailId: string;
  formId?: string;
  /** When the most recent part was submitted. */
  submittedAt: string;
  responses: Record<string, string>;
  documents: SubmittedDocument[];
  /** When each part was submitted. Absent on a form submitted in one go. */
  parts?: Partial<Record<FormPart, string>>;
  /** Parts the recipient has still to submit. Empty or absent once the form is complete. */
  pendingParts?: FormPart[];
}

export type FormSubmissionStatus = 'Not Sent' | 'Sent' | 'In Progress' | 'Submitted';

export interface Candidate {
  firstName: string;
  lastName: string;
  personalEmail: string;
  mobile: string;
  position: string;
  hireDate: string;
  reportingManagerIds: string[];
  dateOfBirth?: string;
  gender?: string;
  country?: string;
  address?: string;
  employeeFormId?: string;
}

export interface Transition {
  id: string;
  kind: TransitionKind;
  candidate: Candidate;
  templateId: string;
  templateName: string;
  status: 'On Track' | 'At Risk' | 'Completed' | 'Cancelled';
  portalToken: string;
  portalAccess: 'Active' | 'Revoked' | 'Expired';
  portalExpiresAt: string;
  startedOn: string;
  /** Set when the transition starts. Screens show the latest task due date instead (transitionTargetDate). */
  targetDate: string;
  /**
   * The latest task due date as calculated when the transition started. It does not change when
   * due dates change later, so on-time completion is measured against the original plan.
   */
  plannedCompletionDate: string;
  /** The day the transition was completed. Set only when status is 'Completed'. */
  completedOn?: string;
  ownerIds: string[];
  tasks: TransitionTask[];
  emails: EmailRecord[];
  emailEvents: EmailHistoryEvent[];
  formStatus: FormSubmissionStatus;
  submissions: FormSubmission[];
  cancellation?: TransitionCancellation;
  /** Set when HR cancels the candidate's portal access. portalAccess is then 'Revoked'. */
  portalCancellation?: {at: string;by: string;};
  /** Offboarding only: the exit type, reason, dates and documents from Step 2. */
  exit?: ExitDetails;
  /** Offboarding only: the leaver's employment details as they were when the offboarding started. */
  leaver?: LeaverSnapshot;
  /** Onboarding only: the joiner's job details as they were when the onboarding started. */
  joiner?: JoinerSnapshot;
  auditTrail: AuditEntry[];
}

/* ---------- Employee forms ---------- */

export type FieldState = 'Hidden' | 'Optional' | 'Required';

export type FieldDataType =
'Text' |
'Long text' |
'Number' |
'Date' |
'Email' |
'Phone' |
'Dropdown' |
'Currency';

export interface FormField {
  id: string;
  name: string;
  dataType: FieldDataType;
  state: FieldState;
  locked?: boolean;
  options?: string[];
  allowOther?: boolean;
}

export interface ConditionalGroup {
  id: string;
  label: string;
  condition: 'Single' | 'Married';
  fields: FormField[];
  repeating?: {
    label: string;
    fields: FormField[];
  };
}

export interface FormSection {
  id: string;
  title: string;
  enabled: boolean;
  repeating?: boolean;
  fields: FormField[];
  conditionalGroups?: ConditionalGroup[];
}

/* ---------- Employee management ---------- */

export interface Employee {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  department: Department;
  employmentType: EmploymentType;
  client: string;
  officialEmail: string;
  personalEmail: string;
  mobile: string;
  reportingManager: string;
  status: 'Active' | 'Inactive';
  joinedOn: string;
  /** One portal link per employee; every form sent from Employee Management opens in it. */
  portalToken: string;
  record: Record<string, string>;
}

export type EmployeeFormStatus =
'Not Sent' |
'Sent' |
'Submitted' |
'Expired' |
'Revoked';

export type FormActivityAction =
'Sent' |
'Resent' |
'Opened' |
'Draft saved' |
'Submitted' |
'Revoked' |
'Expired' |
'Profile updated';

export interface FormActivityEntry {
  id: string;
  action: FormActivityAction;
  detail?: string;
  actor: string;
  at: string;
}

export interface ChangedValue {
  fieldId: string;
  label: string;
  previous: string;
  submitted: string;
}

export interface EmployeeFormAssignment {
  id: string;
  employeeId: string;
  formId: string;
  formName: string;
  status: EmployeeFormStatus;
  sentAt: string;
  expiresAt: string;
  submittedAt: string | null;
  /** When each part was submitted. The form is Submitted once every part it has is in. */
  submittedParts?: Partial<Record<FormPart, string>>;
  draftSaved: boolean;
  responses: Record<string, string>;
  documentDrafts: Record<string, string[]>;
  submittedDocuments: SubmittedDocument[];
  changes: ChangedValue[];
  activity: FormActivityEntry[];
}

export type DocumentType =
'National ID' |
'Passport' |
'Educational Certificate' |
'Professional Certification' |
'Employment Letter' |
'Police Report' |
'Photograph' |
'Other';

export interface RequiredDocument {
  id: string;
  name: string;
  type: DocumentType;
  required: boolean;
  multiple: boolean;
}

export interface EmployeeForm {
  id: string;
  code: string;
  name: string;
  employmentType: EmploymentType;
  description: string;
  employeeDetailsEnabled: boolean;
  status: 'Active' | 'Inactive';
  isDraft?: boolean;
  createdBy: string;
  createdOn: string;
  lastModified: string;
  sections: FormSection[];
  documents: RequiredDocument[];
}
export type FeedbackAnswerType = 'Rating Scale' | 'Yes / No' | 'Short Comment' | 'Long Comment';

export interface FeedbackQuestion {
  id: string;
  label: string;
  answerType: FeedbackAnswerType;
  /** Optional description or guidelines shown under the question. */
  description: string;
  required: boolean;
}

export interface FeedbackForm {
  id: string;
  /** EXF-NNN, generated when the form is created. The unique identifier: names can repeat. */
  code: string;
  name: string;
  description: string;
  status: 'Active' | 'Inactive';
  questions: FeedbackQuestion[];
  /** How many times the form has been sent. Once sent, it can no longer be edited or deleted. */
  sentCount: number;
  /** Responses received. Kept when the form is deactivated. */
  responseCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
