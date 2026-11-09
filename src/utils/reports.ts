import type { Department, EmploymentType, OboPermission, OffboardingType, Transition } from '../types';
import { HEADCOUNT_RECORDS_FROM, type EmploymentRecord } from '../data/headcount';
import { exitReasonLabel } from './offboarding';
import { formatDate } from './format';
import { PROTOTYPE_TODAY } from './transitions';

/** Reports need View Reports (obo.report.view); without it the section is hidden. */
export const canViewReports = (permissions: OboPermission[]): boolean => permissions.includes('View Reports');

export type ReportTab = 'Onboarding' | 'Offboarding';

export type PeriodPreset =
'this-month' |
'last-month' |
'this-quarter' |
'last-quarter' |
'this-year' |
'last-year' |
'custom';

export const PERIOD_OPTIONS: {value: PeriodPreset;label: string;}[] = [
{ value: 'this-month', label: 'This month' },
{ value: 'last-month', label: 'Last month' },
{ value: 'this-quarter', label: 'This quarter' },
{ value: 'last-quarter', label: 'Last quarter' },
{ value: 'this-year', label: 'This year' },
{ value: 'last-year', label: 'Last year' },
{ value: 'custom', label: 'Custom date range' }];


export const DEFAULT_PERIOD: PeriodPreset = 'this-year';

export const isPeriodPreset = (value: unknown): value is PeriodPreset =>
PERIOD_OPTIONS.some((option) => option.value === value);

/** The filters shared by both tabs, plus Offboarding Type, which only the Offboarding tab uses. */
export interface ReportFilters {
  period: PeriodPreset;
  customFrom: string;
  customTo: string;
  orgUnits: Department[];
  employmentTypes: EmploymentType[];
  clients: string[];
  offboardingTypes: OffboardingType[];
}

export const DEFAULT_REPORT_FILTERS: ReportFilters = {
  period: DEFAULT_PERIOD,
  customFrom: '',
  customTo: '',
  orgUnits: [],
  employmentTypes: [],
  clients: [],
  offboardingTypes: []
};

/** An inclusive range of ISO dates (yyyy-mm-dd). */
export interface DateRange {
  from: string;
  to: string;
}

const pad = (value: number) => String(value).padStart(2, '0');
const isoDate = (year: number, month: number, day: number) => `${year}-${pad(month + 1)}-${pad(day)}`;
const lastDayOf = (year: number, month: number) => new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

/** Months are zero-based and may run past either end of the year. */
function monthsRange(year: number, firstMonth: number, monthCount: number): DateRange {
  const start = new Date(Date.UTC(year, firstMonth, 1));
  const end = new Date(Date.UTC(year, firstMonth + monthCount - 1, 1));
  return {
    from: isoDate(start.getUTCFullYear(), start.getUTCMonth(), 1),
    to: isoDate(end.getUTCFullYear(), end.getUTCMonth(), lastDayOf(end.getUTCFullYear(), end.getUTCMonth()))
  };
}

/** The calendar range a preset covers, around the prototype's fixed today. Custom has none. */
export function presetRange(preset: PeriodPreset, today: string = PROTOTYPE_TODAY): DateRange | null {
  const [year, month] = today.split('-').map(Number);
  const monthIndex = month - 1;
  const quarterStart = Math.floor(monthIndex / 3) * 3;
  switch (preset) {
    case 'this-month':
      return monthsRange(year, monthIndex, 1);
    case 'last-month':
      return monthsRange(year, monthIndex - 1, 1);
    case 'this-quarter':
      return monthsRange(year, quarterStart, 3);
    case 'last-quarter':
      return monthsRange(year, quarterStart - 3, 3);
    case 'this-year':
      return monthsRange(year, 0, 12);
    case 'last-year':
      return monthsRange(year - 1, 0, 12);
    default:
      return null;
  }
}

