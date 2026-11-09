import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { XIcon } from 'lucide-react';
import { Pagination } from '../ui/Pagination';
import { ReportCard, BarList, ColumnChart, StatTile } from './ReportCharts';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import type { Department } from '../../types';
import { formatDate } from '../../utils/format';
import { countBy, countByMonth, formatNumber, formatPercent, type DateRange } from '../../utils/reports';
import { daysBetween, onboardingSummary, type JoinerRow } from '../../utils/onboardingReports';

const PAGE_SIZE = 10;

const TABLE_GRID =
'grid grid-cols-[minmax(170px,1.4fr)_120px_minmax(150px,1.2fr)_110px_110px_110px_minmax(130px,1fr)] items-center gap-4';

const STATUS_BADGE: Record<JoinerRow['status'], string> = {
  Completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'On Track': 'bg-brand-50 text-brand-700 ring-brand-200',
  'At Risk': 'bg-amber-50 text-amber-700 ring-amber-200',
  Cancelled: ''
};

const STATUS_LABEL: Record<JoinerRow['status'], string> = {
  Completed: 'Completed',
  'On Track': 'In progress',
  'At Risk': 'In progress · at risk',
  Cancelled: 'Cancelled'
};

const unavailable = 'Not available';

/**
 * Onboarding Reports: who is joining in the period, and how the onboardings started in the period
 * are running. `joiners` holds the joiners whose hire date is in the period; `rows` holds every
 * onboarding matching the filters, for the completion figures.
 */
