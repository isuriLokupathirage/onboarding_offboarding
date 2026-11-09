import { useMemo, useState } from 'react';
import { BarChart3Icon, CalendarRangeIcon, XIcon } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { FacetedFilter } from '../../components/ui/FacetedFilter';
import { Input, Select } from '../../components/ui/Field';
import { Tabs } from '../../components/ui/Segmented';
import { ExitVolumeReport, type LeaverSelection } from '../../components/reports/ExitVolumeReport';
import { OnboardingReport } from '../../components/reports/OnboardingReport';
import { useAppData } from '../../contexts/AppDataContext';
import { currentStaff } from '../../data/headcount';
import { departments } from '../../data/people';
import { OFFBOARDING_TYPES } from '../../data/exitReasons';
import type { Department, EmploymentType } from '../../types';
import { formatDate } from '../../utils/format';
import { PROTOTYPE_TODAY } from '../../utils/transitions';
import {
  DEFAULT_PERIOD,
  DEFAULT_REPORT_FILTERS,
  PERIOD_OPTIONS,
  customRangeError,
  filterLeavers,
  filterPopulation,
  headcountPopulation,
  formatRange,
  isPeriodPreset,
  leaverRows,
  periodLabel,
  reportRange,
  type DateRange,
  type ReportFilters,
  type ReportTab } from
'../../utils/reports';
import { filterJoinerRows, joinerRows, joinersInPeriod, onboardingSummary } from '../../utils/onboardingReports';
import { useScreenInit } from '../../useScreenInit.js';

const EMPLOYMENT_TYPES: EmploymentType[] = ['Permanent', 'Contract', 'Internship', 'Consultant'];

interface ReportsScreenState {
  tab?: ReportTab;
  filters?: Partial<ReportFilters>;
  selection?: LeaverSelection;
  /** Onboarding tab: the organization unit picked in the chart. */
  joinerUnit?: Department;
}

interface FilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

/**
 * Onboarding & Offboarding → Reports. Filters are held here only, so they carry across the tabs
 * and reset when the user leaves the screen.
 */
