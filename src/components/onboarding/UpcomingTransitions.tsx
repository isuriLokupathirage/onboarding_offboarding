import { Link } from 'react-router-dom';
import { CalendarIcon } from 'lucide-react';
import type { Transition } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { KindDot } from './ActiveTransitions';
import { daysBetween } from '../../utils/attention';
import { transitionProgress } from '../../utils/transitions';

/** How far ahead a start date counts as "soon". */
export const UPCOMING_WINDOW_DAYS = 30;

function startLabel(daysUntil: number): string {
  if (daysUntil === 0) return 'Today';
  return `In ${daysUntil} day${daysUntil === 1 ? '' : 's'}`;
}

/** Active transitions whose start date falls within the window, soonest first. */
export function UpcomingTransitions({
  transitions,
  today
}: {
  transitions: Transition[];
  today: string;
}) {
  const upcoming = transitions.
  map((transition) => ({
    transition,
    daysUntil: daysBetween(today, transition.candidate.hireDate)
  })).
  filter(({ daysUntil }) => daysUntil >= 0 && daysUntil <= UPCOMING_WINDOW_DAYS).
  sort((a, b) => a.daysUntil - b.daysUntil);

  return (
    <section className="rounded-xl border border-line bg-white p-5 shadow-card">
      <h2 className="flex items-center gap-2 text-base font-medium text-ink">
        <CalendarIcon className="h-[18px] w-[18px]" />
        Upcoming Transitions
      </h2>

      {upcoming.length === 0 ?
      <p className="mt-4 rounded-lg border border-dashed border-line px-4 py-8 text-center text-[13px] text-muted">
          Nothing starting soon. No transitions start in the next {UPCOMING_WINDOW_DAYS} days.
        </p> :

      <ul className="mt-4 space-y-2.5">
          {upcoming.map(({ transition, daysUntil }) => {
          const fullName = `${transition.candidate.firstName} ${transition.candidate.lastName}`;
          const { percent } = transitionProgress(transition);
          return (
            <li
              key={transition.id}
              className="flex items-center gap-3 rounded-lg border border-line px-3.5 py-2.5">

                <Avatar name={fullName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">{fullName}</p>
                  <KindDot kind={transition.kind} />
                </div>
                <div className="shrink-0 leading-tight">
                  <p className="text-[13px] font-medium text-emerald-700">{startLabel(daysUntil)}</p>
                  <p className="text-[11px] text-muted">{percent}% Ready</p>
                </div>
                <Link to={`/onboarding/transitions/${transition.id}`}>
                  <Button size="sm">View Tasks</Button>
                </Link>
              </li>);

        })}
        </ul>
      }
    </section>);

}
