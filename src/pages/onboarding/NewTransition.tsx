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
import { ExitDetailsStep } from '../../components/onboarding/ExitDetailsStep';
import { EmptyState } from '../../components/ui/EmptyState';
import { SearchableSelect, type SearchableOption } from '../../components/ui/SearchableSelect';
import { useAppData } from '../../contexts/AppDataContext';
import { jobTitles } from '../../data/jobTitles';
import { recruitmentCandidates } from '../../data/recruitmentCandidates';
import { useEmployeeData } from '../../contexts/EmployeeDataContext';
import { offboardingMilestones, people } from '../../data/people';
import type {
  DueRule,
  Employee,
  ExitDetailsDraft,
  RecruitmentCandidate,
  TransitionKind,
  TransitionTask } from
'../../types';
import { Segmented } from '../../components/ui/Segmented';
import {
  baseDateLabel,
  groupSetupTasks,
  setupTaskProblem,
  type SetupGrouping } from
'../../utils/taskSetup';
import { resolveDueDate } from '../../utils/format';
import { managePermissionFor, toTransitionTask } from '../../utils/transitions';
import { candidateCampaign, onboardableCandidates } from '../../utils/recruitment';
import { offboardableEmployees } from '../../utils/employees';
import {
  exitDateUsage,
  exitDetailsErrors,
  exitReasonLabel,
  exitTargetDate,
  hasExitErrors,
  resolveExitDueDate } from
'../../utils/offboarding';

const stepsFor = (kind: TransitionKind | null) => [
'Transition Type',
kind === 'Offboarding' ? 'Exit Details' : 'Candidate Details',
'Tasks & Owners'];
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
const pick = (value: string | undefined, allowed?: string[]) =>
value && (!allowed || allowed.includes(value)) ? value : '';

