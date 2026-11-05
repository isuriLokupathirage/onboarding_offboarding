import type { Transition } from '../types';
import { daysBetween } from './attention';

export type UpcomingPeriod = '7d' | '14d' | '1m';

export const UPCOMING_PERIODS: {value: UpcomingPeriod;label: string;phrase: string;}[] = [
{ value: '7d', label: 'Next 7 days', phrase: 'the next 7 days' },
{ value: '14d', label: 'Next 14 days', phrase: 'the next 14 days' },
{ value: '1m', label: 'Next 1 month', phrase: 'the next month' }];


export const DEFAULT_UPCOMING_PERIOD: UpcomingPeriod = '1m';

export function isUpcomingPeriod(value: string | null): value is UpcomingPeriod {
  return UPCOMING_PERIODS.some((period) => period.value === value);
}

export function upcomingPeriodPhrase(period: UpcomingPeriod): string {
  return UPCOMING_PERIODS.find((item) => item.value === period)?.phrase ?? '';
}

/** The last day (YYYY-MM-DD) the period covers, counting from today. */
function periodEnd(today: string, period: UpcomingPeriod): string {
  const [year, month, day] = today.split('-').map(Number);
  const end = new Date(Date.UTC(year, month - 1, day));
  if (period === '1m') end.setUTCMonth(end.getUTCMonth() + 1);else
  end.setUTCDate(end.getUTCDate() + (period === '7d' ? 7 : 14));
  return end.toISOString().slice(0, 10);
}

/** The date a transition starts: the hire date, or the Last Working Date for an offboarding. */
export function transitionStartDate(transition: Transition): string {
  const lastWorkingDate = transition.kind === 'Offboarding' ? transition.exit?.dates['Last Working Date'] : undefined;
  return (lastWorkingDate ?? transition.candidate.hireDate).slice(0, 10);
}

/** Days until the transition starts (see transitionStartDate). */
export function daysUntilStart(transition: Transition, today: string): number {
  return daysBetween(today, transitionStartDate(transition));
}

/** True when the transition starts between today and the end of the period, inclusive. */
export function startsWithin(transition: Transition, today: string, period: UpcomingPeriod): boolean {
  const start = transitionStartDate(transition);
  return start >= today && start <= periodEnd(today, period);
}
