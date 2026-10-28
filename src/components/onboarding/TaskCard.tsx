import React from 'react';
import { CalendarIcon, CornerDownRightIcon, GripVerticalIcon, LockIcon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import type { Task } from '../../types';
import { peopleById } from '../../data/people';
import { formatDueRule } from '../../utils/format';
import { AvatarGroup } from '../ui/Avatar';
import { Badge, DepartmentChip, PriorityBadge } from '../ui/Badge';
import { Menu } from '../ui/Menu';
import { RESTRICTED_PERMISSION_NOTE, TASK_PERMISSION_NOTE } from '../../utils/library';

export function TaskCard({
  task,
  selected,
  onToggle,
  isChild,
  selectable = true,
  contextOnly = false,
  canOpen = true,
  canManage = true,
  inUseNote,
  onOpen,
  onEdit,
  onDuplicate,
  onAddChild,
  onDelete













}: {task: Task;selected: boolean;onToggle: (id: string) => void;isChild?: boolean;selectable?: boolean;/** A parent that does not match the search, shown only so its matching child has context. */contextOnly?: boolean;/** False for a restricted task the user may not open. */canOpen?: boolean;/** Whether the user holds Manage Task Library. */canManage?: boolean;/** Set when the task is in use, which blocks deleting it. */inUseNote?: string;onOpen?: (id: string) => void;onEdit?: (id: string) => void;onDuplicate?: (id: string) => void;onAddChild?: (id: string) => void;onDelete?: (id: string) => void;}) {
  const owners = task.ownerIds.map((id) => peopleById[id]?.name ?? 'Unassigned');
  const open = () => {
    if (canOpen) onOpen?.(task.id);
  };

  return (
    <div
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen && canOpen ? 0 : undefined}
      aria-disabled={onOpen && !canOpen ? true : undefined}
      title={!canOpen ? RESTRICTED_PERMISSION_NOTE : undefined}
      onClick={open}
      onKeyDown={(event) => {
        if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          open();
        }
      }}
      className={twMerge(
        'group flex items-start gap-3 rounded-xl border bg-white px-4 py-3.5 transition-colors duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200',
        selected ? 'border-brand-300 bg-brand-50/40' : 'border-line hover:border-slate-300',
        onOpen && canOpen && 'cursor-pointer',
        contextOnly && 'border-dashed bg-slate-50/60 opacity-70',
        isChild && 'ml-9'
      )}>
      
      <button
        type="button"
        aria-label={`Reorder ${task.name}`}
        onClick={(event) => event.stopPropagation()}
        className="mt-0.5 cursor-grab text-slate-300 transition-colors duration-150 ease-out hover:text-subtle">
        
        <GripVerticalIcon className="h-4 w-4" />
      </button>

      {selectable && !contextOnly &&
      <input
        type="checkbox"
        checked={selected}
        onClick={(event) => event.stopPropagation()}
        onChange={() => onToggle(task.id)}
        aria-label={`Select ${task.name}`}
        className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-500 focus:ring-brand-200" />
      }

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {isChild && <CornerDownRightIcon className="h-3.5 w-3.5 text-subtle" />}
          <span className="font-mono text-[11px] font-medium text-subtle">{task.code}</span>
          <h3 className="text-sm font-medium text-ink">{task.name}</h3>
          {contextOnly &&
          <span className="text-[11px] italic text-muted">Parent task, shown for context</span>
          }
          {task.ownerOnlyVisible &&
          <Badge className="bg-violet-50 text-violet-700 ring-violet-200">
              <LockIcon className="h-3 w-3" />
              Restricted
            </Badge>
          }
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
        {
          label: 'Edit task',
          disabled: !canManage || !canOpen,
          hint: !canManage ? TASK_PERMISSION_NOTE : RESTRICTED_PERMISSION_NOTE,
          onSelect: () => onEdit?.(task.id)
        },
        {
          label: 'Duplicate task',
          disabled: !canManage || !canOpen,
          hint: !canManage ? TASK_PERMISSION_NOTE : RESTRICTED_PERMISSION_NOTE,
          onSelect: () => onDuplicate?.(task.id)
        },
        {
          label: 'Add child task',
          // Only top-level tasks can be parents.
          disabled: !canManage || Boolean(task.parentId),
          hint: !canManage ? TASK_PERMISSION_NOTE : 'A child task cannot have child tasks of its own',
          onSelect: () => onAddChild?.(task.id)
        },
        {
          label: 'Delete task',
          danger: true,
          disabled: !canManage || Boolean(inUseNote),
          hint: !canManage ? TASK_PERMISSION_NOTE : `${inUseNote}, so it cannot be deleted`,
          onSelect: () => onDelete?.(task.id)
        }]
        } />
      
    </div>);

}