import type { Department, EmploymentType, Transition } from '../types';
import { transitionProgress } from './transitions';
import { within, type DateRange, type ReportFilters } from './reports';

/** One onboarding as the Onboarding Reports show it. Job details come from the joiner snapshot. */
export interface JoinerRow {
  transitionId: string;
  name: string;
  organizationUnit: Department;
  jobTitle: string;
  employmentType: EmploymentType;
  client: string;
  hireDate: string;
  startedOn: string;
  status: Transition['status'];
  plannedCompletionDate: string;
  completedOn?: string;
  progress: {done: number;total: number;percent: number;};
}

/** Every onboarding that captured a joiner snapshot when it started, whatever its status. */
export function joinerRows(transitions: Transition[]): JoinerRow[] {
  return transitions.flatMap((transition) => {
    const { joiner } = transition;
    if (transition.kind !== 'Onboarding' || !joiner) return [];
    return [
    {
      transitionId: transition.id,
      name: `${transition.candidate.firstName} ${transition.candidate.lastName}`,
      organizationUnit: joiner.organizationUnit,
      jobTitle: joiner.jobTitle,
      employmentType: joiner.employmentType,
      client: joiner.client,
      hireDate: transition.candidate.hireDate,
      startedOn: transition.startedOn,
      status: transition.status,
      plannedCompletionDate: transition.plannedCompletionDate,
      completedOn: transition.completedOn,
      progress: transitionProgress(transition)
    }];

  });
}

/** Organization unit, employment type and client. Offboarding Type does not apply to onboardings. */
export const filterJoinerRows = (rows: JoinerRow[], filters: ReportFilters): JoinerRow[] =>
rows.filter(
  (row) =>
  within(filters.orgUnits, row.organizationUnit) &&
  within(filters.employmentTypes, row.employmentType) &&
  within(filters.clients, row.client)
);

const inRange = (date: string, range: DateRange) => date >= range.from && date <= range.to;

/**
 * Joiners in the period: hire date within it. A cancelled onboarding is not a joiner, so it is left
 * out here and counted separately.
 */
export const joinersInPeriod = (rows: JoinerRow[], range: DateRange): JoinerRow[] =>
rows.filter((row) => row.status !== 'Cancelled' && inRange(row.hireDate, range));

const DAY_MS = 24 * 60 * 60 * 1000;
export const daysBetween = (from: string, to: string): number =>
Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);

export interface OnboardingSummary {
  /** Onboardings started in the period, cancelled ones excluded. */
  started: number;
  completed: number;
  inProgress: number;
  cancelled: number;
  /** Null when nothing was started, so there is nothing to divide by. */
  completionRate: number | null;
  onTime: number;
  /** Null when nothing was completed. In-progress onboardings are left out. */
  onTimeRate: number | null;
  totalDaysToComplete: number;
  /** Null when nothing was completed. */
  averageDaysToComplete: number | null;
}

/**
 * Completion figures for the onboardings started in the period. Cancelled onboardings are left out
 * of every figure and counted on their own.
 */
export function onboardingSummary(rows: JoinerRow[], range: DateRange): OnboardingSummary {
  const startedInPeriod = rows.filter((row) => inRange(row.startedOn, range));
  const cancelled = startedInPeriod.filter((row) => row.status === 'Cancelled').length;
  const active = startedInPeriod.filter((row) => row.status !== 'Cancelled');
  const completed = active.filter((row) => row.status === 'Completed' && row.completedOn);
  const onTime = completed.filter((row) => (row.completedOn as string) <= row.plannedCompletionDate).length;
  const totalDaysToComplete = completed.reduce(
    (total, row) => total + daysBetween(row.startedOn, row.completedOn as string),
    0
  );
  return {
    started: active.length,
    completed: completed.length,
    inProgress: active.filter((row) => row.status !== 'Completed').length,
    cancelled,
    completionRate: active.length === 0 ? null : completed.length / active.length * 100,
    onTime,
    onTimeRate: completed.length === 0 ? null : onTime / completed.length * 100,
    totalDaysToComplete,
    averageDaysToComplete: completed.length === 0 ? null : totalDaysToComplete / completed.length
  };
}
