import React from 'react';
import { CalendarIcon, CornerDownRightIcon, GripVerticalIcon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import type { Task } from '../../types';
import { peopleById } from '../../data/people';
import { formatDueRule } from '../../utils/format';
import { AvatarGroup } from '../ui/Avatar';
import { Badge, DepartmentChip, PriorityBadge } from '../ui/Badge';
import { Menu } from '../ui/Menu';

export function TaskCard({
  task,
  selected,
  onToggle,
  isChild,
  onDelete






}: {task: Task;selected: boolean;onToggle: (id: string) => void;isChild?: boolean;onDelete?: (id: string) => void;}) {
  const owners = task.ownerIds.map((id) => peopleById[id]?.name ?? 'Unassigned');

  return (
    <div
      className={twMerge(
        'group flex items-start gap-3 rounded-xl border bg-white px-4 py-3.5 transition-colors duration-150 ease-out',
        selected ? 'border-brand-300 bg-brand-50/40' : 'border-line hover:border-slate-300',
        isChild && 'ml-9'
      )}>
      
      <button
        type="button"
        aria-label={`Reorder ${task.name}`}
        className="mt-0.5 cursor-grab text-slate-300 transition-colors duration-150 ease-out hover:text-subtle">
        
        <GripVerticalIcon className="h-4 w-4" />
      </button>

      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggle(task.id)}
        aria-label={`Select ${task.name}`}
        className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-500 focus:ring-brand-200" />
      

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {isChild && <CornerDownRightIcon className="h-3.5 w-3.5 text-subtle" />}
          <span className="font-mono text-[11px] font-medium text-subtle">{task.code}</span>
          <h3 className="text-sm font-medium text-ink">{task.name}</h3>
          {task.optional && <Badge className="bg-slate-50 text-slate-600 ring-slate-200">Optional</Badge>}
          {task.showInCandidateEvents &&
          <Badge className="bg-sky-50 text-sky-700 ring-sky-200">In candidate events</Badge>
          }
        </div>
        <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-muted">{task.description}</p>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <AvatarGroup names={owners} size="xs" />
          <DepartmentChip department={task.department} />
          <PriorityBadge priority={task.priority} />
          <span className="inline-flex items-center gap-1.5 text-[12px] text-muted">
            <CalendarIcon className="h-3.5 w-3.5 text-subtle" />
            {formatDueRule(task.dueRule)}
          </span>
        </div>
      </div>

      <Menu
        label={`Actions for ${task.name}`}
        items={[
        { label: 'Edit task' },
        { label: 'Duplicate task' },
        { label: 'Add child task' },
        { label: 'Delete task', danger: true, onSelect: () => onDelete?.(task.id) }]
        } />
      
    </div>);

}