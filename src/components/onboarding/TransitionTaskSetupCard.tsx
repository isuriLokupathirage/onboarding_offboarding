import React, { useState } from 'react';
import { AlertCircleIcon, CalendarIcon, PencilIcon, RotateCcwIcon, Trash2Icon } from 'lucide-react';
import type { Milestone, TransitionTask } from '../../types';
import { Badge, DepartmentChip, PriorityBadge } from '../ui/Badge';
import { Input, Select } from '../ui/Field';
import { PillToggle } from '../ui/Toggle';
import { PeoplePicker } from '../common/PeoplePicker';
import { milestones } from '../../data/people';
import { formatDate, resolveDueDate } from '../../utils/format';

export function TransitionTaskSetupCard({
  task,
  hireDate,
  showDateError,
  onChange,
  onRemove






}: {task: TransitionTask;hireDate: string;showDateError: boolean;onChange: (patch: Partial<TransitionTask>) => void;onRemove: () => void;}) {
  const [editing, setEditing] = useState(false);
  const [mode, setMode] = useState<'relative' | 'exact'>('relative');
  const [amount, setAmount] = useState('3');
  const [unit, setUnit] = useState<'days' | 'weeks' | 'months'>('days');
  const [direction, setDirection] = useState<'before' | 'after'>('after');
  const [milestone, setMilestone] = useState<Milestone>('Hire Date');

  const dateRequired = task.showInCandidateEvents;
  const dateMissing = !task.dueDate;
  const invalid = dateRequired && dateMissing && showDateError;

  const applyRelative = (next: {
    amount?: string;
    unit?: 'days' | 'weeks' | 'months';
    direction?: 'before' | 'after';
    milestone?: Milestone;
  }) => {
    const value = {
      amount: next.amount ?? amount,
      unit: next.unit ?? unit,
      direction: next.direction ?? direction,
      milestone: next.milestone ?? milestone
    };
    setAmount(value.amount);
    setUnit(value.unit);
    setDirection(value.direction);
    setMilestone(value.milestone);
    const resolved = resolveDueDate(
      {
        kind: 'relative',
        amount: Number(value.amount) || 0,
        unit: value.unit,
        direction: value.direction,
        milestone: value.milestone
      },
      hireDate
    );
    onChange({ dueDate: resolved, dueSource: 'override' });
  };

  return (
    <div
      className={`rounded-xl border bg-white p-4 ${
      invalid ? 'border-red-300 ring-1 ring-red-100' : 'border-line'}`
      }>
      
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-[13px] font-medium text-ink">{task.name}</h4>
            {task.optional && <Badge>Optional</Badge>}
            {task.showInCandidateEvents &&
            <Badge className="bg-sky-50 text-sky-700 ring-sky-200">In candidate events</Badge>
            }
          </div>
          <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-muted">{task.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <DepartmentChip department={task.department} />
            <PriorityBadge priority={task.priority} />
          </div>
        </div>
        <button
          type="button"
          aria-label={`Remove ${task.name}`}
          onClick={onRemove}
          className="rounded-lg p-1.5 text-subtle transition-colors duration-150 ease-out hover:bg-red-50 hover:text-red-600">
          
          <Trash2Icon className="h-4 w-4" />
        </button>
      </div>

      <div
        className={`mt-3 rounded-lg px-3 py-2.5 ring-1 ring-inset ${
        dateMissing ?
        invalid ?
        'bg-red-50 ring-red-200' :
        'bg-amber-50 ring-amber-200' :
        'bg-slate-50 ring-line'}`
        }>
        
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {dateMissing ?
          <span
            className={`inline-flex items-center gap-2 text-[12px] ${
            invalid ? 'text-red-800' : 'text-amber-900'}`
            }>
            
              <AlertCircleIcon className="h-4 w-4 shrink-0" />
              {dateRequired ?
            'A date is required because this task appears in the candidate\u2019s events.' :
            'This task has no due date rule. Set a date for this transition.'}
            </span> :

          <>
              <span className="inline-flex items-center gap-2 text-[12px] text-ink">
                <CalendarIcon className="h-3.5 w-3.5 text-subtle" />
                Due {formatDate(task.dueDate)}
              </span>
              <Badge
              className={
              task.dueSource === 'override' ?
              'bg-brand-50 text-brand-700 ring-brand-200' :
              'bg-white text-muted ring-line'
              }>
              
                {task.dueSource === 'override' ? 'Overridden' : 'Calculated from hire date'}
              </Badge>
            </>
          }

          <div className="ml-auto flex items-center gap-2">
            {task.dueSource === 'override' && task.calculatedDueDate &&
            <button
              type="button"
              onClick={() => {
                onChange({ dueDate: task.calculatedDueDate, dueSource: 'calculated' });
                setEditing(false);
              }}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[12px] text-muted transition-colors duration-150 ease-out hover:bg-white hover:text-ink">
              
                <RotateCcwIcon className="h-3.5 w-3.5" />
                Reset
              </button>
            }
            <button
              type="button"
              onClick={() => setEditing((prev) => !prev)}
              aria-expanded={editing}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[12px] font-medium text-brand-700 transition-colors duration-150 ease-out hover:bg-white">
              
              <PencilIcon className="h-3.5 w-3.5" />
              {editing ? 'Close' : dateMissing ? 'Set date' : 'Change date'}
            </button>
          </div>
        </div>

        {editing &&
        <div className="mt-3 border-t border-white/70 pt-3">
            <PillToggle
            options={[
            { value: 'relative', label: 'Due date rule' },
            { value: 'exact', label: 'Exact date' }]
            }
            value={mode}
            onChange={setMode} />
          

            {mode === 'relative' ?
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <Input
              type="number"
              min={0}
              value={amount}
              onChange={(event) => applyRelative({ amount: event.target.value })}
              aria-label={`Offset amount for ${task.name}`}
              className="h-9 w-20 bg-white" />
            
                <Select
              value={unit}
              onChange={(event) => applyRelative({ unit: event.target.value as typeof unit })}
              aria-label={`Offset unit for ${task.name}`}
              className="h-9 w-28 bg-white">
              
                  <option value="days">days</option>
                  <option value="weeks">weeks</option>
                  <option value="months">months</option>
                </Select>
                <Select
              value={direction}
              onChange={(event) =>
              applyRelative({ direction: event.target.value as typeof direction })
              }
              aria-label={`Offset direction for ${task.name}`}
              className="h-9 w-28 bg-white">
              
                  <option value="before">before</option>
                  <option value="after">after</option>
                </Select>
                <Select
              value={milestone}
              onChange={(event) => applyRelative({ milestone: event.target.value as Milestone })}
              aria-label={`Milestone for ${task.name}`}
              className="h-9 w-52 bg-white">
              
                  {milestones.map((option) =>
              <option key={option} value={option}>
                      {option}
                    </option>
              )}
                </Select>
              </div> :

          <div className="mt-2.5">
                <Input
              type="date"
              value={task.dueDate ?? ''}
              onChange={(event) =>
              onChange({ dueDate: event.target.value || null, dueSource: 'override' })
              }
              aria-label={`Exact due date for ${task.name}`}
              className="h-9 w-48 bg-white" />
            
              </div>
          }
          </div>
        }
      </div>

      <div className="mt-3">
        <p className="mb-1.5 text-[12px] font-medium text-ink">Task owners</p>
        <PeoplePicker
          selectedIds={task.ownerIds}
          onChange={(ids) => onChange({ ownerIds: ids })}
          placeholder="Search to add an owner"
          emptyHint="No owners assigned yet" />
        
      </div>
    </div>);

}