export function OnboardingReport({
  joiners,
  rows,
  range,
  selectedUnit,
  onSelectUnit
}: {
  joiners: JoinerRow[];
  rows: JoinerRow[];
  range: DateRange;
  selectedUnit?: Department;
  onSelectUnit: (unit?: Department) => void;
}) {
  const summary = useMemo(() => onboardingSummary(rows, range), [rows, range]);
  const byMonth = useMemo(() => countByMonth(joiners.map((row) => row.hireDate), range), [joiners, range]);
  const byUnit = useMemo(() => countBy(joiners, (row) => row.organizationUnit), [joiners]);
  const tableRows = useMemo(
    () =>
    joiners.
    filter((row) => !selectedUnit || row.organizationUnit === selectedUnit).
    sort((a, b) => b.hireDate.localeCompare(a.hireDate) || a.name.localeCompare(b.name)),
    [joiners, selectedUnit]
  );

  // Back to the first page whenever a filter or chart selection changes the rows.
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [tableRows]);
  const pageRows = tableRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const startedNote = `Of ${summary.started} started in the period`;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatTile
          label="Joiners"
          value={String(joiners.length)}
          note="Hire date in the period"
          formula={'Joiners = Onboardings whose hire date falls in the period\nCancelled onboardings are not counted'} />

        <StatTile
          label="Onboardings completed"
          value={String(summary.completed)}
          note={startedNote}
          formula={'Onboardings started in the period that are completed\nCancelled onboardings are not counted'} />

        <StatTile
          label="Onboardings in progress"
          value={String(summary.inProgress)}
          note={startedNote}
          formula={'Onboardings started in the period that are not yet completed\nCancelled onboardings are not counted'} />

        <StatTile
          label="Average days to complete"
          value={summary.averageDaysToComplete === null ? unavailable : `${formatNumber(summary.averageDaysToComplete)} days`}
          muted={summary.averageDaysToComplete === null}
          note={summary.completed === 0 ? 'No onboardings completed yet' : 'Start to completion'}
          formula={`Average days to complete = Total days from start to completion ÷ Onboardings completed\n${
          summary.averageDaysToComplete === null ?
          'No onboardings started in the period are completed yet.' :
          `${summary.totalDaysToComplete} ÷ ${summary.completed} = ${formatNumber(summary.averageDaysToComplete)} days`}`
          } />

      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="Completion rate"
          value={summary.completionRate === null ? unavailable : formatPercent(summary.completionRate)}
          muted={summary.completionRate === null}
          note={`${summary.completed} of ${summary.started} completed`}
          formula={`Completion rate = Onboardings completed ÷ Onboardings started in the period × 100\n${
          summary.completionRate === null ?
          'No onboardings were started in the period.' :
          `${summary.completed} ÷ ${summary.started} × 100 = ${formatPercent(summary.completionRate)}`}\nCancelled onboardings are not counted`
          } />

        <StatTile
          label="On-time completion rate"
          value={summary.onTimeRate === null ? unavailable : formatPercent(summary.onTimeRate)}
          muted={summary.onTimeRate === null}
          note={`${summary.onTime} of ${summary.completed} by the Planned Completion Date`}
          formula={`On-time completion rate = Completed on or before the Planned Completion Date ÷ Onboardings completed × 100\n${
          summary.onTimeRate === null ?
          'No onboardings started in the period are completed yet.' :
          `${summary.onTime} ÷ ${summary.completed} × 100 = ${formatPercent(summary.onTimeRate)}`}\nOnboardings in progress are not counted. The Planned Completion Date is the latest task due date when the onboarding started.`
          } />

        <StatTile
          label="Cancelled"
          value={String(summary.cancelled)}
          note="Started in the period, then cancelled"
          formula={'Onboardings started in the period that were cancelled\nThey are left out of every completion figure'} />

      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <ReportCard title="Joiners per month" description="By hire date" className="xl:col-span-2">
          <ColumnChart
            label="Joiners per month"
            entries={byMonth.map((month) => ({
              key: month.key,
              label: month.label,
              value: month.count,
              valueLabel: month.count > 0 ? String(month.count) : '',
              hover: `${month.label}: ${month.count} joiner${month.count === 1 ? '' : 's'}`
            }))} />

        </ReportCard>
        <ReportCard
          title="Joiners by organization unit"
          description="Highest first. Select an organization unit to filter the table">

          <BarList
            entries={byUnit}
            selected={selectedUnit}
            onSelect={(label) => onSelectUnit(label === selectedUnit ? undefined : label as Department)}
            noun="joiners" />

        </ReportCard>
      </div>

      <ReportCard
        title="Joiners"
        description={
        selectedUnit ?
        `${tableRows.length} of ${joiners.length} joiners` :
        `${joiners.length} joiner${joiners.length === 1 ? '' : 's'}`
        }
        actions={
        selectedUnit &&
        <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 py-1 pl-2.5 pr-1 text-[12px] text-brand-700 ring-1 ring-inset ring-brand-200">
                Organization unit: {selectedUnit}
                <button
              type="button"
              onClick={() => onSelectUnit(undefined)}
              aria-label={`Remove Organization unit ${selectedUnit}`}
              className="rounded-full p-0.5 transition-colors duration-150 ease-out hover:bg-brand-100">

                  <XIcon className="h-3 w-3" />
                </button>
              </span>
              <button
            type="button"
            onClick={() => onSelectUnit(undefined)}
            className="text-[12px] font-medium text-brand-700 transition-colors duration-150 ease-out hover:text-brand-600">

                Show all joiners
              </button>
            </div>

        }>

        <div className="-mx-5 -mb-5 border-t border-line">
          <div className="overflow-x-auto">
          <div className="min-w-[1050px]">
            <div
              className={`${TABLE_GRID} border-b border-line bg-slate-50/70 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-subtle`}>

              <span>Name</span>
              <span>Organization unit</span>
              <span>Job title</span>
              <span>Employment type</span>
              <span>Hire date</span>
              <span>Onboarding status</span>
              <span>Progress</span>
            </div>
            <ul className="divide-y divide-line">
              {pageRows.map((row) =>
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
                  <span className="text-muted">{row.employmentType}</span>
                  <span className="text-ink">{formatDate(row.hireDate)}</span>
                  <span
                  title={
                  row.completedOn ?
                  `Completed ${formatDate(row.completedOn)} after ${daysBetween(row.startedOn, row.completedOn)} days\nPlanned Completion Date ${formatDate(row.plannedCompletionDate)} · ${
                  row.completedOn <= row.plannedCompletionDate ? 'on time' : 'late'}` :
                  `Planned Completion Date ${formatDate(row.plannedCompletionDate)}`
                  }>

                    <Badge className={STATUS_BADGE[row.status]}>{STATUS_LABEL[row.status]}</Badge>
                  </span>
                  <span>
                    <span className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="text-muted">
                        {row.progress.done}/{row.progress.total} tasks
                      </span>
                      <span className="font-semibold text-ink">{row.progress.percent}%</span>
                    </span>
                    <Progress
                    value={row.progress.percent}
                    tone={row.status === 'Completed' ? 'emerald' : row.status === 'At Risk' ? 'amber' : 'brand'} />

                  </span>
                </li>
              )}
            </ul>
          </div>
          </div>
          {tableRows.length > PAGE_SIZE &&
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={tableRows.length}
            onChange={setPage}
            className="border-t border-line px-5 py-3" />

          }
        </div>
      </ReportCard>
    </div>);

}
