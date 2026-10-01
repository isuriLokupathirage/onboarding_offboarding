import React from 'react';
import { CalendarIcon, LockIcon, LockKeyholeIcon, UserIcon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { Button } from '../ui/Button';
import { PriorityBadge } from '../ui/Badge';
import type { Transition, TransitionKind, TransitionTask } from '../../types';
import { formatDate } from '../../utils/format';
import { blockingTask } from '../../utils/transitions';

export function dueLabel(task: TransitionTask): string {
  return task.dueSource === 'override' ? 'Exact date' : 'Due';
}

export function KindTag({ kind }: {kind: TransitionKind;}) {
  return (
    <span
      className={twMerge(
        'inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset',
        kind === 'Onboarding' ?
        'bg-emerald-50 text-emerald-700 ring-emerald-200' :
        'bg-violet-50 text-violet-700 ring-violet-200'
      )}>

      {kind}
    </span>);

}

const statusStyles: Partial<Record<TransitionTask['status'], string>> = {
  Open: 'bg-slate-50 text-slate-600',
  'In Progress': 'bg-sky-50 text-sky-700'
};

export function OboTaskCard({
  transition,
  task,
  onOpen
}: {
  transition: Transition;
  task: TransitionTask;
  onOpen: () => void;
}) {
  const blocker = blockingTask(transition, task);
  const fullName = `${transition.candidate.firstName} ${transition.candidate.lastName}`;

  return (
    <article className="flex flex-col rounded-xl border border-line bg-white p-5 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <KindTag kind={transition.kind} />
        <span
          className={twMerge(
            'rounded-md px-2 py-0.5 text-[12px] font-medium',
            statusStyles[task.status] ?? 'bg-slate-50 text-slate-600'
          )}>

          {task.status}
        </span>
      </div>

      <h3 className="mt-3 truncate text-[15px] font-semibold text-ink" title={task.name}>
        {task.name}
      </h3>
      <p className="truncate text-[12px] text-muted" title={transition.templateName}>
        {transition.templateName}
      </p>

      <ul className="mt-3 space-y-2 text-[13px] text-ink">
        <li className="flex items-center gap-2">
          <UserIcon className="h-3.5 w-3.5 shrink-0 text-subtle" />
          <span className="truncate">
            {fullName} <span className="text-muted">· {transition.candidate.position}</span>
          </span>
        </li>
        <li className="flex items-center gap-2">
          <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-subtle" />
          {task.dueDate ?
          <span>
              <span className="text-muted">{dueLabel(task)}</span> {formatDate(task.dueDate)}
            </span> :

          <span className="text-muted">No due date set</span>
          }
        </li>
        <li className="flex flex-wrap items-center gap-2">
          <PriorityBadge priority={task.priority} />
          {task.restricted &&
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted">
              <LockKeyholeIcon className="h-3 w-3" />
              Restricted
            </span>
          }
        </li>
      </ul>

      <div className="mt-auto pt-4">
        {blocker &&
        <p className="mb-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-[12px] text-amber-900 ring-1 ring-inset ring-amber-200">
            <LockIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />
            <span>
              Waiting on <span className="font-medium">{blocker.name}</span>
            </span>
          </p>
        }
        <Button className="w-full" onClick={onOpen}>
          Open Task
        </Button>
      </div>
    </article>);

}
