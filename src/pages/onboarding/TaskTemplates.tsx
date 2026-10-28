import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useScreenInit } from '../../useScreenInit.js';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  LayoutTemplateIcon,
  ListChecksIcon,
  PlusIcon,
  RefreshCwIcon,
  Trash2Icon,
  XIcon } from
'lucide-react';
import { twMerge } from 'tailwind-merge';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Segmented } from '../../components/ui/Segmented';
import { SearchInput } from '../../components/ui/SearchInput';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { Menu } from '../../components/ui/Menu';
import { Tooltip } from '../../components/ui/Tooltip';
import { Toast } from '../../components/ui/Toast';
import { TaskCard } from '../../components/onboarding/TaskCard';
import { DeleteTasksDialog } from '../../components/onboarding/DeleteTasksDialog';
import { DeleteTemplatesDialog } from '../../components/onboarding/DeleteTemplatesDialog';
import { useAppData } from '../../contexts/AppDataContext';
import type { Template, TransitionKind } from '../../types';
import { sortWithChildren } from '../../utils/format';
import {
  TASK_PERMISSION_NOTE,
  TEMPLATE_PERMISSION_NOTE,
  taskUsage,
  taskUsageLabel,
  templateTransitions } from
'../../utils/library';

export type TemplatesView = 'templates' | 'tasks';

/** What the Templates screen remembers when another screen sends the user back to it. */
export interface TemplatesScreenState {
  kind?: TransitionKind;
  view?: TemplatesView;
  notice?: string;
}

const PAGE_SIZE = 10;

