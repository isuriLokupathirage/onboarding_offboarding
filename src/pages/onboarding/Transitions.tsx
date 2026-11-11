import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangleIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  MailIcon,
  PlusIcon,
  SendIcon,
  UsersIcon,
  XIcon } from
'lucide-react';
import { twMerge } from 'tailwind-merge';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Segmented } from '../../components/ui/Segmented';
import { SearchInput } from '../../components/ui/SearchInput';
import { Toggle } from '../../components/ui/Toggle';
import { FacetedFilter } from '../../components/ui/FacetedFilter';
import { Select } from '../../components/ui/Field';
import { Avatar, AvatarGroup } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Progress } from '../../components/ui/Progress';
import { EmptyState } from '../../components/ui/EmptyState';
import { Tooltip } from '../../components/ui/Tooltip';
import { SendTransitionFormDialog } from '../../components/onboarding/SendTransitionFormDialog';
import { sendFormNotice } from '../../utils/sendForm';
import { SendExitFeedbackFormDialog } from '../../components/onboarding/SendExitFeedbackFormDialog';
import { useAppData } from '../../contexts/AppDataContext';
import { useEmployeeData } from '../../contexts/EmployeeDataContext';
import { peopleById } from '../../data/people';
import type { Transition, TransitionKind } from '../../types';
import { formatDate } from '../../utils/format';
import {
  canReceiveExitFeedback,
  canReceiveForm,
  daysLabel,
  exitFeedbackSendBlock,
  hasTaskOwnedBy,
  isOverdue,
  PROTOTYPE_TODAY,
  statusGroup,
  taskOwnerIds,
  transitionProgress,
  transitionTargetDate,
  visibleKinds,
  type TransitionStatusGroup } from
'../../utils/transitions';
import { attentionLabels, attentionTasks, isAttentionFilter, type AttentionFilter } from '../../utils/attention';
import { UPCOMING_PERIODS, isUpcomingPeriod, startsWithin, type UpcomingPeriod } from '../../utils/upcoming';
import { useScreenInit } from '../../useScreenInit.js';

type TypeFilter = 'all' | TransitionKind;

const PAGE_SIZE = 10;
const STATUS_OPTIONS: TransitionStatusGroup[] = ['Active', 'Completed', 'Cancelled'];
/** The list opens on transitions in progress. */
const DEFAULT_STATUSES: TransitionStatusGroup[] = ['Active'];
const ATTENTION_OPTIONS: AttentionFilter[] = ['overdue', 'blocked', 'due-today'];

interface ListScreenState {
  /** Canvas: one status, as the screens set before Status became a filter. */
  tab?: TransitionStatusGroup;
  statuses?: TransitionStatusGroup[];
  assignedToMe?: boolean;
  type?: TypeFilter;
  query?: string;
  attention?: AttentionFilter[];
  starting?: UpcomingPeriod;
  /** Canvas: open Send Form for these transitions, as the bulk action does. */
  sendTo?: string[];
}

interface FilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

/** ?attention= holds one value from a dashboard count, or several separated by commas. */
function parseAttention(value: string | null): AttentionFilter[] {
  const values = (value ?? '').split(',').filter(isAttentionFilter);
  return ATTENTION_OPTIONS.filter((option) => values.includes(option));
}

/** ?status= holds one status (the dashboard sends Active) or several separated by commas. */
function parseStatuses(value: string | null): TransitionStatusGroup[] {
  const values = (value ?? '').split(',');
  return STATUS_OPTIONS.filter((option) => values.includes(option));
}

const sameStatuses = (a: TransitionStatusGroup[], b: TransitionStatusGroup[]): boolean =>
a.length === b.length && a.every((status) => b.includes(status));
const PERMISSION_NOTE = 'Requires the Manage Onboarding Transitions permission';
const GRID =
'grid grid-cols-[20px_minmax(200px,2.2fr)_110px_minmax(150px,1.6fr)_130px_90px_150px_84px] items-center gap-4';

