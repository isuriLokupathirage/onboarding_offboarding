import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { CornerDownRightIcon, LockIcon, PencilIcon, UsersIcon } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { NoAccess } from '../../components/layout/AccessGate';
import { Button } from '../../components/ui/Button';
import { Badge, DepartmentChip, PriorityBadge } from '../../components/ui/Badge';
import { Menu } from '../../components/ui/Menu';
import { Tooltip } from '../../components/ui/Tooltip';
import { Toast } from '../../components/ui/Toast';
import { DeleteTemplatesDialog } from '../../components/onboarding/DeleteTemplatesDialog';
import { useAppData } from '../../contexts/AppDataContext';
import type { Task } from '../../types';
import { formatDueRule } from '../../utils/format';
import {
  RESTRICTED_PERMISSION_NOTE,
  TEMPLATE_PERMISSION_NOTE,
  templatePhases,
  templateTransitions } from
'../../utils/library';
import type { TemplatesScreenState } from './TaskTemplates';

/** A template's details, with its tasks grouped into phases by when they fall due. */
export function TemplateDetail() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { tasks, templates, transitions, hasOboPermission, addTemplate, nextTemplateCode } = useAppData();
  const { notice: arrivedNotice, ...returned } = (location.state ?? {}) as TemplatesScreenState;
  const [notice, setNotice] = useState<string | null>(arrivedNotice ?? null);
  const [deleting, setDeleting] = useState(false);

  const template = templates.find((item) => item.id === templateId);
  const templateTasks = useMemo(
    () =>
    template ?
    template.taskIds.
    map((id) => tasks.find((task) => task.id === id)).
    filter((task): task is Task => Boolean(task)) :
    [],
    [template, tasks]
  );
  const phases = useMemo(() => templatePhases(templateTasks), [templateTasks]);

  if (!template) {
    return <NoAccess title="Template not found" description="This template may have been deleted." />;
  }

  const canManage = hasOboPermission('Manage Templates');
  const canSeeRestricted = hasOboPermission('View Restricted Tasks');
  const used = templateTransitions(template.id, transitions).length;
  const backState: TemplatesScreenState = { kind: template.kind, view: 'templates', ...returned };
  const listUrl = `/onboarding/templates?kind=${template.kind}&view=templates`;

  const duplicate = () => {
    const id = `tpl-${Date.now()}`;
    const code = nextTemplateCode(template.kind);
    addTemplate({ ...template, id, code, name: `${template.name} (Copy)`, taskIds: [...template.taskIds] });
    navigate(`/onboarding/templates/${id}`, {
      state: { ...backState, notice: `"${template.name}" was duplicated as ${code}.` }
    });
  };

  const editButton =
  <Button
    variant="primary"
    disabled={!canManage}
    onClick={() => navigate(`/onboarding/templates/${template.id}/edit`, { state: backState })}>

      <PencilIcon className="h-4 w-4" />
      Edit
    </Button>;


  return (
    <div>
      <PageHeader
        title={template.name}
        breadcrumb={[
        { label: 'Onboarding & Offboarding', to: '/onboarding/dashboard' },
        { label: 'Templates', to: listUrl },
        { label: template.name }]
        }
        actions={
        <>
            {canManage ? editButton : <Tooltip label={TEMPLATE_PERMISSION_NOTE}><span>{editButton}</span></Tooltip>}
            <Menu
            label={`Actions for ${template.name}`}
            items={[
            { label: 'Duplicate', disabled: !canManage, hint: TEMPLATE_PERMISSION_NOTE, onSelect: duplicate },
            {
              label: 'Delete',
              danger: true,
              disabled: !canManage || used > 0,
              hint: !canManage ?
              TEMPLATE_PERMISSION_NOTE :
              `Used by ${used} transition${used === 1 ? '' : 's'}, so it cannot be deleted`,
              onSelect: () => setDeleting(true)
            }]
            } />

          </>
        } />


      <div className="px-8 py-6">
        <div className="max-w-4xl space-y-5">
          <section className="rounded-xl border border-line bg-white p-6 shadow-card">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[12px] font-medium text-subtle">{template.code}</span>
              <Badge>{template.kind}</Badge>
              <Badge
                className={used > 0 ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-slate-50 text-muted ring-line'}>

                <UsersIcon className="h-3 w-3" />
                {used > 0 ? `Used by ${used} transition${used === 1 ? '' : 's'}` : 'Not used by any transition'}
              </Badge>
            </div>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
              <Detail label="Template name">{template.name}</Detail>
              <Detail label="Client">{template.client}</Detail>
              <Detail label="Employment type">{template.employmentType}</Detail>
              <Detail label="Task count">{template.taskIds.length}</Detail>
            </dl>
          </section>

          {phases.length === 0 ?
          <p className="rounded-xl border border-dashed border-line bg-white px-4 py-10 text-center text-[13px] text-muted">
              This template has no tasks.
            </p> :

          phases.map((phase) =>
          <section key={phase.label} className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
                <header className="flex items-center gap-2 border-b border-line bg-slate-50/70 px-5 py-2.5">
                  <h2 className="text-[13px] font-semibold text-ink">{phase.label}</h2>
                  <Badge>
                    {phase.tasks.length} task{phase.tasks.length === 1 ? '' : 's'}
                  </Badge>
                </header>
                <ul className="divide-y divide-line">
                  {phase.tasks.map((task) => {
                const restricted = task.ownerOnlyVisible && !canSeeRestricted;
                const isChild = Boolean(task.parentId && template.taskIds.includes(task.parentId));
                return (
                  <li key={task.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                        {isChild && <CornerDownRightIcon className="h-3.5 w-3.5 text-subtle" />}
                        <span className="font-mono text-[11px] text-subtle">{task.code}</span>
                        {restricted ?
                    <span className="flex-1 text-[13px] text-ink" title={RESTRICTED_PERMISSION_NOTE}>
                            {task.name}
                          </span> :

                    <Link
                      to={`/onboarding/templates/tasks/${task.id}`}
                      state={{ kind: task.kind, view: 'tasks' }}
                      className="flex-1 text-[13px] font-medium text-ink hover:text-brand-600 hover:underline">

                            {task.name}
                          </Link>
                    }
                        {task.optional && <Badge className="bg-slate-50 text-slate-600 ring-slate-200">Optional</Badge>}
                        {task.ownerOnlyVisible &&
                    <Badge className="bg-violet-50 text-violet-700 ring-violet-200">
                            <LockIcon className="h-3 w-3" />
                            Restricted
                          </Badge>
                    }
                        <DepartmentChip department={task.department} />
                        <PriorityBadge priority={task.priority} />
                        <span className="w-52 text-right text-[12px] text-muted">{formatDueRule(task.dueRule)}</span>
                      </li>);

              })}
                </ul>
              </section>
          )
          }
        </div>
      </div>

      <DeleteTemplatesDialog
        templateIds={deleting ? [template.id] : null}
        bulk={false}
        onCancel={() => setDeleting(false)}
        onDeleted={(message) => navigate('/onboarding/templates', { state: { ...backState, notice: message } })} />

      <Toast message={notice} onClose={() => setNotice(null)} />
    </div>);

}

function Detail({ label, children }: {label: string;children: React.ReactNode;}) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-subtle">{label}</dt>
      <dd className="mt-0.5 text-[13px] text-ink">{children}</dd>
    </div>);

}
