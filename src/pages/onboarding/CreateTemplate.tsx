import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDownIcon, PlusIcon } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { FieldGroup, Input, Select } from '../../components/ui/Field';
import { SearchInput } from '../../components/ui/SearchInput';
import { WizardSteps } from '../../components/ui/WizardSteps';
import { Badge, DepartmentChip, PriorityBadge } from '../../components/ui/Badge';
import { useAppData } from '../../contexts/AppDataContext';
import { clients, departments, employmentTypes } from '../../data/people';
import type { Department, EmploymentType, TransitionKind } from '../../types';
import { formatDueRule, nextCode } from '../../utils/format';
import { useScreenInit } from '../../useScreenInit.js';

const steps = ['Basic Information', 'Add Tasks', 'Review'];

export function CreateTemplate() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as {kind?: TransitionKind;taskIds?: string[];};
  const kind: TransitionKind = state.kind ?? 'Onboarding';
  const { tasks, templates, addTemplate } = useAppData();

  const screenInit = useScreenInit();
  const seeded = Boolean(screenInit.seeded);
  const [step, setStep] = useState<number>(screenInit.step ?? 0);
  const [name, setName] = useState(seeded ? 'Engineering Onboarding — Colombo' : '');
  const [client, setClient] = useState(seeded ? clients[0] : '');
  const [employmentType, setEmploymentType] = useState<EmploymentType | ''>(
    seeded ? 'Permanent' : ''
  );
  const [selectedIds, setSelectedIds] = useState<string[]>(
    state.taskIds ?? (seeded ? ['t1', 't2', 't5', 't7', 't9'] : [])
  );
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string[]>(departments);
  const [submitted, setSubmitted] = useState(false);

  const libraryTasks = useMemo(() => tasks.filter((task) => task.kind === kind), [tasks, kind]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matched = needle ?
    libraryTasks.filter(
      (task) =>
      task.name.toLowerCase().includes(needle) ||
      task.code.toLowerCase().includes(needle) ||
      task.department.toLowerCase().includes(needle)
    ) :
    libraryTasks;
    const selected = matched.filter((task) => selectedIds.includes(task.id));
    const rest = matched.filter((task) => !selectedIds.includes(task.id));
    return { selected, rest };
  }, [libraryTasks, query, selectedIds]);

  const grouped = useMemo(() => {
    const map = new Map<Department, typeof tasks>();
    selectedIds.forEach((id) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      map.set(task.department, [...(map.get(task.department) ?? []), task]);
    });
    return Array.from(map.entries());
  }, [selectedIds, tasks]);

  const basicValid = name.trim() && client && employmentType;

  const handleNext = () => {
    if (step === 0) {
      setSubmitted(true);
      if (!basicValid) return;
    }
    setStep((prev) => Math.min(steps.length - 1, prev + 1));
  };

  const handleCreate = () => {
    addTemplate({
      id: `tpl-${Date.now()}`,
      code: nextCode(
        kind === 'Onboarding' ? 'ONT' : 'OFT',
        templates.map((t) => t.code),
        3
      ),
      kind,
      name: name.trim(),
      client,
      employmentType: employmentType as EmploymentType,
      taskIds: selectedIds
    });
    navigate('/onboarding/templates');
  };

  return (
    <div>
      <PageHeader
        title="Create Template"
        subtitle={`A ${kind.toLowerCase()} template groups the tasks a client and employment type always need.`}
        backTo="/onboarding/templates"
        backLabel="Back to Templates"
        meta={
        <div className="mt-4">
            <WizardSteps steps={steps} current={step} />
          </div>
        } />
      

      <div className="px-8 py-6">
        <div className="max-w-3xl rounded-xl border border-line bg-white p-6 shadow-card">
          {step === 0 &&
          <div className="space-y-5">
              <FieldGroup label="Template Name" required>
                <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Standard Permanent Onboarding"
                className={submitted && !name.trim() ? 'border-red-300' : ''} />
              
              </FieldGroup>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FieldGroup label="Client" required>
                  <Select
                  value={client}
                  onChange={(event) => setClient(event.target.value)}
                  className={submitted && !client ? 'border-red-300' : ''}>
                  
                    <option value="">Select client</option>
                    {clients.map((item) =>
                  <option key={item} value={item}>
                        {item}
                      </option>
                  )}
                  </Select>
                </FieldGroup>
                <FieldGroup label="Employment Type" required>
                  <Select
                  value={employmentType}
                  onChange={(event) => setEmploymentType(event.target.value as EmploymentType)}
                  className={submitted && !employmentType ? 'border-red-300' : ''}>
                  
                    <option value="">Select employment type</option>
                    {employmentTypes.map((type) =>
                  <option key={type} value={type}>
                        {type}
                      </option>
                  )}
                  </Select>
                </FieldGroup>
              </div>
              {submitted && !basicValid &&
            <p className="text-[12px] text-red-600">
                  Template name, client and employment type are all required.
                </p>
            }
            </div>
          }

          {step === 1 &&
          <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[13px] font-medium text-ink">
                  {selectedIds.length} task{selectedIds.length === 1 ? '' : 's'} selected
                </p>
                <div className="flex items-center gap-2">
                  <SearchInput
                  value={query}
                  onChange={setQuery}
                  placeholder="Search tasks"
                  className="w-56" />
                
                  <Button
                  size="sm"
                  onClick={() =>
                  navigate('/onboarding/templates/new-task', { state: { kind } })
                  }>
                  
                    <PlusIcon className="h-3.5 w-3.5" />
                    Create New Task
                  </Button>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {visible.selected.map((task) =>
              <TaskPickRow
                key={task.id}
                code={task.code}
                name={task.name}
                department={task.department}
                priority={task.priority}
                due={formatDueRule(task.dueRule)}
                optional={task.optional}
                checked
                onToggle={() => setSelectedIds((prev) => prev.filter((id) => id !== task.id))} />

              )}

                {visible.selected.length > 0 && visible.rest.length > 0 &&
              <div className="flex items-center gap-3 py-2">
                    <span className="h-px flex-1 bg-line" />
                    <span className="text-[11px] font-medium uppercase tracking-wider text-subtle">
                      Available tasks
                    </span>
                    <span className="h-px flex-1 bg-line" />
                  </div>
              }

                {visible.rest.map((task) =>
              <TaskPickRow
                key={task.id}
                code={task.code}
                name={task.name}
                department={task.department}
                priority={task.priority}
                due={formatDueRule(task.dueRule)}
                optional={task.optional}
                checked={false}
                onToggle={() => setSelectedIds((prev) => [...prev, task.id])} />

              )}
              </div>
            </div>
          }

          {step === 2 &&
          <div>
              <div className="rounded-lg bg-slate-50 p-4">
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-subtle">Template name</dt>
                    <dd className="mt-0.5 text-[13px] font-medium text-ink">{name}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-subtle">Client</dt>
                    <dd className="mt-0.5 text-[13px] text-ink">{client}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-subtle">Employment type</dt>
                    <dd className="mt-0.5 text-[13px] text-ink">{employmentType}</dd>
                  </div>
                </dl>
              </div>

              <div className="mt-5 space-y-2">
                {grouped.length === 0 &&
              <p className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-[13px] text-muted">
                    No tasks selected yet. Go back to step 2 to add tasks.
                  </p>
              }
                {grouped.map(([department, deptTasks]) => {
                const open = expanded.includes(department);
                return (
                  <div key={department} className="overflow-hidden rounded-lg border border-line">
                      <button
                      type="button"
                      aria-expanded={open}
                      onClick={() =>
                      setExpanded((prev) =>
                      prev.includes(department) ?
                      prev.filter((d) => d !== department) :
                      [...prev, department]
                      )
                      }
                      className="flex w-full items-center gap-2.5 bg-slate-50/70 px-4 py-2.5 text-left transition-colors duration-150 ease-out hover:bg-slate-100/70">
                      
                        <ChevronDownIcon
                        className={`h-4 w-4 text-subtle transition-transform duration-150 ease-out ${
                        open ? '' : '-rotate-90'}`
                        } />
                      
                        <span className="text-[13px] font-medium text-ink">{department}</span>
                        <Badge>{deptTasks.length} tasks</Badge>
                      </button>
                      {open &&
                    <ul className="divide-y divide-line">
                          {deptTasks.map((task) =>
                      <li key={task.id} className="flex items-center gap-3 px-4 py-2.5">
                              <span className="font-mono text-[11px] text-subtle">{task.code}</span>
                              <span className="flex-1 text-[13px] text-ink">{task.name}</span>
                              <PriorityBadge priority={task.priority} />
                              <span className="w-56 text-right text-[12px] text-muted">
                                {formatDueRule(task.dueRule)}
                              </span>
                            </li>
                      )}
                        </ul>
                    }
                    </div>);

              })}
              </div>
            </div>
          }

          <div className="mt-6 flex items-center justify-between border-t border-line pt-5">
            <Button onClick={() => step === 0 ? navigate('/onboarding/templates') : setStep(step - 1)}>
              {step === 0 ? 'Cancel' : 'Back'}
            </Button>
            {step < steps.length - 1 ?
            <Button variant="primary" onClick={handleNext}>
                Continue
              </Button> :

            <Button variant="primary" onClick={handleCreate} disabled={selectedIds.length === 0}>
                Create Template
              </Button>
            }
          </div>
        </div>
      </div>
    </div>);

}

function TaskPickRow({
  code,
  name,
  department,
  priority,
  due,
  optional,
  checked,
  onToggle









}: {code: string;name: string;department: string;priority: 'Low' | 'Medium' | 'High';due: string;optional: boolean;checked: boolean;onToggle: () => void;}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2.5 transition-colors duration-150 ease-out ${
      checked ? 'border-brand-300 bg-brand-50/40' : 'border-line hover:border-slate-300'}`
      }>
      
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-200" />
      
      <span className="font-mono text-[11px] text-subtle">{code}</span>
      <span className="flex-1 text-[13px] font-medium text-ink">
        {name}
        {optional && <span className="ml-2 text-[11px] font-normal text-muted">Optional</span>}
      </span>
      <DepartmentChip department={department} />
      <PriorityBadge priority={priority} />
      <span className="w-52 text-right text-[12px] text-muted">{due}</span>
    </label>);

}