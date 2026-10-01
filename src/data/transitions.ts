import type { AuditEntry, Transition, TransitionCancellation, TransitionTask } from '../types';
import { peopleById } from './people';
import { seedTasks } from './tasks';
import { seedTemplates } from './templates';
import { seedForms } from './forms';
import { addDays } from '../utils/format';
import { FORM_LINK_EXPIRY_DAYS, toTransitionTask } from '../utils/transitions';

type TransitionSeed = Omit<
  Transition,
  'portalToken' | 'portalAccess' | 'portalExpiresAt' | 'emailEvents' | 'auditTrail' | 'submissions'> &
{
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
  daysRemaining: 5,
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
    t9: { status: 'In Progress', ownerIds: ['u5', 'u10', 'u1'] },
    t14: { dueDate: null, calculatedDueDate: null }
  }),
  emails: [
  {
    id: 'em0',
    subject: 'Welcome to Accxis Holdings — complete your Permanent Employee Onboarding Form',
    recipient: 'anushka.rajapaksha@gmail.com',
    sentAt: '2026-09-08T09:14:00',
    content: 'form',
    formId: 'frm1'
  },
  {
    id: 'em1',
    subject: 'Complete your Permanent Employee Onboarding Form',
    recipient: 'anushka.rajapaksha@gmail.com',
    sentAt: '2026-09-22T09:10:00',
    content: 'form',
    formId: 'frm1',
    draft: {
      savedAt: '2026-09-23T20:15:00',
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
    sentAt: '2026-09-23T14:02:00',
    content: 'reminder'
  },
  {
    id: 'em3',
    subject: 'Complete your Document Verification Form',
    recipient: 'anushka.rajapaksha@gmail.com',
    sentAt: '2026-09-24T11:30:00',
    content: 'form',
    formId: 'frm4'
  }],

  formStatus: 'In Progress',
  submissions: [
  {
    emailId: 'em3',
    formId: 'frm4',
    submittedAt: '2026-09-25T18:05:00',
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
  daysRemaining: 12,
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
    sentAt: '2026-09-26T09:10:00',
    content: 'form'
  },
  {
    id: 'em11',
    subject: 'Reminder — complete your employee data form',
    recipient: 'hiruni.dissa@gmail.com',
    sentAt: '2026-09-28T10:00:00',
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
  status: 'At Risk',
  startedOn: '2026-08-29',
  targetDate: '2026-09-18',
  daysRemaining: 2,
  ownerIds: ['u1', 'u5', 'u6'],
  tasks: buildTasks('tpl5', '2026-09-18', {
    t20: { status: 'Completed' },
    t21: { status: 'Completed' },
    t22: { status: 'Completed' },
    t23: { status: 'In Progress' },
    t24: { status: 'In Progress' },
    t26: { status: 'Completed' }
  }),
  emails: [],
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
  daysRemaining: 19,
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
    sentAt: '2026-09-25T09:05:00',
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
  daysRemaining: 26,
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
  daysRemaining: 1,
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
  daysRemaining: number;
  completedTasks: number | 'all';
  managerIds: string[];
  cancellation?: TransitionCancellation;
}

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
    daysRemaining: seed.daysRemaining,
    ownerIds: [...new Set(tasks.flatMap((task) => task.ownerIds))],
    tasks,
    emails: [],
    formStatus: 'Not Sent',
    cancellation: seed.cancellation
  };
}

