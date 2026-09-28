export type TransitionKind = 'Onboarding' | 'Offboarding';

export type Priority = 'Low' | 'Medium' | 'High';

export type Department = 'HR' | 'IT Ops' | 'Engineering' | 'Finance' | 'Security';

export type Milestone =
'Hire Date' |
'First Working Day' |
'End of First Week' |
'End of First Month' |
'Probation End Date';

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

export interface Template {
  id: string;
  code: string;
  kind: TransitionKind;
  name: string;
  client: string;
  employmentType: EmploymentType;
  taskIds: string[];
}

export type TransitionTaskStatus = 'Not Started' | 'In Progress' | 'Completed';

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
}

export interface EmailRecord {
  id: string;
  subject: string;
  recipient: string;
  sentAt: string;
  status: 'Delivered' | 'Opened' | 'Revoked' | 'Bounced';
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
  targetDate: string;
  daysRemaining: number;
  ownerIds: string[];
  tasks: TransitionTask[];
  emails: EmailRecord[];
  formStatus: FormSubmissionStatus;
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
  record: Record<string, string>;
}

export type EmployeeFormStatus =
'Not Sent' |
'Sent' |
'In Progress' |
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
  linkToken: string;
  draftSaved: boolean;
  responses: Record<string, string>;
  documentDrafts: Record<string, string[]>;
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