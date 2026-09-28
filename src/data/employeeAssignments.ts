import type { ChangedValue, EmployeeFormAssignment } from '../types';

type AssignmentSeed = Omit<EmployeeFormAssignment, 'documentDrafts' | 'changes'> & {
  changes: (ChangedValue & {review?: string;})[];
};

const baseAssignments: AssignmentSeed[] = [
{
  id: 'asg1',
  employeeId: 'emp1',
  formId: 'frm1',
  formName: 'Permanent Employee Onboarding Form',
  status: 'In Progress',
  sentAt: '2026-09-02T09:15:00',
  expiresAt: '2026-10-02T09:15:00',
  submittedAt: null,
  linkToken: 'lnk-7f2a91',
  draftSaved: true,
  responses: {},
  changes: [],
  activity: [
  {
    id: 'ac1',
    action: 'Sent',
    detail: 'Permanent Employee Onboarding Form',
    actor: 'Nimal Perera',
    at: '2026-09-02T09:15:00'
  },
  { id: 'ac2', action: 'Opened', actor: 'Dasuni Perera', at: '2026-09-03T18:42:00' },
  { id: 'ac3', action: 'Draft saved', actor: 'Dasuni Perera', at: '2026-09-03T19:05:00' }]

},
{
  id: 'asg2',
  employeeId: 'emp2',
  formId: 'frm1',
  formName: 'Permanent Employee Onboarding Form',
  status: 'Submitted',
  sentAt: '2026-08-20T10:02:00',
  expiresAt: '2026-09-19T10:02:00',
  submittedAt: '2026-08-24T14:36:00',
  linkToken: 'lnk-3c88b0',
  draftSaved: false,
  responses: {
    mobile: '+94 71 900 4477',
    permAddress: '27 Flower Road, Colombo 07',
    bankName: 'Commercial Bank of Ceylon',
    branchName: 'Colombo 07'
  },
  changes: [
  {
    fieldId: 'mobile',
    label: 'Personal Mobile Number',
    previous: '+94 71 442 3018',
    submitted: '+94 71 900 4477',
    review: 'Pending'
  },
  {
    fieldId: 'permAddress',
    label: 'Permanent Address',
    previous: '14 Temple Lane, Nugegoda',
    submitted: '27 Flower Road, Colombo 07',
    review: 'Pending'
  },
  {
    fieldId: 'bankName',
    label: 'Bank Name',
    previous: 'Sampath Bank',
    submitted: 'Commercial Bank of Ceylon',
    review: 'Pending'
  },
  {
    fieldId: 'branchName',
    label: 'Branch Name',
    previous: 'Nugegoda',
    submitted: 'Colombo 07',
    review: 'Pending'
  }],

  activity: [
  {
    id: 'ac4',
    action: 'Sent',
    detail: 'Permanent Employee Onboarding Form',
    actor: 'Nimal Perera',
    at: '2026-08-20T10:02:00'
  },
  { id: 'ac5', action: 'Opened', actor: 'Lohara Dias', at: '2026-08-22T20:11:00' },
  { id: 'ac6', action: 'Draft saved', actor: 'Lohara Dias', at: '2026-08-22T20:40:00' },
  { id: 'ac7', action: 'Submitted', actor: 'Lohara Dias', at: '2026-08-24T14:36:00' }]

},
{
  id: 'asg3',
  employeeId: 'emp3',
  formId: 'frm1',
  formName: 'Permanent Employee Onboarding Form',
  status: 'Sent',
  sentAt: '2026-09-14T08:30:00',
  expiresAt: '2026-10-14T08:30:00',
  submittedAt: null,
  linkToken: 'lnk-b41d27',
  draftSaved: false,
  responses: {},
  changes: [],
  activity: [
  {
    id: 'ac8',
    action: 'Sent',
    detail: 'Permanent Employee Onboarding Form',
    actor: 'Dilani Jayawardena',
    at: '2026-09-14T08:30:00'
  }]

},
{
  id: 'asg4',
  employeeId: 'emp4',
  formId: 'frm3',
  formName: 'Contract Employee Form',
  status: 'Expired',
  sentAt: '2026-07-15T11:20:00',
  expiresAt: '2026-08-14T11:20:00',
  submittedAt: null,
  linkToken: 'lnk-90ee5a',
  draftSaved: false,
  responses: {},
  changes: [],
  activity: [
  {
    id: 'ac9',
    action: 'Sent',
    detail: 'Contract Employee Form',
    actor: 'Nimal Perera',
    at: '2026-07-15T11:20:00'
  },
  { id: 'ac10', action: 'Expired', actor: 'System', at: '2026-08-14T11:20:00' }]

},
{
  id: 'asg5',
  employeeId: 'emp5',
  formId: 'frm1',
  formName: 'Permanent Employee Onboarding Form',
  status: 'Revoked',
  sentAt: '2026-09-01T09:00:00',
  expiresAt: '2026-10-01T09:00:00',
  submittedAt: null,
  linkToken: 'lnk-5ab6c3',
  draftSaved: true,
  responses: {},
  changes: [],
  activity: [
  {
    id: 'ac11',
    action: 'Sent',
    detail: 'Permanent Employee Onboarding Form',
    actor: 'Nimal Perera',
    at: '2026-09-01T09:00:00'
  },
  { id: 'ac12', action: 'Opened', actor: 'Amila Prabhashwara', at: '2026-09-02T07:45:00' },
  {
    id: 'ac13',
    action: 'Revoked',
    detail: 'Sent to the wrong employment type',
    actor: 'Nimal Perera',
    at: '2026-09-05T15:12:00'
  }]

}];


export const seedAssignments: EmployeeFormAssignment[] = baseAssignments.map((assignment) => ({
  ...assignment,
  documentDrafts:
  assignment.id === 'asg1' ?
  { d1: ['NIC-front.jpg', 'NIC-back.jpg'] } :
  assignment.id === 'asg5' ?
  { d5: ['photograph.jpg'] } :
  {},
  changes: assignment.changes.map(({ fieldId, label, previous, submitted }) => ({
    fieldId,
    label,
    previous,
    submitted
  }))
}));