export function TaskTemplates() {
  const navigate = useNavigate();
  const location = useLocation();
  const returned = (location.state ?? {}) as TemplatesScreenState;
  // Breadcrumb links can name the toggles in the address, for example ?view=tasks.
  const [searchParams] = useSearchParams();
  const linkedKind = searchParams.get('kind');
  const linkedView = searchParams.get('view');
  const {
    tasks,
    templates,
    transitions,
    hasOboPermission,
    addTemplate,
    nextTemplateCode,
    addTask,
    nextTaskCode
  } = useAppData();
  const screenInit = useScreenInit();
  const canManageTemplates = hasOboPermission('Manage Templates');
  const canManageTasks = hasOboPermission('Manage Task Library');
  const canSeeRestricted = hasOboPermission('View Restricted Tasks');

  // Onboarding and Templates are selected by default.
  const [kind, setKind] = useState<TransitionKind>(
    returned.kind ??
    (linkedKind === 'Onboarding' || linkedKind === 'Offboarding' ? linkedKind : undefined) ??
    (screenInit.kind as TransitionKind) ??
    'Onboarding'
  );
  const [view, setView] = useState<TemplatesView>(
    returned.view ??
    (linkedView === 'tasks' || linkedView === 'templates' ? linkedView : undefined) ??
    (screenInit.view as TemplatesView) ??
    'templates'
  );
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [deletingTasks, setDeletingTasks] = useState<{ids: string[];bulk: boolean;} | null>(null);
  const [deletingTemplates, setDeletingTemplates] = useState<{ids: string[];bulk: boolean;} | null>(null);
  const [notice, setNotice] = useState<string | null>(returned.notice ?? null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState(() => new Date());

  // A notice handed over by another screen is shown once, not again on reload.
  useEffect(() => {
    if (returned.notice) navigate(location.pathname, { replace: true, state: { kind, view } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => setPage(1), [kind, view, query]);

  useEffect(() => {
    if (!refreshing) return undefined;
    const timer = setTimeout(() => {
      setRefreshing(false);
      setRefreshedAt(new Date());
    }, 600);
    return () => clearTimeout(timer);
  }, [refreshing]);

  const kindTasks = useMemo(() => tasks.filter((task) => task.kind === kind), [tasks, kind]);
  const kindTemplates = useMemo(() => templates.filter((t) => t.kind === kind), [templates, kind]);

  const visibleTasks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matched = needle ?
    kindTasks.filter(
      (task) =>
      task.name.toLowerCase().includes(needle) ||
      task.code.toLowerCase().includes(needle) ||
      task.department.toLowerCase().includes(needle)
    ) :
    kindTasks;
    return sortWithChildren(matched);
  }, [kindTasks, query]);

  const visibleTemplates = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return kindTemplates;
    return kindTemplates.filter(
      (template) =>
      template.name.toLowerCase().includes(needle) ||
      template.code.toLowerCase().includes(needle) ||
      template.client.toLowerCase().includes(needle) ||
      template.employmentType.toLowerCase().includes(needle)
    );
  }, [kindTemplates, query]);

  const pageCount = Math.max(1, Math.ceil(visibleTemplates.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageTemplates = visibleTemplates.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const taskUsageById = useMemo(
    () => new Map(kindTasks.map((task) => [task.id, taskUsage(task.id, templates, transitions)])),
    [kindTasks, templates, transitions]
  );

  const tasksSelectable = canManageTasks || canManageTemplates;
  const selectedIds = view === 'tasks' ? selectedTasks : selectedTemplates;
  // "Visible" means every record the list currently shows (the current page for templates).
  const visibleIds =
  view === 'tasks' ? visibleTasks.map((task) => task.id) : pageTemplates.map((template) => template.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const someSelected = !allSelected && visibleIds.some((id) => selectedIds.includes(id));

  const toggleAll = () => {
    const setter = view === 'tasks' ? setSelectedTasks : setSelectedTemplates;
    setter((prev) =>
    allSelected ? prev.filter((id) => !visibleIds.includes(id)) : Array.from(new Set([...prev, ...visibleIds]))
    );
  };

  const toggleTask = (id: string) =>
  setSelectedTasks((prev) => prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]);
  const toggleTemplate = (id: string) =>
  setSelectedTemplates((prev) => prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]);

  const backState: TemplatesScreenState = { kind, view };
  const openTemplate = (id: string) => navigate(`/onboarding/templates/${id}`, { state: backState });
  const openTask = (id: string) => navigate(`/onboarding/templates/tasks/${id}`, { state: backState });

  const duplicateTemplate = (template: Template) => {
    const code = nextTemplateCode(template.kind);
    addTemplate({
      ...template,
      id: `tpl-${Date.now()}`,
      code,
      name: `${template.name} (Copy)`,
      taskIds: [...template.taskIds]
    });
    setNotice(`"${template.name}" was duplicated as ${code}.`);
  };

  const duplicateTask = (id: string) => {
    const source = tasks.find((task) => task.id === id);
    if (!source) return;
    const code = nextTaskCode(source.kind);
    addTask({
      ...source,
      id: `task-${Date.now()}`,
      code,
      name: `${source.name} (Copy)`,
      files: source.files.map((file) => ({ ...file }))
    });
    setNotice(`"${source.name}" was duplicated as ${code}.`);
  };

  const countFor = (target: TransitionKind) =>
  view === 'tasks' ?
  tasks.filter((task) => task.kind === target).length :
  templates.filter((template) => template.kind === target).length;

  const canCreate = view === 'tasks' ? canManageTasks : canManageTemplates;
  const createButton =
  <Button
    variant="primary"
    disabled={!canCreate}
    onClick={() =>
    navigate(
      view === 'tasks' ? '/onboarding/templates/new-task' : '/onboarding/templates/new-template',
      { state: { kind } }
    )
    }>

      <PlusIcon className="h-4 w-4" />
      {view === 'tasks' ? 'New Task' : 'New Template'}
    </Button>;


  const selectAllBox = (label: string) =>
  <input
    type="checkbox"
    checked={allSelected}
    ref={(element) => {
      if (element) element.indeterminate = someSelected;
    }}
    onChange={toggleAll}
    aria-label={label}
    className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-200" />;



  return (
    <div className="pb-24">
      <PageHeader
        title="Templates"
        breadcrumb={[{ label: 'Onboarding & Offboarding', to: '/onboarding/dashboard' }, { label: 'Templates' }]} />


      <div className="px-8 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Segmented
              options={[
              { value: 'Onboarding', label: 'Onboarding', count: countFor('Onboarding') },
              { value: 'Offboarding', label: 'Offboarding', count: countFor('Offboarding') }]
              }
              value={kind}
              onChange={(next) => {
                setKind(next);
                // Selection never carries across transition types.
                setSelectedTasks([]);
                setSelectedTemplates([]);
              }} />

            <Segmented
              options={[
              { value: 'templates', label: 'Templates', count: kindTemplates.length },
              { value: 'tasks', label: 'Tasks', count: kindTasks.length }]
              }
              value={view}
              onChange={(next) => setView(next)} />

          </div>

          <div className="flex items-center gap-2">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder={view === 'tasks' ? 'Search tasks' : 'Search templates'}
              className="w-64" />

            <Tooltip
              label={`Refresh · updated ${refreshedAt.toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit'
              })}`}>

              <Button aria-label="Refresh list" onClick={() => setRefreshing(true)} disabled={refreshing}>
                <RefreshCwIcon className={twMerge('h-4 w-4', refreshing && 'animate-spin')} />
              </Button>
            </Tooltip>
            {canCreate ?
            createButton :

            <Tooltip label={view === 'tasks' ? TASK_PERMISSION_NOTE : TEMPLATE_PERMISSION_NOTE}>
                <span>{createButton}</span>
              </Tooltip>
            }
          </div>
        </div>

        {view === 'templates' && !canManageTemplates &&
        <div className="mt-4 rounded-lg bg-sky-50 px-3.5 py-3 text-[13px] text-sky-900 ring-1 ring-inset ring-sky-200">
            You have View Templates access. You can open and review templates, but creating, editing,
            duplicating and deleting are unavailable.
          </div>
        }

        {view === 'tasks' ?
        <div className="mt-5">
            {tasksSelectable && visibleTasks.length > 0 && !refreshing &&
          <label className="mb-2 inline-flex cursor-pointer items-center gap-2 px-1 text-[12px] font-medium text-muted">
                {selectAllBox('Select all tasks')}
                Select all
              </label>
          }
            <div className="space-y-2">
              {refreshing ?
            <LoadingRows /> :
            visibleTasks.length === 0 ?
            <EmptyState
              icon={ListChecksIcon}
              title={query ? 'No tasks match your search' : `No ${kind.toLowerCase()} tasks yet`}
              description={query ? 'Try a different task name, code or department.' : undefined} /> :


            visibleTasks.map((task) => {
              const usage = taskUsageById.get(task.id);
              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  selected={selectedTasks.includes(task.id)}
                  onToggle={toggleTask}
                  selectable={tasksSelectable}
                  isChild={Boolean(task.parentId && visibleTasks.some((t) => t.id === task.parentId))}
                  canOpen={!task.ownerOnlyVisible || canSeeRestricted}
                  canManage={canManageTasks}
                  inUseNote={usage?.inUse ? taskUsageLabel(usage) : undefined}
                  onOpen={openTask}
                  onEdit={(id) => navigate(`/onboarding/templates/tasks/${id}/edit`, { state: backState })}
                  onDuplicate={duplicateTask}
                  onAddChild={(id) =>
                  navigate('/onboarding/templates/new-task', { state: { ...backState, parentId: id } })
                  }
                  onDelete={(id) => setDeletingTasks({ ids: [id], bulk: false })} />);


            })
            }
            </div>
          </div> :

        <div className="mt-5 overflow-hidden rounded-xl border border-line bg-white shadow-card">
            <table className="w-full text-left">
              <thead className="border-b border-line bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-subtle">
                <tr>
                  {canManageTemplates &&
                <th scope="col" className="w-10 py-2.5 pl-5">
                      {selectAllBox('Select all templates')}
                    </th>
                }
                  <th scope="col" className={twMerge('py-2.5 pr-4', !canManageTemplates && 'pl-5')}>
                    Template Name
                  </th>
                  <th scope="col" className="py-2.5 pr-4">Client</th>
                  <th scope="col" className="py-2.5 pr-4">Employment Type</th>
                  <th scope="col" className="py-2.5 pr-4 text-right">Task Count</th>
                  <th scope="col" className="w-16 py-2.5 pr-5 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {refreshing ?
              <tr>
                    <td colSpan={6} className="p-4">
                      <LoadingRows />
                    </td>
                  </tr> :
              pageTemplates.length === 0 ?
              <tr>
                    <td colSpan={6} className="p-5">
                      <EmptyState
                    icon={LayoutTemplateIcon}
                    title={
                    query ? 'No templates match your search' : `No ${kind.toLowerCase()} templates yet`
                    }
                    description={query ? 'Try a different name, code, client or employment type.' : undefined} />

                    </td>
                  </tr> :

              pageTemplates.map((template) => {
                const used = templateTransitions(template.id, transitions).length;
                const selected = selectedTemplates.includes(template.id);
                return (
                  <tr
                    key={template.id}
                    tabIndex={0}
                    onClick={() => openTemplate(template.id)}
                    onKeyDown={(event) => {
                      if (event.target === event.currentTarget && event.key === 'Enter') openTemplate(template.id);
                    }}
                    className={twMerge(
                      'cursor-pointer transition-colors duration-150 ease-out hover:bg-slate-50/60 focus:outline-none focus-visible:bg-slate-50',
                      selected && 'bg-brand-50/40'
                    )}>

                        {canManageTemplates &&
                    <td className="py-3.5 pl-5" onClick={(event) => event.stopPropagation()}>
                            <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleTemplate(template.id)}
                        aria-label={`Select ${template.name}`}
                        className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-200" />

                          </td>
                    }
                        <td className={twMerge('py-3.5 pr-4', !canManageTemplates && 'pl-5')}>
                          <span className="block text-[13px] font-medium text-ink">{template.name}</span>
                          <span className="font-mono text-[11px] text-subtle">{template.code}</span>
                        </td>
                        <td className="py-3.5 pr-4 text-[13px] text-muted">{template.client}</td>
                        <td className="py-3.5 pr-4">
                          <Badge className="bg-sky-50 text-sky-700 ring-sky-200">{template.employmentType}</Badge>
                        </td>
                        <td className="py-3.5 pr-4 text-right text-[13px] font-medium text-ink">
                          {template.taskIds.length}
                        </td>
                        <td className="py-3.5 pr-5">
                          <div className="flex justify-end">
                            <Menu
                          label={`Actions for ${template.name}`}
                          items={[
                          { label: 'View', onSelect: () => openTemplate(template.id) },
                          {
                            label: 'Edit',
                            disabled: !canManageTemplates,
                            hint: TEMPLATE_PERMISSION_NOTE,
                            onSelect: () =>
                            navigate(`/onboarding/templates/${template.id}/edit`, { state: backState })
                          },
                          {
                            label: 'Duplicate',
                            disabled: !canManageTemplates,
                            hint: TEMPLATE_PERMISSION_NOTE,
                            onSelect: () => duplicateTemplate(template)
                          },
                          {
                            label: 'Delete',
                            danger: true,
                            disabled: !canManageTemplates || used > 0,
                            hint: !canManageTemplates ?
                            TEMPLATE_PERMISSION_NOTE :
                            `Used by ${used} transition${used === 1 ? '' : 's'}, so it cannot be deleted`,
                            onSelect: () => setDeletingTemplates({ ids: [template.id], bulk: false })
                          }]
                          } />

                          </div>
                        </td>
                      </tr>);

              })
              }
              </tbody>
            </table>

            {!refreshing && visibleTemplates.length > PAGE_SIZE &&
          <div className="flex items-center justify-between border-t border-line px-5 py-3 text-[12px] text-muted">
                <span>
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentPage * PAGE_SIZE, visibleTemplates.length)} of {visibleTemplates.length}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                size="sm"
                aria-label="Previous page"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}>

                    <ChevronLeftIcon className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) =>
              <Button
                key={number}
                size="sm"
                variant={number === currentPage ? 'primary' : 'secondary'}
                aria-current={number === currentPage ? 'page' : undefined}
                onClick={() => setPage(number)}>

                      {number}
                    </Button>
              )}
                  <Button
                size="sm"
                aria-label="Next page"
                disabled={currentPage === pageCount}
                onClick={() => setPage(currentPage + 1)}>

                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
          }
          </div>
        }
      </div>

      <AnimatePresence>
        {selectedIds.length > 0 &&
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2">

            <div className="flex items-center gap-4 rounded-xl border border-line bg-white px-4 py-3 shadow-pop">
              <span className="text-[13px] font-medium text-ink">
                {selectedIds.length} {view === 'tasks' ? 'task' : 'template'}
                {selectedIds.length === 1 ? '' : 's'} selected
              </span>
              <span className="h-5 w-px bg-line" aria-hidden="true" />
              {view === 'tasks' && canManageTemplates &&
            <Button
              size="sm"
              variant="primary"
              onClick={() =>
              navigate('/onboarding/templates/new-template', {
                state: { kind, taskIds: selectedTasks }
              })
              }>

                  Create Template
                </Button>
            }
              {(view === 'tasks' ? canManageTasks : canManageTemplates) &&
            <Button
              size="sm"
              onClick={() =>
              view === 'tasks' ?
              setDeletingTasks({ ids: selectedTasks, bulk: true }) :
              setDeletingTemplates({ ids: selectedTemplates, bulk: true })
              }
              className="text-red-600 ring-red-200 hover:bg-red-50">

                  <Trash2Icon className="h-3.5 w-3.5" />
                  Delete Selected ({selectedIds.length})
                </Button>
            }
              <button
              type="button"
              aria-label="Clear selection"
              onClick={() => view === 'tasks' ? setSelectedTasks([]) : setSelectedTemplates([])}
              className="rounded-lg p-1.5 text-subtle transition-colors duration-150 ease-out hover:bg-slate-100 hover:text-ink">

                <XIcon className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        }
      </AnimatePresence>

      <DeleteTasksDialog
        taskIds={deletingTasks?.ids ?? null}
        bulk={deletingTasks?.bulk ?? false}
        onCancel={() => setDeletingTasks(null)}
        onDeleted={(message) => {
          setDeletingTasks(null);
          setSelectedTasks([]);
          setNotice(message);
        }} />

      <DeleteTemplatesDialog
        templateIds={deletingTemplates?.ids ?? null}
        bulk={deletingTemplates?.bulk ?? false}
        onCancel={() => setDeletingTemplates(null)}
        onDeleted={(message) => {
          setDeletingTemplates(null);
          setSelectedTemplates([]);
          setNotice(message);
        }} />

      <Toast message={notice} onClose={() => setNotice(null)} />
    </div>);

}

function LoadingRows() {
  return (
    <div className="space-y-2" aria-label="Loading" role="status">
      {[0, 1, 2, 3].map((row) =>
      <div key={row} className="h-12 animate-pulse rounded-lg bg-slate-100" />
      )}
    </div>);

}
