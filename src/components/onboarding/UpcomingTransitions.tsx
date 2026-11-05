import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarIcon } from 'lucide-react';
import type { Transition } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Select } from '../ui/Field';
import { KindDot } from './ActiveTransitions';
import { transitionProgress } from '../../utils/transitions';
import {
  DEFAULT_UPCOMING_PERIOD,
  UPCOMING_PERIODS,
  daysUntilStart,
  startsWithin,
  upcomingPeriodPhrase,
  type UpcomingPeriod } from
'../../utils/upcoming';

/** How many upcoming transitions the dashboard lists. The rest are reached through View All. */
const MAX_ENTRIES = 5;

function startLabel(daysUntil: number): string {
  if (daysUntil === 0) return 'Today';
  return `In ${daysUntil} day${daysUntil === 1 ? '' : 's'}`;
}

/** Active transitions starting within the chosen period, soonest first. */
export function UpcomingTransitions({
  transitions,
  today,
  initialPeriod = DEFAULT_UPCOMING_PERIOD




}: {transitions: Transition[];today: string;initialPeriod?: UpcomingPeriod;}) {
  const [period, setPeriod] = useState<UpcomingPeriod>(initialPeriod);
  const upcoming = transitions.
  filter((transition) => startsWithin(transition, today, period)).
  map((transition) => ({ transition, daysUntil: daysUntilStart(transition, today) })).
  sort((a, b) => a.daysUntil - b.daysUntil);
  const shown = upcoming.slice(0, MAX_ENTRIES);

  return (
    <section className="rounded-xl border border-line bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-medium text-ink">
          <CalendarIcon className="h-[18px] w-[18px]" />
          Upcoming Transitions ({upcoming.length})
        </h2>
        <div className="flex items-center gap-3">
          <Select
            value={period}
            onChange={(event) => setPeriod(event.target.value as UpcomingPeriod)}
            aria-label="Period"
            className="h-8 w-36 text-[13px]">

            {UPCOMING_PERIODS.map((item) =>
            <option key={item.value} value={item.value}>
                {item.label}
              </option>
            )}
          </Select>
          <Link
            to={`/onboarding/transitions?status=Active&starting=${period}`}
            className="text-[13px] font-medium text-ink transition-colors duration-150 ease-out hover:text-brand-700">

            View All
          </Link>
        </div>
      </div>

      {shown.length === 0 ?
      <p className="mt-4 rounded-lg border border-dashed border-line px-4 py-8 text-center text-[13px] text-muted">
          No transitions start in {upcomingPeriodPhrase(period)}.
        </p> :

      <ul className="mt-4 space-y-2.5">
          {shown.map(({ transition, daysUntil }) => {
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
