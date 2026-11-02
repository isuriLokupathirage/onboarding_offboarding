import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useScreenInit } from '../../useScreenInit.js';
import {
  AlertCircleIcon,
  ChevronDownIcon,
  LockIcon,
  PlusIcon,
  ShieldOffIcon,
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
import { CandidatePicker } from '../../components/onboarding/CandidatePicker';
import { EmptyState } from '../../components/ui/EmptyState';
import { SearchableSelect, type SearchableOption } from '../../components/ui/SearchableSelect';
import { useAppData } from '../../contexts/AppDataContext';
import { jobTitles } from '../../data/jobTitles';
import { recruitmentCandidates } from '../../data/recruitmentCandidates';
import type { Department, RecruitmentCandidate, TransitionKind, TransitionTask } from '../../types';
import { resolveDueDate } from '../../utils/format';
import { managePermissionFor, toTransitionTask } from '../../utils/transitions';
import { candidateCampaign, onboardableCandidates } from '../../utils/recruitment';

const steps = ['Transition Type', 'Candidate Details', 'Tasks & Owners'];
const ALL_KINDS: TransitionKind[] = ['Onboarding', 'Offboarding'];

interface Details {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  jobTitle: string;
  hireDate: string;
  dob: string;
  gender: string;
  country: string;
  address: string;
}

type DetailKey = keyof Details;

const REQUIRED_DETAILS: DetailKey[] = ['firstName', 'lastName', 'email', 'mobile', 'jobTitle', 'hireDate'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENDERS = ['Male', 'Female', 'Other'];
const COUNTRIES = ['Sri Lanka', 'India', 'Singapore', 'Australia'];
const jobTitleOptions: SearchableOption[] = jobTitles.map((title) => ({ value: title, label: title }));

/**
 * Step 2 values from a recruitment candidate: their extracted details, and the Job Title from
 * their campaign. Anything not extracted, or not in master data, is left blank.
 */
function candidateDetails(candidate: RecruitmentCandidate | undefined): Details {
  const campaignTitle = candidate ? candidateCampaign(candidate)?.jobTitle : undefined;
  const pick = (value: string | undefined, allowed?: string[]) =>
  value && (!allowed || allowed.includes(value)) ? value : '';
  return {
    firstName: pick(candidate?.firstName),
    lastName: pick(candidate?.lastName),
    email: pick(candidate?.personalEmail),
    mobile: pick(candidate?.mobile),
    jobTitle: pick(campaignTitle, jobTitles),
    hireDate: pick(candidate?.offeredStartDate),
    dob: pick(candidate?.dateOfBirth),
    gender: pick(candidate?.gender, GENDERS),
    country: pick(candidate?.country, COUNTRIES),
    address: pick(candidate?.address)
  };
}

export function NewTransition() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tasks, templates, transitions, addTransition, forms, hasOboPermission, recruitmentModulePurchased } =
  useAppData();

  const screenInit = useScreenInit();
  const manageableKinds = ALL_KINDS.filter((item) => hasOboPermission(managePermissionFor(item)));
  // Recruitment opens this screen with ?from=recruitment&candidateId=…
  const fromRecruitment = searchParams.get('from') === 'recruitment' || screenInit.from === 'recruitment';

  const initialKind = (): TransitionKind | null => {
    if (manageableKinds.length === 1) return manageableKinds[0];
    if (fromRecruitment && manageableKinds.includes('Onboarding')) return 'Onboarding';
    if (screenInit.kind) return screenInit.kind;
    return screenInit.step ? 'Onboarding' : null;
  };

  // Recruitment candidates without an active onboarding transition.
  const candidates = useMemo(() => onboardableCandidates(recruitmentCandidates, transitions), [transitions]);
  const initialCandidate = (): RecruitmentCandidate | undefined => {
    const id = searchParams.get('candidateId') ?? screenInit.candidateId;
    return recruitmentModulePurchased && initialKind() === 'Onboarding' ?
    candidates.find((candidate) => candidate.id === id) :
    undefined;
  };
  const [step, setStep] = useState<number>(screenInit.step ?? 0);
  const [kind, setKind] = useState<TransitionKind | null>(initialKind);
  const [candidateId, setCandidateId] = useState<string>(() => initialCandidate()?.id ?? '');
  const [templateId, setTemplateId] = useState<string>(screenInit.templateId ?? '');
  const [submitted, setSubmitted] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [expanded, setExpanded] = useState<string[]>([]);

  // What Recruitment supplied, kept so a field shows "from Recruitment" until it is edited.
  const [prefill, setPrefill] = useState<Details>(() => candidateDetails(initialCandidate()));
  const [details, setDetails] = useState<Details>(prefill);
  const [managerIds, setManagerIds] = useState<string[]>(screenInit.managerIds ?? []);
  const [formId, setFormId] = useState('frm1');
  const [setupTasks, setSetupTasks] = useState<TransitionTask[]>([]);

  // Past Step 1 a type is always chosen; the fallback only keeps the types simple.
  const chosenKind: TransitionKind = kind ?? 'Onboarding';
  const { firstName, lastName, email, mobile, jobTitle, hireDate, dob, gender, country, address } = details;
  const setField = (key: DetailKey, value: string) => setDetails((prev) => ({ ...prev, [key]: value }));
  const selectedCandidate = candidates.find((candidate) => candidate.id === candidateId);
  const selectedCampaign = selectedCandidate ? candidateCampaign(selectedCandidate) : undefined;
  const isPrefilled = (key: DetailKey) => Boolean(candidateId && prefill[key] && details[key] === prefill[key]);
  const activeTemplates = useMemo(
    () => templates.filter((t) => t.kind === kind && t.status === 'Active'),
    [templates, kind]
  );
  const template = templates.find((t) => t.id === templateId);
  const step1Complete = Boolean(kind && activeTemplates.some((t) => t.id === templateId));

  /** Fills Step 2 from the picked candidate, or clears it for manual entry. */
  const selectCandidate = (id: string) => {
    setCandidateId(id);
    const next = candidateDetails(candidates.find((candidate) => candidate.id === id));
    setPrefill(next);
    setDetails(next);
  };

  const selectKind = (next: TransitionKind) => {
    if (next === kind) return;
    setKind(next);
    setTemplateId('');
    if (next === 'Offboarding' && candidateId) selectCandidate('');
  };

  const buildTasks = (id: string, hire: string): TransitionTask[] => {
    const selected = templates.find((t) => t.id === id);
    if (!selected) return [];
    return selected.taskIds.map((taskId) => {
      const task = tasks.find((t) => t.id === taskId)!;
      return toTransitionTask(task, `st-${taskId}`, resolveDueDate(task.dueRule, hire));
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

  const fieldError = (key: DetailKey): string | undefined => {
    if (!REQUIRED_DETAILS.includes(key)) return undefined;
    if (!details[key].trim()) return 'Required';
    if (key === 'email' && !EMAIL_PATTERN.test(email.trim())) return 'Enter a valid email address';
    return undefined;
  };
  const detailsValid = REQUIRED_DETAILS.every((key) => !fieldError(key));
  const showError = (key: DetailKey) => submitted ? fieldError(key) : undefined;

  const handleNext = () => {
    setSubmitted(true);
    if (step === 0) {
      if (!step1Complete) return;
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
      kind: chosenKind,
      candidate: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        personalEmail: email.trim(),
        mobile: mobile.trim(),
        position: jobTitle,
        hireDate,
        reportingManagerIds: managerIds,
        dateOfBirth: dob || undefined,
        gender: gender || undefined,
        country: country || undefined,
        address: address.trim() || undefined,
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
      emailEvents: [],
      submissions: [],
      auditTrail: [
      {
        id: `${id}-au1`,
        action: 'Transition started',
        actor: 'Nimal Perera',
        at: new Date().toISOString(),
        detail: template?.name
      }],
      formStatus: 'Not Sent'
    });
    navigate(`/onboarding/transitions/${id}`);
  };

  const availableToAdd = tasks.filter(
    (task) => task.kind === chosenKind && !setupTasks.some((t) => t.taskId === task.id)
  );

  if (manageableKinds.length === 0) {
    return (
      <div>
        <PageHeader title="New Transition" backTo="/onboarding/transitions" backLabel="Back to Transitions" />
        <div className="px-8 py-6">
          <div className="max-w-4xl">
            <EmptyState
              icon={ShieldOffIcon}
              title="You can't start a transition"
              description="Starting a transition needs the Manage Onboarding Transitions or Manage Offboarding Transitions permission."
              action={<Button onClick={() => navigate('/onboarding/transitions')}>Back to Transitions</Button>} />

          </div>
        </div>
      </div>);

  }

  const noPermissionReason = (item: TransitionKind) =>
  `You need the ${managePermissionFor(item)} permission to start this type.`;

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
              {fromRecruitment &&
            <div className="mb-5 flex items-center gap-2 rounded-lg bg-sky-50 px-3.5 py-2.5 text-[13px] text-sky-900 ring-1 ring-inset ring-sky-200">
                  <SparklesIcon className="h-4 w-4 shrink-0 text-sky-700" />
                  Started from Recruitment.
                </div>
            }

              <p className="text-[13px] font-medium text-ink">
                What kind of transition is this?<span className="ml-0.5 text-red-500">*</span>
              </p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <KindCard
                icon={UserPlusIcon}
                title="Onboarding"
                description="A new joiner starting with the company."
                selected={kind === 'Onboarding'}
                disabledReason={manageableKinds.includes('Onboarding') ? undefined : noPermissionReason('Onboarding')}
                onSelect={() => selectKind('Onboarding')} />

                <KindCard
                icon={UserMinusIcon}
                title="Offboarding"
                description="An employee leaving or finishing a contract."
                selected={kind === 'Offboarding'}
                disabledReason={manageableKinds.includes('Offboarding') ? undefined : noPermissionReason('Offboarding')}
                onSelect={() => selectKind('Offboarding')} />

              </div>

              {kind &&
            <div className="mt-6 max-w-md space-y-5">
                  {kind === 'Onboarding' &&
              <div>
                      <FieldGroup
                  label="Select Candidate"
                  hint={<span className="text-[11px] text-subtle">Optional</span>}>

                        <CandidatePicker
                    candidates={candidates}
                    value={candidateId}
                    onChange={selectCandidate}
                    disabled={!recruitmentModulePurchased} />

                      </FieldGroup>
                      <p className="mt-1.5 text-[12px] text-muted">
                        {recruitmentModulePurchased ?
                  'Candidates who have completed a recruitment workflow. Picking one fills in their details in the next step; leave it blank to enter them yourself.' :
                  'Available when your organisation has the Recruitment module. Enter the candidate’s details in the next step.'}
                      </p>
                    </div>
              }

                  <div>
                    <FieldGroup label={`Select ${kind} Template`} required>
                      <Select value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
                        <option value="">Select a template</option>
                        {activeTemplates.map((item) =>
                    <option key={item.id} value={item.id}>
                            {item.code} — {item.name} ({item.taskIds.length} tasks)
                          </option>
                    )}
                      </Select>
                    </FieldGroup>
                    {template ?
                <p className="mt-1.5 text-[12px] text-muted">
                        {template.client} · {template.employmentType} · {template.taskIds.length} tasks
                      </p> :

                <p className="mt-1.5 text-[12px] text-muted">Only active templates are listed.</p>
                }
                  </div>
                </div>
            }
            </div>
          }

          {step === 1 &&
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              {selectedCandidate &&
            <div className="sm:col-span-2 flex items-start gap-2.5 rounded-lg bg-sky-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-sky-900 ring-1 ring-inset ring-sky-200">
                  <SparklesIcon className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
                  <span>
                    Pre-filled from {selectedCandidate.firstName} {selectedCandidate.lastName}&apos;s application
                    {selectedCampaign && <> and the {selectedCampaign.name} campaign</>}. Check the values and
                    complete anything left blank. Every field can be edited.
                  </span>
                </div>
            }

              <FieldGroup label="First Name" required hint={<PrefillHint show={isPrefilled('firstName')} />}>
                <Input
                value={firstName}
                onChange={(event) => setField('firstName', event.target.value)}
                aria-invalid={Boolean(showError('firstName'))}
                className={showError('firstName') ? 'border-red-300' : ''} />
                <FieldError message={showError('firstName')} />
              </FieldGroup>
              <FieldGroup label="Last Name" required hint={<PrefillHint show={isPrefilled('lastName')} />}>
                <Input
                value={lastName}
                onChange={(event) => setField('lastName', event.target.value)}
                aria-invalid={Boolean(showError('lastName'))}
                className={showError('lastName') ? 'border-red-300' : ''} />
                <FieldError message={showError('lastName')} />
              </FieldGroup>
              <FieldGroup label="Personal Email" required hint={<PrefillHint show={isPrefilled('email')} />}>
                <Input
                type="email"
                value={email}
                onChange={(event) => setField('email', event.target.value)}
                placeholder="name@example.com"
                aria-invalid={Boolean(showError('email'))}
                className={showError('email') ? 'border-red-300' : ''} />
                <FieldError message={showError('email')} />
              </FieldGroup>
              <FieldGroup label="Mobile Number" required hint={<PrefillHint show={isPrefilled('mobile')} />}>
                <Input
                value={mobile}
                onChange={(event) => setField('mobile', event.target.value)}
                placeholder="+94 7X XXX XXXX"
                aria-invalid={Boolean(showError('mobile'))}
                className={showError('mobile') ? 'border-red-300' : ''} />
                <FieldError message={showError('mobile')} />
              </FieldGroup>
              <FieldGroup
              label="Job Title"
              required
              hint={<PrefillHint show={isPrefilled('jobTitle')} label="from campaign" />}>
                <SearchableSelect
                options={jobTitleOptions}
                value={jobTitle}
                onChange={(value) => setField('jobTitle', value)}
                placeholder="Select a job title"
                searchPlaceholder="Search job titles"
                invalid={Boolean(showError('jobTitle'))} />
                <FieldError message={showError('jobTitle')} />
              </FieldGroup>
              <FieldGroup
              label={chosenKind === 'Offboarding' ? 'Last Working Date' : 'Hire Date'}
              required
              hint={<PrefillHint show={isPrefilled('hireDate')} />}>
                <Input
                type="date"
                value={hireDate}
                onChange={(event) => setField('hireDate', event.target.value)}
                aria-invalid={Boolean(showError('hireDate'))}
                className={showError('hireDate') ? 'border-red-300' : ''} />
                <FieldError message={showError('hireDate')} />
              </FieldGroup>

              <FieldGroup label="Date of Birth" hint={<PrefillHint show={isPrefilled('dob')} />}>
                <Input type="date" value={dob} onChange={(event) => setField('dob', event.target.value)} />
              </FieldGroup>
              <FieldGroup label="Gender" hint={<PrefillHint show={isPrefilled('gender')} />}>
                <Select value={gender} onChange={(event) => setField('gender', event.target.value)}>
                  <option value="">Select gender</option>
                  {GENDERS.map((item) =>
                <option key={item} value={item}>
                      {item}
                    </option>
                )}
                </Select>
              </FieldGroup>
              <FieldGroup label="Country" hint={<PrefillHint show={isPrefilled('country')} />}>
                <Select value={country} onChange={(event) => setField('country', event.target.value)}>
                  <option value="">Select country</option>
                  {COUNTRIES.map((item) =>
                <option key={item} value={item}>
                      {item}
                    </option>
                )}
                </Select>
              </FieldGroup>
              <FieldGroup label="Address" hint={<PrefillHint show={isPrefilled('address')} />}>
                <Input
                value={address}
                onChange={(event) => setField('address', event.target.value)}
                placeholder="e.g. 18 Galle Road, Colombo 03" />

              </FieldGroup>

              <div className="sm:col-span-2">
                <FieldGroup label="Reporting Managers">
                  <PeoplePicker
                  selectedIds={managerIds}
                  onChange={setManagerIds}
                  placeholder="Search managers by name or department"
                  emptyHint="No reporting managers added" />

                </FieldGroup>
              </div>

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
            <p className="sm:col-span-2 text-[12px] text-red-600">Complete the highlighted fields to continue.</p>
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
                    toTransitionTask(task, `st-${task.id}`, resolveDueDate(task.dueRule, hireDate))]
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
                        kind={chosenKind}
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
            <Button variant="primary" onClick={handleNext} disabled={step === 0 && !step1Complete}>
                Next
              </Button> :

            <Button variant="primary" onClick={handleCreate}>
                Create &amp; Start {chosenKind}
              </Button>
            }
          </div>
        </div>
      </div>
    </div>);

}

