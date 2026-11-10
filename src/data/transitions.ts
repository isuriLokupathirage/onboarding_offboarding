import type {
  AuditEntry,
  Department,
  EmailRecord,
  JoinerSnapshot,
  LeaverSnapshot,
  OffboardingType,
  Transition,
  TransitionCancellation,
  TransitionTask } from
'../types';
import { peopleById } from './people';
import { seedTasks } from './tasks';
import { seedTemplates } from './templates';
import { seedForms } from './forms';
import { addDays, formatDate } from '../utils/format';
import {
  FORM_LINK_EXPIRY_DAYS,
  exitFeedbackEmailSubject,
  toTransitionTask,
  transitionTargetDate } from
'../utils/transitions';

type TransitionSeed = Omit<
  Transition,
  'portalToken' | 'portalAccess' | 'portalExpiresAt' | 'emailEvents' | 'auditTrail' | 'submissions' | 'plannedCompletionDate'> &
{
  /** Defaults to the latest task due date. */
  plannedCompletionDate?: string;
  emailEvents?: Transition['emailEvents'];
  submissions?: Transition['submissions'];
};

function buildTasks(
templateId: string,
hireDate: string,
overrides: Partial<Record<string, Partial<TransitionTask>>> = {})
: TransitionTask[] {
  const template = seedTemplates.find((t) => t.id === templateId);
  if (!template) return [];
  return template.taskIds.map((taskId, index) => {
    const task = seedTasks.find((t) => t.id === taskId)!;
    const base = toTransitionTask(task, `${templateId}-${taskId}`, shiftDate(hireDate, index));
    return { ...base, ...(overrides[taskId] ?? {}) };
  });
}

function shiftDate(iso: string, offsetDays: number): string {
  const date = new Date(iso);
  date.setDate(date.getDate() + offsetDays - 3);
  return date.toISOString().slice(0, 10);
}

