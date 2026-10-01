import React, { useCallback, useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import {
  AlertTriangleIcon,
  CalendarIcon,
  CheckCircle2Icon,
  CircleDashedIcon,
  ClockIcon,
  HistoryIcon,
  MinusCircleIcon,
  SendIcon,
  XCircleIcon } from
'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Avatar, AvatarGroup } from '../../components/ui/Avatar';
import { Badge, PriorityBadge } from '../../components/ui/Badge';
import { CancelTransitionDialog } from '../../components/onboarding/CancelTransitionDialog';
import { Progress } from '../../components/ui/Progress';
import { Tabs } from '../../components/ui/Segmented';
import { TaskDetailPanel } from '../../components/tasks/TaskDetailPanel';
import { EmailHistory } from '../../components/onboarding/EmailHistory';
import { SubmissionPanel } from '../../components/onboarding/SubmissionPanel';
import { SendTransitionFormDialog } from '../../components/onboarding/SendTransitionFormDialog';
import { TaskStatusBadge } from '../../components/tasks/TaskStatusBadge';
import { dueLabel } from '../../components/tasks/OboTaskCard';
import { useAppData } from '../../contexts/AppDataContext';
import { peopleById } from '../../data/people';
import type {
  Department,
  Transition,
  TransitionTask,
  TransitionTaskStatus } from
'../../types';
import { formatDate, formatDateTime } from '../../utils/format';
import {
  canReceiveForm,
  daysLabel,
  isOverdue,
  managePermissionFor,
  statusGroup,
  transitionProgress } from
'../../utils/transitions';
import { useScreenInit } from '../../useScreenInit.js';

type View = 'tasks' | 'emails';

export function TransitionDetail() {
  const { transitionId } = useParams();
  const { transitions } = useAppData();
  const transition = transitions.find((item) => item.id === transitionId);
  if (!transition) return <Navigate to="/onboarding/transitions" replace />;
  return <TransitionView transition={transition} />;
}

function TransitionView({ transition }: {transition: Transition;}) {
  const {
    currentUserId,
    hasOboPermission,
    updateTaskStatus,
    cancelTransition,
    revokeEmail,
    forms,
    templates
  } = useAppData();
  const screenInit = useScreenInit() as {
    view?: View;
    openTask?: string;
    submission?: boolean;
    sendForm?: boolean;
    cancel?: boolean;
  };
  const [submissionEmailId, setSubmissionEmailId] = useState<string | null>(
    screenInit.submission ? transition.submissions[0]?.emailId ?? null : null
  );
  const [view, setView] = useState<View>(screenInit.view === 'emails' ? 'emails' : 'tasks');
  const [openTaskId, setOpenTaskId] = useState<string | null>(screenInit.openTask ?? null);
  const [confirmingCancel, setConfirmingCancel] = useState(Boolean(screenInit.cancel));
  const [notice, setNotice] = useState<string | null>(null);

  const fullName = `${transition.candidate.firstName} ${transition.candidate.lastName}`;
  const { done, total, percent } = transitionProgress(transition);
  const active = statusGroup(transition) === 'Active';
  const overdue = isOverdue(transition);
  const canCancel = active && hasOboPermission(managePermissionFor(transition.kind));
  const canSendForm = canReceiveForm(transition) && hasOboPermission('Manage Onboarding Transitions');
  const [sendingForm, setSendingForm] = useState(Boolean(screenInit.sendForm) && canSendForm);

  const grouped = useMemo(() => {
    const map = new Map<Department, TransitionTask[]>();
    transition.tasks.forEach((task) => {
      map.set(task.department, [...(map.get(task.department) ?? []), task]);
    });
    return Array.from(map.entries());
  }, [transition]);

  const openTask = transition.tasks.find((task) => task.id === openTaskId);
  const canUpdateOpenTask = Boolean(
    openTask &&
    active &&
    openTask.ownerIds.includes(currentUserId) &&
    hasOboPermission('Update Task Progress')
  );

  const closePanel = useCallback(() => setOpenTaskId(null), []);
  const closeSubmission = useCallback(() => setSubmissionEmailId(null), []);
  const shownSubmission = transition.submissions.find(
    (submission) => submission.emailId === submissionEmailId
  );
  const closeSendForm = useCallback(() => setSendingForm(false), []);
  const closeCancel = useCallback(() => setConfirmingCancel(false), []);

  const saveStatus = (status: TransitionTaskStatus) => {
    if (!openTask) return;
    updateTaskStatus(transition.id, openTask.id, status);
    setNotice(`${openTask.name} is now ${status.toLowerCase()}.`);
    setOpenTaskId(null);
  };

  return (
    <div>
      <PageHeader
        title={fullName}
        backTo="/onboarding/transitions"
        backLabel="Back to Transitions"
        meta={
        <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 text-[13px] text-ink">
              <span
              className={`h-2 w-2 rounded-full ${
              transition.kind === 'Onboarding' ? 'bg-emerald-500' : 'bg-violet-500'}`
              }
              aria-hidden="true" />

              {transition.kind}
            </span>
            <span className="text-[13px] text-muted">{transition.candidate.position}</span>
            <HealthBadge transition={transition} />
          </div>
        }
        actions={
        <div className="flex items-start gap-5">
            <div className="w-64">
              <div className="mb-1.5 flex items-center justify-between text-[12px]">
                <span className="text-muted">
                  {done}/{total} tasks complete
                </span>
                <span className="font-semibold text-ink">{percent}%</span>
              </div>
              <Progress value={percent} tone={overdue ? 'amber' : 'brand'} />
              <p
              className={`mt-2 text-right text-[12px] ${
              overdue ? 'font-medium text-red-600' : 'text-muted'}`
              }>

                {daysLabel(transition)} · {formatDate(transition.targetDate)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {canSendForm &&
            <Button size="sm" variant="primary" onClick={() => setSendingForm(true)}>
                  <SendIcon className="h-4 w-4" />
                  Send Form
                </Button>
            }
              {canCancel &&
            <Button
              size="sm"
              onClick={() => setConfirmingCancel(true)}
              className="text-red-600 ring-red-200 hover:bg-red-50">

                  <XCircleIcon className="h-4 w-4" />
                  Cancel Transition
                </Button>
            }
            </div>
          </div>
        } />


      <div className="px-8 py-6">
        {notice &&
        <div className="mb-4 rounded-lg bg-emerald-50 px-3.5 py-3 text-[13px] text-emerald-900 ring-1 ring-inset ring-emerald-200">
            {notice}
          </div>
        }

        {transition.cancellation &&
        <div className="mb-5 flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3.5 ring-1 ring-inset ring-slate-200">
            <XCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            <div className="min-w-0 text-[13px]">
              <p className="font-medium text-ink">
                Cancelled on {formatDate(transition.cancellation.date)} by{' '}
                {transition.cancellation.cancelledBy}
              </p>
              <p className="mt-1 whitespace-pre-line break-words leading-relaxed text-muted">
                <span className="font-medium text-ink">Reason:</span> {transition.cancellation.reason}
              </p>
            </div>
          </div>
        }

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Tabs
              options={[
              { value: 'tasks', label: 'Tasks', count: total },
              { value: 'emails', label: 'Email history', count: transition.emails.length }]
              }
              value={view}
              onChange={setView} />


            {view === 'tasks' &&
            <div className="mt-4 space-y-3">
                {grouped.map(([department, tasks]) =>
              <section key={department} className="overflow-hidden rounded-xl border border-line bg-white">
                    <div className="flex items-center gap-2.5 border-b border-line bg-slate-50/70 px-4 py-2.5">
                      <h2 className="text-[13px] font-medium text-ink">{department}</h2>
                      <Badge>{tasks.length} tasks</Badge>
                      <span className="ml-auto text-[12px] text-muted">
                        {tasks.filter((t) => t.status === 'Completed').length} complete
                      </span>
                    </div>
                    <ul className="divide-y divide-line">
                      {tasks.map((task) =>
                  <li key={task.id}>
                          <button
                      type="button"
                      onClick={() => {
                        setNotice(null);
                        setOpenTaskId(task.id);
                      }}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-150 ease-out hover:bg-slate-50/70">

                            <StatusIcon status={task.status} />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-[13px] font-medium text-ink">{task.name}</p>
                                {task.optional && <Badge>Optional</Badge>}
                              </div>
                              <p className="mt-0.5 text-[12px] text-muted">{task.description}</p>
                              <div className="mt-2 flex flex-wrap items-center gap-3">
                                <AvatarGroup
                            names={task.ownerIds.map((id) => peopleById[id]?.name ?? '')}
                            size="xs" />

                                <PriorityBadge priority={task.priority} />
                                <span className="inline-flex items-center gap-1.5 text-[12px] text-muted">
                                  <CalendarIcon className="h-3.5 w-3.5 text-subtle" />
                                  {task.dueDate ?
                            `${dueLabel(task)} ${formatDate(task.dueDate)}` :
                            'No due date set'}
                                </span>
                              </div>
                            </div>
                            <TaskStatusBadge status={task.status} />
                          </button>
                        </li>
                  )}
                    </ul>
                  </section>
              )}
              </div>
            }

            {view === 'emails' &&
            <EmailHistory
              transition={transition}
              onRevoke={(emailId) => {
                revokeEmail(transition.id, emailId);
                setNotice("The form was revoked and removed from the candidate's portal.");
              }}
              onViewSubmission={setSubmissionEmailId} />
            }
          </div>

          <aside className="space-y-4">
            <section className="rounded-xl border border-line bg-white p-5">
              <h2 className="text-[13px] font-medium text-ink">Candidate details</h2>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
                <Detail label="Personal email" value={transition.candidate.personalEmail} wide />
                <Detail label="Mobile number" value={transition.candidate.mobile} />
                <Detail label="Position" value={transition.candidate.position} />
                <Detail label="Hire date" value={formatDate(transition.candidate.hireDate)} />
                <Detail label="Country" value={transition.candidate.country ?? '—'} />
                <Detail label="Address" value={transition.candidate.address ?? '—'} wide />
                <Detail label="Date of birth" value={formatDate(transition.candidate.dateOfBirth)} />
                <Detail label="Gender" value={transition.candidate.gender ?? '—'} />
              </dl>
              <div className="mt-4 border-t border-line pt-3">
                <p className="text-[11px] uppercase tracking-wide text-subtle">Reporting managers</p>
                <ul className="mt-2 space-y-2">
                  {transition.candidate.reportingManagerIds.map((id) =>
                  <li key={id} className="flex items-center gap-2.5">
                      <Avatar name={peopleById[id]?.name ?? id} size="sm" />
                      <span className="min-w-0 leading-tight">
                        <span className="block truncate text-[13px] text-ink">{peopleById[id]?.name ?? id}</span>
                        <span className="block truncate text-[11px] text-muted">{peopleById[id]?.role}</span>
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            </section>


            <section className="rounded-xl border border-line bg-white p-5">
              <h2 className="text-[13px] font-medium text-ink">Key dates</h2>
              <ul className="mt-3 space-y-2.5 text-[13px]">
                <li className="flex items-center gap-2 text-muted">
                  <ClockIcon className="h-3.5 w-3.5 text-subtle" />
                  Started {formatDate(transition.startedOn)}
                </li>
                <li className="flex items-center gap-2 text-muted">
                  <CalendarIcon className="h-3.5 w-3.5 text-subtle" />
                  {transition.kind === 'Onboarding' ? 'Hire date' : 'Last working day'}{' '}
                  {formatDate(transition.candidate.hireDate)}
                </li>
                <li className="flex items-center gap-2 text-muted">
                  <CalendarIcon className="h-3.5 w-3.5 text-subtle" />
                  Target {formatDate(transition.targetDate)}
                </li>
              </ul>
            </section>

            <section className="rounded-xl border border-line bg-white p-5">
              <h2 className="text-[13px] font-medium text-ink">Audit trail</h2>
              <ol className="mt-3 space-y-3">
                {[...transition.auditTrail].
                sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).
                map((entry) =>
                <li key={entry.id} className="flex gap-2.5">
                      <HistoryIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-subtle" />
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-ink">{entry.action}</p>
                        <p className="text-[12px] text-muted">
                          {entry.actor} · {formatDateTime(entry.at)}
                        </p>
                        {entry.detail &&
                    <p className="mt-0.5 line-clamp-2 break-words text-[12px] text-muted">{entry.detail}</p>
                    }
                      </div>
                    </li>
                )}
              </ol>
            </section>
          </aside>
        </div>
      </div>

      <TaskDetailPanel
        transition={openTask ? transition : undefined}
        task={openTask}
        canUpdate={canUpdateOpenTask}
        onClose={closePanel}
        onSave={saveStatus} />


      <SendTransitionFormDialog
        open={sendingForm}
        recipients={[transition]}
        onClose={closeSendForm}
        onSent={(formName) => {
          setView('emails');
          setNotice(`${formName} was sent to ${transition.candidate.personalEmail}.`);
        }} />


      <SubmissionPanel
        open={Boolean(shownSubmission)}
        candidateName={fullName}
        form={forms.find((form) => form.id === shownSubmission?.formId)}
        submission={shownSubmission}
        onClose={closeSubmission} />


      <CancelTransitionDialog
        open={confirmingCancel}
        transition={transition}
        client={templates.find((template) => template.id === transition.templateId)?.client ?? '—'}
        onClose={closeCancel}
        onConfirm={(date, reason) => {
          cancelTransition(transition.id, date, reason);
          setConfirmingCancel(false);
          setNotice(`${fullName}'s ${transition.kind.toLowerCase()} was cancelled.`);
        }} />

    </div>);

}

function HealthBadge({ transition }: {transition: Transition;}) {
  const group = statusGroup(transition);
  if (group === 'Completed')
  return <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200">Completed</Badge>;
  if (group === 'Cancelled')
  return <Badge className="bg-slate-100 text-slate-600 ring-slate-200">Cancelled</Badge>;
  if (isOverdue(transition))
  return (
    <Badge className="bg-red-50 text-red-700 ring-red-200">
        <AlertTriangleIcon className="h-3 w-3" />
        Overdue
      </Badge>);

  return <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200">On track</Badge>;
}

function StatusIcon({ status }: {status: TransitionTask['status'];}) {
  if (status === 'Completed')
  return <CheckCircle2Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />;
  if (status === 'In Progress')
  return <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />;
  if (status === 'Skipped' || status === 'Cancelled')
  return <MinusCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />;
  return <CircleDashedIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />;
}

function Detail({ label, value, wide }: {label: string;value: string;wide?: boolean;}) {
  return (
    <div className={wide ? 'col-span-2 min-w-0' : 'min-w-0'}>
      <dt className="text-[11px] uppercase tracking-wide text-subtle">{label}</dt>
      <dd className="mt-0.5 break-words text-[13px] text-ink">{value}</dd>
    </div>);

}
