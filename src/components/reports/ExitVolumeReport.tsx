import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { XIcon } from 'lucide-react';
import { ReportCard, BarList, ColumnChart, StatTile } from './ReportCharts';
import { OFFBOARDING_TYPES } from '../../data/exitReasons';
import type { Department, OffboardingType } from '../../types';
import { formatDate } from '../../utils/format';
import {
  averageTenureMonths,
  countBy,
  formatTenure,
  leaversByMonth,
  type DateRange,
  type LeaverRow } from
'../../utils/reports';

/** The chart segments picked to narrow the leavers table: at most one type, reason and organization unit. */
export interface LeaverSelection {
  type?: OffboardingType;
  reason?: string;
  organizationUnit?: Department;
}

const SELECTION_LABELS: Record<keyof LeaverSelection, string> = {
  type: 'Offboarding Type',
  reason: 'Exit Reason',
  organizationUnit: 'Organization unit'
};

const TABLE_GRID =
'grid grid-cols-[minmax(170px,1.4fr)_110px_minmax(150px,1.2fr)_110px_minmax(170px,1.4fr)_110px_110px_110px] items-center gap-4';

const percentOf = (count: number, total: number) => `${Math.round(count / Math.max(1, total) * 100)}% of leavers`;

/**
 * Offboarding Reports → exit volume: who left in the period, when, why and from where. `rows`
 * already holds only the leavers in the period that match the filters.
 */
export function ExitVolumeReport({
  rows,
  range,
  selection,
  onSelectionChange
}: {
  rows: LeaverRow[];
  range: DateRange;
  selection: LeaverSelection;
  onSelectionChange: (next: LeaverSelection) => void;
}) {
  const byMonth = useMemo(() => leaversByMonth(rows, range), [rows, range]);
  const byReason = useMemo(() => countBy(rows, (row) => row.reason), [rows]);
  const byOrgUnit = useMemo(() => countBy(rows, (row) => row.organizationUnit), [rows]);
  // Types keep their fixed order and show at zero, so the three are always comparable.
  const byType = OFFBOARDING_TYPES.map((type) => ({
    label: type,
    count: rows.filter((row) => row.type === type).length
  }));

  const tableRows = useMemo(
    () =>
    rows.
    filter(
      (row) =>
      (!selection.type || row.type === selection.type) && (
      !selection.reason || row.reason === selection.reason) && (
      !selection.organizationUnit || row.organizationUnit === selection.organizationUnit)
    ).
    sort((a, b) => b.exitDate.localeCompare(a.exitDate) || a.name.localeCompare(b.name)),
    [rows, selection]
  );

  // Selecting a segment again clears it.
  const toggle = <K extends keyof LeaverSelection,>(key: K, value: LeaverSelection[K]) =>
  onSelectionChange({ ...selection, [key]: selection[key] === value ? undefined : value });

  const selectionChips = (Object.keys(SELECTION_LABELS) as (keyof LeaverSelection)[]).filter((key) => selection[key]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatTile label="Total leavers" value={String(rows.length)} note="Completed offboardings" />
        {OFFBOARDING_TYPES.map((type) => {
          const count = byType.find((entry) => entry.label === type)?.count ?? 0;
          return <StatTile key={type} label={type} value={String(count)} note={percentOf(count, rows.length)} />;
        })}
        <StatTile
          label="Average tenure"
          value={formatTenure(averageTenureMonths(rows))}
          note="Date of joining to exit date" />

      </div>

      <ReportCard title="Leavers per month" description="By Actual Exit Date">
        <ColumnChart entries={byMonth} noun="leavers" />
      </ReportCard>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <ReportCard title="Leavers by offboarding type" description="Select a type to filter the table">
          <BarList
            entries={byType}
            selected={selection.type}
            onSelect={(label) => toggle('type', label as OffboardingType)}
            noun="leavers" />

        </ReportCard>
        <ReportCard title="Leavers by exit reason" description="Highest first. Select a reason to filter the table">
          <BarList
            entries={byReason}
            selected={selection.reason}
            onSelect={(label) => toggle('reason', label)}
            noun="leavers" />

        </ReportCard>
        <ReportCard title="Leavers by organization unit" description="Highest first. Select an organization unit to filter the table">
          <BarList
            entries={byOrgUnit}
            selected={selection.organizationUnit}
            onSelect={(label) => toggle('organizationUnit', label as Department)}
            noun="leavers" />

        </ReportCard>
      </div>

      <ReportCard
        title="Leavers"
        description={
        selectionChips.length > 0 ?
        `${tableRows.length} of ${rows.length} leavers` :
        `${rows.length} leaver${rows.length === 1 ? '' : 's'}`
        }
        actions={
        selectionChips.length > 0 &&
        <div className="flex flex-wrap items-center gap-2">
              {selectionChips.map((key) =>
          <span
            key={key}
            className="inline-flex items-center gap-1 rounded-full bg-brand-50 py-1 pl-2.5 pr-1 text-[12px] text-brand-700 ring-1 ring-inset ring-brand-200">

                  {SELECTION_LABELS[key]}: {selection[key]}
                  <button
              type="button"
              onClick={() => onSelectionChange({ ...selection, [key]: undefined })}
              aria-label={`Remove ${SELECTION_LABELS[key]} ${selection[key]}`}
              className="rounded-full p-0.5 transition-colors duration-150 ease-out hover:bg-brand-100">

                    <XIcon className="h-3 w-3" />
                  </button>
                </span>
          )}
              <button
            type="button"
            onClick={() => onSelectionChange({})}
            className="text-[12px] font-medium text-brand-700 transition-colors duration-150 ease-out hover:text-brand-600">

                Show all leavers
              </button>
            </div>

        }>

        <div className="-mx-5 -mb-5 overflow-x-auto border-t border-line">
          <div className="min-w-[1100px]">
            <div
              className={`${TABLE_GRID} border-b border-line bg-slate-50/70 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-subtle`}>

              <span>Name</span>
              <span>Organization unit</span>
              <span>Job title</span>
              <span>Offboarding type</span>
              <span>Exit reason</span>
              <span>Date of joining</span>
              <span>Exit date</span>
              <span>Tenure</span>
            </div>
            {tableRows.length === 0 &&
            <p className="px-5 py-8 text-center text-[13px] text-muted">
                No leavers match the selected chart segments.
              </p>
            }
            <ul className="divide-y divide-line">
              {tableRows.map((row) =>
              <li key={row.transitionId} className={`${TABLE_GRID} px-5 py-3 text-[13px]`}>
                  <Link
                  to={`/onboarding/transitions/${row.transitionId}`}
                  className="truncate font-medium text-ink transition-colors duration-150 ease-out hover:text-brand-600">

                    {row.name}
                  </Link>
                  <span className="truncate text-muted">{row.organizationUnit}</span>
                  <span className="truncate text-muted" title={row.jobTitle}>
                    {row.jobTitle}
                  </span>
                  <span className="text-ink">{row.type}</span>
                  <span className="truncate text-muted" title={row.reason}>
                    {row.reason}
                  </span>
                  <span className="text-muted">{formatDate(row.joinedOn)}</span>
                  <span className="text-ink">{formatDate(row.exitDate)}</span>
                  <span className="text-muted">{formatTenure(row.tenureMonths)}</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </ReportCard>
    </div>);

}
