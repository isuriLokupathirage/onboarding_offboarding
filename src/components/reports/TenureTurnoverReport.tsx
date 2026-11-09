import { useMemo } from 'react';
import { ReportCard, BarList, ColumnChart, StatTile, type ColumnEntry } from './ReportCharts';
import type { EmploymentRecord } from '../../data/headcount';
import { formatDate } from '../../utils/format';
import {
  AVERAGE_HEADCOUNT_FORMULA,
  TENURE_BANDS,
  TURNOVER_FORMULA,
  averageHeadcountWorking,
  averageTenureMonths,
  earlyAttrition,
  formatNumber,
  formatPercent,
  formatTenure,
  leaversByTenureBand,
  totalTenureMonths,
  turnoverByMonth,
  turnoverFor,
  turnoverWorking,
  type DateRange,
  type LeaverRow } from
'../../utils/reports';

/**
 * Offboarding Reports → tenure and turnover: how long leavers stayed, and leavers against headcount.
 * `rows` holds the leavers in the period that match the filters; `headcount` holds every employment
 * that matches the organization unit, employment type and client filters.
 */
export function TenureTurnoverReport({
  rows,
  range,
  headcount,
  selectedBand,
  onSelectBand
}: {
  rows: LeaverRow[];
  range: DateRange;
  headcount: EmploymentRecord[];
  selectedBand?: string;
  onSelectBand: (band: string) => void;
}) {
  const bands = useMemo(() => leaversByTenureBand(rows), [rows]);
  const attrition = earlyAttrition(rows);
  const averageTenure = averageTenureMonths(rows);
  const totalTenure = totalTenureMonths(rows);
  const turnover = useMemo(() => turnoverFor(rows.length, headcount, range), [rows, headcount, range]);
  const months = useMemo(() => turnoverByMonth(rows, headcount, range), [rows, headcount, range]);

  const monthColumns: ColumnEntry[] = months.map(({ key, label, turnover: month }) =>
  month.available ?
  {
    key,
    label,
    value: month.rate,
    valueLabel: month.leavers > 0 ? formatPercent(month.rate) : '',
    hover: `${label}: ${formatPercent(month.rate)} turnover\n${TURNOVER_FORMULA}\n${turnoverWorking(month)}\n${AVERAGE_HEADCOUNT_FORMULA}\n${averageHeadcountWorking(month)}`
  } :
  { key, label, value: null, valueLabel: '', hover: `${label}: turnover unavailable\n${month.reason}` }
  );
  const anyMonthAvailable = months.some((month) => month.turnover.available);
  const unavailableReasons = [
  ...new Set(months.flatMap(({ turnover: month }) => month.available ? [] : [month.reason]))];

  return (
    <section className="space-y-5" aria-labelledby="tenure-turnover-heading">
      <div>
        <h2 id="tenure-turnover-heading" className="text-[15px] font-semibold text-ink">
          Tenure and turnover
        </h2>
        <p className="mt-0.5 text-[12px] text-muted">
          Tenure runs from Date of Joining to Actual Exit Date. Hover over a figure to see how it is calculated.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatTile
          label="Average tenure"
          value={formatTenure(averageTenure)}
          note={`Across ${rows.length} leaver${rows.length === 1 ? '' : 's'}`}
          formula={`Average tenure = Total tenure of all leavers ÷ Number of leavers\n${totalTenure} months ÷ ${rows.length} = ${formatTenure(averageTenure)}\nTenure = Actual Exit Date − Date of Joining`} />

        <StatTile
          label="Early attrition"
          value={formatPercent(attrition.percent)}
          note={`${attrition.early} of ${attrition.total} left within 12 months`}
          formula={`Early attrition = Leavers with tenure under 12 months ÷ Total leavers × 100\n${attrition.early} ÷ ${attrition.total} × 100 = ${formatPercent(attrition.percent)}`} />

        {turnover.available ?
        <>
            <StatTile
            label="Turnover rate"
            value={formatPercent(turnover.rate)}
            note={`${turnover.leavers} leavers against ${formatNumber(turnover.averageHeadcount)} average headcount`}
            formula={`${TURNOVER_FORMULA}\n${turnoverWorking(turnover)}${
            turnover.endDate < range.to ? `\nThe period is still running, so headcount at the end is today's (${formatDate(turnover.endDate)}).` : ''}`
            } />

            <StatTile
            label="Average headcount"
            value={formatNumber(turnover.averageHeadcount)}
            note={`${turnover.startHeadcount} at start, ${turnover.endHeadcount} at end`}
            formula={`${AVERAGE_HEADCOUNT_FORMULA}\n${averageHeadcountWorking(turnover)}`} />

          </> :

        <>
            <StatTile
            label="Turnover rate"
            value="Unavailable"
            muted
            note={turnover.reason}
            formula={`${TURNOVER_FORMULA}\nUnavailable: ${turnover.reason}`} />

            <StatTile
            label="Average headcount"
            value="Unavailable"
            muted
            note="Headcount for this period cannot be determined"
            formula={`${AVERAGE_HEADCOUNT_FORMULA}\nUnavailable: ${turnover.reason}`} />

          </>
        }
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ReportCard title="Leavers by tenure" description="Select a band to filter the table">
          <BarList entries={bands} selected={selectedBand} onSelect={onSelectBand} noun="leavers" />
          <p className="mt-3 text-[11px] text-subtle">
            {TENURE_BANDS.map((band) => `${band.label}: ${band.bounds.toLowerCase()}`).join(' · ')}
          </p>
        </ReportCard>

        <ReportCard title="Turnover rate per month" description="Leavers in the month ÷ average headcount for the month × 100">
          {anyMonthAvailable ?
          <>
              <ColumnChart entries={monthColumns} label="Turnover rate per month" />
              {unavailableReasons.length > 0 &&
            <p className="mt-3 text-[11px] text-subtle">
                  Dashed months have no turnover rate. {unavailableReasons.join(' ')}
                </p>
            }
            </> :

          <p className="rounded-lg bg-slate-50 px-4 py-8 text-center text-[13px] text-muted">
              Turnover rate is unavailable for this period. {turnover.available ? '' : turnover.reason}
            </p>
          }
        </ReportCard>
      </div>
    </section>);

}
