import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LockIcon, LockKeyholeIcon, XIcon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';
import { Avatar } from '../ui/Avatar';
import { DepartmentChip, PriorityBadge } from '../ui/Badge';
import { TaskStatusBadge } from './TaskStatusBadge';
import { peopleById } from '../../data/people';
import type { Transition, TransitionTask, TransitionTaskStatus } from '../../types';
import { formatDate } from '../../utils/format';
import { blockingTask } from '../../utils/transitions';
import { KindTag, dueLabel } from './OboTaskCard';

interface StatusOption {
  value: TransitionTaskStatus;
  label: string;
  description: string;
}

const STATUS_OPTIONS: StatusOption[] = [
{ value: 'Not Started', label: 'Not Started', description: 'Work on this task has not begun.' },
{ value: 'In Progress', label: 'In Progress', description: 'You are working on this task.' },
{ value: 'Completed', label: 'Completed', description: 'The task is done.' },
{ value: 'Skipped', label: 'Skipped', description: 'This optional task is not needed.' }];


export function TaskDetailPanel({
  transition,
  task,
  onClose,
  onSave,
  canUpdate = true
}: {
  transition: Transition | undefined;
  task: TransitionTask | undefined;
  onClose: () => void;
  onSave: (status: TransitionTaskStatus) => void;
  canUpdate?: boolean;
}) {
  const [status, setStatus] = useState<TransitionTaskStatus>(task?.status ?? 'Not Started');

  useEffect(() => {
    if (task) setStatus(task.status);
  }, [task]);

  return (
    <Drawer open={Boolean(transition && task)} label={task?.name ?? 'Task details'} onClose={onClose}>
      {transition && task &&
      <PanelBody
        transition={transition}
        task={task}
        status={status}
        onStatusChange={setStatus}
        onClose={onClose}
        onSave={() => onSave(status)}
        canUpdate={canUpdate} />
      }
    </Drawer>);

}

function PanelBody({
  transition,
  task,
  status,
  onStatusChange,
  onClose,
  onSave,
  canUpdate
}: {
  transition: Transition;
  task: TransitionTask;
  status: TransitionTaskStatus;
  onStatusChange: (status: TransitionTaskStatus) => void;
  onClose: () => void;
  onSave: () => void;
  canUpdate: boolean;
}) {
  const blocker = blockingTask(transition, task);
  const fullName = `${transition.candidate.firstName} ${transition.candidate.lastName}`;
  const options = STATUS_OPTIONS.filter((option) => option.value !== 'Skipped' || task.optional);

  return (
    <>
      <div className="flex items-start justify-between gap-3 border-b border-line px-6 py-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <KindTag kind={transition.kind} />
            {task.restricted &&
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted">
                <LockKeyholeIcon className="h-3 w-3" />
                Restricted
              </span>
            }
          </div>
          <h2 className="mt-2 text-base font-semibold text-ink">{task.name}</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">{task.description}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close task details"
          className="rounded-lg p-1.5 text-subtle transition-colors duration-150 ease-out hover:bg-slate-100 hover:text-ink">

          <XIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="scroll-thin flex-1 overflow-y-auto px-6 py-5">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-[13px]">
          <div className="col-span-2">
            <dt className="text-[11px] uppercase tracking-wide text-subtle">For</dt>
            <dd className="mt-0.5 text-ink">
              {fullName} <span className="text-muted">· {transition.candidate.position}</span>
            </dd>
            <Link
              to={`/onboarding/transitions/${transition.id}`}
              className="mt-0.5 inline-block text-[12px] text-brand-600 hover:underline">

              {transition.templateName}
            </Link>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-subtle">{dueLabel(task)}</dt>
            <dd className="mt-0.5 text-ink">{task.dueDate ? formatDate(task.dueDate) : 'No due date set'}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-subtle">Priority</dt>
            <dd className="mt-1">
              <PriorityBadge priority={task.priority} />
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-subtle">Department</dt>
            <dd className="mt-1">
              <DepartmentChip department={task.department} />
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-subtle">Status</dt>
            <dd className="mt-1">
              <TaskStatusBadge status={task.status} />
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-subtle">Optional</dt>
            <dd className="mt-0.5 text-ink">{task.optional ? 'Yes' : 'No'}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-subtle">In candidate events</dt>
            <dd className="mt-0.5 text-ink">{task.showInCandidateEvents ? 'Yes' : 'No'}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-[11px] uppercase tracking-wide text-subtle">Owners</dt>
            <dd>
              <ul className="mt-1.5 space-y-2">
                {task.ownerIds.map((id) =>
                <li key={id} className="flex items-center gap-2.5">
                    <Avatar name={peopleById[id]?.name ?? id} size="sm" />
                    <span className="leading-tight">
                      <span className="block text-ink">{peopleById[id]?.name ?? id}</span>
                      <span className="block text-[11px] text-muted">{peopleById[id]?.role}</span>
                    </span>
                  </li>
                )}
              </ul>
            </dd>
          </div>
        </dl>

        {blocker &&
        <div className="mt-5 flex items-start gap-2.5 rounded-lg bg-amber-50 px-3.5 py-3 ring-1 ring-inset ring-amber-200">
            <LockIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <p className="text-[13px] leading-relaxed text-amber-900">
              Waiting on <span className="font-medium">{blocker.name}</span> ({blocker.status.toLowerCase()}).
              This task can be completed once it is done.
            </p>
          </div>
        }

        {canUpdate &&
        <fieldset className="mt-6">
          <legend className="text-[13px] font-medium text-ink">Status</legend>
          <div className="mt-2 space-y-2">
            {options.map((option) => {
              const disabled = option.value === 'Completed' && Boolean(blocker);
              const selected = status === option.value;
              return (
                <label
                  key={option.value}
                  className={twMerge(
                    'flex items-start gap-3 rounded-lg border px-3.5 py-2.5 transition-colors duration-150 ease-out',
                    selected ? 'border-brand-400 bg-brand-50/50' : 'border-line',
                    disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-slate-300'
                  )}>

                  <input
                    type="radio"
                    name="task-status"
                    value={option.value}
                    checked={selected}
                    disabled={disabled}
                    onChange={() => onStatusChange(option.value)}
                    className="mt-0.5 h-4 w-4 border-slate-300 text-brand-500 focus:ring-brand-200" />

                  <span>
                    <span className="block text-[13px] font-medium text-ink">{option.label}</span>
                    <span className="block text-[12px] text-muted">
                      {disabled ? `Blocked until ${blocker?.name} is completed.` : option.description}
                    </span>
                  </span>
                </label>);

            })}
          </div>
        </fieldset>
        }
      </div>

      <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
        {canUpdate ?
        <>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="primary" disabled={status === task.status} onClick={onSave}>
              Update Status
            </Button>
          </> :

        <Button onClick={onClose}>Close</Button>
        }
      </div>
    </>);

}
