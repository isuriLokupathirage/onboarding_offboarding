import type { Department, OffboardingType } from '../types';
import type { EmploymentRecord } from '../data/headcount';
import { OFFBOARDING_TYPES } from '../data/exitReasons';
import { formatDate } from './format';
import {
  averageTenureMonths,
  countBy,
  countByMonth,
  earlyAttrition,
  formatNumber,
  formatPercent,
  formatTenure,
  leaversByTenureBand,
  tenureBand,
  turnoverByMonth,
  turnoverFor,
  type DateRange,
  type LeaverRow } from
'./reports';
import { daysBetween, onboardingSummary, type JoinerRow } from './onboardingReports';

/** One block of rows in an export: a chart's totals or the report's table. */
export interface ExportTable {
  title: string;
  columns: string[];
  rows: (string | number)[][];
}

/** Everything an Excel or PDF export of one report holds. */
export interface ReportExport {
  name: string;
  period: string;
  /** One line per filter or chart selection, such as "Organization unit: Engineering". */
  filters: string[];
  generatedOn: string;
  generatedBy: string;
  figures: {label: string;value: string;}[];
  charts: ExportTable[];
  /** The rows behind the report, every page, as narrowed on screen. */
  table: ExportTable;
}

/** The chart segments that narrow the leavers table. Mirrors LeaverSelection on screen. */
export interface LeaverSelectionLike {
  type?: OffboardingType;
  reason?: string;
  organizationUnit?: Department;
  tenureBand?: string;
}

export const matchesLeaverSelection = (row: LeaverRow, selection: LeaverSelectionLike): boolean =>
(!selection.type || row.type === selection.type) &&
(!selection.reason || row.reason === selection.reason) &&
(!selection.organizationUnit || row.organizationUnit === selection.organizationUnit) &&
(!selection.tenureBand || tenureBand(row.tenureMonths) === selection.tenureBand);

const SELECTION_LABELS: Record<keyof LeaverSelectionLike, string> = {
  type: 'Offboarding type',
  reason: 'Exit reason',
  organizationUnit: 'Organization unit',
  tenureBand: 'Tenure'
};

const counted = (entries: {label: string;count: number;}[]): (string | number)[][] =>
entries.map((entry) => [entry.label, entry.count]);

export function offboardingExport({
  rows,
  range,
  headcount,
  selection,
  period,
  filters,
  generatedOn,
  generatedBy
}: {
  rows: LeaverRow[];
  range: DateRange;
  headcount: EmploymentRecord[];
  selection: LeaverSelectionLike;
  period: string;
  filters: string[];
  generatedOn: string;
  generatedBy: string;
}): ReportExport {
  const attrition = earlyAttrition(rows);
  const turnover = turnoverFor(rows.length, headcount, range);
  const selectionLines = (Object.keys(SELECTION_LABELS) as (keyof LeaverSelectionLike)[]).
  filter((key) => selection[key]).
  map((key) => `${SELECTION_LABELS[key]}: ${selection[key]} (table only)`);
  const tableRows = rows.
  filter((row) => matchesLeaverSelection(row, selection)).
  sort((a, b) => b.exitDate.localeCompare(a.exitDate) || a.name.localeCompare(b.name));

  return {
    name: 'Offboarding Report',
    period,
    filters: [...filters, ...selectionLines],
    generatedOn,
    generatedBy,
    figures: [
    { label: 'Total leavers', value: String(rows.length) },
    ...OFFBOARDING_TYPES.map((type) => ({
      label: `${type} leavers`,
      value: String(rows.filter((row) => row.type === type).length)
    })),
    { label: 'Average tenure', value: formatTenure(averageTenureMonths(rows)) },
    { label: 'Early attrition', value: formatPercent(attrition.percent) },
    {
      label: 'Turnover rate',
      value: turnover.available ? formatPercent(turnover.rate) : `Unavailable: ${turnover.reason}`
    },
    {
      label: 'Average headcount',
      value: turnover.available ? formatNumber(turnover.averageHeadcount) : 'Unavailable'
    }],

    charts: [
    {
      title: 'Leavers per month',
      columns: ['Month', 'Leavers'],
      rows: counted(countByMonth(rows.map((row) => row.exitDate), range))
    },
    {
      title: 'Leavers by offboarding type',
      columns: ['Offboarding type', 'Leavers'],
      rows: OFFBOARDING_TYPES.map((type) => [type, rows.filter((row) => row.type === type).length])
    },
    { title: 'Leavers by exit reason', columns: ['Exit reason', 'Leavers'], rows: counted(countBy(rows, (row) => row.reason)) },
    {
      title: 'Leavers by organization unit',
      columns: ['Organization unit', 'Leavers'],
      rows: counted(countBy(rows, (row) => row.organizationUnit))
    },
    { title: 'Leavers by tenure', columns: ['Tenure band', 'Leavers'], rows: counted(leaversByTenureBand(rows)) },
    {
      title: 'Turnover rate per month',
      columns: ['Month', 'Leavers', 'Average headcount', 'Turnover rate'],
      rows: turnoverByMonth(rows, headcount, range).map(({ label, turnover: month }) =>
      month.available ?
      [label, month.leavers, month.averageHeadcount, formatPercent(month.rate)] :
      [label, '', '', 'Unavailable']
      )
    }],

    table: {
      title: 'Leavers',
      columns: [
      'Name',
      'Organization unit',
      'Job title',
      'Employment type',
      'Client',
      'Offboarding type',
      'Exit reason',
      'Date of joining',
      'Exit date',
      'Tenure',
      'Tenure (months)'],

      rows: tableRows.map((row) => [
      row.name,
      row.organizationUnit,
      row.jobTitle,
      row.employmentType,
      row.client,
      row.type,
      row.reason,
      formatDate(row.joinedOn),
      formatDate(row.exitDate),
      formatTenure(row.tenureMonths),
      row.tenureMonths]
      )
    }
  };
}