export function Transitions() {
  const navigate = useNavigate();
  const init = useScreenInit() as ListScreenState;
  const { transitions, currentUserId, oboPermissions, hasOboPermission } = useAppData();
  const [searchParams, setSearchParams] = useSearchParams();
  // The dashboard links here with ?status=Active. No status chosen lists every status.
  const linkedStatuses = parseStatuses(searchParams.get('status'));
  const [statuses, setStatuses] = useState<TransitionStatusGroup[]>(() => {
    if (init.statuses) return init.statuses;
    if (init.tab) return [init.tab];
    if (searchParams.get('status') === 'All') return [];
    return linkedStatuses.length > 0 ? linkedStatuses : DEFAULT_STATUSES;
  });
  const [assignedToMe, setAssignedToMe] = useState(init.assignedToMe ?? false);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(init.type ?? 'all');
  const [query, setQuery] = useState(init.query ?? '');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>(init.sendTo ?? []);
  const [sendingTo, setSendingTo] = useState<string[] | null>(init.sendTo ?? null);
  // Offboarding rows send exit feedback forms, one leaver at a time.
  const [exitFeedbackFor, setExitFeedbackFor] = useState<string | null>(null);
  const { employees } = useEmployeeData();
  const [notice, setNotice] = useState<string | null>(null);

  const kinds = useMemo(() => visibleKinds(oboPermissions), [oboPermissions]);
  // The dashboard links here with ?attention= (header counts, Needs Attention) or ?starting=
  // (Upcoming Transitions); each opens the list with that filter applied as a chip.
  const linkedAttention = parseAttention(searchParams.get('attention'));
  const startingParam = searchParams.get('starting');
  const [attention, setAttention] = useState<AttentionFilter[]>(
    linkedAttention.length > 0 ? linkedAttention : init.attention ?? []
  );
  const [starting, setStarting] = useState<UpcomingPeriod | null>(
    isUpcomingPeriod(startingParam) ? startingParam : init.starting ?? null
  );

  // Keep the address in step with the Status, Attention and Starting filters, so a reload keeps them.
  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (statuses.length > 0) next.set('status', statuses.join(','));else
        next.set('status', 'All');
        if (attention.length > 0) next.set('attention', attention.join(','));else
        next.delete('attention');
        if (starting) next.set('starting', starting);else
        next.delete('starting');
        return next;
      },
      { replace: true }
    );
  }, [statuses, attention, starting, setSearchParams]);
  const statusMatches = useCallback(
    (transition: Transition) => statuses.length === 0 || statuses.includes(statusGroup(transition)),
    [statuses]
  );
  const canSeeRestricted = hasOboPermission('View Restricted Tasks');
  const canSendForms = hasOboPermission('Manage Onboarding Transitions');
  const canStartTransition = canSendForms || hasOboPermission('Manage Offboarding Transitions');
  const isSelectable = (transition: Transition) => canSendForms && canReceiveForm(transition);
  const closeSendForm = useCallback(() => setSendingTo(null), []);
  const closeExitFeedback = useCallback(() => setExitFeedbackFor(null), []);
  const canManageOffboarding = hasOboPermission('Manage Offboarding Transitions');
  const canSendExitFeedback = hasOboPermission('Send Exit Feedback Forms');
  const officialEmailOf = (transition: Transition) =>
  employees.find((employee) => employee.id === transition.exit?.employeeId)?.officialEmail;
  /** The row's Send Form action: who it sends to, and why it is disabled when it is. */
  const rowSendForm = (transition: Transition): {label: string;blocked?: string;onSend: () => void;} | null => {
    const fullName = `${transition.candidate.firstName} ${transition.candidate.lastName}`;
    if (canReceiveForm(transition)) {
      return {
        label: `Send a form to ${fullName}`,
        blocked: canSendForms ? undefined : PERMISSION_NOTE,
        onSend: () => setSendingTo([transition.id])
      };
    }
    if (canReceiveExitFeedback(transition) && canManageOffboarding) {
      return {
        label: `Send an exit feedback form to ${fullName}`,
        blocked: exitFeedbackSendBlock(canSendExitFeedback, officialEmailOf(transition)),
        onSend: () => setExitFeedbackFor(transition.id)
      };
    }
    return null;
  };
  const exitFeedbackTransition = transitions.find((transition) => transition.id === exitFeedbackFor);

  const scoped = useMemo(
    () =>
    transitions.filter(
      (transition) =>
      kinds.includes(transition.kind) && (
      !assignedToMe || hasTaskOwnedBy(transition, currentUserId))
    ),
    [transitions, kinds, assignedToMe, currentUserId]
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return scoped.filter(
      (transition) =>
      statusMatches(transition) && (
      attention.length === 0 ||
      attention.some((filter) => attentionTasks(transition, filter, canSeeRestricted).length > 0)) && (
      !starting || startsWithin(transition, PROTOTYPE_TODAY, starting)) && (
      typeFilter === 'all' || transition.kind === typeFilter) && (
      !needle ||
      `${transition.candidate.firstName} ${transition.candidate.lastName}`.
      toLowerCase().
      includes(needle))
    );
  }, [scoped, statusMatches, typeFilter, query, attention, starting, canSeeRestricted]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const filtersApplied =
  Boolean(query.trim()) ||
  typeFilter !== 'all' ||
  assignedToMe ||
  attention.length > 0 ||
  Boolean(starting) ||
  !sameStatuses(statuses, DEFAULT_STATUSES);
  const attentionCount = (filter: AttentionFilter) =>
  scoped.filter(
    (transition) => statusMatches(transition) && attentionTasks(transition, filter, canSeeRestricted).length > 0
  ).length;
  const onlyStatus = statuses.length === 1 ? statuses[0].toLowerCase() : null;
  const selectableOnPage = pageItems.filter(isSelectable);
  const allOnPageSelected =
  selectableOnPage.length > 0 && selectableOnPage.every((transition) => selected.includes(transition.id));
  const recipients = transitions.filter(
    (transition) => sendingTo?.includes(transition.id) && isSelectable(transition)
  );

  const toggleSelected = (id: string) =>
  setSelected((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);

  const togglePage = () =>
  setSelected((prev) =>
  allOnPageSelected ?
  prev.filter((id) => !selectableOnPage.some((transition) => transition.id === id)) :
  [...new Set([...prev, ...selectableOnPage.map((transition) => transition.id)])]
  );

  // A selection only holds transitions the current statuses list.
  const changeStatuses = (next: TransitionStatusGroup[]) => {
    setStatuses(next);
    setPage(1);
    setSelected([]);
  };

  // Clear filters puts the list back to how it opens: Active, nothing else applied.
  const clearFilters = () => {
    changeStatuses(DEFAULT_STATUSES);
    setQuery('');
    setTypeFilter('all');
    setAssignedToMe(false);
    setAttention([]);
    setStarting(null);
    setPage(1);
  };

  const chips: FilterChip[] = statuses.map((status) => ({
    key: `status-${status}`,
    label: `Status: ${status}`,
    onRemove: () => changeStatuses(statuses.filter((item) => item !== status))
  }));
  if (query.trim()) chips.push({ key: 'query', label: `Search: “${query.trim()}”`, onRemove: () => setQuery('') });
  if (typeFilter !== 'all') chips.push({ key: 'type', label: `Type: ${typeFilter}`, onRemove: () => setTypeFilter('all') });
  attention.forEach((filter) =>
  chips.push({
    key: `attention-${filter}`,
    label: `Attention: ${attentionLabels[filter]}`,
    onRemove: () => setAttention((prev) => prev.filter((item) => item !== filter))
  })
  );
  if (starting) {
    const period = UPCOMING_PERIODS.find((item) => item.value === starting);
    chips.push({ key: 'starting', label: `Starting: ${period?.label}`, onRemove: () => setStarting(null) });
  }
  if (assignedToMe) chips.push({ key: 'mine', label: 'Assigned to me', onRemove: () => setAssignedToMe(false) });

  const bulkSendButton =
  <Button
    variant="primary"
    disabled={!canSendForms || selected.length === 0}
    onClick={() => setSendingTo(selected)}>

      <SendIcon className="h-4 w-4" />
      Send Form
      {selected.length > 0 &&
    <span className="rounded bg-white/20 px-1.5 py-0.5 text-[11px] font-semibold">{selected.length}</span>
    }
    </Button>;


  return (
    <div className="pb-24">
      <PageHeader
        title="Transitions"
        subtitle="Every joiner and leaver moving through a template, with progress and task owners."
        actions={
        canStartTransition &&
        <Button variant="primary" onClick={() => navigate('/onboarding/transitions/new')}>
            <PlusIcon className="h-4 w-4" />
            New Transition
          </Button>
        } />


      <div className="px-8 py-6">
        {notice &&
        <div className="mb-4 rounded-lg bg-emerald-50 px-3.5 py-3 text-[13px] text-emerald-900 ring-1 ring-inset ring-emerald-200">
            {notice}
          </div>
        }

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput
              value={query}
              onChange={(value) => {
                setQuery(value);
                setPage(1);
              }}
              placeholder="Search by candidate or employee name"
              className="w-72" />

            <FacetedFilter
              title="Status"
              searchable={false}
              showChips={false}
              options={STATUS_OPTIONS.map((status) => ({
                value: status,
                label: status,
                count: scoped.filter((transition) => statusGroup(transition) === status).length
              }))}
              selected={statuses}
              onChange={(values) => changeStatuses(parseStatuses(values.join(',')))} />

            {kinds.length > 1 &&
            <Segmented
              size="sm"
              options={[
              { value: 'all', label: 'All types' },
              { value: 'Onboarding', label: 'Onboarding' },
              { value: 'Offboarding', label: 'Offboarding' }]
              }
              value={typeFilter}
              onChange={(value) => {
                setTypeFilter(value);
                setPage(1);
              }} />

            }
            <FacetedFilter
              title="Attention"
              searchable={false}
              showChips={false}
              options={ATTENTION_OPTIONS.map((filter) => ({
                value: filter,
                label: attentionLabels[filter],
                count: attentionCount(filter)
              }))}
              selected={attention}
              onChange={(values) => {
                setAttention(parseAttention(values.join(',')));
                setPage(1);
              }} />

            <Select
              value={starting ?? ''}
              onChange={(event) => {
                const value = event.target.value;
                setStarting(isUpcomingPeriod(value) ? value : null);
                setPage(1);
              }}
              aria-label="Starting"
              className="w-48 text-[13px]">

              <option value="">Starting: Any time</option>
              {UPCOMING_PERIODS.map((period) =>
              <option key={period.value} value={period.value}>
                  Starting: {period.label}
                </option>
              )}
            </Select>
            <label className="inline-flex cursor-pointer items-center gap-2.5 text-[13px] font-medium text-ink">
              <Toggle
                checked={assignedToMe}
                onChange={(next) => {
                  setAssignedToMe(next);
                  setPage(1);
                }}
                label="Assigned to me" />

              Assigned to me
            </label>
          </div>

          <div className="flex items-center gap-2">
            {canSendForms ?
            bulkSendButton :

            <Tooltip label={PERMISSION_NOTE}>
                <span>{bulkSendButton}</span>
              </Tooltip>
            }
            {selected.length > 0 &&
            <Button variant="ghost" onClick={() => setSelected([])} aria-label="Clear selection">
                <XIcon className="h-4 w-4" />
                Clear
              </Button>
            }
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p className="text-[12px] text-muted" aria-live="polite">
            {visible.length} transition{visible.length === 1 ? '' : 's'}
          </p>
          {chips.length > 0 &&
          <>
              <span className="h-4 w-px bg-line" aria-hidden="true" />
              {chips.map((chip) =>
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-1 pl-2.5 pr-1 text-[12px] text-ink ring-1 ring-inset ring-slate-200">

                  {chip.label}
                  <button
                type="button"
                onClick={() => {
                  chip.onRemove();
                  setPage(1);
                }}
                aria-label={`Remove filter ${chip.label}`}
                className="rounded-full p-0.5 text-subtle transition-colors duration-150 ease-out hover:bg-slate-200 hover:text-ink">

                    <XIcon className="h-3 w-3" />
                  </button>
                </span>
            )}
            </>
          }
          {filtersApplied &&
          <button
            type="button"
            onClick={clearFilters}
            className="text-[12px] font-medium text-brand-700 transition-colors duration-150 ease-out hover:text-brand-600">

              Clear filters
            </button>
          }
        </div>

        {selected.length > 0 &&
        <p className="mt-3 text-[12px] text-muted">
            {selected.length} transition{selected.length === 1 ? '' : 's'} selected. Each candidate receives
            their own link at their personal email address.
          </p>
        }

        <div className="mt-5 overflow-x-auto rounded-xl border border-line bg-white shadow-card">
          <div className="min-w-[1040px]">
          <div
            className={`${GRID} border-b border-line bg-slate-50/70 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-subtle`}>

            <span>
              {(statuses.length === 0 || statuses.includes('Active')) && canSendForms &&
              <input
                type="checkbox"
                checked={allOnPageSelected}
                disabled={selectableOnPage.length === 0}
                onChange={togglePage}
                aria-label="Select all onboarding transitions on this page"
                className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-200 disabled:opacity-40" />

              }
            </span>
            <span>Candidate / Employee</span>
            <span>Type</span>
            <span>Template</span>
            <span>Progress</span>
            <span>Task owners</span>
            <span>Days remaining</span>
            <span className="text-right">Actions</span>
          </div>

          {pageItems.length === 0 ?
          <div className="p-6">
              <EmptyState
              icon={UsersIcon}
              title={onlyStatus ? `No ${onlyStatus} transitions found` : 'No transitions found'}
              description={
              filtersApplied ?
              'No transitions match the current search and filters. Try adjusting or clearing them.' :
              onlyStatus ?
              `There are no ${onlyStatus} transitions to show yet.` :
              'There are no transitions to show yet.'
              }
              action={
              filtersApplied ?
              <Button size="sm" onClick={clearFilters}>
                      Clear filters
                    </Button> :
              undefined
              } />

            </div> :

          <ul className="divide-y divide-line">
              {pageItems.map((transition) =>
            <TransitionRow
              key={transition.id}
              transition={transition}
              selectable={isSelectable(transition)}
              checked={selected.includes(transition.id)}
              onToggle={() => toggleSelected(transition.id)}
              sendForm={rowSendForm(transition)}
              onOpen={() => navigate(`/onboarding/transitions/${transition.id}`)} />

            )}
            </ul>
          }
          </div>
        </div>

        {visible.length > PAGE_SIZE &&
        <Pagination
          page={currentPage}
          pageCount={pageCount}
          total={visible.length}
          onChange={setPage} />

        }
      </div>

      <SendTransitionFormDialog
        open={recipients.length > 0}
        recipients={recipients}
        onClose={closeSendForm}
        onSent={(sends, formNames) => {
          setNotice(sendFormNotice(sends, formNames, recipients));
          setSelected([]);
        }} />

      {exitFeedbackTransition &&
      <SendExitFeedbackFormDialog
        open
        transition={exitFeedbackTransition}
        recipient={officialEmailOf(exitFeedbackTransition) ?? ''}
        onClose={closeExitFeedback}
        onSent={(formNames) =>
        setNotice(
          `${formNames.length === 1 ? formNames[0] : `${formNames.length} exit feedback forms`} ${
          formNames.length === 1 ? 'was' : 'were'} sent to ${officialEmailOf(exitFeedbackTransition)}.`
        )
        } />
      }
    </div>);

}

