import { useEffect, useRef, useState } from 'react';
import { CheckIcon, ChevronDownIcon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import type { TransitionTaskStatus } from '../../types';
import { taskStatusStyles } from './TaskStatusBadge';

const STATUS_OPTIONS: TransitionTaskStatus[] = [
'Open',
'In Progress',
'On Hold',
'Completed',
'Cancelled'];

/** Task status dropdown. `compact` is the smaller size used inside a table row. */
export function StatusSelect({
  value,
  onChange,
  disabledReason = () => undefined,
  labelledBy,
  label,
  compact = false
}: {
  value: TransitionTaskStatus;
  onChange: (status: TransitionTaskStatus) => void;
  disabledReason?: (status: TransitionTaskStatus) => string | undefined;
  labelledBy?: string;
  label?: string;
  compact?: boolean;
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
        aria-labelledby={labelledBy}
        aria-label={label}
        onClick={() => setOpen((prev) => !prev)}
        className={twMerge(
          'flex w-full items-center justify-between gap-3 rounded-lg border border-line bg-white px-3 text-left transition-colors duration-150 ease-out hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-200',
          compact ? 'h-8 gap-2 px-2.5' : 'h-10'
        )}>

        <span
          className={twMerge(
            'flex items-center gap-2 whitespace-nowrap font-medium text-ink',
            compact ? 'text-[12px]' : 'text-[13px]'
          )}>

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
        aria-labelledby={labelledBy}
        aria-label={label}
        className="absolute right-0 z-20 mt-1.5 w-full min-w-[168px] overflow-hidden rounded-lg border border-line bg-white py-1 shadow-pop">

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