const STATUS_LABEL: Record<JoinerRow['status'], string> = {
  Completed: 'Completed',
  'On Track': 'In progress',
  'At Risk': 'In progress (at risk)',
  Cancelled: 'Cancelled'
};

export function onboardingExport({
  joiners,
  onboardings,
  range,
  selectedUnit,
  period,
  filters,
  generatedOn,
  generatedBy
}: {
  joiners: JoinerRow[];
  onboardings: JoinerRow[];
  range: DateRange;
  selectedUnit?: Department;
  period: string;
  filters: string[];
  generatedOn: string;
  generatedBy: string;
}): ReportExport {
  const summary = onboardingSummary(onboardings, range);
  const tableRows = joiners.
  filter((row) => !selectedUnit || row.organizationUnit === selectedUnit).
  sort((a, b) => b.hireDate.localeCompare(a.hireDate) || a.name.localeCompare(b.name));
  const orUnavailable = (value: number | null, format: (value: number) => string) =>
  value === null ? 'Not available' : format(value);

  return {
    name: 'Onboarding Report',
    period,
    filters: [...filters, ...(selectedUnit ? [`Organization unit: ${selectedUnit} (table only)`] : [])],
    generatedOn,
    generatedBy,
    figures: [
    { label: 'Joiners', value: String(joiners.length) },
    { label: 'Onboardings completed', value: String(summary.completed) },
    { label: 'Onboardings in progress', value: String(summary.inProgress) },
    {
      label: 'Average days to complete',
      value: orUnavailable(summary.averageDaysToComplete, (value) => `${formatNumber(value)} days`)
    },
    { label: 'Completion rate', value: orUnavailable(summary.completionRate, formatPercent) },
    { label: 'On-time completion rate', value: orUnavailable(summary.onTimeRate, formatPercent) },
    { label: 'Cancelled', value: String(summary.cancelled) }],

    charts: [
    {
      title: 'Joiners per month',
      columns: ['Month', 'Joiners'],
      rows: counted(countByMonth(joiners.map((row) => row.hireDate), range))
    },
    {
      title: 'Joiners by organization unit',
      columns: ['Organization unit', 'Joiners'],
      rows: counted(countBy(joiners, (row) => row.organizationUnit))
    }],

    table: {
      title: 'Joiners',
      columns: [
      'Name',
      'Organization unit',
      'Job title',
      'Employment type',
      'Client',
      'Hire date',
      'Onboarding status',
      'Tasks completed',
      'Progress',
      'Planned Completion Date',
      'Completed on',
      'Days to complete'],

      rows: tableRows.map((row) => [
      row.name,
      row.organizationUnit,
      row.jobTitle,
      row.employmentType,
      row.client,
      formatDate(row.hireDate),
      STATUS_LABEL[row.status],
      `${row.progress.done}/${row.progress.total}`,
      `${row.progress.percent}%`,
      formatDate(row.plannedCompletionDate),
      row.completedOn ? formatDate(row.completedOn) : '',
      row.completedOn ? daysBetween(row.startedOn, row.completedOn) : '']
      )
    }
  };
}

/** A file name such as "Offboarding_Report_2026-09-16.xlsx". */
export const exportFileName = (report: ReportExport, isoDate: string, extension: string): string =>
`${report.name.replace(/\s+/g, '_')}_${isoDate}.${extension}`;
