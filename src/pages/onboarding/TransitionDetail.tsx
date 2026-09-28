import React, { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  CalendarIcon,
  CheckCircle2Icon,
  CircleDashedIcon,
  ClockIcon,
  MailIcon,
  PhoneIcon } from
'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Avatar, AvatarGroup } from '../../components/ui/Avatar';
import { Badge, DepartmentChip, PriorityBadge } from '../../components/ui/Badge';
import { Progress } from '../../components/ui/Progress';
import { Tabs } from '../../components/ui/Segmented';
import { useAppData } from '../../contexts/AppDataContext';
import { peopleById } from '../../data/people';
import type { Department, FormSubmissionStatus, TransitionTask } from '../../types';
import { formatDate } from '../../utils/format';
import { useScreenInit } from '../../useScreenInit.js';

type View = 'tasks' | 'emails' | 'details';

const formStatusStyles: Record<FormSubmissionStatus, string> = {
  'Not Sent': 'bg-slate-100 text-slate-700 ring-slate-200',
  Sent: 'bg-sky-50 text-sky-700 ring-sky-200',
  'In Progress': 'bg-amber-50 text-amber-700 ring-amber-200',
  Submitted: 'bg-emerald-50 text-emerald-700 ring-emerald-200'
};

export function TransitionDetail() {
  const { transitionId } = useParams();
  const { transitions, revokeEmail, resendEmail, setPortalAccess } = useAppData();
  const screenInit = useScreenInit();
  const [view, setView] = useState<View>(screenInit.view as View ?? 'tasks');

  const transition = transitions.find((item) => item.id === transitionId);
  if (!transition) return <Navigate to="/onboarding/transitions" replace />;

  const fullName = `${transition.candidate.firstName} ${transition.candidate.lastName}`;
  const done = transition.tasks.filter((task) => task.status === 'Completed').length;
  const progress = Math.round(done / Math.max(1, transition.tasks.length) * 100);

  const grouped = useMemo(() => {
    const map = new Map<Department, TransitionTask[]>();
    transition.tasks.forEach((task) => {
      map.set(task.department, [...(map.get(task.department) ?? []), task]);
    });
    return Array.from(map.entries());
  }, [transition]);

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
            <Badge
            className={
            transition.status === 'At Risk' ?
            'bg-amber-50 text-amber-700 ring-amber-200' :
            'bg-emerald-50 text-emerald-700 ring-emerald-200'
            }>
            
              {transition.status}
            </Badge>
            <Badge className={formStatusStyles[transition.formStatus]}>
              Employee form: {transition.formStatus}
            </Badge>
          </div>
        }
        actions={
        <div className="w-64">
            <div className="mb-1.5 flex items-center justify-between text-[12px]">
              <span className="text-muted">
                {done}/{transition.tasks.length} tasks complete
              </span>
              <span className="font-semibold text-ink">{progress}%</span>
            </div>
            <Progress value={progress} tone={transition.status === 'At Risk' ? 'amber' : 'brand'} />
            <p className="mt-2 text-right text-[12px] text-muted">
              {transition.daysRemaining} days remaining · {formatDate(transition.targetDate)}
            </p>
          </div>
        } />
      

      <div className="px-8 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Tabs
              options={[
              { value: 'tasks', label: 'Tasks', count: transition.tasks.length },
              { value: 'emails', label: 'Email history', count: transition.emails.length },
              { value: 'details', label: 'Candidate details' }]
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
                  <li key={task.id} className="flex items-start gap-3 px-4 py-3">
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
                                {task.dueDate ? formatDate(task.dueDate) : 'No due date set'}
                              </span>
                            </div>
                          </div>
                          <Badge
                      className={
                      task.status === 'Completed' ?
                      'bg-emerald-50 text-emerald-700 ring-emerald-200' :
                      task.status === 'In Progress' ?
                      'bg-amber-50 text-amber-700 ring-amber-200' :
                      'bg-slate-50 text-slate-600 ring-slate-200'
                      }>
                      
                            {task.status}
                          </Badge>
                        </li>
                  )}
                    </ul>
                  </section>
              )}
              </div>
            }

            {view === 'emails' &&
            <section className="mt-4 overflow-hidden rounded-xl border border-line bg-white">
                <div className="border-b border-line px-4 py-3">
                  <h2 className="text-[13px] font-medium text-ink">Emails sent to {fullName}</h2>
                </div>
                {transition.emails.length === 0 ?
              <p className="px-4 py-10 text-center text-[13px] text-muted">
                    No emails have been sent for this transition yet.
                  </p> :

              <ul className="divide-y divide-line">
                    {transition.emails.map((email) =>
                <li key={email.id} className="flex items-start gap-3 px-4 py-3.5">
                        <MailIcon className="mt-0.5 h-4 w-4 shrink-0 text-subtle" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-ink">{email.subject}</p>
                          <p className="mt-0.5 text-[12px] text-muted">
                            {email.recipient} · {email.sentAt}
                          </p>
                        </div>
                        <Badge
                    className={
                    email.status === 'Revoked' ?
                    'bg-red-50 text-red-700 ring-red-200' :
                    email.status === 'Opened' ?
                    'bg-emerald-50 text-emerald-700 ring-emerald-200' :
                    'bg-slate-50 text-slate-600 ring-slate-200'
                    }>
                    
                          {email.status}
                        </Badge>
                        <div className="flex items-center gap-1.5">
                          <Button size="sm" onClick={() => resendEmail(transition.id, email.id)}>
                            Resend
                          </Button>
                          <Button
                      size="sm"
                      variant="ghost"
                      disabled={email.status === 'Revoked'}
                      onClick={() => revokeEmail(transition.id, email.id)}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700 disabled:text-subtle">
                      
                            Revoke
                          </Button>
                        </div>
                      </li>
                )}
                  </ul>
              }
              </section>
            }

            {view === 'details' &&
            <section className="mt-4 rounded-xl border border-line bg-white p-5">
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Detail label="Personal email" value={transition.candidate.personalEmail} />
                  <Detail label="Mobile number" value={transition.candidate.mobile} />
                  <Detail label="Position" value={transition.candidate.position} />
                  <Detail label="Hire date" value={formatDate(transition.candidate.hireDate)} />
                  <Detail label="Country" value={transition.candidate.country ?? '—'} />
                  <Detail label="Address" value={transition.candidate.address ?? '—'} />
                  <Detail label="Date of birth" value={formatDate(transition.candidate.dateOfBirth)} />
                  <Detail label="Gender" value={transition.candidate.gender ?? '—'} />
                </dl>
                <div className="mt-5 border-t border-line pt-4">
                  <p className="text-[11px] uppercase tracking-wide text-subtle">Reporting managers</p>
                  <ul className="mt-2 space-y-2">
                    {transition.candidate.reportingManagerIds.map((id) =>
                  <li key={id} className="flex items-center gap-2.5">
                        <Avatar name={peopleById[id]?.name ?? id} size="sm" />
                        <span className="text-[13px] text-ink">{peopleById[id]?.name}</span>
                        <span className="text-[12px] text-muted">{peopleById[id]?.role}</span>
                      </li>
                  )}
                  </ul>
                </div>
              </section>
            }
          </div>

          <aside className="space-y-4">
            <section className="rounded-xl border border-line bg-white p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-[13px] font-medium text-ink">Candidate portal</h2>
                <Badge
                  className={
                  transition.portalAccess === 'Active' ?
                  'bg-emerald-50 text-emerald-700 ring-emerald-200' :
                  'bg-red-50 text-red-700 ring-red-200'
                  }>
                  
                  {transition.portalAccess}
                </Badge>
              </div>
              <p className="mt-2 font-mono text-[11px] text-subtle">
                accxis.lk/portal/{transition.portalToken}
              </p>
              <p className="mt-1 text-[12px] text-muted">
                Expires {formatDate(transition.portalExpiresAt)}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link to={`/portal/${transition.portalToken}`}>
                  <Button size="sm">Open portal</Button>
                </Link>
                {transition.portalAccess === 'Active' ?
                <Button
                  size="sm"
                  onClick={() => setPortalAccess(transition.id, 'Revoked')}
                  className="text-red-600 ring-red-200 hover:bg-red-50">
                  
                    Revoke access
                  </Button> :

                <Button size="sm" onClick={() => setPortalAccess(transition.id, 'Active')}>
                    Restore access
                  </Button>
                }
              </div>
            </section>

            <section className="rounded-xl border border-line bg-white p-5">
              <h2 className="text-[13px] font-medium text-ink">Form submission</h2>
              <p className="mt-2 text-[13px] text-muted">
                Employee data form status:{' '}
                <span className="font-medium text-ink">{transition.formStatus}</span>
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Button size="sm" variant="primary">
                  {transition.formStatus === 'Not Sent' ? 'Send form' : 'Send reminder'}
                </Button>
                <Button size="sm">View submission</Button>
              </div>
            </section>

            <section className="rounded-xl border border-line bg-white p-5">
              <h2 className="text-[13px] font-medium text-ink">Transition owners</h2>
              <ul className="mt-3 space-y-2.5">
                {transition.ownerIds.map((id) =>
                <li key={id} className="flex items-center gap-2.5">
                    <Avatar name={peopleById[id]?.name ?? id} size="sm" />
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block truncate text-[13px] text-ink">{peopleById[id]?.name}</span>
                      <span className="block truncate text-[11px] text-muted">{peopleById[id]?.role}</span>
                    </span>
                  </li>
                )}
              </ul>
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
                  Target {formatDate(transition.targetDate)}
                </li>
                <li className="flex items-center gap-2 text-muted">
                  <PhoneIcon className="h-3.5 w-3.5 text-subtle" />
                  {transition.candidate.mobile}
                </li>
              </ul>
            </section>

            <section className="rounded-xl border border-line bg-white p-5">
              <h2 className="text-[13px] font-medium text-ink">Departments involved</h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {grouped.map(([department, tasks]) =>
                <DepartmentChip key={department} department={`${department} · ${tasks.length}`} />
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>);

}

function StatusIcon({ status }: {status: TransitionTask['status'];}) {
  if (status === 'Completed')
  return <CheckCircle2Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />;
  if (status === 'In Progress')
  return <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />;
  return <CircleDashedIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />;
}

function Detail({ label, value }: {label: string;value: string;}) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-subtle">{label}</dt>
      <dd className="mt-0.5 text-[13px] text-ink">{value}</dd>
    </div>);

}