const compactSeeds: CompactSeed[] = [
{ id: 'tr7', kind: 'Onboarding', name: ['Sachini', 'Perera'], position: 'Frontend Engineer', templateId: 'tpl2', status: 'At Risk', startedOn: '2026-08-25', targetDate: '2026-09-12', daysRemaining: -4, completedTasks: 2, managerIds: ['u9'] },
{ id: 'tr8', kind: 'Onboarding', name: ['Dinuka', 'Herath'], position: 'Data Analyst', templateId: 'tpl2', status: 'On Track', startedOn: '2026-09-10', targetDate: '2026-10-01', daysRemaining: 15, completedTasks: 1, managerIds: ['u4'] },
{ id: 'tr9', kind: 'Offboarding', name: ['Kavindi', 'Samarasinghe'], position: 'Software Intern', templateId: 'tpl7', status: 'On Track', startedOn: '2026-09-09', targetDate: '2026-09-30', daysRemaining: 14, completedTasks: 1, managerIds: ['u9'] },
{ id: 'tr10', kind: 'Onboarding', name: ['Ravindu', 'Jayasuriya'], position: 'Solutions Consultant', templateId: 'tpl4', status: 'On Track', startedOn: '2026-09-11', targetDate: '2026-09-25', daysRemaining: 9, completedTasks: 2, managerIds: ['u1'] },
{ id: 'tr11', kind: 'Offboarding', name: ['Lahiru', 'Gamage'], position: 'Payroll Assistant', templateId: 'tpl5', status: 'At Risk', startedOn: '2026-08-20', targetDate: '2026-09-10', daysRemaining: -6, completedTasks: 3, managerIds: ['u5'] },
{ id: 'tr12', kind: 'Onboarding', name: ['Oshadi', 'Fonseka'], position: 'UX Designer', templateId: 'tpl1', status: 'Completed', startedOn: '2026-07-20', targetDate: '2026-08-04', daysRemaining: 0, completedTasks: 'all', managerIds: ['u4'] },
{ id: 'tr13', kind: 'Offboarding', name: ['Nuwan', 'Karunaratne'], position: 'Network Engineer', templateId: 'tpl6', status: 'Completed', startedOn: '2026-07-01', targetDate: '2026-07-31', daysRemaining: 0, completedTasks: 'all', managerIds: ['u2'] },
{ id: 'tr14', kind: 'Onboarding', name: ['Ishani', 'Wijesekara'], position: 'Accounts Executive', templateId: 'tpl3', status: 'Completed', startedOn: '2026-08-03', targetDate: '2026-08-18', daysRemaining: 0, completedTasks: 'all', managerIds: ['u5'] },
{ id: 'tr15', kind: 'Onboarding', name: ['Supun', 'Abeywickrama'], position: 'Mobile Engineer', templateId: 'tpl2', status: 'Cancelled', startedOn: '2026-08-12', targetDate: '2026-09-01', daysRemaining: 0, completedTasks: 1, managerIds: ['u9'],
  cancellation: { date: '2026-08-21', reason: 'The candidate declined the offer after accepting a counter-offer from their current employer.', cancelledBy: 'Nimal Perera', recordedAt: '2026-08-21T11:40:00' } },
{ id: 'tr16', kind: 'Offboarding', name: ['Pavithra', 'Liyanage'], position: 'HR Assistant', templateId: 'tpl5', status: 'Cancelled', startedOn: '2026-08-18', targetDate: '2026-09-08', daysRemaining: 0, completedTasks: 2, managerIds: ['u1'],
  cancellation: { date: '2026-08-27', reason: 'Resignation withdrawn after a discussion with the reporting manager. Pavithra will continue in her current role.', cancelledBy: 'Dilani Jayawardena', recordedAt: '2026-08-27T15:05:00' } }];

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

  (transition.submissions ?? []).forEach((submission, index) => {
    entries.push({
      id: `${transition.id}-sub${index}`,
      action: 'Form submitted',
      actor: `${transition.candidate.firstName} ${transition.candidate.lastName}`,
      at: submission.submittedAt,
      detail: seedForms.find((form) => form.id === submission.formId)?.name
    });
  });
  if (transition.cancellation) {
    entries.push({
      id: `${transition.id}-au2`,
      action: 'Transition cancelled',
      actor: transition.cancellation.cancelledBy,
      at: transition.cancellation.recordedAt,
      detail: transition.cancellation.reason
    });
  }
  return entries;
}

const portalAccessOverrides: Record<string, Transition['portalAccess']> = {
  tr5: 'Revoked'
};

export const seedTransitions: Transition[] = [...baseTransitions, ...compactTransitions].map((transition, index) => ({
  ...transition,
  emailEvents: transition.emailEvents ?? [],
  submissions: transition.submissions ?? [],
  auditTrail: seedAudit(transition),
  emails: transition.emails.map((email) =>
  email.content === 'form' ?
  {
    ...email,
    formId: email.formId ?? transition.candidate.employeeFormId,
    linkExpiresAt: addDays(email.sentAt, FORM_LINK_EXPIRY_DAYS)
  } :
  email
  ),
  portalToken: `cnd-${((index + 1) * 48271).toString(16)}`,
  portalAccess: portalAccessOverrides[transition.id] ?? 'Active',
  portalExpiresAt: addDays(`${transition.startedOn}T09:00:00`, 45)
}));