/** Marks a field still holding the value Recruitment supplied. Disappears once it is edited. */
function PrefillHint({ show, label = 'from Recruitment' }: {show: boolean;label?: string;}) {
  if (!show) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-sky-700">
      <SparklesIcon className="h-3 w-3" />
      {label}
    </span>);

}

function FieldError({ message }: {message?: string;}) {
  if (!message) return null;
  return <p className="mt-1 text-[12px] text-red-600">{message}</p>;
}

function KindCard({
  icon: Icon,
  title,
  description,
  selected,
  disabledReason,
  onSelect







}: {icon: React.ComponentType<{className?: string;}>;title: string;description: string;selected: boolean;disabledReason?: string;onSelect: () => void;}) {
  const disabled = Boolean(disabledReason);
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      title={disabledReason}
      onClick={onSelect}
      className={`rounded-xl border p-4 text-left transition-colors duration-150 ease-out ${
      disabled ?
      'cursor-not-allowed border-line bg-slate-50 opacity-70' :
      selected ?
      'border-brand-400 bg-brand-50/50 ring-1 ring-brand-200' :
      'border-line hover:border-slate-300'}`
      }>

      <span className="flex items-start justify-between gap-2">
        <Icon className={`h-5 w-5 ${selected ? 'text-brand-600' : 'text-subtle'}`} />
        {disabled && <LockIcon className="h-3.5 w-3.5 text-subtle" aria-hidden />}
      </span>
      <p className="mt-3 text-sm font-medium text-ink">{title}</p>
      <p className="mt-0.5 text-[12px] text-muted">{disabled ? disabledReason : description}</p>
    </button>);

}