function TransitionRow({
  transition,
  selectable,
  checked,
  onToggle,
  sendForm,
  onOpen
}: {
  transition: Transition;
  selectable: boolean;
  checked: boolean;
  onToggle: () => void;
  /** Onboarding sends an employee form; offboarding sends exit feedback forms. Null hides the action. */
  sendForm: {label: string;blocked?: string;onSend: () => void;} | null;
  onOpen: () => void;
}) {
  const { done, total, percent } = transitionProgress(transition);
  const fullName = `${transition.candidate.firstName} ${transition.candidate.lastName}`;
  const overdue = isOverdue(transition);
  const active = statusGroup(transition) === 'Active';
  let daysTone = 'text-muted';
  if (overdue) daysTone = 'text-red-600';else
  if (active) daysTone = 'text-ink';

  return (
    <li
      onClick={onOpen}
      className={twMerge(
        GRID,
        'cursor-pointer px-5 py-3.5 transition-colors duration-150 ease-out',
        checked ? 'bg-brand-50/40' : 'hover:bg-slate-50/60'
      )}>

      <span onClick={(event) => event.stopPropagation()}>
        {selectable &&
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          aria-label={`Select ${fullName}`}
          className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-200" />
        }
      </span>

      <span className="flex min-w-0 items-center gap-3">
        <Avatar name={fullName} size="md" />
        <span className="min-w-0 leading-tight">
          <Link
            to={`/onboarding/transitions/${transition.id}`}
            onClick={(event) => event.stopPropagation()}
            className="block truncate text-[13px] font-medium text-ink transition-colors duration-150 ease-out hover:text-brand-600">

            {fullName}
          </Link>
          <span className="block truncate text-[12px] text-muted">{transition.candidate.position}</span>
        </span>
      </span>

      <span>
        <span className="inline-flex items-center gap-2 text-[13px] text-ink">
          <span
            className={`h-2 w-2 rounded-full ${
            transition.kind === 'Onboarding' ? 'bg-emerald-500' : 'bg-violet-500'}`
            }
            aria-hidden="true" />

          {transition.kind}
        </span>
        {transition.status === 'At Risk' &&
        <Badge className="mt-1 block w-fit bg-amber-50 text-amber-700 ring-amber-200">At risk</Badge>
        }
      </span>

      <span className="truncate text-[13px] text-muted" title={transition.templateName}>
        {transition.templateName}
      </span>

      <span>
        <span className="mb-1 flex items-center justify-between text-[11px]">
          <span className="text-muted">
            {done}/{total}
          </span>
          <span className="font-semibold text-ink">{percent}%</span>
        </span>
        <Progress value={percent} tone={transition.status === 'At Risk' ? 'amber' : 'brand'} />
      </span>

      <span>
        <AvatarGroup names={taskOwnerIds(transition).map((id) => peopleById[id]?.name ?? id)} size="xs" />
      </span>

      <span className="text-[12px]">
        <span className={`inline-flex items-center gap-1.5 font-medium ${daysTone}`}>
          {overdue ?
          <AlertTriangleIcon className="h-3.5 w-3.5" /> :

          <CalendarDaysIcon className="h-3.5 w-3.5 text-subtle" />
          }
          {daysLabel(transition)}
        </span>
        <span className="mt-0.5 block pl-5 text-muted">{formatDate(transitionTargetDate(transition))}</span>
      </span>

      <span className="flex justify-end gap-1" onClick={(event) => event.stopPropagation()}>
        {sendForm &&
        <Tooltip label={sendForm.blocked ?? sendForm.label}>
            <button
            type="button"
            disabled={Boolean(sendForm.blocked)}
            onClick={sendForm.onSend}
            aria-label={sendForm.label}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-subtle transition-colors duration-150 ease-out hover:bg-brand-50 hover:text-brand-600 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent">

              <MailIcon className="h-4 w-4" />
            </button>
          </Tooltip>
        }
        <Tooltip label="View Details">
          <button
            type="button"
            onClick={onOpen}
            aria-label={`View details for ${fullName}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-subtle transition-colors duration-150 ease-out hover:bg-slate-100 hover:text-ink">

            <EyeIcon className="h-4 w-4" />
          </button>
        </Tooltip>
      </span>
    </li>);

}

function Pagination({
  page,
  pageCount,
  total,
  onChange




}: {page: number;pageCount: number;total: number;onChange: (page: number) => void;}) {
  const first = (page - 1) * PAGE_SIZE + 1;
  const last = Math.min(page * PAGE_SIZE, total);
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between">
      <p className="text-[12px] text-muted">
        Showing {first}–{last} of {total}
      </p>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          aria-label="Previous page">

          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) =>
        <Button
          key={number}
          size="sm"
          variant={number === page ? 'primary' : 'ghost'}
          aria-current={number === page ? 'page' : undefined}
          onClick={() => onChange(number)}
          className="w-8 px-0">

            {number}
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          disabled={page === pageCount}
          onClick={() => onChange(page + 1)}
          aria-label="Next page">

          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </nav>);

}
