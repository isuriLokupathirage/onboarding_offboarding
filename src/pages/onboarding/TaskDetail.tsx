import React, { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { CornerDownRightIcon, LockIcon, PencilIcon } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { NoAccess } from '../../components/layout/AccessGate';
import { Button } from '../../components/ui/Button';
import { Badge, DepartmentChip, PriorityBadge } from '../../components/ui/Badge';
import { AvatarGroup } from '../../components/ui/Avatar';
import { Menu } from '../../components/ui/Menu';
import { Tooltip } from '../../components/ui/Tooltip';
import { Toast } from '../../components/ui/Toast';
import { TaskFiles } from '../../components/tasks/TaskFiles';
import { DeleteTasksDialog } from '../../components/onboarding/DeleteTasksDialog';
import { useAppData } from '../../contexts/AppDataContext';
import { peopleById } from '../../data/people';
import { formatDueRule } from '../../utils/format';
import { TASK_PERMISSION_NOTE, taskUsage, taskUsageLabel } from '../../utils/library';
import type { TemplatesScreenState } from './TaskTemplates';

/** Everything captured when the task was created, read-only. */
export function TaskDetail() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { tasks, templates, transitions, hasOboPermission } = useAppData();
  const [deleting, setDeleting] = useState(false);
  const { notice: arrivedNotice, ...returned } = (location.state ?? {}) as TemplatesScreenState;
  const [notice, setNotice] = useState<string | null>(arrivedNotice ?? null);

  const task = tasks.find((item) => item.id === taskId);
  const backState: TemplatesScreenState = { kind: task?.kind, view: 'tasks', ...returned };

  if (!task) {
    return (
      <NoAccess
        title="Task not found"
        description="This task may have been deleted from the task library." />);


  }
  // Edit and Delete follow the same permission rules as the task list.
  const canManage = hasOboPermission('Manage Task Library');
  if (task.ownerOnlyVisible && !hasOboPermission('View Restricted Tasks')) {
    return (
      <NoAccess
        title="This task is restricted"
        description="Only users with the View Restricted Tasks permission can open restricted tasks." />);


  }

  const usage = taskUsage(task.id, templates, transitions);
  const parent = tasks.find((item) => item.id === task.parentId);
  const children = tasks.filter((item) => item.parentId === task.id);
  const owners = task.ownerIds.map((id) => peopleById[id]?.name ?? 'Unknown');
  const editTo = `/onboarding/templates/tasks/${task.id}/edit`;

  const editButton =
  <Button variant="primary" disabled={!canManage} onClick={() => navigate(editTo, { state: backState })}>
      <PencilIcon className="h-4 w-4" />
      Edit
    </Button>;


  return (
    <div>
      <PageHeader
        title={task.name}
        breadcrumb={[
        { label: 'Onboarding & Offboarding', to: '/onboarding/dashboard' },
        { label: 'Templates', to: `/onboarding/templates?kind=${task.kind}&view=templates` },
        { label: 'Tasks', to: `/onboarding/templates?kind=${task.kind}&view=tasks` },
        { label: task.name }]
        }
        actions={
        <>
            {canManage ? editButton : <Tooltip label={TASK_PERMISSION_NOTE}><span>{editButton}</span></Tooltip>}
            <Menu
            label={`Actions for ${task.name}`}
            items={[
            {
              label: 'Delete task',
              danger: true,
              disabled: !canManage || usage.inUse,
              hint: !canManage ? TASK_PERMISSION_NOTE : `${taskUsageLabel(usage)}, so it cannot be deleted`,
              onSelect: () => setDeleting(true)
            }]
            } />

          </>
        } />


      <div className="px-8 py-6">
        <div className="max-w-3xl space-y-5">
          <section className="rounded-xl border border-line bg-white p-6 shadow-card">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[12px] font-medium text-subtle">{task.code}</span>
              <Badge>{task.kind}</Badge>
              {task.optional && <Badge className="bg-slate-50 text-slate-600 ring-slate-200">Optional</Badge>}
              {task.ownerOnlyVisible &&
              <Badge className="bg-violet-50 text-violet-700 ring-violet-200">
                  <LockIcon className="h-3 w-3" />
                  Restricted
                </Badge>
              }
              <Badge
                className={
                usage.inUse ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-slate-50 text-muted ring-line'
                }>

                {taskUsageLabel(usage)}
              </Badge>
            </div>
            <h2 className="mt-3 text-base font-semibold text-ink">{task.name}</h2>
            <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-muted">{task.description}</p>

            <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-4 border-t border-line pt-5 sm:grid-cols-2">
              <Detail label="Department">
                <DepartmentChip department={task.department} />
              </Detail>
              <Detail label="Priority">
                <PriorityBadge priority={task.priority} />
              </Detail>
              <Detail label="Due date">{formatDueRule(task.dueRule)}</Detail>
              <Detail label="Optional task">{task.optional ? 'Yes' : 'No'}</Detail>
              <Detail label="Show in candidate's events">{task.showInCandidateEvents ? 'Yes' : 'No'}</Detail>
              <Detail label="Assignment notifications">{task.notifyOnAssignment}</Detail>
              <Detail label="Visibility">
                {task.ownerOnlyVisible ? 'Visible only to task owner and admins' : 'Everyone on the transition'}
              </Detail>
              <Detail label="Default owners">
                {owners.length ? <AvatarGroup names={owners} size="xs" /> : 'Picked when a transition starts'}
              </Detail>
            </dl>
          </section>

          <section className="rounded-xl border border-line bg-white p-6 shadow-card">
            <h3 className="text-sm font-semibold text-ink">Task dependencies</h3>
            <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <Detail label="Parent task">
                {parent ?
                <Link
                  to={`/onboarding/templates/tasks/${parent.id}`}
                  state={backState}
                  className="text-brand-600 hover:underline">

                    {parent.code} — {parent.name}
                  </Link> :

                'No parent task'
                }
              </Detail>
              <Detail label="Parent task completion is required">
                {parent ? task.parentCompletionRequired ? 'Yes' : 'No' : '—'}
              </Detail>
            </dl>
            {children.length > 0 &&
            <div className="mt-4">
                <p className="text-[11px] uppercase tracking-wide text-subtle">Child tasks</p>
                <ul className="mt-1.5 space-y-1">
                  {children.map((child) =>
                <li key={child.id} className="flex items-center gap-2 text-[13px]">
                      <CornerDownRightIcon className="h-3.5 w-3.5 text-subtle" />
                      <Link
                    to={`/onboarding/templates/tasks/${child.id}`}
                    state={backState}
                    className="text-ink hover:text-brand-600 hover:underline">

                        {child.code} — {child.name}
                      </Link>
                    </li>
                )}
                </ul>
              </div>
            }
          </section>

          <section className="rounded-xl border border-line bg-white p-6 shadow-card">
            <h3 className="text-sm font-semibold text-ink">Attached files</h3>
            <TaskFiles files={task.files} taskName={task.name} downloadable />
          </section>

          {usage.templates.length > 0 &&
          <section className="rounded-xl border border-line bg-white p-6 shadow-card">
              <h3 className="text-sm font-semibold text-ink">Used in templates</h3>
              <ul className="mt-2 divide-y divide-line">
                {usage.templates.map((template) =>
              <li key={template.id} className="flex items-center gap-3 py-2 text-[13px]">
                    <span className="font-mono text-[11px] text-subtle">{template.code}</span>
                    <Link
                  to={`/onboarding/templates/${template.id}`}
                  className="flex-1 text-ink hover:text-brand-600 hover:underline">

                      {template.name}
                    </Link>
                    <span className="text-muted">{template.client}</span>
                  </li>
              )}
              </ul>
            </section>
          }
        </div>
      </div>

      <DeleteTasksDialog
        taskIds={deleting ? [task.id] : null}
        bulk={false}
        onCancel={() => setDeleting(false)}
        onDeleted={(message) =>
        navigate('/onboarding/templates', { state: { ...backState, notice: message } })
        } />

      <Toast message={notice} onClose={() => setNotice(null)} />
    </div>);

}

function Detail({ label, children }: {label: string;children: React.ReactNode;}) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-subtle">{label}</dt>
      <dd className="mt-1 text-[13px] text-ink">{children}</dd>
    </div>);

}
