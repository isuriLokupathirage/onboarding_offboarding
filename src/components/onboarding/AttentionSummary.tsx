import { Link } from 'react-router-dom';
import { AlertTriangleIcon, CalendarClockIcon, LockIcon } from 'lucide-react';
import type { Transition } from '../../types';
import { attentionLabels, attentionTasks, type AttentionFilter } from '../../utils/attention';

const FILTERS: AttentionFilter[] = ['overdue', 'blocked', 'due-today'];

const icons = {
  overdue: AlertTriangleIcon,
  blocked: LockIcon,
  'due-today': CalendarClockIcon
};

const alertStyles: Record<AttentionFilter, string> = {
  overdue: 'border-red-400 text-red-600 hover:bg-red-50',
  blocked: 'border-amber-400 text-amber-600 hover:bg-amber-50',
  'due-today': 'border-blue-400 text-blue-600 hover:bg-blue-50'
};

/** Overdue, Blocked and Due Today task counts. Each opens the Transitions list filtered to it. */
export function AttentionSummary({
  transitions,
  canSeeRestricted,
  today
}: {
  transitions: Transition[];
  canSeeRestricted: boolean;
  today: string;
}) {
  return (
    <ul className="flex flex-wrap items-center gap-2.5">
      {FILTERS.map((filter) => {
        const count = transitions.reduce(
          (total, transition) =>
          total + attentionTasks(transition, filter, canSeeRestricted, today).length,
          0
        );
        const Icon = icons[filter];
        return (
          <li key={filter}>
            <Link
              to={`/onboarding/transitions?attention=${filter}`}
              aria-label={`${count} ${attentionLabels[filter]}. Open the filtered list.`}
              className={`inline-flex h-9 items-center gap-1.5 rounded-lg border bg-white px-3 text-[13px] font-medium transition-colors duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-brand-200 ${
              count > 0 ? alertStyles[filter] : 'border-line text-muted hover:bg-slate-50'}`
              }>

              <Icon className="h-4 w-4 shrink-0" />
              {count} {attentionLabels[filter]}
            </Link>
          </li>);

      })}
    </ul>);

}
