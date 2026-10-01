import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckIcon, ChevronDownIcon, LockIcon, LockKeyholeIcon, XIcon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';
import { Avatar } from '../ui/Avatar';
import { DepartmentChip, PriorityBadge } from '../ui/Badge';
import { TaskStatusBadge, taskStatusStyles } from './TaskStatusBadge';
import { TaskFiles } from './TaskFiles';
import { useAppData } from '../../contexts/AppDataContext';
import { peopleById } from '../../data/people';
import type { Transition, TransitionTask, TransitionTaskStatus } from '../../types';
import { formatDate } from '../../utils/format';
import { blockingTask } from '../../utils/transitions';
import { KindTag, dueLabel } from './OboTaskCard';

const STATUS_OPTIONS: TransitionTaskStatus[] = [
'Open',
'In Progress',
'On Hold',
'Completed',
'Cancelled'];


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
  const [status, setStatus] = useState<TransitionTaskStatus>(task?.status ?? 'Open');

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
  const { tasks } = useAppData();
  const blocker = blockingTask(transition, task);
  // Files are attached to the task in the library, not to each transition's copy of it.
  const files = tasks.find((item) => item.id === task.taskId)?.files ?? [];
  const fullName = `${transition.candidate.firstName} ${transition.candidate.lastName}`;

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
        {canUpdate &&
        <div className="mb-6 border-b border-line pb-5">
            <p id="task-status-label" className="text-[13px] font-medium text-ink">
              Update status
            </p>
            <div className="mt-2">
              <StatusSelect
              value={status}
              onChange={onStatusChange}
              disabledReason={(option) =>
              option === 'Completed' && blocker ? `Blocked until ${blocker.name} is completed` : undefined
              } />

            </div>
          </div>
        }
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
          <div className="col-span-2">
            <dt className="text-[11px] uppercase tracking-wide text-subtle">Attached files</dt>
            <dd>
              <TaskFiles files={files} taskName={task.name} />
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

function StatusSelect({
  value,
  onChange,
  disabledReason
}: {
  value: TransitionTaskStatus;
  onChange: (status: TransitionTaskStatus) => void;
  disabledReason: (status: TransitionTaskStatus) => string | undefined;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby="task-status-label"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-10 w-full items-center justify-between gap-3 rounded-lg border border-line bg-white px-3 text-left transition-colors duration-150 ease-out hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-200">

        <span className="flex items-center gap-2 text-[13px] font-medium text-ink">
          <span className={`h-2 w-2 rounded-full ${taskStatusStyles[value].dot}`} />
          {value}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-subtle transition-transform duration-150 ease-out ${
          open ? 'rotate-180' : ''}`
          } />

      </button>

      {open &&
      <ul
        role="listbox"
        aria-labelledby="task-status-label"
        className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-lg border border-line bg-white py-1 shadow-pop">

          {STATUS_OPTIONS.map((option) => {
          const reason = disabledReason(option);
          const selected = option === value;
          return (
            <li key={option}>
                <button
                type="button"
                role="option"
                aria-selected={selected}
                disabled={Boolean(reason)}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className={twMerge(
                  'flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors duration-150 ease-out',
                  selected ? 'bg-slate-50' : 'hover:bg-slate-50',
                  reason ? 'cursor-not-allowed opacity-50 hover:bg-white' : ''
                )}>

                  <span className={`h-2 w-2 shrink-0 rounded-full ${taskStatusStyles[option].dot}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-ink">{option}</span>
                    {reason && <span className="block text-[12px] text-muted">{reason}</span>}
                  </span>
                  {selected && <CheckIcon className="h-4 w-4 shrink-0 text-brand-600" />}
                </button>
              </li>);

        })}
        </ul>
      }
    </div>);

}
