import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRightIcon,
  ClipboardListIcon,
  ClockIcon,
  LayoutTemplateIcon,
  UserMinusIcon,
  UserPlusIcon } from
'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Avatar, AvatarGroup } from '../../components/ui/Avatar';
import { Badge, DepartmentChip, PriorityBadge } from '../../components/ui/Badge';
import { Progress } from '../../components/ui/Progress';
import { useAppData } from '../../contexts/AppDataContext';
import { peopleById } from '../../data/people';
import { formatDate } from '../../utils/format';

export function Overview() {
  const { transitions, tasks, templates } = useAppData();
  const onboarding = transitions.filter((t) => t.kind === 'Onboarding');
  const offboarding = transitions.filter((t) => t.kind === 'Offboarding');

  const progressOf = (id: string) => {
    const transition = transitions.find((t) => t.id === id)!;
    const done = transition.tasks.filter((task) => task.status === 'Completed').length;
    return Math.round(done / Math.max(1, transition.tasks.length) * 100);
  };

  const dueSoon = transitions.
  flatMap((transition) =>
  transition.tasks.
  filter((task) => task.status !== 'Completed').
  slice(0, 2).
  map((task) => ({ transition, task }))
  ).
  slice(0, 6);

  const spotlight = onboarding[0];

  return (
    <div>
      <PageHeader
        title="Onboarding & Offboarding"
        subtitle="Track every joiner and leaver, the tasks behind them and the teams responsible."
        actions={
        <>
            <Link to="/onboarding/templates">
              <Button>Manage templates</Button>
            </Link>
            <Link to="/onboarding/transitions/new">
              <Button variant="primary">
                <UserPlusIcon className="h-4 w-4" />
                New transition
              </Button>
            </Link>
          </>
        } />
      

      <div className="px-8 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2">
            {spotlight &&
            <article className="rounded-xl border border-line bg-white p-6 shadow-card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <Avatar
                    name={`${spotlight.candidate.firstName} ${spotlight.candidate.lastName}`}
                    size="lg" />
                  
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-ink">
                          {spotlight.candidate.firstName} {spotlight.candidate.lastName}
                        </h2>
                        <Badge className="bg-brand-50 text-brand-700 ring-brand-200">
                          Closest start date
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-[13px] text-muted">
                        {spotlight.candidate.position} · Joins {formatDate(spotlight.candidate.hireDate)}
                      </p>
                      <p className="mt-0.5 text-[13px] text-muted">{spotlight.templateName}</p>
                    </div>
                  </div>
                  <Link to={`/onboarding/transitions/${spotlight.id}`}>
                    <Button>
                      View details
                      <ArrowRightIcon className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                <div className="mt-6 flex items-end justify-between gap-6">
                  <div className="flex-1">
                    <div className="mb-1.5 flex items-center justify-between text-[12px]">
                      <span className="text-muted">
                        {spotlight.tasks.filter((t) => t.status === 'Completed').length} of{' '}
                        {spotlight.tasks.length} tasks complete
                      </span>
                      <span className="font-semibold text-ink">{progressOf(spotlight.id)}%</span>
                    </div>
                    <Progress value={progressOf(spotlight.id)} />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold tracking-tight text-ink">
                      {spotlight.daysRemaining}
                    </p>
                    <p className="text-[11px] uppercase tracking-wide text-subtle">days remaining</p>
                  </div>
                </div>
              </article>
            }

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                icon={UserPlusIcon}
                label="Active onboardings"
                value={onboarding.length}
                accent="text-brand-600" />
              
              <StatCard
                icon={UserMinusIcon}
                label="Active offboardings"
                value={offboarding.length}
                accent="text-slate-600" />
              
              <StatCard
                icon={LayoutTemplateIcon}
                label="Templates in use"
                value={templates.length}
                accent="text-slate-600" />
              
            </div>

            <section className="mt-6 rounded-xl border border-line bg-white shadow-card">
              <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                <h2 className="text-sm font-semibold text-ink">Tasks needing attention</h2>
                <Link
                  to="/onboarding/transitions"
                  className="text-[13px] text-brand-600 transition-colors duration-150 ease-out hover:text-brand-700">
                  
                  All transitions
                </Link>
              </div>
              <ul className="divide-y divide-line">
                {dueSoon.map(({ transition, task }) =>
                <li key={`${transition.id}-${task.id}`} className="flex items-center gap-4 px-5 py-3">
                    <ClipboardListIcon className="h-4 w-4 shrink-0 text-subtle" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink">{task.name}</p>
                      <p className="truncate text-[12px] text-muted">
                        {transition.candidate.firstName} {transition.candidate.lastName} ·{' '}
                        {transition.kind}
                      </p>
                    </div>
                    <DepartmentChip department={task.department} />
                    <PriorityBadge priority={task.priority} />
                    <span className="w-24 text-right text-[12px] text-muted">
                      {formatDate(task.dueDate)}
                    </span>
                  </li>
                )}
              </ul>
            </section>
          </section>

          <aside className="space-y-6">
            <section className="rounded-xl border border-line bg-white shadow-card">
              <div className="border-b border-line px-5 py-3.5">
                <h2 className="text-sm font-semibold text-ink">In flight</h2>
              </div>
              <ul className="divide-y divide-line">
                {transitions.slice(0, 5).map((transition) =>
                <li key={transition.id} className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                      transition.kind === 'Onboarding' ? 'bg-emerald-500' : 'bg-violet-500'}`
                      }
                      aria-hidden="true" />
                    
                      <Link
                      to={`/onboarding/transitions/${transition.id}`}
                      className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink transition-colors duration-150 ease-out hover:text-brand-600">
                      
                        {transition.candidate.firstName} {transition.candidate.lastName}
                      </Link>
                      <span className="text-[12px] font-medium text-muted">
                        {progressOf(transition.id)}%
                      </span>
                    </div>
                    <div className="mt-2 pl-5">
                      <Progress
                      value={progressOf(transition.id)}
                      tone={transition.status === 'At Risk' ? 'amber' : 'brand'} />
                    
                      <div className="mt-2 flex items-center justify-between">
                        <AvatarGroup
                        names={transition.ownerIds.map((id) => peopleById[id]?.name ?? '')}
                        size="xs" />
                      
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                          <ClockIcon className="h-3 w-3" />
                          {transition.daysRemaining} days
                        </span>
                      </div>
                    </div>
                  </li>
                )}
              </ul>
            </section>

            <section className="rounded-xl border border-line bg-white p-5 shadow-card">
              <h2 className="text-sm font-semibold text-ink">Task library</h2>
              <p className="mt-1 text-[13px] text-muted">
                {tasks.filter((t) => t.kind === 'Onboarding').length} onboarding and{' '}
                {tasks.filter((t) => t.kind === 'Offboarding').length} offboarding tasks are available
                across {templates.length} templates.
              </p>
              <Link to="/onboarding/templates" className="mt-4 inline-block">
                <Button size="sm">Open task library</Button>
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </div>);

}

function StatCard({
  icon: Icon,
  label,
  value,
  accent





}: {icon: React.ComponentType<{className?: string;}>;label: string;value: number;accent: string;}) {
  return (
    <div className="rounded-xl border border-line bg-white px-5 py-4 shadow-card">
      <Icon className={`h-4 w-4 ${accent}`} />
      <p className="mt-3 text-2xl font-semibold tracking-tight text-ink">{value}</p>
      <p className="mt-0.5 text-[12px] text-muted">{label}</p>
    </div>);

}