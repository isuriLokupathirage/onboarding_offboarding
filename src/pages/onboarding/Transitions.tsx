import React, { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { Segmented, Tabs } from '../../components/ui/Segmented';
import { SearchInput } from '../../components/ui/SearchInput';
import { Toggle } from '../../components/ui/Toggle';
import { Avatar, AvatarGroup } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Progress } from '../../components/ui/Progress';
import { EmptyState } from '../../components/ui/EmptyState';
import { Tooltip } from '../../components/ui/Tooltip';
import { SendTransitionFormDialog } from '../../components/onboarding/SendTransitionFormDialog';
import { useAppData } from '../../contexts/AppDataContext';
import { peopleById } from '../../data/people';
import type { Transition, TransitionKind } from '../../types';
import { formatDate } from '../../utils/format';
import {
  canReceiveForm,
  daysLabel,
  hasTaskOwnedBy,
  isOverdue,
  statusGroup,
  transitionProgress,
  visibleKinds,
  type TransitionStatusGroup } from
'../../utils/transitions';
import { useScreenInit } from '../../useScreenInit.js';

type TypeFilter = 'all' | TransitionKind;

const PAGE_SIZE = 10;
const STATUS_TABS: TransitionStatusGroup[] = ['Active', 'Completed', 'Cancelled'];
const PERMISSION_NOTE = 'Requires the Manage Onboarding Transitions permission';
const GRID =
'grid grid-cols-[20px_minmax(200px,2.2fr)_110px_minmax(150px,1.6fr)_130px_90px_150px_84px] items-center gap-4';

export function Transitions() {
  const navigate = useNavigate();
  const init = useScreenInit() as {tab?: TransitionStatusGroup;assignedToMe?: boolean;};
  const { transitions, currentUserId, oboPermissions, hasOboPermission } = useAppData();
  const [tab, setTab] = useState<TransitionStatusGroup>(init.tab ?? 'Active');
  const [assignedToMe, setAssignedToMe] = useState(init.assignedToMe ?? false);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [sendingTo, setSendingTo] = useState<string[] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const kinds = useMemo(() => visibleKinds(oboPermissions), [oboPermissions]);
  const canSendForms = hasOboPermission('Manage Onboarding Transitions');
  const isSelectable = (transition: Transition) => canSendForms && canReceiveForm(transition);
  const closeSendForm = useCallback(() => setSendingTo(null), []);

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
      statusGroup(transition) === tab && (
      typeFilter === 'all' || transition.kind === typeFilter) && (
      !needle ||
      `${transition.candidate.firstName} ${transition.candidate.lastName}`.
      toLowerCase().
      includes(needle))
    );
  }, [scoped, tab, typeFilter, query]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const filtersApplied = Boolean(query.trim()) || typeFilter !== 'all' || assignedToMe;
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

  const changeTab = (next: TransitionStatusGroup) => {
    setTab(next);
    setQuery('');
    setTypeFilter('all');
    setPage(1);
    setSelected([]);
  };

  const clearFilters = () => {
    setQuery('');
    setTypeFilter('all');
    setAssignedToMe(false);
    setPage(1);
  };

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

        <Tabs
          options={STATUS_TABS.map((status) => ({
            value: status,
            label: status,
            count: scoped.filter((transition) => statusGroup(transition) === status).length
          }))}
          value={tab}
          onChange={changeTab} />


        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput
              value={query}
              onChange={(value) => {
                setQuery(value);
                setPage(1);
              }}
              placeholder="Search by candidate or employee name"
              className="w-72" />

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
              {tab === 'Active' && canSendForms &&
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
              title={`No ${tab.toLowerCase()} transitions found`}
              description={
              filtersApplied ?
              'No transitions match the current search and filters. Try adjusting or clearing them.' :
              `There are no ${tab.toLowerCase()} transitions to show yet.`
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
              showSendForm={canReceiveForm(transition)}
              canSendForms={canSendForms}
              onSendForm={() => setSendingTo([transition.id])}
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
        onSent={(formName, count) => {
          setNotice(
            count === 1 ?
            `${formName} was sent to ${recipients[0]?.candidate.personalEmail}.` :
            `${formName} was sent to ${count} candidates at their personal email addresses.`
          );
          setSelected([]);
        }} />

    </div>);

}

function TransitionRow({
  transition,
  selectable,
  checked,
  onToggle,
  showSendForm,
  canSendForms,
  onSendForm,
  onOpen
}: {
  transition: Transition;
  selectable: boolean;
  checked: boolean;
  onToggle: () => void;
  showSendForm: boolean;
  canSendForms: boolean;
  onSendForm: () => void;
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
        <AvatarGroup names={transition.ownerIds.map((id) => peopleById[id]?.name ?? '')} size="xs" />
      </span>

      <span className="text-[12px]">
        <span className={`inline-flex items-center gap-1.5 font-medium ${daysTone}`}>
          {overdue ?
          <AlertTriangleIcon className="h-3.5 w-3.5" /> :

          <CalendarDaysIcon className="h-3.5 w-3.5 text-subtle" />
          }
          {daysLabel(transition)}
        </span>
        <span className="mt-0.5 block pl-5 text-muted">{formatDate(transition.targetDate)}</span>
      </span>

      <span className="flex justify-end gap-1" onClick={(event) => event.stopPropagation()}>
        {showSendForm &&
        <Tooltip label={canSendForms ? `Send a form to ${fullName}` : PERMISSION_NOTE}>
            <button
            type="button"
            disabled={!canSendForms}
            onClick={onSendForm}
            aria-label={`Send a form to ${fullName}`}
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
