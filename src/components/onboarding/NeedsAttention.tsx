import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangleIcon, CheckIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { Segmented } from '../ui/Segmented';
import type { AttentionEntry } from '../../utils/attention';

/** How many entries the dashboard lists. The rest are reached through View All. */
const MAX_ENTRIES = 5;

type View = 'overdue' | 'blocked';

function outstanding(days: number): string {
  if (days <= 0) return 'Today';
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

/**
 * Overdue or blocked tasks, longest outstanding first, switched with Overdue / Blocked.
 * View All opens the Transitions list on the same filter; Resolve opens the task's side panel.
 */
export function NeedsAttention({
  entries,
  onResolve,
  initialView = 'overdue'




}: {entries: AttentionEntry[];onResolve: (entry: AttentionEntry) => void;initialView?: View;}) {
  const [view, setView] = useState<View>(initialView);
  const overdue = entries.filter((entry) => entry.overdueDays > 0).sort((a, b) => b.overdueDays - a.overdueDays);
  const blocked = entries.filter((entry) => entry.blocker).sort((a, b) => b.blockedDays - a.blockedDays);
  const listed = view === 'overdue' ? overdue : blocked;
  const shown = listed.slice(0, MAX_ENTRIES);

  return (
    <section className="rounded-xl border border-line bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-medium text-red-600">
          <AlertTriangleIcon className="h-[18px] w-[18px]" />
          Needs Attention
        </h2>
        <div className="flex items-center gap-3">
          <Segmented
            options={[
            { value: 'overdue', label: 'Overdue', count: overdue.length },
            { value: 'blocked', label: 'Blocked', count: blocked.length }]
            }
            value={view}
            onChange={setView} />

          <Link
            to={`/onboarding/transitions?status=Active&attention=${view}`}
            className="text-[13px] font-medium text-ink transition-colors duration-150 ease-out hover:text-brand-700">

            View All
          </Link>
        </div>
      </div>

      {shown.length === 0 ?
      <p className="mt-4 rounded-lg border border-dashed border-line px-4 py-8 text-center text-[13px] text-muted">
          {view === 'overdue' ? 'Nothing needs attention. No tasks are overdue.' : 'Nothing needs attention. No tasks are blocked.'}
        </p> :

      <ul className="mt-4 space-y-2.5">
          {shown.map((entry) => {
          const { transition, task, blocker } = entry;
          const fullName = `${transition.candidate.firstName} ${transition.candidate.lastName}`;
          const isBlocked = view === 'blocked';
          const days = isBlocked ? entry.blockedDays : entry.overdueDays;
          return (
            <li
              key={`${transition.id}-${task.id}`}
              className="flex items-center gap-3 rounded-lg border border-line px-3.5 py-2.5">

                <span
                className={`h-2 w-2 shrink-0 rounded-full ${isBlocked ? 'bg-amber-400' : 'bg-red-500'}`}
                aria-hidden="true" />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] text-muted">{fullName}</p>
                  <p className="truncate text-[13px] font-medium text-ink">{task.name}</p>
                  {blocker && <p className="truncate text-[11px] text-muted">Waiting on {blocker.name}</p>}
                </div>
                <div className="shrink-0 text-right leading-tight">
                  <p className={`text-[13px] font-medium ${isBlocked ? 'text-amber-700' : 'text-red-600'}`}>
                    {outstanding(days)}
                  </p>
                  <p className={`text-[11px] font-medium ${isBlocked ? 'text-amber-600' : 'text-red-600'}`}>
                    {isBlocked ? 'Blocked' : 'Overdue'}
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