export function Reports() {
  const init = useScreenInit() as ReportsScreenState;
  const { transitions, templates } = useAppData();
  const [tab, setTab] = useState<ReportTab>(init.tab ?? 'Offboarding');
  const [filters, setFiltersState] = useState<ReportFilters>(() => ({
    ...DEFAULT_REPORT_FILTERS,
    ...init.filters
  }));
  const [selection, setSelection] = useState<LeaverSelection>(init.selection ?? {});
  const [joinerUnit, setJoinerUnit] = useState<Department | undefined>(init.joinerUnit);

  // A new filter changes who is in the report, so chart selections start again.
  const setFilters = (patch: Partial<ReportFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...patch }));
    setSelection({});
    setJoinerUnit(undefined);
  };

  const allLeavers = useMemo(() => leaverRows(transitions), [transitions]);
  const clients = useMemo(
    () =>
    [...new Set([...templates.map((template) => template.client), ...allLeavers.map((row) => row.client)])].sort(),
    [templates, allLeavers]
  );
  const range = useMemo(() => reportRange(filters), [filters]);
  const rangeError = filters.period === 'custom' ? customRangeError(filters.customFrom, filters.customTo) : undefined;
  const leavers = useMemo(() => range ? filterLeavers(allLeavers, range, filters) : [], [allLeavers, range, filters]);
  // Headcount follows organization unit, employment type and client, but not Offboarding Type.
  const headcount = useMemo(
    () => filterPopulation(headcountPopulation(currentStaff, allLeavers), filters),
    [allLeavers, filters]
  );
  const allJoiners = useMemo(() => joinerRows(transitions), [transitions]);
  const onboardings = useMemo(() => filterJoinerRows(allJoiners, filters), [allJoiners, filters]);
  const joiners = useMemo(() => range ? joinersInPeriod(onboardings, range) : [], [onboardings, range]);
  // The Onboarding tab is empty only when no one joins and no onboarding starts in the period.
  const onboardingHasData = useMemo(() => {
    if (!range) return false;
    const summary = onboardingSummary(onboardings, range);
    return joiners.length > 0 || summary.started + summary.cancelled > 0;
  }, [onboardings, joiners, range]);
  const isOffboarding = tab === 'Offboarding';

  // Counts beside each filter option, ignoring that filter's own choice: leavers in the period on
  // the Offboarding tab, joiners in the period on the Onboarding tab.
  const optionCount = (
  patch: Partial<ReportFilters>,
  match: (row: {organizationUnit: Department;employmentType: EmploymentType;client: string;}) => boolean) =>
  {
    if (!range) return undefined;
    const next = { ...filters, ...patch };
    return isOffboarding ?
    filterLeavers(allLeavers, range, next).filter(match).length :
    joinersInPeriod(filterJoinerRows(allJoiners, next), range).filter(match).length;
  };

  const chips: FilterChip[] = [];
  if (filters.period !== DEFAULT_PERIOD) {
    chips.push({
      key: 'period',
      label: `Period: ${periodLabel(filters)}`,
      onRemove: () => setFilters({ period: DEFAULT_PERIOD, customFrom: '', customTo: '' })
    });
  }
  filters.orgUnits.forEach((unit) =>
  chips.push({
    key: `unit-${unit}`,
    label: `Organization unit: ${unit}`,
    onRemove: () => setFilters({ orgUnits: filters.orgUnits.filter((item) => item !== unit) })
  })
  );
  filters.employmentTypes.forEach((type) =>
  chips.push({
    key: `employment-${type}`,
    label: `Employment type: ${type}`,
    onRemove: () => setFilters({ employmentTypes: filters.employmentTypes.filter((item) => item !== type) })
  })
  );
  filters.clients.forEach((client) =>
  chips.push({
    key: `client-${client}`,
    label: `Client: ${client}`,
    onRemove: () => setFilters({ clients: filters.clients.filter((item) => item !== client) })
  })
  );
  // Offboarding Type applies to the Offboarding tab only. It is kept, but not shown, on Onboarding.
  if (isOffboarding) {
    filters.offboardingTypes.forEach((type) =>
    chips.push({
      key: `offboarding-${type}`,
      label: `Offboarding type: ${type}`,
      onRemove: () => setFilters({ offboardingTypes: filters.offboardingTypes.filter((item) => item !== type) })
    })
    );
  }
  const clearFilters = () => setFilters(DEFAULT_REPORT_FILTERS);

  return (
    <div className="pb-24">
      <PageHeader title="Reports" breadcrumb={[{ label: 'Onboarding & Offboarding' }, { label: 'Reports' }]} />

      <div className="px-8 pt-4">
        <Tabs<ReportTab>
          options={[
          { value: 'Onboarding', label: 'Onboarding Reports' },
          { value: 'Offboarding', label: 'Offboarding Reports' }]
          }
          value={tab}
          onChange={setTab} />

      </div>

      <div className="px-8 py-5">
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={filters.period}
            onChange={(event) => {
              const value = event.target.value;
              if (isPeriodPreset(value)) setFilters({ period: value });
            }}
            aria-label="Period"
            className="w-56 text-[13px]">

            {PERIOD_OPTIONS.map((option) =>
            <option key={option.value} value={option.value}>
                Period: {option.label}
              </option>
            )}
          </Select>
          {filters.period === 'custom' &&
          <div className="flex items-center gap-2">
              <Input
              type="date"
              value={filters.customFrom}
              onChange={(event) => setFilters({ customFrom: event.target.value })}
              aria-label="Start date"
              aria-invalid={Boolean(rangeError && filters.customFrom && filters.customTo)}
              className="w-40 text-[13px]" />

              <span className="text-[13px] text-muted">to</span>
              <Input
              type="date"
              value={filters.customTo}
              min={filters.customFrom || undefined}
              onChange={(event) => setFilters({ customTo: event.target.value })}
              aria-label="End date"
              aria-invalid={Boolean(rangeError && filters.customFrom && filters.customTo)}
              className="w-40 text-[13px]" />

            </div>
          }
          <FacetedFilter
            title="Organization unit"
            searchable={false}
            showChips={false}
            options={departments.map((unit) => ({
              value: unit,
              label: unit,
              count: optionCount({ orgUnits: [] }, (row) => row.organizationUnit === unit)
            }))}
            selected={filters.orgUnits}
            onChange={(values) => setFilters({ orgUnits: departments.filter((unit) => values.includes(unit)) })} />

          <FacetedFilter
            title="Employment type"
            searchable={false}
            showChips={false}
            options={EMPLOYMENT_TYPES.map((type) => ({
              value: type,
              label: type,
              count: optionCount({ employmentTypes: [] }, (row) => row.employmentType === type)
            }))}
            selected={filters.employmentTypes}
            onChange={(values) =>
            setFilters({ employmentTypes: EMPLOYMENT_TYPES.filter((type) => values.includes(type)) })
            } />

          <FacetedFilter
            title="Client"
            showChips={false}
            options={clients.map((client) => ({
              value: client,
              label: client,
              count: optionCount({ clients: [] }, (row) => row.client === client)
            }))}
            selected={filters.clients}
            onChange={(values) => setFilters({ clients: clients.filter((client) => values.includes(client)) })} />

          {isOffboarding &&
          <FacetedFilter
            title="Offboarding type"
            searchable={false}
            showChips={false}
            options={OFFBOARDING_TYPES.map((type) => ({
              value: type,
              label: type,
              count: range ?
              filterLeavers(allLeavers, range, { ...filters, offboardingTypes: [] }).filter((row) => row.type === type).length :
              undefined
            }))}
            selected={filters.offboardingTypes}
            onChange={(values) =>
            setFilters({ offboardingTypes: OFFBOARDING_TYPES.filter((type) => values.includes(type)) })
            } />

          }
        </div>

        {rangeError && (filters.customFrom || filters.customTo) &&
        <p className="mt-2 text-[12px] text-red-600" role="alert">
            {rangeError}
          </p>
        }

        {chips.length > 0 &&
        <div className="mt-3 flex flex-wrap items-center gap-2">
            {chips.map((chip) =>
          <span
            key={chip.key}
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-1 pl-2.5 pr-1 text-[12px] text-ink ring-1 ring-inset ring-slate-200">

                {chip.label}
                <button
              type="button"
              onClick={chip.onRemove}
              aria-label={`Remove filter ${chip.label}`}
              className="rounded-full p-0.5 text-subtle transition-colors duration-150 ease-out hover:bg-slate-200 hover:text-ink">

                  <XIcon className="h-3 w-3" />
                </button>
              </span>
          )}
            <button
            type="button"
            onClick={clearFilters}
            className="text-[12px] font-medium text-brand-700 transition-colors duration-150 ease-out hover:text-brand-600">

              Clear filters
            </button>
          </div>
        }

        <div className="mt-5">
          {!range ?
          <EmptyState
            icon={CalendarRangeIcon}
            title="Choose a date range"
            description="Select a start date and an end date to see the report for a custom period." /> :

          <>
              <ReportMeta range={range} />
              {isOffboarding ?
            leavers.length === 0 ?
            <EmptyState
              icon={BarChart3Icon}
              title="No leavers in this period"
              description={`No completed offboardings have an Actual Exit Date in ${formatRange(range)}${
              chips.some((chip) => chip.key !== 'period') ? ' that match the selected filters' : ''}.`
              }
              action={
              chips.length > 0 ?
              <Button size="sm" onClick={clearFilters}>
                        Clear filters
                      </Button> :
              undefined
              } /> :


            <ExitVolumeReport
              rows={leavers}
              range={range}
              headcount={headcount}
              selection={selection}
              onSelectionChange={setSelection} /> :


            onboardingHasData ?
            <OnboardingReport
              joiners={joiners}
              rows={onboardings}
              range={range}
              selectedUnit={joinerUnit}
              onSelectUnit={setJoinerUnit} /> :

            <EmptyState
              icon={BarChart3Icon}
              title="No onboardings in this period"
              description={`No onboardings have a hire date or a start date in ${formatRange(range)}${
              chips.some((chip) => chip.key !== 'period') ? ' that match the selected filters' : ''}.`
              }
              action={
              chips.length > 0 ?
              <Button size="sm" onClick={clearFilters}>
                        Clear filters
                      </Button> :
              undefined
              } />

            }
            </>
          }
        </div>
      </div>
    </div>);

}

/** The period a report covers and the date it was generated. */
function ReportMeta({ range }: {range: DateRange;}) {
  return (
    <p className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted">
      <span>
        Period: <span className="font-medium text-ink">{formatRange(range)}</span>
      </span>
      <span className="h-3.5 w-px bg-line" aria-hidden="true" />
      <span>
        Generated on <span className="font-medium text-ink">{formatDate(PROTOTYPE_TODAY)}</span>
      </span>
    </p>);

}