function candidateDetails(candidate: RecruitmentCandidate | undefined): Details {
  const campaignTitle = candidate ? candidateCampaign(candidate)?.jobTitle : undefined;
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

/** The employee's reporting manager as a person id, when they are in the people directory. */
function employeeManagerIds(employee: Employee | undefined): string[] {
  const manager = employee ? people.find((person) => person.name === employee.reportingManager) : undefined;
  return manager ? [manager.id] : [];
}

export function NewTransition() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tasks, templates, transitions, addTransition, hasOboPermission, recruitmentModulePurchased } =
  useAppData();

  const screenInit = useScreenInit();
  const manageableKinds = ALL_KINDS.filter((item) => hasOboPermission(managePermissionFor(item)));
  // Recruitment opens this screen with ?from=recruitment&candidateId=…
  const fromRecruitment = searchParams.get('from') === 'recruitment' || screenInit.from === 'recruitment';
  // An employee record opens this screen with ?from=employee&employeeId=…
  const fromEmployee = searchParams.get('from') === 'employee' || screenInit.from === 'employee';

  const initialKind = (): TransitionKind | null => {
    if (manageableKinds.length === 1) return manageableKinds[0];
    if (fromRecruitment && manageableKinds.includes('Onboarding')) return 'Onboarding';
    if (fromEmployee && manageableKinds.includes('Offboarding')) return 'Offboarding';
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

  // Active employees without an offboarding transition in progress.
  const { employees } = useEmployeeData();
  const leavers = useMemo(() => offboardableEmployees(employees, transitions), [employees, transitions]);
  const employeeOptions: SearchableOption[] = useMemo(
    () =>
    leavers.map((employee) => ({
      value: employee.id,
      label: `${employee.firstName} ${employee.lastName}`,
      description: `${employee.code} · ${employee.jobTitle}`,
      keywords: [employee.code, employee.officialEmail, employee.department]
    })),
    [leavers]
  );
  const initialEmployee = (): Employee | undefined => {
    const id = searchParams.get('employeeId') ?? screenInit.employeeId;
    return initialKind() === 'Offboarding' ? leavers.find((employee) => employee.id === id) : undefined;
  };
  const [step, setStep] = useState<number>(screenInit.step ?? 0);
  const [kind, setKind] = useState<TransitionKind | null>(initialKind);
  const [candidateId, setCandidateId] = useState<string>(() => initialCandidate()?.id ?? '');
  const [employeeId, setEmployeeId] = useState<string>(() => initialEmployee()?.id ?? '');
  const [templateId, setTemplateId] = useState<string>(screenInit.templateId ?? '');
  // Design canvas screens can open a step with its validation already shown.
  const [submitted, setSubmitted] = useState<boolean>(Boolean(screenInit.showErrors));
  const [addingTask, setAddingTask] = useState(false);
  const [grouping, setGrouping] = useState<SetupGrouping>(screenInit.grouping ?? 'department');
  const [collapsed, setCollapsed] = useState<string[]>([]);

  // What Recruitment supplied, kept so a field shows its source until edited.
  const [prefill, setPrefill] = useState<Details>(() => candidateDetails(initialCandidate()));
  const [details, setDetails] = useState<Details>(prefill);
  const [managerIds, setManagerIds] = useState<string[]>(
    () => screenInit.managerIds ?? employeeManagerIds(initialEmployee())
  );
  const [setupTasks, setSetupTasks] = useState<TransitionTask[]>([]);
  // Offboarding Step 2. Design canvas screens can preset any part of it.
  const [exit, setExit] = useState<ExitDetailsDraft>(() => ({
    type: 'Voluntary',
    reason: '',
    dates: {},
    documents: [],
    ...screenInit.exit
  }));

  // Past Step 1 a type is always chosen; the fallback only keeps the types simple.
  const chosenKind: TransitionKind = kind ?? 'Onboarding';
  const { firstName, lastName, email, mobile, jobTitle, hireDate, dob, gender, country, address } = details;
  const setField = (key: DetailKey, value: string) => setDetails((prev) => ({ ...prev, [key]: value }));
  const selectedCandidate = candidates.find((candidate) => candidate.id === candidateId);
  const selectedCampaign = selectedCandidate ? candidateCampaign(selectedCandidate) : undefined;
  const selectedEmployee = leavers.find((employee) => employee.id === employeeId);
  const isPrefilled = (key: DetailKey) => Boolean(candidateId && prefill[key] && details[key] === prefill[key]);
  const prefillHint = (key: DetailKey, label?: string) => <PrefillHint show={isPrefilled(key)} label={label} />;
  const activeTemplates = useMemo(
    () => templates.filter((t) => t.kind === kind && t.status === 'Active'),
    [templates, kind]
  );
  const template = templates.find((t) => t.id === templateId);
  // An offboarding is always for an employee on record: Step 2 shows their details read-only.
  const step1Complete = Boolean(
    kind && activeTemplates.some((t) => t.id === templateId) && (kind !== 'Offboarding' || selectedEmployee)
  );

  const templateTasks = useMemo(
    () => (template?.taskIds ?? []).flatMap((taskId) => tasks.filter((task) => task.id === taskId)),
    [template, tasks]
  );
  // A date is mandatory only when a task in the selected template calculates its due date from it.
  const dateUsage = useMemo(() => exitDateUsage(templateTasks), [templateTasks]);
  const requiredExitDates = offboardingDatesIn(dateUsage);
  const exitErrors = exitDetailsErrors(exit, requiredExitDates);
  // Timeline groups are measured from this date.
  const baseDate = chosenKind === 'Offboarding' ? exit.dates['Last Working Date'] ?? '' : hireDate;
  const resolveRule = (rule: DueRule | null): string | null =>
  chosenKind === 'Offboarding' ? resolveExitDueDate(rule, exit.dates) : resolveDueDate(rule, hireDate);

  /** Fills Step 2 from the picked candidate, or clears it for manual entry. */
  const selectCandidate = (id: string) => {
    setCandidateId(id);
    const next = candidateDetails(candidates.find((candidate) => candidate.id === id));
    setPrefill(next);
    setDetails(next);
  };

  /** The leaving employee. Their reporting manager becomes the transition owner. */
  const selectEmployee = (id: string) => {
    setEmployeeId(id);
    setManagerIds(employeeManagerIds(leavers.find((item) => item.id === id)));
  };

  const selectKind = (next: TransitionKind) => {
    if (next === kind) return;
    setKind(next);
    setTemplateId('');
    if (next === 'Offboarding' && candidateId) selectCandidate('');
    if (next === 'Onboarding' && employeeId) selectEmployee('');
  };

  const buildTasks = (id: string): TransitionTask[] => {
    const selected = templates.find((t) => t.id === id);
    if (!selected) return [];
    return selected.taskIds.flatMap((taskId) =>
    tasks.
    filter((t) => t.id === taskId).
    map((task) => toTransitionTask(task, `st-${taskId}`, resolveRule(task.dueRule)))
    );
  };

  useEffect(() => {
    if (screenInit.step === 2 && screenInit.templateId) {
      // Design canvas screens can preset owners per library task id, e.g. { t1: ['u1', 'u13'] }.
      const presetOwners: Record<string, string[]> = screenInit.taskOwners ?? {};
      setSetupTasks(
        buildTasks(screenInit.templateId).map((task) =>
        presetOwners[task.taskId] ? { ...task, ownerIds: presetOwners[task.taskId] } : task
        )
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Without the hire date or last working date there is nothing to place tasks before or after.
  const canGroupByTimeline = Boolean(baseDate);
  const groups = useMemo(
    () => groupSetupTasks(setupTasks, canGroupByTimeline ? grouping : 'department', chosenKind, baseDate),
    [setupTasks, grouping, canGroupByTimeline, chosenKind, baseDate]
  );
  const departmentCount = new Set(setupTasks.map((task) => task.department)).size;

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
      if (chosenKind === 'Offboarding' ? hasExitErrors(exitErrors) : !detailsValid) return;
      setSetupTasks(buildTasks(templateId));
      setCollapsed([]);
      setStep(2);
      setSubmitted(false);
    }
  };

  const blockedTasks = setupTasks.filter((task) => setupTaskProblem(task));

  const handleCreate = () => {
    setSubmitted(true);
    if (setupTasks.length === 0 || blockedTasks.length > 0) {
      setCollapsed([]);
      return;
    }
    const id = `tr-${Date.now()}`;
    const leaver = chosenKind === 'Offboarding' ? selectedEmployee : undefined;
    const targetDate = leaver ? exitTargetDate(exit.dates) : hireDate;
    const target = new Date(targetDate);
    const days = Number.isNaN(target.getTime()) ?
    0 :
    Math.max(0, Math.round((target.getTime() - new Date('2026-09-16').getTime()) / (1000 * 60 * 60 * 24)));
    addTransition({
      id,
      kind: chosenKind,
      candidate: leaver ?
      {
        firstName: leaver.firstName,
        lastName: leaver.lastName,
        personalEmail: leaver.personalEmail,
        mobile: leaver.mobile,
        position: leaver.jobTitle,
        hireDate: targetDate,
        reportingManagerIds: managerIds,
        dateOfBirth: leaver.record.dob || undefined,
        address: leaver.record.permAddress || undefined
      } :
      {
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
        address: address.trim() || undefined
        // No employee form yet: one is linked when it is sent with Send Form.
      },
      exit: leaver ? { ...exit, employeeId: leaver.id, otherReason: exit.otherReason?.trim() || undefined } : undefined,
      templateId,
      templateName: template?.name ?? '',
      status: 'On Track',
      portalToken: `cnd-${Date.now().toString(16)}`,
      portalAccess: 'Active',
      portalExpiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      startedOn: new Date().toISOString().slice(0, 10),
      targetDate,
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
        detail: leaver ? `${template?.name} · ${exit.type}: ${exitReasonLabel(exit)}` : template?.name
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
            <WizardSteps steps={stepsFor(kind)} current={step} />
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
              {fromEmployee && selectedEmployee &&
            <div className="mb-5 flex items-center gap-2 rounded-lg bg-sky-50 px-3.5 py-2.5 text-[13px] text-sky-900 ring-1 ring-inset ring-sky-200">
                  <SparklesIcon className="h-4 w-4 shrink-0 text-sky-700" />
                  Started from {selectedEmployee.firstName} {selectedEmployee.lastName}&apos;s employee record.
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
                  {kind === 'Offboarding' &&
              <div>
                      <FieldGroup label="Select Employee" required>

                        <SearchableSelect
                    options={employeeOptions}
                    value={employeeId}
                    onChange={selectEmployee}
                    placeholder="Select an employee"
                    searchPlaceholder="Search by name, code or email"
                    emptyText="No active employees without an offboarding in progress"
                    withAvatars />

                      </FieldGroup>
                      <p className="mt-1.5 text-[12px] text-muted">
                        Active employees without an offboarding in progress. Their details are shown for
                        reference in the next step.
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

          {step === 1 && chosenKind === 'Offboarding' && selectedEmployee &&
          <>
              <ExitDetailsStep
              employee={selectedEmployee}
              exit={exit}
              onChange={setExit}
              dateUsage={dateUsage}
              templateName={template?.name ?? 'the selected template'}
              errors={exitErrors}
              showErrors={submitted} />

              {submitted && hasExitErrors(exitErrors) &&
            <p className="mt-5 text-[12px] text-red-600">Complete the highlighted fields to continue.</p>
            }
            </>
          }

          {step === 1 && chosenKind === 'Onboarding' &&
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

              <FieldGroup label="First Name" required hint={prefillHint('firstName')}>
                <Input
                value={firstName}
                onChange={(event) => setField('firstName', event.target.value)}
                aria-invalid={Boolean(showError('firstName'))}
                className={showError('firstName') ? 'border-red-300' : ''} />
                <FieldError message={showError('firstName')} />
              </FieldGroup>
              <FieldGroup label="Last Name" required hint={prefillHint('lastName')}>
                <Input
                value={lastName}
                onChange={(event) => setField('lastName', event.target.value)}
                aria-invalid={Boolean(showError('lastName'))}
                className={showError('lastName') ? 'border-red-300' : ''} />
                <FieldError message={showError('lastName')} />
              </FieldGroup>
              <FieldGroup label="Personal Email" required hint={prefillHint('email')}>
                <Input
                type="email"
                value={email}
                onChange={(event) => setField('email', event.target.value)}
                placeholder="name@example.com"
                aria-invalid={Boolean(showError('email'))}
                className={showError('email') ? 'border-red-300' : ''} />
                <FieldError message={showError('email')} />
              </FieldGroup>
              <FieldGroup label="Mobile Number" required hint={prefillHint('mobile')}>
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
              hint={prefillHint('jobTitle', 'from campaign')}>
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
              label="Hire Date"
              required
              hint={prefillHint('hireDate')}>
                <Input
                type="date"
                value={hireDate}
                onChange={(event) => setField('hireDate', event.target.value)}
                aria-invalid={Boolean(showError('hireDate'))}
                className={showError('hireDate') ? 'border-red-300' : ''} />
                <FieldError message={showError('hireDate')} />
              </FieldGroup>

              <FieldGroup label="Date of Birth" hint={prefillHint('dob')}>
                <Input type="date" value={dob} onChange={(event) => setField('dob', event.target.value)} />
              </FieldGroup>
              <FieldGroup label="Gender" hint={prefillHint('gender')}>
                <Select value={gender} onChange={(event) => setField('gender', event.target.value)}>
                  <option value="">Select gender</option>
                  {GENDERS.map((item) =>
                <option key={item} value={item}>
                      {item}
                    </option>
                )}
                </Select>
              </FieldGroup>
              <FieldGroup label="Country" hint={prefillHint('country')}>
                <Select value={country} onChange={(event) => setField('country', event.target.value)}>
                  <option value="">Select country</option>
                  {COUNTRIES.map((item) =>
                <option key={item} value={item}>
                      {item}
                    </option>
                )}
                </Select>
              </FieldGroup>
              <FieldGroup label="Address" hint={prefillHint('address')}>
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
                    {setupTasks.length} tasks across {departmentCount} departments
                  </p>
                  <p className="text-[12px] text-muted">
                    Due dates are calculated from the{' '}
                    {chosenKind === 'Offboarding' ? 'exit dates' : baseDateLabel(chosenKind).toLowerCase()} and can
                    be overridden per task. Adding or removing tasks changes this transition only, not the
                    template.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Segmented
                  size="sm"
                  options={[
                  { value: 'department', label: 'Department' },
                  ...(canGroupByTimeline ? [{ value: 'timeline' as const, label: 'Timeline' }] : [])]
                  }
                  value={canGroupByTimeline ? grouping : 'department'}
                  onChange={(next) => {
                    setGrouping(next);
                    setCollapsed([]);
                  }} />

                  <Button size="sm" onClick={() => setAddingTask((prev) => !prev)}>
                    <PlusIcon className="h-3.5 w-3.5" />
                    Add Task
                  </Button>
                </div>
              </div>

              {submitted && (blockedTasks.length > 0 || setupTasks.length === 0) &&
            <div className="mt-3 flex items-start gap-2.5 rounded-lg bg-red-50 px-3.5 py-3 ring-1 ring-inset ring-red-200">
                  <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  <p className="text-[13px] leading-relaxed text-red-800">
                    {setupTasks.length === 0 ?
                'Add at least one task to start the transition.' :
                <>
                        {blockedTasks.length === 1 ? '1 task still needs' : `${blockedTasks.length} tasks still need`}{' '}
                        attention:{' '}
                        {blockedTasks.map((task) => `${task.name} (${setupTaskProblem(task)})`).join(', ')}.
                      </>
                }
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
                    toTransitionTask(task, `st-${task.id}`, resolveRule(task.dueRule))]
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
                {groups.map((group) => {
                const isCollapsed = collapsed.includes(group.key);
                return (
                  <section key={group.key} className="overflow-hidden rounded-xl border border-line">
                      <button
                      type="button"
                      aria-expanded={!isCollapsed}
                      onClick={() =>
                      setCollapsed((prev) =>
                      prev.includes(group.key) ? prev.filter((key) => key !== group.key) : [...prev, group.key]
                      )
                      }
                      className="flex w-full items-center gap-2.5 bg-slate-50/70 px-4 py-2.5 text-left transition-colors duration-150 ease-out hover:bg-slate-100/70">

                        <ChevronDownIcon
                        className={`h-4 w-4 text-subtle transition-transform duration-150 ease-out ${
                        isCollapsed ? '-rotate-90' : ''}`
                        } />

                        <span className="text-[13px] font-medium text-ink">{group.label}</span>
                        <Badge>
                          {group.tasks.length} task{group.tasks.length === 1 ? '' : 's'}
                        </Badge>
                      </button>
                      {!isCollapsed &&
                    <div className="space-y-2 bg-white p-3">
                          {group.tasks.length === 0 &&
                      <p className="px-1 py-2 text-[12px] text-subtle">No tasks in this group.</p>
                      }
                          {group.tasks.map((task) =>
                      <TransitionTaskSetupCard
                        key={task.id}
                        task={task}
                        kind={chosenKind}
                        resolveRule={resolveRule}
                        showErrors={submitted}
                        ownerSearch={screenInit.ownerSearch?.taskId === task.taskId ? screenInit.ownerSearch.query : undefined}
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

/** Marks a field still holding the value Recruitment or the employee record supplied. Disappears once edited. */
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

/** The exit dates at least one template task uses, in Step 2 order. */
function offboardingDatesIn(usage: ReturnType<typeof exitDateUsage>) {
  return offboardingMilestones.filter((milestone) => (usage[milestone] ?? 0) > 0);
}