const baseTransitions: TransitionSeed[] = [
{
  id: 'tr1',
  kind: 'Onboarding',
  candidate: {
    firstName: 'Anushka',
    lastName: 'Rajapaksha',
    personalEmail: 'anushka.rajapaksha@gmail.com',
    mobile: '+94 77 412 8890',
    position: 'Software Engineer',
    hireDate: '2026-09-21',
    reportingManagerIds: ['u4', 'u9'],
    dateOfBirth: '1997-04-12',
    gender: 'Female',
    country: 'Sri Lanka',
    address: '41/3 Nawala Road, Rajagiriya',
    employeeFormId: 'frm1'
  },
  templateId: 'tpl1',
  templateName: 'Standard Permanent Onboarding',
  status: 'On Track',
  startedOn: '2026-09-08',
  targetDate: '2026-09-21',
  ownerIds: ['u1', 'u2', 'u4'],
  tasks: buildTasks('tpl1', '2026-09-21', {
    t1: { status: 'Completed' },
    t2: { status: 'Completed' },
    t3: { status: 'Completed' },
    t4: { status: 'In Progress' },
    t5: { status: 'Open' },
    t6: { status: 'Open' },
    t7: { status: 'Completed' },
    t8: { status: 'Open' },
    t9: { status: 'In Progress', ownerIds: ['u5', 'u10', 'u14', 'u1'] },
    t14: { dueDate: null, calculatedDueDate: null }
  }),
  emails: [
  {
    id: 'em0',
    subject: 'Welcome to Accxis Holdings — complete your Permanent Employee Onboarding Form',
    recipient: 'anushka.rajapaksha@gmail.com',
    sentAt: '2026-09-08T09:14:00',
    content: 'form',
    formId: 'frm1',
    replacedBy: 'em1'
  },
  {
    id: 'em1',
    subject: 'Complete your Permanent Employee Onboarding Form',
    recipient: 'anushka.rajapaksha@gmail.com',
    sentAt: '2026-09-14T09:10:00',
    content: 'form',
    formId: 'frm1',
    draft: {
      savedAt: '2026-09-15T20:15:00',
      responses: {
        firstName: 'Anushka',
        lastName: 'Rajapaksha',
        dob: '1997-04-12',
        gender: 'Female',
        permAddress: '41/3 Nawala Road, Rajagiriya',
        mobile: '+94 77 412 8890'
      },
      documents: { d1: ['NIC-front.jpg'] }
    }
  },
  {
    id: 'em2',
    subject: 'Document upload reminder',
    recipient: 'anushka.rajapaksha@gmail.com',
    sentAt: '2026-09-15T14:02:00',
    content: 'reminder'
  },
  {
    id: 'em3',
    subject: 'Complete your Document Verification Form',
    recipient: 'anushka.rajapaksha@gmail.com',
    sentAt: '2026-09-15T11:30:00',
    content: 'form',
    formId: 'frm4'
  }],

  formStatus: 'In Progress',
  submissions: [
  {
    emailId: 'em3',
    formId: 'frm4',
    submittedAt: '2026-09-16T08:05:00',
    responses: {},
    documents: [
    { name: 'National Identity Card', fileName: 'NIC-front-back.pdf' },
    { name: 'Passport Size Photograph', fileName: 'photo.jpg' }]

  }]

},
{
  id: 'tr2',
  kind: 'Onboarding',
  candidate: {
    firstName: 'Hiruni',
    lastName: 'Dissanayake',
    personalEmail: 'hiruni.dissa@gmail.com',
    mobile: '+94 71 308 5521',
    position: 'HR Executive',
    hireDate: '2026-09-28',
    reportingManagerIds: ['u1'],
    country: 'Sri Lanka',
    employeeFormId: 'frm1'
  },
  templateId: 'tpl1',
  templateName: 'Standard Permanent Onboarding',
  status: 'On Track',
  startedOn: '2026-09-12',
  targetDate: '2026-09-28',
  ownerIds: ['u1', 'u3'],
  tasks: buildTasks('tpl1', '2026-09-28', {
    t1: { status: 'Completed' },
    t2: { status: 'In Progress' },
    t3: { ownerIds: ['u3', 'u1'] },
    t7: { dueDate: '2026-09-29', dueSource: 'override' }
  }),
  emails: [
  {
    id: 'em4',
    subject: 'Welcome to Accxis Holdings — complete your employee data form',
    recipient: 'hiruni.dissa@gmail.com',
    sentAt: '2026-09-12T10:41:00',
    content: 'form',
    linkRevoked: true
  },
  {
    id: 'em10',
    subject: 'Complete your Permanent Employee Onboarding Form',
    recipient: 'hiruni.dissa@gmail.com',
    sentAt: '2026-09-14T09:10:00',
    content: 'form'
  },
  {
    id: 'em11',
    subject: 'Reminder — complete your employee data form',
    recipient: 'hiruni.dissa@gmail.com',
    sentAt: '2026-09-15T10:00:00',
    content: 'reminder'
  }],
  emailEvents: [
  { id: 'ev1', emailId: 'em4', action: 'Link revoked', actor: 'Nimal Perera', at: '2026-09-13T09:05:00' }],

  formStatus: 'Sent'
},
{
  id: 'tr3',
  kind: 'Offboarding',
  candidate: {
    firstName: 'Malith',
    lastName: 'Senanayake',
    personalEmail: 'malith.sena@gmail.com',
    mobile: '+94 76 221 7734',
    position: 'Senior Accountant',
    hireDate: '2026-09-18',
    reportingManagerIds: ['u5'],
    country: 'Sri Lanka'
  },
  templateId: 'tpl5',
  templateName: 'Standard Resignation Offboarding',
  exit: {
    employeeId: 'emp9',
    type: 'Voluntary',
    reason: 'Better Employment Opportunity',
    dates: {
      'Resignation Effective Date': '2026-08-19',
      'Notice Period Start Date': '2026-08-19',
      'Payroll Cut-off Date': '2026-09-15',
      'Last Working Date': '2026-09-18',
      'Actual Exit Date': '2026-09-19'
    },
    documents: [
    { id: 'exd-tr3-1', name: 'Resignation_Letter_Malith_Senanayake.pdf', bytes: 217088 },
    { id: 'exd-tr3-2', name: 'Resignation_Acceptance_Letter.pdf', bytes: 154624 }]

  },
  leaver: {
    jobTitle: 'Senior Accountant',
    organizationUnit: 'Finance',
    employmentType: 'Permanent',
    client: 'Accxis Holdings (Pvt) Ltd',
    joinedOn: '2021-02-01'
  },
  status: 'At Risk',
  startedOn: '2026-08-29',
  targetDate: '2026-09-18',
  ownerIds: ['u1', 'u5', 'u6'],
  tasks: buildTasks('tpl5', '2026-09-18', {
    t20: { status: 'Completed' },
    t21: { status: 'Completed' },
    t22: { status: 'Completed' },
    t23: { status: 'In Progress' },
    t24: { status: 'In Progress' },
    t26: { status: 'Completed' }
  }),
  // One exit feedback form in each status: open (so it cannot be sent again from Send Form),
  // revoked, submitted and expired.
  emails: [
  {
    id: 'em-tr3-1',
    subject: exitFeedbackEmailSubject(addDays('2026-09-14T10:20:00', FORM_LINK_EXPIRY_DAYS)),
    recipient: 'malith.senanayake@accxis.lk',
    sentAt: '2026-09-14T10:20:00',
    content: 'form',
    feedbackFormId: 'fbf1',
    formName: 'Standard Exit Interview',
    formCode: 'EXF-001'
  },
  {
    id: 'em-tr3-2',
    subject: exitFeedbackEmailSubject(addDays('2026-09-08T14:00:00', FORM_LINK_EXPIRY_DAYS)),
    recipient: 'malith.senanayake@accxis.lk',
    sentAt: '2026-09-08T14:00:00',
    content: 'form',
    feedbackFormId: 'fbf11',
    formName: 'Finance Team Exit Survey',
    formCode: 'EXF-011',
    linkRevoked: true,
    sentBy: 'Dilani Jayawardena'
  },
  {
    id: 'em-tr3-3',
    subject: exitFeedbackEmailSubject(addDays('2026-09-01T09:30:00', FORM_LINK_EXPIRY_DAYS)),
    recipient: 'malith.senanayake@accxis.lk',
    sentAt: '2026-09-01T09:30:00',
    content: 'form',
    feedbackFormId: 'fbf8',
    formName: 'Manager Exit Survey',
    formCode: 'EXF-008'
  },
  {
    id: 'em-tr3-4',
    subject: exitFeedbackEmailSubject(addDays('2026-08-30T11:15:00', FORM_LINK_EXPIRY_DAYS)),
    recipient: 'malith.senanayake@accxis.lk',
    sentAt: '2026-08-30T11:15:00',
    content: 'form',
    feedbackFormId: 'fbf10',
    formName: 'Remote Employee Exit Survey',
    formCode: 'EXF-010'
  }],

  emailEvents: [
  { id: 'ev-tr3-1', emailId: 'em-tr3-2', action: 'Link revoked', actor: 'Dilani Jayawardena', at: '2026-09-10T16:40:00' }],

  submissions: [
  {
    emailId: 'em-tr3-3',
    submittedAt: '2026-09-03T19:12:00',
    responses: {
      'fbf8-q1': '4',
      'fbf8-q2': 'A role leading a larger finance team, which was not open here for at least two years.',
      'fbf8-q3': 'Yes',
      'fbf8-q4': '3'
    },
    documents: []
  }],

  formStatus: 'Not Sent'
},
{
  id: 'tr4',
  kind: 'Onboarding',
  candidate: {
    firstName: 'Tharindu',
    lastName: 'Alwis',
    personalEmail: 'tharindu.alwis@gmail.com',
    mobile: '+94 70 559 1182',
    position: 'DevOps Engineer',
    hireDate: '2026-10-05',
    reportingManagerIds: ['u9'],
    country: 'Sri Lanka',
    employeeFormId: 'frm2'
  },
  templateId: 'tpl2',
  templateName: 'Engineering Intern Onboarding',
  status: 'On Track',
  startedOn: '2026-09-15',
  targetDate: '2026-10-05',
  ownerIds: ['u2', 'u9'],
  tasks: buildTasks('tpl2', '2026-10-05', {
    t2: { status: 'In Progress' },
    t5: { ownerIds: ['u8', 'u1'] }
  }),
  emails: [
  {
    id: 'em7',
    subject: 'Internship onboarding — complete your Intern Onboarding Form',
    recipient: 'tharindu.alwis@gmail.com',
    sentAt: '2026-09-15T15:05:00',
    content: 'form'
  }],

  formStatus: 'Sent'
},
{
  id: 'tr5',
  kind: 'Offboarding',
  candidate: {
    firstName: 'Nadeesha',
    lastName: 'Kumari',
    personalEmail: 'nadeesha.kumari@gmail.com',
    mobile: '+94 78 640 2201',
    position: 'Security Analyst',
    hireDate: '2026-10-12',
    reportingManagerIds: ['u6'],
    country: 'Sri Lanka'
  },
  templateId: 'tpl6',
  templateName: 'Contract Completion Offboarding',
  status: 'On Track',
  startedOn: '2026-09-14',
  targetDate: '2026-10-12',
  ownerIds: ['u6', 'u10'],
  tasks: buildTasks('tpl6', '2026-10-12', { t20: { status: 'In Progress' } }),
  emails: [],
  formStatus: 'Not Sent'
},
{
  id: 'tr6',
  kind: 'Onboarding',
  candidate: {
    firstName: 'Chamod',
    lastName: 'Weerasinghe',
    personalEmail: 'chamod.weera@gmail.com',
    mobile: '+94 75 118 9043',
    position: 'QA Engineer',
    hireDate: '2026-09-17',
    reportingManagerIds: ['u4'],
    country: 'Sri Lanka',
    employeeFormId: 'frm1'
  },
  templateId: 'tpl3',
  templateName: 'Finance Contract Onboarding',
  status: 'On Track',
  startedOn: '2026-08-31',
  targetDate: '2026-09-17',
  ownerIds: ['u1', 'u5'],
  tasks: buildTasks('tpl3', '2026-09-17', {
    t1: { status: 'Completed' },
    t2: { status: 'Completed' },
    t7: { status: 'Completed' },
    t9: { status: 'Completed' },
    t10: { status: 'In Progress' }
  }),
  emails: [
  {
    id: 'em8',
    subject: 'Welcome to Accxis Holdings — complete your employee data form',
    recipient: 'chamod.weera@gmail.com',
    sentAt: '2026-08-31T13:10:00',
    content: 'form'
  },
  {
    id: 'em9',
    subject: 'Reminder — complete your employee data form',
    recipient: 'chamod.weera@gmail.com',
    sentAt: '2026-09-02T09:00:00',
    content: 'reminder'
  },
  {
    id: 'em12',
    subject: 'Please complete your employee form by 14 Sept 2026',
    recipient: 'chamod.weera@gmail.com',
    sentAt: '2026-08-31T13:12:00',
    content: 'form',
    formId: 'frm4'
  }],

  formStatus: 'Submitted',
  submissions: [
  {
    emailId: 'em8',
    formId: 'frm1',
    submittedAt: '2026-09-03T18:42:00',
    responses: {
      firstName: 'Chamod',
      lastName: 'Weerasinghe',
      nic: '199813204571',
      dob: '1998-05-11',
      gender: 'Male',
      nationality: 'Sri Lankan',
      marital: 'Single',
      permAddress: '52/1 Temple Road, Maharagama',
      mobile: '+94 75 118 9043',
      email: 'chamod.weera@gmail.com',
      eduSchool: 'University of Moratuwa',
      eduDegree: 'BSc (Hons) in Information Technology',
      eduField: 'Software Engineering',
      expTitle: 'Associate QA Engineer',
      expCompany: 'Zenlanka Technologies',
      ecName: 'Kumudu Weerasinghe',
      ecNumber: '+94 71 552 0911',
      ecRelationship: 'Parent',
      accName: 'W. A. C. Weerasinghe',
      accType: 'Savings — LKR',
      bankName: 'Hatton National Bank',
      branchName: 'Maharagama',
      accNumber: '004020118832'
    },
    documents: [
    { name: 'National Identity Card', fileName: 'NIC-front-back.pdf' },
    { name: 'Highest Educational Qualification', fileName: 'BSc-Transcript.pdf' },
    { name: 'Passport Size Photograph', fileName: 'photo.jpg' }]

  }]
}];