/** What stops a custom range being used, or undefined when it is complete and in order. */
export function customRangeError(from: string, to: string): string | undefined {
  if (!from || !to) return 'Select a start date and an end date';
  if (to < from) return 'The end date must be on or after the start date';
  return undefined;
}

/** The range the report covers, or null while a custom range is incomplete or invalid. */
export function reportRange(filters: ReportFilters): DateRange | null {
  if (filters.period !== 'custom') return presetRange(filters.period);
  return customRangeError(filters.customFrom, filters.customTo) ?
  null :
  { from: filters.customFrom, to: filters.customTo };
}

export const formatRange = (range: DateRange): string => `${formatDate(range.from)} – ${formatDate(range.to)}`;

export const periodLabel = (filters: ReportFilters): string => {
  if (filters.period !== 'custom') return PERIOD_OPTIONS.find((option) => option.value === filters.period)?.label ?? '';
  const range = reportRange(filters);
  return range ? formatRange(range) : 'Custom date range';
};

/* ---------- Exit volume ---------- */

/** One leaver as the exit volume report shows them. Employment details come from the transition. */
export interface LeaverRow {
  transitionId: string;
  name: string;
  organizationUnit: Department;
  jobTitle: string;
  employmentType: EmploymentType;
  client: string;
  type: OffboardingType;
  reason: string;
  joinedOn: string;
  exitDate: string;
  tenureMonths: number;
}

/** Whole months from joining to leaving. */
export function tenureInMonths(joinedOn: string, exitDate: string): number {
  const [joinYear, joinMonth, joinDay] = joinedOn.split('-').map(Number);
  const [exitYear, exitMonth, exitDay] = exitDate.split('-').map(Number);
  const months = (exitYear - joinYear) * 12 + (exitMonth - joinMonth) - (exitDay < joinDay ? 1 : 0);
  return Math.max(0, months);
}

export function formatTenure(months: number): string {
  if (months < 1) return 'Less than a month';
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts = [];
  if (years > 0) parts.push(`${years} yr${years === 1 ? '' : 's'}`);
  if (rest > 0) parts.push(`${rest} mo${rest === 1 ? '' : 's'}`);
  return parts.join(' ');
}

/**
 * Every leaver a report can count: completed offboardings with an Actual Exit Date. Cancelled and
 * in-progress offboardings are left out, and so is one without the details captured when it started.
 */
export function leaverRows(transitions: Transition[]): LeaverRow[] {
  return transitions.flatMap((transition) => {
    const exitDate = transition.exit?.dates['Actual Exit Date'];
    const { exit, leaver } = transition;
    if (transition.kind !== 'Offboarding' || transition.status !== 'Completed' || !exit || !leaver || !exitDate) {
      return [];
    }
    return [
    {
      transitionId: transition.id,
      name: `${transition.candidate.firstName} ${transition.candidate.lastName}`,
      organizationUnit: leaver.organizationUnit,
      jobTitle: leaver.jobTitle,
      employmentType: leaver.employmentType,
      client: leaver.client,
      type: exit.type,
      reason: exitReasonLabel(exit),
      joinedOn: leaver.joinedOn,
      exitDate,
      tenureMonths: tenureInMonths(leaver.joinedOn, exitDate)
    }];

  });
}

const within = <T,>(values: T[], value: T) => values.length === 0 || values.includes(value);

/** Leavers whose Actual Exit Date falls in the range and who match every filter. */
export function filterLeavers(rows: LeaverRow[], range: DateRange, filters: ReportFilters): LeaverRow[] {
  return rows.filter(
    (row) =>
    row.exitDate >= range.from &&
    row.exitDate <= range.to &&
    within(filters.orgUnits, row.organizationUnit) &&
    within(filters.employmentTypes, row.employmentType) &&
    within(filters.clients, row.client) &&
    within(filters.offboardingTypes, row.type)
  );
}

export interface CountEntry {
  label: string;
  count: number;
}

