import type { OboPermission } from '../types';

/** Every Onboarding & Offboarding permission, with the system key where the stories name one. */
export const oboPermissionCatalogue: {permission: OboPermission;key?: string;}[] = [
{ permission: 'View All Transitions' },
{ permission: 'Manage Onboarding Transitions' },
{ permission: 'Manage Offboarding Transitions' },
{ permission: 'Update Task Progress' },
{ permission: 'View Restricted Tasks', key: 'obo.task.restricted' },
{ permission: 'View Templates', key: 'obo.template.view' },
{ permission: 'Manage Templates', key: 'obo.template.manage' },
{ permission: 'Manage Task Library', key: 'obo.task.manage' }];


export const ALL_OBO_PERMISSIONS: OboPermission[] = oboPermissionCatalogue.map((item) => item.permission);

/** Ready-made roles for trying the prototype. */
export const demoRoles: {name: string;description: string;permissions: OboPermission[];}[] = [
{
  name: 'HR Manager',
  description: 'Full access to transitions, templates and the task library',
  permissions: ALL_OBO_PERMISSIONS
},
{
  name: 'Template Viewer',
  description: 'Can open templates and tasks but not change them',
  permissions: ['View All Transitions', 'View Templates']
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