interface CompactSeed {
  id: string;
  kind: Transition['kind'];
  name: [string, string];
  position: string;
  templateId: string;
  status: Transition['status'];
  startedOn: string;
  targetDate: string;
  completedTasks: number | 'all';
  managerIds: string[];
  cancellation?: TransitionCancellation;
  exit?: Transition['exit'];
  leaver?: LeaverSnapshot;
  completedOn?: string;
  emails?: EmailRecord[];
  portalCancellation?: Transition['portalCancellation'];
}

function daysBefore(iso: string, days: number): string {
  const date = new Date(iso);
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

interface LeaverSeed {
  id: string;
  name: [string, string];
  leaver: LeaverSnapshot;
  type: OffboardingType;
  reason: string;
  /** The Actual Exit Date. The Last Working Date is the same day. */
  exitDate: string;
  templateId: string;
  managerId: string;
}

/** A completed offboarding with its exit details, for the Reports section. */
function completedLeaver(seed: LeaverSeed): CompactSeed {
  return {
    id: seed.id,
    kind: 'Offboarding',
    name: seed.name,
    position: seed.leaver.jobTitle,
    templateId: seed.templateId,
    status: 'Completed',
    startedOn: daysBefore(seed.exitDate, 28),
    targetDate: seed.exitDate,
    completedTasks: 'all',
    managerIds: [seed.managerId],
    exit: {
      employeeId: `emp-${seed.id}`,
      type: seed.type,
      reason: seed.reason,
      dates: {
        'Resignation Effective Date': daysBefore(seed.exitDate, 30),
        'Last Working Date': seed.exitDate,
        'Actual Exit Date': seed.exitDate
      },
      documents: []
    },
    leaver: seed.leaver,
    completedOn: seed.exitDate
  };
}

interface JoinerSeed {
  id: string;
  name: [string, string];
  position: string;
  templateId: string;
  hireDate: string;
  /** Days between starting the onboarding and the hire date. */
  leadDays: number;
  /** Days after the Planned Completion Date that it was completed. Negative is early. */
  daysLate: number;
  managerId: string;
}

/** A completed onboarding, for the Reports section. Its tasks fall due around the hire date. */
function completedJoiner(seed: JoinerSeed): CompactSeed {
  const taskCount = seedTemplates.find((template) => template.id === seed.templateId)?.taskIds.length ?? 1;
  const planned = shiftDate(seed.hireDate, taskCount - 1);
  return {
    id: seed.id,
    kind: 'Onboarding',
    name: seed.name,
    position: seed.position,
    templateId: seed.templateId,
    status: 'Completed',
    startedOn: daysBefore(seed.hireDate, seed.leadDays),
    targetDate: seed.hireDate,
    completedTasks: 'all',
    managerIds: [seed.managerId],
    completedOn: daysBefore(planned, -seed.daysLate)
  };
}

/** Completed onboardings across last year and this year, so the Onboarding Reports have data to show. */
const joinerSeeds: JoinerSeed[] = [
{ id: 'tr34', name: ['Nimesha', 'Fernando'], position: 'Software Engineer', templateId: 'tpl1', hireDate: '2026-01-12', leadDays: 14, daysLate: -2, managerId: 'u9' },
{ id: 'tr35', name: ['Charith', 'Senanayake'], position: 'Backend Engineer', templateId: 'tpl1', hireDate: '2026-01-26', leadDays: 21, daysLate: 0, managerId: 'u9' },
{ id: 'tr36', name: ['Ayesha', 'Rahman'], position: 'Financial Analyst', templateId: 'tpl3', hireDate: '2026-02-09', leadDays: 14, daysLate: 3, managerId: 'u5' },
{ id: 'tr37', name: ['Tharindu', 'Wijeratne'], position: 'Network Engineer', templateId: 'tpl4', hireDate: '2026-02-23', leadDays: 10, daysLate: -1, managerId: 'u2' },
{ id: 'tr38', name: ['Malsha', 'Gunawardena'], position: 'HR Assistant', templateId: 'tpl1', hireDate: '2026-03-09', leadDays: 14, daysLate: 0, managerId: 'u1' },
{ id: 'tr39', name: ['Pasindu', 'Kodikara'], position: 'Engineering Intern', templateId: 'tpl2', hireDate: '2026-03-16', leadDays: 12, daysLate: 5, managerId: 'u9' },
{ id: 'tr40', name: ['Dulani', 'Amarasinghe'], position: 'Procurement Executive', templateId: 'tpl3', hireDate: '2026-04-06', leadDays: 14, daysLate: -3, managerId: 'u5' },
{ id: 'tr41', name: ['Heshan', 'Mendis'], position: 'Systems Engineer', templateId: 'tpl4', hireDate: '2026-04-20', leadDays: 10, daysLate: 0, managerId: 'u2' },
{ id: 'tr42', name: ['Kaveesha', 'Ranasinghe'], position: 'Software Intern', templateId: 'tpl8', hireDate: '2026-05-04', leadDays: 12, daysLate: 2, managerId: 'u9' },
{ id: 'tr43', name: ['Janith', 'Wickramaratne'], position: 'Frontend Engineer', templateId: 'tpl1', hireDate: '2026-05-18', leadDays: 21, daysLate: -1, managerId: 'u9' },
{ id: 'tr44', name: ['Ruvini', 'Seneviratne'], position: 'Payroll Assistant', templateId: 'tpl3', hireDate: '2026-06-01', leadDays: 14, daysLate: 0, managerId: 'u5' },
{ id: 'tr45', name: ['Mohamed', 'Rizwan'], position: 'Security Analyst', templateId: 'tpl4', hireDate: '2026-06-15', leadDays: 10, daysLate: 4, managerId: 'u6' },
{ id: 'tr46', name: ['Sithara', 'Jayawardena'], position: 'Data Analyst', templateId: 'tpl1', hireDate: '2026-06-29', leadDays: 14, daysLate: 0, managerId: 'u4' },
{ id: 'tr47', name: ['Lakmal', 'Dissanayake'], position: 'DevOps Engineer', templateId: 'tpl1', hireDate: '2026-07-13', leadDays: 21, daysLate: 6, managerId: 'u2' },
{ id: 'tr48', name: ['Hasini', 'Perera'], position: 'Associate Finance Executive', templateId: 'tpl3', hireDate: '2026-08-10', leadDays: 14, daysLate: -2, managerId: 'u5' },
{ id: 'tr49', name: ['Chathura', 'Bandara'], position: 'QA Engineer', templateId: 'tpl1', hireDate: '2025-04-07', leadDays: 14, daysLate: 0, managerId: 'u9' },
{ id: 'tr50', name: ['Nirosha', 'Fernando'], position: 'HR Executive', templateId: 'tpl1', hireDate: '2025-08-18', leadDays: 14, daysLate: 3, managerId: 'u1' },
{ id: 'tr51', name: ['Dineth', 'Samarakoon'], position: 'Logistics Coordinator', templateId: 'tpl4', hireDate: '2025-11-03', leadDays: 10, daysLate: -1, managerId: 'u5' }];

/** Organization units for the seeded joiners' job titles. Real onboardings record it in Step 2. */
const SEED_UNIT_BY_JOB_TITLE: Record<string, Department> = {
  'Network Engineer': 'IT Ops',
  'Systems Engineer': 'IT Ops',
  'DevOps Engineer': 'IT Ops',
  'Solutions Consultant': 'IT Ops',
  'Financial Analyst': 'Finance',
  'Procurement Executive': 'Finance',
  'Payroll Assistant': 'Finance',
  'Accounts Executive': 'Finance',
  'Associate Finance Executive': 'Finance',
  'Logistics Coordinator': 'Finance',
  'HR Assistant': 'HR',
  'HR Executive': 'HR',
  'Security Analyst': 'Security'
};

/** The joiner snapshot a seeded onboarding would have captured when it started. */
function seedJoiner(transition: TransitionSeed): JoinerSnapshot | undefined {
  if (transition.kind !== 'Onboarding') return undefined;
  const template = seedTemplates.find((item) => item.id === transition.templateId);
  if (!template) return undefined;
  return {
    jobTitle: transition.candidate.position,
    organizationUnit: SEED_UNIT_BY_JOB_TITLE[transition.candidate.position] ?? 'Engineering',
    employmentType: template.employmentType,
    client: template.client
  };
}

const ACCXIS = 'Accxis Holdings (Pvt) Ltd';
const ZENLANKA = 'Zenlanka Technologies';
const CEYLON_FIN = 'Ceylon Fin Services';
const SERENDIB = 'Serendib Logistics';

/** Completed offboardings across last year and this year, so every report has data to show. */
const leaverSeeds: LeaverSeed[] = [
{ id: 'tr18', name: ['Chamara', 'Dissanayake'], leaver: { jobTitle: 'Senior Software Engineer', organizationUnit: 'Engineering', employmentType: 'Permanent', client: ZENLANKA, joinedOn: '2020-03-02' }, type: 'Voluntary', reason: 'Better Employment Opportunity', exitDate: '2026-01-30', templateId: 'tpl5', managerId: 'u9' },
{ id: 'tr19', name: ['Hiruni', 'Rajapaksha'], leaver: { jobTitle: 'Financial Analyst', organizationUnit: 'Finance', employmentType: 'Permanent', client: CEYLON_FIN, joinedOn: '2023-04-17' }, type: 'Voluntary', reason: 'Further Education', exitDate: '2026-02-13', templateId: 'tpl5', managerId: 'u5' },
{ id: 'tr20', name: ['Kasun', 'Bandara'], leaver: { jobTitle: 'Systems Engineer', organizationUnit: 'IT Ops', employmentType: 'Contract', client: SERENDIB, joinedOn: '2024-02-05' }, type: 'Mutual', reason: 'Contract Non-Renewal', exitDate: '2026-02-27', templateId: 'tpl6', managerId: 'u2' },
{ id: 'tr21', name: ['Dilshan', 'Fernando'], leaver: { jobTitle: 'QA Engineer', organizationUnit: 'Engineering', employmentType: 'Permanent', client: ZENLANKA, joinedOn: '2022-08-08' }, type: 'Voluntary', reason: 'Better Employment Opportunity', exitDate: '2026-03-20', templateId: 'tpl5', managerId: 'u9' },
{ id: 'tr22', name: ['Tharushi', 'Weerasinghe'], leaver: { jobTitle: 'HR Executive', organizationUnit: 'HR', employmentType: 'Permanent', client: ACCXIS, joinedOn: '2021-11-01' }, type: 'Voluntary', reason: 'Relocation', exitDate: '2026-04-10', templateId: 'tpl5', managerId: 'u1' },
{ id: 'tr23', name: ['Ruwan', 'Kumara'], leaver: { jobTitle: 'Network Engineer', organizationUnit: 'IT Ops', employmentType: 'Permanent', client: ACCXIS, joinedOn: '2019-06-03' }, type: 'Involuntary', reason: 'Redundancy', exitDate: '2026-04-30', templateId: 'tpl5', managerId: 'u2' },
{ id: 'tr24', name: ['Amaya', 'Silva'], leaver: { jobTitle: 'Software Intern', organizationUnit: 'Engineering', employmentType: 'Internship', client: ZENLANKA, joinedOn: '2025-10-06' }, type: 'Mutual', reason: 'Mutual Agreement', exitDate: '2026-05-15', templateId: 'tpl7', managerId: 'u9' },
{ id: 'tr25', name: ['Gayan', 'Ekanayake'], leaver: { jobTitle: 'Senior Accountant', organizationUnit: 'Finance', employmentType: 'Permanent', client: ACCXIS, joinedOn: '2018-01-15' }, type: 'Voluntary', reason: 'Retirement', exitDate: '2026-05-29', templateId: 'tpl5', managerId: 'u5' },
{ id: 'tr26', name: ['Sanduni', 'Herath'], leaver: { jobTitle: 'Frontend Engineer', organizationUnit: 'Engineering', employmentType: 'Permanent', client: ZENLANKA, joinedOn: '2023-01-09' }, type: 'Voluntary', reason: 'Better Employment Opportunity', exitDate: '2026-07-17', templateId: 'tpl5', managerId: 'u9' },
{ id: 'tr27', name: ['Prasad', 'Wickramasinghe'], leaver: { jobTitle: 'Security Analyst', organizationUnit: 'Security', employmentType: 'Contract', client: SERENDIB, joinedOn: '2024-07-01' }, type: 'Involuntary', reason: 'Misconduct', exitDate: '2026-07-24', templateId: 'tpl6', managerId: 'u6' },
{ id: 'tr28', name: ['Madhavi', 'Jayasekara'], leaver: { jobTitle: 'Payroll Executive', organizationUnit: 'Finance', employmentType: 'Contract', client: CEYLON_FIN, joinedOn: '2023-09-11' }, type: 'Voluntary', reason: 'Compensation and Benefits', exitDate: '2026-08-14', templateId: 'tpl6', managerId: 'u5' },
{ id: 'tr29', name: ['Isuru', 'Rathnayake'], leaver: { jobTitle: 'DevOps Engineer', organizationUnit: 'IT Ops', employmentType: 'Permanent', client: ACCXIS, joinedOn: '2022-03-21' }, type: 'Voluntary', reason: 'Work-Life Balance', exitDate: '2026-08-28', templateId: 'tpl5', managerId: 'u2' },
{ id: 'tr30', name: ['Nadeesha', 'Perera'], leaver: { jobTitle: 'Solutions Consultant', organizationUnit: 'Engineering', employmentType: 'Consultant', client: SERENDIB, joinedOn: '2025-02-03' }, type: 'Involuntary', reason: 'Poor Performance', exitDate: '2026-09-04', templateId: 'tpl6', managerId: 'u1' },
{ id: 'tr31', name: ['Shehan', 'Gunasekara'], leaver: { jobTitle: 'Data Analyst', organizationUnit: 'Engineering', employmentType: 'Permanent', client: ZENLANKA, joinedOn: '2021-07-12' }, type: 'Voluntary', reason: 'Better Employment Opportunity', exitDate: '2025-06-27', templateId: 'tpl5', managerId: 'u4' },
{ id: 'tr32', name: ['Kumudu', 'Abeysekera'], leaver: { jobTitle: 'Accounts Executive', organizationUnit: 'Finance', employmentType: 'Permanent', client: ACCXIS, joinedOn: '2020-09-14' }, type: 'Voluntary', reason: 'Family Commitments', exitDate: '2025-10-31', templateId: 'tpl5', managerId: 'u5' },
{ id: 'tr33', name: ['Roshan', 'Peiris'], leaver: { jobTitle: 'IT Support Engineer', organizationUnit: 'IT Ops', employmentType: 'Contract', client: SERENDIB, joinedOn: '2023-03-06' }, type: 'Mutual', reason: 'Contract Non-Renewal', exitDate: '2025-12-19', templateId: 'tpl6', managerId: 'u2' }];

function compactSeed(seed: CompactSeed): TransitionSeed {
  const [firstName, lastName] = seed.name;
  const template = seedTemplates.find((t) => t.id === seed.templateId)!;
  const tasks = buildTasks(seed.templateId, seed.targetDate).map((task, index) => {
    const done = seed.completedTasks === 'all' || index < seed.completedTasks;
    if (done) return { ...task, status: 'Completed' as const };
    return seed.status === 'Cancelled' ? { ...task, status: 'Cancelled' as const } : task;
  });
  return {
    id: seed.id,
    kind: seed.kind,
    candidate: {
      firstName,
      lastName,
      personalEmail: `${firstName}.${lastName}@gmail.com`.toLowerCase(),
      mobile: '+94 77 000 0000',
      position: seed.position,
      hireDate: seed.targetDate,
      reportingManagerIds: seed.managerIds,
      country: 'Sri Lanka'
    },
    templateId: seed.templateId,
    templateName: template.name,
    status: seed.status,
    startedOn: seed.startedOn,
    targetDate: seed.targetDate,
    ownerIds: [...new Set(tasks.flatMap((task) => task.ownerIds))],
    tasks,
    emails: seed.emails ?? [],
    formStatus: seed.emails?.length ? 'Sent' : 'Not Sent',
    cancellation: seed.cancellation,
    portalCancellation: seed.portalCancellation,
    exit: seed.exit,
    leaver: seed.leaver,
    completedOn: seed.completedOn
  };
}

const compactSeeds: CompactSeed[] = [
{ id: 'tr7', kind: 'Onboarding', name: ['Sachini', 'Perera'], position: 'Frontend Engineer', templateId: 'tpl2', status: 'At Risk', startedOn: '2026-08-25', targetDate: '2026-09-12', completedTasks: 2, managerIds: ['u9'],
  emails: [
  {
    id: 'em13',
    subject: 'Please complete your employee form by 19 Sept 2026',
    recipient: 'sachini.perera@gmail.com',
    sentAt: '2026-09-05T10:15:00',
    content: 'form',
    formId: 'frm1',
    expiredAt: '2026-09-10T16:40:00'
  }],
  portalCancellation: { at: '2026-09-10T16:40:00', by: 'Nimal Perera' } },
{ id: 'tr8', kind: 'Onboarding', name: ['Dinuka', 'Herath'], position: 'Data Analyst', templateId: 'tpl2', status: 'On Track', startedOn: '2026-09-10', targetDate: '2026-10-01', completedTasks: 1, managerIds: ['u4'] },
{ id: 'tr9', kind: 'Offboarding', name: ['Kavindi', 'Samarasinghe'], position: 'Software Intern', templateId: 'tpl7', status: 'On Track', startedOn: '2026-09-09', targetDate: '2026-09-30', completedTasks: 1, managerIds: ['u9'] },
{ id: 'tr10', kind: 'Onboarding', name: ['Ravindu', 'Jayasuriya'], position: 'Solutions Consultant', templateId: 'tpl4', status: 'On Track', startedOn: '2026-09-11', targetDate: '2026-09-25', completedTasks: 2, managerIds: ['u1'] },
{ id: 'tr11', kind: 'Offboarding', name: ['Lahiru', 'Gamage'], position: 'Payroll Assistant', templateId: 'tpl5', status: 'At Risk', startedOn: '2026-08-20', targetDate: '2026-09-10', completedTasks: 3, managerIds: ['u5'] },
{ id: 'tr12', kind: 'Onboarding', name: ['Oshadi', 'Fonseka'], position: 'UX Designer', templateId: 'tpl1', status: 'Completed', startedOn: '2026-07-20', targetDate: '2026-08-04', completedTasks: 'all', managerIds: ['u4'], completedOn: '2026-08-07',
  emails: [
  {
    id: 'em14',
    subject: 'Please complete your employee form by 03 Aug 2026',
    recipient: 'oshadi.fonseka@gmail.com',
    sentAt: '2026-07-20T11:00:00',
    content: 'form',
    formId: 'frm1'
  }] },
{ id: 'tr13', kind: 'Offboarding', name: ['Nuwan', 'Karunaratne'], position: 'Network Engineer', templateId: 'tpl6', status: 'Completed', startedOn: '2026-07-01', targetDate: '2026-07-31', completedTasks: 'all', managerIds: ['u2'],
  exit: {
    employeeId: 'emp-tr13',
    type: 'Mutual',
    reason: 'Contract Non-Renewal',
    dates: { 'Last Working Date': '2026-07-31', 'Actual Exit Date': '2026-07-31' },
    documents: []
  },
  leaver: { jobTitle: 'Network Engineer', organizationUnit: 'IT Ops', employmentType: 'Contract', client: CEYLON_FIN, joinedOn: '2023-05-02' } },
{ id: 'tr14', kind: 'Onboarding', name: ['Ishani', 'Wijesekara'], position: 'Accounts Executive', templateId: 'tpl3', status: 'Completed', startedOn: '2026-08-03', targetDate: '2026-08-18', completedTasks: 'all', managerIds: ['u5'], completedOn: '2026-08-21' },
{ id: 'tr52', kind: 'Onboarding', name: ['Ishara', 'Kumari'], position: 'Accounts Executive', templateId: 'tpl3', status: 'Cancelled', startedOn: '2026-03-30', targetDate: '2026-04-13', completedTasks: 0, managerIds: ['u5'],
  cancellation: { date: '2026-04-02', reason: 'The candidate withdrew before the hire date for personal reasons.', cancelledBy: 'Nimal Perera', recordedAt: '2026-04-02T10:20:00' } },
{ id: 'tr15', kind: 'Onboarding', name: ['Supun', 'Abeywickrama'], position: 'Mobile Engineer', templateId: 'tpl2', status: 'Cancelled', startedOn: '2026-08-12', targetDate: '2026-09-01', completedTasks: 1, managerIds: ['u9'],
  cancellation: { date: '2026-08-21', reason: 'The candidate declined the offer after accepting a counter-offer from their current employer.', cancelledBy: 'Nimal Perera', recordedAt: '2026-08-21T11:40:00' } },
{ id: 'tr16', kind: 'Offboarding', name: ['Pavithra', 'Liyanage'], position: 'HR Assistant', templateId: 'tpl5', status: 'Cancelled', startedOn: '2026-08-18', targetDate: '2026-09-08', completedTasks: 2, managerIds: ['u1'],
  cancellation: { date: '2026-08-27', reason: 'Resignation withdrawn after a discussion with the reporting manager. Pavithra will continue in her current role.', cancelledBy: 'Dilani Jayawardena', recordedAt: '2026-08-27T15:05:00' },
  // Cancelled, so reports leave it out even though its Actual Exit Date falls in this year.
  exit: {
    employeeId: 'emp-tr16',
    type: 'Voluntary',
    reason: 'Personal Reasons',
    dates: { 'Resignation Effective Date': '2026-08-08', 'Last Working Date': '2026-09-08', 'Actual Exit Date': '2026-09-08' },
    documents: []
  },
  leaver: { jobTitle: 'HR Assistant', organizationUnit: 'HR', employmentType: 'Permanent', client: ACCXIS, joinedOn: '2024-01-08' } },
{ id: 'tr17', kind: 'Offboarding', name: ['Nethmi', 'Gunawardena'], position: 'Security Analyst', templateId: 'tpl5', status: 'Completed', startedOn: '2026-06-02', targetDate: '2026-06-30', completedTasks: 'all', managerIds: ['u6'],
  exit: {
    employeeId: 'emp8',
    type: 'Involuntary',
    reason: 'Redundancy',
    dates: { 'Resignation Effective Date': '2026-06-01', 'Payroll Cut-off Date': '2026-06-25', 'Last Working Date': '2026-06-30', 'Actual Exit Date': '2026-06-30' },
    documents: [
    { id: 'exd-tr17-1', name: 'Redundancy_Notice_Nethmi_Gunawardena.pdf', bytes: 301056 },
    { id: 'exd-tr17-2', name: 'Final_Settlement_Statement.docx', bytes: 88064 }]
  },
  leaver: { jobTitle: 'Security Analyst', organizationUnit: 'Security', employmentType: 'Contract', client: SERENDIB, joinedOn: '2022-06-15' } },
...leaverSeeds.map(completedLeaver),
...joinerSeeds.map(completedJoiner)];

const compactTransitions: TransitionSeed[] = compactSeeds.map(compactSeed);

function seedAudit(transition: TransitionSeed): AuditEntry[] {
  const entries: AuditEntry[] = [
  {
    id: `${transition.id}-au1`,
    action: 'Transition started',
    actor: peopleById[transition.ownerIds[0]]?.name ?? 'System',
    at: `${transition.startedOn}T09:00:00`,
    detail: transition.templateName
  }];

  const sender = peopleById[transition.ownerIds[0]]?.name ?? 'System';
  transition.emails.forEach((email) => {
    if (email.content !== 'form') return;
    const form = email.feedbackFormId ?
    undefined :
    seedForms.find((item) => item.id === (email.formId ?? transition.candidate.employeeFormId));
    const label = email.formName ? `${email.formCode} ${email.formName}` : form ? `${form.code} ${form.name}` : email.subject;
    entries.push({
      id: `${transition.id}-${email.id}-sent`,
      action: email.feedbackFormId ? 'Exit feedback form sent' : 'Form sent',
      actor: email.sentBy ?? sender,
      at: email.sentAt,
      detail: `${label} · ${email.recipient} · expires ${formatDate(
        addDays(email.sentAt, FORM_LINK_EXPIRY_DAYS)
      )}`
    });
  });
  (transition.emailEvents ?? []).forEach((event) => {
    const email = transition.emails.find((item) => item.id === event.emailId);
    const form = seedForms.find((item) => item.id === (email?.formId ?? transition.candidate.employeeFormId));
    entries.push({
      id: `${transition.id}-${event.id}`,
      action: 'Form revoked',
      actor: event.actor,
      at: event.at,
      detail: `${email?.formName ?? form?.name ?? email?.subject ?? 'Form'} · removed from the ${
      transition.kind === 'Onboarding' ? "candidate's" : "employee's"} portal`
    });
  });
  if (transition.portalCancellation) {
    const { at, by } = transition.portalCancellation;
    const expired = transition.emails.filter((email) => email.expiredAt);
    entries.push({
      id: `${transition.id}-portal-cancelled`,
      action: 'Portal access cancelled',
      actor: by,
      at,
      detail: `Portal closed · ${expired.length} open form${expired.length === 1 ? '' : 's'} expired`
    });
    expired.forEach((email) =>
    entries.push({
      id: `${transition.id}-${email.id}-expired`,
      action: 'Form expired',
      actor: by,
      at: email.expiredAt as string,
      detail: `${seedForms.find((form) => form.id === email.formId)?.name ?? email.subject} · expired when portal access was cancelled`
    })
    );
  }
  (transition.submissions ?? []).forEach((submission, index) => {
    const email = transition.emails.find((item) => item.id === submission.emailId);
    const answers = Object.values(submission.responses).filter((value) => value.trim()).length;
    entries.push({
      id: `${transition.id}-sub${index}`,
      action: email?.feedbackFormId ? 'Exit feedback form submitted' : 'Form submitted',
      actor: `${transition.candidate.firstName} ${transition.candidate.lastName}`,
      at: submission.submittedAt,
      detail: email?.feedbackFormId ?
      `${email.formName} · ${answers} answer${answers === 1 ? '' : 's'}` :
      seedForms.find((form) => form.id === submission.formId)?.name
    });
  });
  if (transition.cancellation) {
    entries.push({
      id: `${transition.id}-au2`,
      action: 'Transition cancelled',
      actor: transition.cancellation.cancelledBy,
      at: transition.cancellation.recordedAt,
      detail: `Cancellation date ${formatDate(transition.cancellation.date)} · ${transition.cancellation.reason}`
    });
  }
  return entries;
}

export const seedTransitions: Transition[] = [...baseTransitions, ...compactTransitions].map((transition, index) => ({
  ...transition,
  plannedCompletionDate: transition.plannedCompletionDate ?? transitionTargetDate(transition),
  joiner: transition.joiner ?? seedJoiner(transition),
  emailEvents: transition.emailEvents ?? [],
  submissions: transition.submissions ?? [],
  auditTrail: seedAudit(transition),
  emails: transition.emails.map((email) =>
  email.content === 'form' ?
  {
    ...email,
    // An exit feedback form names its form through feedbackFormId instead.
    formId: email.feedbackFormId ? undefined : email.formId ?? transition.candidate.employeeFormId,
    linkExpiresAt: addDays(email.sentAt, FORM_LINK_EXPIRY_DAYS),
    sentBy: email.sentBy ?? peopleById[transition.ownerIds[0]]?.name ?? 'System'
  } :
  email
  ),
  portalToken: `cnd-${((index + 1) * 48271).toString(16)}`,
  portalAccess: transition.portalCancellation ? 'Revoked' : 'Active',
  portalExpiresAt: addDays(`${transition.startedOn}T09:00:00`, 45)
}));