/** Counts per value, highest first, then alphabetically. */
export function countBy(rows: LeaverRow[], key: (row: LeaverRow) => string): CountEntry[] {
  const counts = new Map<string, number>();
  rows.forEach((row) => counts.set(key(row), (counts.get(key(row)) ?? 0) + 1));
  return [...counts.entries()].
  map(([label, count]) => ({ label, count })).
  sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/** Leavers in each month of the range, including months with none. */
export function leaversByMonth(rows: LeaverRow[], range: DateRange): (CountEntry & {key: string;})[] {
  const [fromYear, fromMonth] = range.from.split('-').map(Number);
  const [toYear, toMonth] = range.to.split('-').map(Number);
  const spansYears = fromYear !== toYear;
  const months: (CountEntry & {key: string;})[] = [];
  for (let index = (fromYear * 12 + fromMonth - 1); index <= toYear * 12 + toMonth - 1; index += 1) {
    const year = Math.floor(index / 12);
    const month = index % 12;
    const key = `${year}-${pad(month + 1)}`;
    const name = new Date(Date.UTC(year, month, 1)).toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' });
    months.push({
      key,
      label: spansYears ? `${name} ${String(year).slice(2)}` : name,
      count: rows.filter((row) => row.exitDate.startsWith(key)).length
    });
  }
  return months;
}

export const averageTenureMonths = (rows: LeaverRow[]): number =>
rows.length === 0 ? 0 : Math.round(rows.reduce((total, row) => total + row.tenureMonths, 0) / rows.length);

export const formatPercent = (value: number): string => `${value.toFixed(1)}%`;
export const formatNumber = (value: number): string => (Number.isInteger(value) ? String(value) : value.toFixed(1));

/* ---------- Tenure ---------- */

export interface TenureBand {
  label: string;
  /** Whole months, from `min` up to but not including `max`. */
  min: number;
  max: number;
  /** The band's exact bounds, for hover text. */
  bounds: string;
}

export const TENURE_BANDS: TenureBand[] = [
{ label: 'Under 6 months', min: 0, max: 6, bounds: 'Less than 6 months' },
{ label: '6 to 12 months', min: 6, max: 12, bounds: '6 months up to 12 months' },
{ label: '1 to 3 years', min: 12, max: 36, bounds: '1 year up to 3 years' },
{ label: '3 to 5 years', min: 36, max: 60, bounds: '3 years up to 5 years' },
{ label: 'Over 5 years', min: 60, max: Infinity, bounds: '5 years or more' }];


export const tenureBand = (months: number): string =>
(TENURE_BANDS.find((band) => months >= band.min && months < band.max) ?? TENURE_BANDS[TENURE_BANDS.length - 1]).label;

/** Leavers in each band, in band order, including bands with none. */
export const leaversByTenureBand = (rows: LeaverRow[]): CountEntry[] =>
TENURE_BANDS.map((band) => ({
  label: band.label,
  count: rows.filter((row) => tenureBand(row.tenureMonths) === band.label).length
}));

export const totalTenureMonths = (rows: LeaverRow[]): number => rows.reduce((total, row) => total + row.tenureMonths, 0);

/** Leavers with tenure under 12 months, as a share of all leavers. */
export function earlyAttrition(rows: LeaverRow[]): {early: number;total: number;percent: number;} {
  const early = rows.filter((row) => row.tenureMonths < 12).length;
  return { early, total: rows.length, percent: rows.length === 0 ? 0 : early / rows.length * 100 };
}

/* ---------- Headcount and turnover ---------- */

/** Everyone who was employed at some point: current staff plus every leaver, until their exit date. */
export const headcountPopulation = (staff: EmploymentRecord[], leavers: LeaverRow[]): EmploymentRecord[] => [
...staff,
...leavers.map((row) => ({
  organizationUnit: row.organizationUnit,
  employmentType: row.employmentType,
  client: row.client,
  joinedOn: row.joinedOn,
  leftOn: row.exitDate
}))];


/** Organization unit, employment type and client narrow headcount too. Offboarding Type does not. */
export const filterPopulation = (records: EmploymentRecord[], filters: ReportFilters): EmploymentRecord[] =>
records.filter(
  (record) =>
  within(filters.orgUnits, record.organizationUnit) &&
  within(filters.employmentTypes, record.employmentType) &&
  within(filters.clients, record.client)
);

/** People employed on a day. A leaver still counts on their Actual Exit Date. */
export const headcountOn = (records: EmploymentRecord[], date: string): number =>
records.filter((record) => record.joinedOn <= date && (!record.leftOn || record.leftOn >= date)).length;

export type Turnover =
{
  available: true;
  leavers: number;
  startDate: string;
  endDate: string;
  startHeadcount: number;
  endHeadcount: number;
  averageHeadcount: number;
  rate: number;
} |
{available: false;reason: string;};

/**
 * Turnover rate = leavers ÷ average headcount × 100, where average headcount = (headcount at the
 * start + headcount at the end) ÷ 2. While a period is still running, its end is today.
 */
export function turnoverFor(
leavers: number,
records: EmploymentRecord[],
range: DateRange,
today: string = PROTOTYPE_TODAY)
: Turnover {
  if (range.from > today) {
    return { available: false, reason: 'This period has not started yet, so there is no headcount for it.' };
  }
  if (range.from < HEADCOUNT_RECORDS_FROM) {
    return {
      available: false,
      reason: `Headcount records start on ${formatDate(HEADCOUNT_RECORDS_FROM)}, so headcount at the start of this period is not known.`
    };
  }
  const endDate = range.to < today ? range.to : today;
  const startHeadcount = headcountOn(records, range.from);
  const endHeadcount = headcountOn(records, endDate);
  const averageHeadcount = (startHeadcount + endHeadcount) / 2;
  if (averageHeadcount === 0) {
    return { available: false, reason: 'No one matching the selected filters was employed in this period.' };
  }
  return {
    available: true,
    leavers,
    startDate: range.from,
    endDate,
    startHeadcount,
    endHeadcount,
    averageHeadcount,
    rate: leavers / averageHeadcount * 100
  };
}

export const TURNOVER_FORMULA = 'Turnover rate = Leavers in the period ÷ Average headcount × 100';
export const AVERAGE_HEADCOUNT_FORMULA = 'Average headcount = (Headcount at start + Headcount at end) ÷ 2';

/** The turnover sum with its figures, such as "2 ÷ 141.5 × 100 = 1.4%". */
export const turnoverWorking = (turnover: Extract<Turnover, {available: true;}>): string =>
`${turnover.leavers} ÷ ${formatNumber(turnover.averageHeadcount)} × 100 = ${formatPercent(turnover.rate)}`;

export const averageHeadcountWorking = (turnover: Extract<Turnover, {available: true;}>): string =>
`(${turnover.startHeadcount} on ${formatDate(turnover.startDate)} + ${turnover.endHeadcount} on ${formatDate(
  turnover.endDate
)}) ÷ 2 = ${formatNumber(turnover.averageHeadcount)}`;

/** Turnover for each month of the range. Partial first and last months use only the days in range. */
export function turnoverByMonth(
rows: LeaverRow[],
records: EmploymentRecord[],
range: DateRange)
: {key: string;label: string;turnover: Turnover;}[] {
  return leaversByMonth(rows, range).map((month) => {
    const [year, monthNumber] = month.key.split('-').map(Number);
    const full = monthsRange(year, monthNumber - 1, 1);
    const clipped = { from: full.from < range.from ? range.from : full.from, to: full.to > range.to ? range.to : full.to };
    return { key: month.key, label: month.label, turnover: turnoverFor(month.count, records, clipped) };
  });
}
