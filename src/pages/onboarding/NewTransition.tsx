import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScreenInit } from '../../useScreenInit.js';
import {
  AlertCircleIcon,
  ChevronDownIcon,
  PlusIcon,
  SparklesIcon,
  UserMinusIcon,
  UserPlusIcon } from
'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { FieldGroup, Input, Select } from '../../components/ui/Field';
import { WizardSteps } from '../../components/ui/WizardSteps';
import { Badge } from '../../components/ui/Badge';
import { PeoplePicker } from '../../components/common/PeoplePicker';
import { TransitionTaskSetupCard } from '../../components/onboarding/TransitionTaskSetupCard';
import { useAppData } from '../../contexts/AppDataContext';
import type { Department, TransitionKind, TransitionTask } from '../../types';
import { resolveDueDate } from '../../utils/format';

const steps = ['Transition Type', 'Candidate Details', 'Tasks & Owners'];

export function NewTransition() {
  const navigate = useNavigate();
  const { tasks, templates, addTransition, forms } = useAppData();

  const screenInit = useScreenInit();
  const [step, setStep] = useState<number>(screenInit.step ?? 0);
  const [kind, setKind] = useState<TransitionKind>('Onboarding');
  const [templateId, setTemplateId] = useState<string>(screenInit.templateId ?? '');
  const [submitted, setSubmitted] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [expanded, setExpanded] = useState<string[]>([]);

  const [firstName, setFirstName] = useState('Sachini');
  const [lastName, setLastName] = useState('Herath');
  const [email, setEmail] = useState('sachini.herath@gmail.com');
  const [mobile, setMobile] = useState('+94 77 903 4416');
  const [position, setPosition] = useState('Frontend Engineer');
  const [hireDate, setHireDate] = useState('2026-10-01');
  const [managerIds, setManagerIds] = useState<string[]>(['u4']);
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [country, setCountry] = useState('Sri Lanka');
  const [address, setAddress] = useState('');
  const [formId, setFormId] = useState('frm1');
  const [setupTasks, setSetupTasks] = useState<TransitionTask[]>([]);

  const kindTemplates = useMemo(() => templates.filter((t) => t.kind === kind), [templates, kind]);
  const template = templates.find((t) => t.id === templateId);

  const buildTasks = (id: string, hire: string): TransitionTask[] => {
    const selected = templates.find((t) => t.id === id);
    if (!selected) return [];
    return selected.taskIds.map((taskId) => {
      const task = tasks.find((t) => t.id === taskId)!;
      const calculated = resolveDueDate(task.dueRule, hire);
      return {
        id: `st-${taskId}`,
        taskId,
        name: task.name,
        description: task.description,
        department: task.department,
        priority: task.priority,
        optional: task.optional,
        showInCandidateEvents: task.showInCandidateEvents,
        dueDate: calculated,
        calculatedDueDate: calculated,
        dueSource: 'calculated',
        ownerIds: task.ownerIds,
        status: 'Not Started'
      };
    });
  };

  useEffect(() => {
    if (screenInit.step === 2 && screenInit.templateId) {
      setSetupTasks(buildTasks(screenInit.templateId, hireDate));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<Department, TransitionTask[]>();
    setupTasks.forEach((task) => {
      map.set(task.department, [...(map.get(task.department) ?? []), task]);
    });
    return Array.from(map.entries());
  }, [setupTasks]);

  const detailsValid =
  firstName.trim() && lastName.trim() && email.trim() && mobile.trim() && position.trim() && hireDate && managerIds.length > 0;

  const handleNext = () => {
    setSubmitted(true);
    if (step === 0) {
      if (!templateId) return;
      setStep(1);
      setSubmitted(false);
      return;
    }
    if (step === 1) {
      if (!detailsValid) return;
      setSetupTasks(buildTasks(templateId, hireDate));
      setExpanded([]);
      setStep(2);
      setSubmitted(false);
    }
  };

  const missingEventDates = setupTasks.filter((task) => task.showInCandidateEvents && !task.dueDate);

  const handleCreate = () => {
    setSubmitted(true);
    if (missingEventDates.length > 0) {
      setExpanded([]);
      return;
    }
    const id = `tr-${Date.now()}`;
    const target = new Date(hireDate);
    const days = Math.max(
      0,
      Math.round((target.getTime() - new Date('2026-09-16').getTime()) / (1000 * 60 * 60 * 24))
    );
    addTransition({
      id,
      kind,
      candidate: {
        firstName,
        lastName,
        personalEmail: email,
        mobile,
        position,
        hireDate,
        reportingManagerIds: managerIds,
        dateOfBirth: dob || undefined,
        gender: gender || undefined,
        country: country || undefined,
        address: address || undefined,
        employeeFormId: formId || undefined
      },
      templateId,
      templateName: template?.name ?? '',
      status: 'On Track',
      portalToken: `cnd-${Date.now().toString(16)}`,
      portalAccess: 'Active',
      portalExpiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      startedOn: new Date().toISOString().slice(0, 10),
      targetDate: hireDate,
      daysRemaining: days,
      ownerIds: managerIds,
      tasks: setupTasks,
      emails: [],
      formStatus: 'Not Sent'
    });
    navigate(`/onboarding/transitions/${id}`);
  };

  const availableToAdd = tasks.filter(
    (task) => task.kind === kind && !setupTasks.some((t) => t.taskId === task.id)
  );

  return (
    <div>
      <PageHeader
        title="New Transition"
        subtitle="Set up a joiner or leaver, confirm their details and assign the task owners."
        backTo="/onboarding/transitions"
        backLabel="Back to Transitions"
        meta={
        <div className="mt-4">
            <WizardSteps steps={steps} current={step} />
          </div>
        } />
      

      <div className="px-8 py-6">
        <div className="max-w-4xl rounded-xl border border-line bg-white p-6 shadow-card">
          {step === 0 &&
          <div>
              <p className="text-[13px] font-medium text-ink">What kind of transition is this?</p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <KindCard
                icon={UserPlusIcon}
                title="Onboarding"
                description="A new joiner starting with the company."
                selected={kind === 'Onboarding'}
                onSelect={() => {
                  setKind('Onboarding');
                  setTemplateId('');
                }} />
              
                <KindCard
                icon={UserMinusIcon}
                title="Offboarding"
                description="An employee leaving or finishing a contract."
                selected={kind === 'Offboarding'}
                onSelect={() => {
                  setKind('Offboarding');
                  setTemplateId('');
                }} />
              
              </div>

              <div className="mt-6 max-w-md">
                <FieldGroup label={`Select ${kind} Template`} required>
                  <Select
                  value={templateId}
                  onChange={(event) => setTemplateId(event.target.value)}
                  className={submitted && !templateId ? 'border-red-300' : ''}>
                  
                    <option value="">Select a template</option>
                    {kindTemplates.map((item) =>
                  <option key={item.id} value={item.id}>
                        {item.code} — {item.name} ({item.taskIds.length} tasks)
                      </option>
                  )}
                  </Select>
                </FieldGroup>
                {submitted && !templateId &&
              <p className="mt-1.5 text-[12px] text-red-600">A template is required to continue.</p>
              }
                {template &&
              <p className="mt-2 text-[12px] text-muted">
                    {template.client} · {template.employmentType} · {template.taskIds.length} tasks
                  </p>
              }
              </div>
            </div>
          }

          {step === 1 &&
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              <FieldGroup label="First Name" required hint={<FromRecruitment />}>
                <Input value={firstName} onChange={(event) => setFirstName(event.target.value)} />
              </FieldGroup>
              <FieldGroup label="Last Name" required hint={<FromRecruitment />}>
                <Input value={lastName} onChange={(event) => setLastName(event.target.value)} />
              </FieldGroup>
              <FieldGroup label="Personal Email" required hint={<FromRecruitment />}>
                <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
              </FieldGroup>
              <FieldGroup label="Mobile Number" required hint={<FromRecruitment />}>
                <Input
                value={mobile}
                onChange={(event) => setMobile(event.target.value)}
                placeholder="+94 7X XXX XXXX" />
              
              </FieldGroup>
              <FieldGroup label="Position" required>
                <Input value={position} onChange={(event) => setPosition(event.target.value)} />
              </FieldGroup>
              <FieldGroup label="Hire Date" required>
                <Input type="date" value={hireDate} onChange={(event) => setHireDate(event.target.value)} />
              </FieldGroup>

              <div className="sm:col-span-2">
                <FieldGroup label="Reporting Managers" required>
                  <PeoplePicker
                  selectedIds={managerIds}
                  onChange={setManagerIds}
                  placeholder="Search managers by name or department"
                  emptyHint="Add at least one reporting manager" />
                
                </FieldGroup>
              </div>

              <FieldGroup label="Date of Birth">
                <Input type="date" value={dob} onChange={(event) => setDob(event.target.value)} />
              </FieldGroup>
              <FieldGroup label="Gender">
                <Select value={gender} onChange={(event) => setGender(event.target.value)}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </Select>
              </FieldGroup>
              <FieldGroup label="Country">
                <Select value={country} onChange={(event) => setCountry(event.target.value)}>
                  <option value="Sri Lanka">Sri Lanka</option>
                  <option value="India">India</option>
                  <option value="Singapore">Singapore</option>
                  <option value="Australia">Australia</option>
                </Select>
              </FieldGroup>
              <FieldGroup label="Address">
                <Input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="e.g. 18 Galle Road, Colombo 03" />
              
              </FieldGroup>

              <div className="sm:col-span-2">
                <FieldGroup label="Employee Form">
                  <Select value={formId} onChange={(event) => setFormId(event.target.value)}>
                    <option value="">No form — collect details later</option>
                    {forms.
                  filter((form) => form.status === 'Active').
                  map((form) =>
                  <option key={form.id} value={form.id}>
                          {form.code} — {form.name}
                        </option>
                  )}
                  </Select>
                </FieldGroup>
              </div>

              {submitted && !detailsValid &&
            <p className="sm:col-span-2 text-[12px] text-red-600">
                  Fill in every required field and add at least one reporting manager.
                </p>
            }
            </div>
          }

          {step === 2 &&
          <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] font-medium text-ink">
                    {setupTasks.length} tasks across {grouped.length} departments
                  </p>
                  <p className="text-[12px] text-muted">
                    Due dates are calculated from the hire date and can be overridden per task. Changes
                    apply to this transition only.
                  </p>
                </div>
                <Button size="sm" onClick={() => setAddingTask((prev) => !prev)}>
                  <PlusIcon className="h-3.5 w-3.5" />
                  Add Task
                </Button>
              </div>

              {submitted && missingEventDates.length > 0 &&
            <div className="mt-3 flex items-start gap-2.5 rounded-lg bg-red-50 px-3.5 py-3 ring-1 ring-inset ring-red-200">
                  <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  <p className="text-[13px] leading-relaxed text-red-800">
                    {missingEventDates.length} task
                    {missingEventDates.length === 1 ? '' : 's'} shown in the candidate&apos;s events still
                    need a date: {missingEventDates.map((task) => task.name).join(', ')}.
                  </p>
                </div>
            }

              {addingTask &&
            <div className="mt-3 rounded-xl border border-line bg-slate-50/70 p-3">
                  <p className="mb-2 text-[12px] font-medium text-ink">Add from the task library</p>
                  <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                    {availableToAdd.map((task) =>
                <button
                  key={task.id}
                  type="button"
                  onClick={() => {
                    setSetupTasks((prev) => [
                    ...prev,
                    {
                      id: `st-${task.id}`,
                      taskId: task.id,
                      name: task.name,
                      description: task.description,
                      department: task.department,
                      priority: task.priority,
                      optional: task.optional,
                      showInCandidateEvents: task.showInCandidateEvents,
                      dueDate: resolveDueDate(task.dueRule, hireDate),
                      calculatedDueDate: resolveDueDate(task.dueRule, hireDate),
                      dueSource: 'calculated',
                      ownerIds: task.ownerIds,
                      status: 'Not Started'
                    }]
                    );
                    setAddingTask(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg border border-line bg-white px-3 py-2 text-left transition-colors duration-150 ease-out hover:border-brand-300">
                  
                        <span className="font-mono text-[11px] text-subtle">{task.code}</span>
                        <span className="flex-1 text-[13px] text-ink">{task.name}</span>
                        <Badge>{task.department}</Badge>
                      </button>
                )}
                    {availableToAdd.length === 0 &&
                <p className="px-2 py-4 text-center text-[12px] text-muted">
                        Every library task is already in this transition.
                      </p>
                }
                  </div>
                </div>
            }

              <div className="mt-4 space-y-3">
                {grouped.map(([department, deptTasks]) => {
                const collapsed = expanded.includes(department);
                return (
                  <section key={department} className="overflow-hidden rounded-xl border border-line">
                      <button
                      type="button"
                      aria-expanded={!collapsed}
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
                        collapsed ? '-rotate-90' : ''}`
                        } />
                      
                        <span className="text-[13px] font-medium text-ink">{department}</span>
                        <Badge>{deptTasks.length} tasks</Badge>
                      </button>
                      {!collapsed &&
                    <div className="space-y-2 bg-white p-3">
                          {deptTasks.map((task) =>
                      <TransitionTaskSetupCard
                        key={task.id}
                        task={task}
                        hireDate={hireDate}
                        showDateError={submitted}
                        onChange={(patch) =>
                        setSetupTasks((prev) =>
                        prev.map((item) => item.id === task.id ? { ...item, ...patch } : item)
                        )
                        }
                        onRemove={() =>
                        setSetupTasks((prev) => prev.filter((item) => item.id !== task.id))
                        } />

                      )}
                        </div>
                    }
                    </section>);

              })}
              </div>
            </div>
          }

          <div className="mt-6 flex items-center justify-between border-t border-line pt-5">
            <Button
              onClick={() => step === 0 ? navigate('/onboarding/transitions') : setStep(step - 1)}>
              
              {step === 0 ? 'Cancel' : 'Back'}
            </Button>
            {step < 2 ?
            <Button variant="primary" onClick={handleNext}>
                Continue
              </Button> :

            <Button variant="primary" onClick={handleCreate}>
                Create &amp; Start {kind}
              </Button>
            }
          </div>
        </div>
      </div>
    </div>);

}

function FromRecruitment() {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-sky-700">
      <SparklesIcon className="h-3 w-3" />
      from Recruitment
    </span>);

}

function KindCard({
  icon: Icon,
  title,
  description,
  selected,
  onSelect






}: {icon: React.ComponentType<{className?: string;}>;title: string;description: string;selected: boolean;onSelect: () => void;}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`rounded-xl border p-4 text-left transition-colors duration-150 ease-out ${
      selected ? 'border-brand-400 bg-brand-50/50 ring-1 ring-brand-200' : 'border-line hover:border-slate-300'}`
      }>
      
      <Icon className={`h-5 w-5 ${selected ? 'text-brand-600' : 'text-subtle'}`} />
      <p className="mt-3 text-sm font-medium text-ink">{title}</p>
      <p className="mt-0.5 text-[12px] text-muted">{description}</p>
    </button>);

}