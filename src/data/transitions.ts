import type { Transition, TransitionTask } from '../types';
import { seedTasks } from './tasks';
import { seedTemplates } from './templates';
import { addDays } from '../utils/format';

type TransitionSeed = Omit<Transition, 'portalToken' | 'portalAccess' | 'portalExpiresAt'>;

function buildTasks(
templateId: string,
hireDate: string,
overrides: Partial<Record<string, Partial<TransitionTask>>> = {})
: TransitionTask[] {
  const template = seedTemplates.find((t) => t.id === templateId);
  if (!template) return [];
  return template.taskIds.map((taskId, index) => {
    const task = seedTasks.find((t) => t.id === taskId)!;
    const dueDate = shiftDate(hireDate, index);
    const base: TransitionTask = {
      id: `${templateId}-${taskId}`,
      taskId,
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
      status: 'Not Started'
    };
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
    t5: { status: 'Not Started' },
    t6: { status: 'Not Started' },
    t7: { status: 'Completed' },
    t8: { status: 'Not Started' },
    t9: { status: 'In Progress' },
    t14: { dueDate: null, calculatedDueDate: null }
  }),
  emails: [
  {
    id: 'em1',
    subject: 'Welcome to Accxis Holdings — complete your employee data form',
    recipient: 'anushka.rajapaksha@gmail.com',
    sentAt: '08 Sep 2026, 09:14',
    status: 'Opened'
  },
  {
    id: 'em2',
    subject: 'Document upload reminder',
    recipient: 'anushka.rajapaksha@gmail.com',
    sentAt: '11 Sep 2026, 14:02',
    status: 'Delivered'
  },
  {
    id: 'em3',
    subject: 'First day schedule and office directions',
    recipient: 'anushka.rajapaksha@gmail.com',
    sentAt: '15 Sep 2026, 08:30',
    status: 'Delivered'
  }],

  formStatus: 'In Progress'
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
    t2: { status: 'In Progress' }
  }),
  emails: [
  {
    id: 'em4',
    subject: 'Welcome to Accxis Holdings — complete your employee data form',
    recipient: 'hiruni.dissa@gmail.com',
    sentAt: '12 Sep 2026, 10:41',
    status: 'Delivered'
  }],

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
  emails: [
  {
    id: 'em5',
    subject: 'Exit interview schedule confirmation',
    recipient: 'malith.sena@gmail.com',
    sentAt: '02 Sep 2026, 11:20',
    status: 'Opened'
  },
  {
    id: 'em6',
    subject: 'Asset return checklist',
    recipient: 'malith.sena@gmail.com',
    sentAt: '09 Sep 2026, 16:45',
    status: 'Revoked'
  }],

  formStatus: 'Submitted'
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
  tasks: buildTasks('tpl2', '2026-10-05', { t2: { status: 'In Progress' } }),
  emails: [
  {
    id: 'em7',
    subject: 'Internship onboarding — next steps',
    recipient: 'tharindu.alwis@gmail.com',
    sentAt: '15 Sep 2026, 09:05',
    status: 'Delivered'
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
    subject: 'Welcome aboard — your first week plan',
    recipient: 'chamod.weera@gmail.com',
    sentAt: '31 Aug 2026, 13:10',
    status: 'Opened'
  }],

  formStatus: 'Submitted'
}];


const portalAccessOverrides: Record<string, Transition['portalAccess']> = {
  tr5: 'Revoked'
};

export const seedTransitions: Transition[] = baseTransitions.map((transition, index) => ({
  ...transition,
  portalToken: `cnd-${((index + 1) * 48271).toString(16)}`,
  portalAccess: portalAccessOverrides[transition.id] ?? 'Active',
  portalExpiresAt: addDays(`${transition.startedOn}T09:00:00`, 45)
}));