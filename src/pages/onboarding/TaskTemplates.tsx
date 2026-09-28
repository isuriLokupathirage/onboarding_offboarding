import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScreenInit } from '../../useScreenInit.js';
import { AnimatePresence, motion } from 'framer-motion';
import { ListChecksIcon, PlusIcon, Trash2Icon, XIcon } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Segmented } from '../../components/ui/Segmented';
import { SearchInput } from '../../components/ui/SearchInput';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { Menu } from '../../components/ui/Menu';
import { TaskCard } from '../../components/onboarding/TaskCard';
import { useAppData } from '../../contexts/AppDataContext';
import type { TransitionKind } from '../../types';
import { sortWithChildren } from '../../utils/format';

type View = 'templates' | 'tasks';

export function TaskTemplates() {
  const navigate = useNavigate();
  const { tasks, templates, deleteTasks } = useAppData();
  const screenInit = useScreenInit();
  const [kind, setKind] = useState<TransitionKind>(screenInit.kind as TransitionKind ?? 'Onboarding');
  const [view, setView] = useState<View>(screenInit.view as View ?? 'tasks');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

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
      template.client.toLowerCase().includes(needle)
    );
  }, [kindTemplates, query]);

  const toggleSelect = (id: string) =>
  setSelected((prev) => prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]);

  return (
    <div className="pb-24">
      <PageHeader
        title="Templates"
        subtitle="Build the task library once, then assemble the templates each client and employment type needs." />
      

      <div className="px-8 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Segmented
              options={[
              { value: 'Onboarding', label: 'Onboarding', count: tasks.filter((t) => t.kind === 'Onboarding').length },
              { value: 'Offboarding', label: 'Offboarding', count: tasks.filter((t) => t.kind === 'Offboarding').length }]
              }
              value={kind}
              onChange={(next) => {
                setKind(next);
                setSelected([]);
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
            
            <Button
              variant="primary"
              onClick={() =>
              navigate(
                view === 'tasks' ?
                '/onboarding/templates/new-task' :
                '/onboarding/templates/new-template',
                { state: { kind } }
              )
              }>
              
              <PlusIcon className="h-4 w-4" />
              {view === 'tasks' ? 'New Task' : 'New Template'}
            </Button>
          </div>
        </div>

        {view === 'tasks' ?
        <div className="mt-5 space-y-2">
            {visibleTasks.length === 0 ?
          <EmptyState
            icon={ListChecksIcon}
            title="No tasks match your search"
            description="Try a different task name, code or department." /> :


          visibleTasks.map((task) =>
          <TaskCard
            key={task.id}
            task={task}
            selected={selected.includes(task.id)}
            onToggle={toggleSelect}
            isChild={Boolean(task.parentId && visibleTasks.some((t) => t.id === task.parentId))}
            onDelete={(id) => deleteTasks([id])} />

          )
          }
          </div> :

        <div className="mt-5 overflow-hidden rounded-xl border border-line bg-white shadow-card">
            <div className="grid grid-cols-12 gap-4 border-b border-line bg-slate-50/70 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-subtle">
              <span className="col-span-2">Code</span>
              <span className="col-span-4">Template name</span>
              <span className="col-span-3">Client</span>
              <span className="col-span-2">Employment type</span>
              <span className="col-span-1 text-right">Tasks</span>
            </div>
            {visibleTemplates.length === 0 ?
          <p className="px-5 py-10 text-center text-[13px] text-muted">
                No templates match your search.
              </p> :

          <ul className="divide-y divide-line">
                {visibleTemplates.map((template) =>
            <li
              key={template.id}
              className="grid grid-cols-12 items-center gap-4 px-5 py-3.5 transition-colors duration-150 ease-out hover:bg-slate-50/60">
              
                    <span className="col-span-2 font-mono text-[12px] text-subtle">{template.code}</span>
                    <span className="col-span-4 text-[13px] font-medium text-ink">{template.name}</span>
                    <span className="col-span-3 text-[13px] text-muted">{template.client}</span>
                    <span className="col-span-2">
                      <Badge className="bg-sky-50 text-sky-700 ring-sky-200">
                        {template.employmentType}
                      </Badge>
                    </span>
                    <span className="col-span-1 flex items-center justify-end gap-1">
                      <span className="text-[13px] font-medium text-ink">{template.taskIds.length}</span>
                      <Menu
                  label={`Actions for ${template.name}`}
                  items={[{ label: 'Edit template' }, { label: 'Duplicate' }, { label: 'Archive', danger: true }]} />
                
                    </span>
                  </li>
            )}
              </ul>
          }
          </div>
        }
      </div>

      <AnimatePresence>
        {view === 'tasks' && selected.length > 0 &&
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2">
          
            <div className="flex items-center gap-4 rounded-xl border border-line bg-white px-4 py-3 shadow-pop">
              <span className="text-[13px] font-medium text-ink">
                {selected.length} task{selected.length === 1 ? '' : 's'} selected
              </span>
              <span className="h-5 w-px bg-line" aria-hidden="true" />
              <Button
              size="sm"
              variant="primary"
              onClick={() =>
              navigate('/onboarding/templates/new-template', {
                state: { kind, taskIds: selected }
              })
              }>
              
                Create Template
              </Button>
              <Button
              size="sm"
              onClick={() => {
                deleteTasks(selected);
                setSelected([]);
              }}
              className="text-red-600 ring-red-200 hover:bg-red-50">
              
                <Trash2Icon className="h-3.5 w-3.5" />
                Delete Selected
              </Button>
              <button
              type="button"
              aria-label="Clear selection"
              onClick={() => setSelected([])}
              className="rounded-lg p-1.5 text-subtle transition-colors duration-150 ease-out hover:bg-slate-100 hover:text-ink">
              
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}