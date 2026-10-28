import { useState } from 'react';
import { AlertTriangleIcon, CheckIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import type { AttentionEntry } from '../../utils/attention';

const PAGE = 4;

function ago(count: number): string {
  return `${count} day${count === 1 ? '' : 's'} ago`;
}

/** Overdue or blocked tasks, longest outstanding first. Resolve opens the task's side panel. */
export function NeedsAttention({
  entries,
  onResolve
}: {
  entries: AttentionEntry[];
  onResolve: (entry: AttentionEntry) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? entries : entries.slice(0, PAGE);

  return (
    <section className="rounded-xl border border-line bg-white p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-medium text-red-600">
          <AlertTriangleIcon className="h-[18px] w-[18px]" />
          Needs Attention
        </h2>
        {entries.length > PAGE &&
        <button
          type="button"
          onClick={() => setShowAll((prev) => !prev)}
          className="text-[13px] font-medium text-ink transition-colors duration-150 ease-out hover:text-brand-700">

            {showAll ? 'Show fewer' : `Show all ${entries.length}`}
          </button>
        }
      </div>

      {entries.length === 0 ?
      <p className="mt-4 rounded-lg border border-dashed border-line px-4 py-8 text-center text-[13px] text-muted">
          Nothing needs attention. No tasks are overdue or blocked.
        </p> :

      <ul className="mt-4 space-y-2.5">
          {shown.map((entry) => {
          const { transition, task, overdueDays, blocker, blockedDays, outstandingDays } = entry;
          const fullName = `${transition.candidate.firstName} ${transition.candidate.lastName}`;
          // A task that is both shows the one it has been outstanding on for longer.
          const blockedLeads = Boolean(blocker) && blockedDays >= overdueDays;
          const status = blocker && (blockedLeads || overdueDays === 0) ? 'Blocked' : 'Overdue';
          return (
            <li
              key={`${transition.id}-${task.id}`}
              className="flex items-center gap-3 rounded-lg border border-line px-3.5 py-2.5">

                <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                status === 'Blocked' ? 'bg-amber-400' : 'bg-red-500'}`
                }
                aria-hidden="true" />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] text-muted">{fullName}</p>
                  <p className="truncate text-[13px] font-medium text-ink">{task.name}</p>
                  {blocker &&
                <p className="truncate text-[11px] text-muted">Waiting on {blocker.name}</p>
                }
                </div>
                <div className="shrink-0 text-right leading-tight">
                  <p className="text-[13px] font-medium text-red-600">
                    {outstandingDays > 0 ? ago(outstandingDays) : 'Today'}
                  </p>
                  <p
                  className={`text-[11px] font-medium ${
                  status === 'Blocked' ? 'text-amber-600' : 'text-red-600'}`
                  }>

                    {status}
                  </p>
                </div>
                <Button size="sm" onClick={() => onResolve(entry)}>
                  <CheckIcon className="h-3.5 w-3.5" />
                  Resolve
                </Button>
              </li>);

        })}
        </ul>
      }
    </section>);

}
