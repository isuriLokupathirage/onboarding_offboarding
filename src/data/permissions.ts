import type { OboPermission } from '../types';

/** Every Onboarding & Offboarding permission, with the system key where the stories name one. */
export const oboPermissionCatalogue: {permission: OboPermission;key?: string;}[] = [
{ permission: 'View All Transitions' },
{ permission: 'Manage Onboarding Transitions' },
{ permission: 'Manage Offboarding Transitions', key: 'obo.offboarding.transition.manage' },
{ permission: 'Update Task Progress', key: 'obo.task.progress' },
{ permission: 'View Restricted Tasks', key: 'obo.task.restricted' },
{ permission: 'View Templates', key: 'obo.template.view' },
{ permission: 'Manage Templates', key: 'obo.template.manage' },
{ permission: 'Manage Task Library', key: 'obo.task.manage' },
{ permission: 'View Employee Profiles', key: 'employee.view' },
{ permission: 'View Exit Feedback Forms', key: 'obo.feedback_form.view' },
{ permission: 'Manage Exit Feedback Forms', key: 'obo.feedback_form.manage' },
{ permission: 'View Reports', key: 'obo.report.view' },
{ permission: 'Send Exit Feedback Forms', key: 'template.exit_feedback_form.send' }];


export const ALL_OBO_PERMISSIONS: OboPermission[] = oboPermissionCatalogue.map((item) => item.permission);

/** Ready-made roles for trying the prototype. */
export const demoRoles: {name: string;description: string;permissions: OboPermission[];}[] = [
{
  name: 'HR Manager',
  description: 'Full access to transitions, templates and the task library',
  permissions: ALL_OBO_PERMISSIONS
},
{
  name: 'Onboarding Coordinator',
  description: 'Starts and manages onboarding transitions only',
  permissions: ['Manage Onboarding Transitions', 'Update Task Progress', 'View Templates']
},
{
  name: 'Offboarding Coordinator',
  description: 'Manages offboarding transitions but cannot send exit feedback forms',
  permissions: ['Manage Offboarding Transitions', 'Update Task Progress', 'View Templates', 'View Employee Profiles']
},
{
  name: 'Template Viewer',
  description: 'Can open templates and tasks but not change them',
  permissions: ['View All Transitions', 'View Templates', 'View Exit Feedback Forms']
},
{
  name: 'Task Library Manager',
  description: 'Manages tasks, including restricted ones, but not templates',
  permissions: ['View Templates', 'Manage Task Library', 'View Restricted Tasks']
},
{
  name: 'Task Owner',
  description: 'Only works on tasks assigned to them',
  permissions: ['Update Task Progress']
}];
