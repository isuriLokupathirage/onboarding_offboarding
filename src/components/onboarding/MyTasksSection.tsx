import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClockIcon, FilterIcon, LinkIcon, RotateCwIcon } from 'lucide-react';
import type { Priority, Transition, TransitionTask, TransitionTaskStatus } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { PriorityBadge } from '../ui/Badge';
import { Select } from '../ui/Field';
import { Menu } from '../ui/Menu';
import { SearchInput } from '../ui/SearchInput';
import { StatusSelect } from '../tasks/StatusSelect';
import { peopleById } from '../../data/people';
import { daysBetween } from '../../utils/attention';
import { formatDate } from '../../utils/format';
import { blockingTask, isTaskOpen } from '../../utils/transitions';

const GRID =
'grid grid-cols-[minmax(0,2.2fr)_minmax(0,1.2fr)_minmax(0,1.3fr)_120px_84px_150px_32px] items-center gap-4';

type StatusFilter = 'all' | TransitionTaskStatus;
type PriorityFilter = 'all' | Priority;

function plural(count: number): string {
  return `${count} day${count === 1 ? '' : 's'}`;
}

/** The task's owners with the signed-in user first, shown as "You +N others". */
function Owners({ ownerIds, currentUserId }: {ownerIds: string[];currentUserId: string;}) {
  const ordered = [...ownerIds].sort(
    (a, b) => Number(b === currentUserId) - Number(a === currentUserId)
  );
  const others = ordered.length - 1;
  const names = ordered.map((id) => peopleById[id]?.name ?? id);
  return (
    <div className="flex min-w-0 items-center gap-2" title={names.join(', ')}>
      <span className="flex shrink-0 -space-x-2">
        {names.slice(0, 3).map((name) =>
        <Avatar key={name} name={name} size="sm" />
        )}
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block text-[12px] font-medium text-ink">You</span>
        {others > 0 &&
        <span className="block truncate text-[11px] text-muted">
            +{others} other{others === 1 ? '' : 's'}
          </span>
        }
      </span>
    </div>);

}

/** The signed-in user's open tasks, soonest date first so overdue ones lead. */
export function MyTasksSection({
  transitions,
  currentUserId,
  canSeeRestricted,
  today,
  onOpenTask,
  onStatusChange
}: {
  transitions: Transition[];
  currentUserId: string;
  canSeeRestricted: boolean;
  today: string;
  onOpenTask: (transition: Transition, task: TransitionTask) => void;
  onStatusChange: (transition: Transition, task: TransitionTask, status: TransitionTaskStatus) => void;
}) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [priority, setPriority] = useState<PriorityFilter>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const mine = useMemo(
    () =>
    transitions.
    flatMap((transition) =>
    transition.tasks.
    filter(
      (task) =>
      task.ownerIds.includes(currentUserId) &&
      isTaskOpen(task) && (
      !task.restricted || canSeeRestricted)
    ).
    map((task) => ({ transition, task }))
    ).
    sort((a, b) => (a.task.dueDate ?? '9999').localeCompare(b.task.dueDate ?? '9999')),
    [transitions, currentUserId, canSeeRestricted]
  );

  const needle = query.trim().toLowerCase();
  const rows = mine.filter(({ transition, task }) => {
    const person = `${transition.candidate.firstName} ${transition.candidate.lastName}`.toLowerCase();
    return (
      (status === 'all' || task.status === status) && (
      priority === 'all' || task.priority === priority) && (
      !needle || task.name.toLowerCase().includes(needle) || person.includes(needle)));

  });
  const activeFilters = Number(status !== 'all') + Number(priority !== 'all');
  const filtersApplied = Boolean(needle) || activeFilters > 0;

  const reset = () => {
    setQuery('');
    setStatus('all');
    setPriority('all');
  };

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ink">My Tasks ({mine.length})</h2>
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search by task or employee"
            className="w-64" />

          <Button
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((prev) => !prev)}>

            <FilterIcon className="h-4 w-4" />
            Filters
            {activeFilters > 0 &&
            <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[11px] font-semibold text-brand-700">
                {activeFilters}
              </span>
            }
          </Button>
          <Button variant="primary" disabled={!filtersApplied} onClick={reset}>
            Reset Filters
            <RotateCwIcon className="h-4 w-4" />
          </Button>
          <Link
            to="/tasks/my-tasks"
            className="ml-2 text-[13px] font-medium text-ink transition-colors duration-150 ease-out hover:text-brand-700">

            All Tasks
          </Link>
        </div>
      </div>

      {filtersOpen &&
      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-white px-4 py-3">
          <Select
          aria-label="Filter by status"
          value={status}
          onChange={(event) => setStatus(event.target.value as StatusFilter)}
          className="h-9 w-44 text-[13px]">

            <option value="all">All statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="On Hold">On Hold</option>
          </Select>
          <Select
          aria-label="Filter by priority"
          value={priority}
          onChange={(event) => setPriority(event.target.value as PriorityFilter)}
          className="h-9 w-44 text-[13px]">

            <option value="all">All priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </Select>
        </div>
      }

      {rows.length === 0 ?
      <p className="mt-3 rounded-lg border border-dashed border-line bg-white px-4 py-10 text-center text-[13px] text-muted">
          {mine.length === 0 ?
        'No open onboarding or offboarding tasks are assigned to you.' :
        'No tasks match. Try a different search, or reset the filters.'}
        </p> :

      <ul className="mt-3 space-y-2">
          {rows.map(({ transition, task }) => {
          const blocker = blockingTask(transition, task);
          const until = task.dueDate ? daysBetween(today, task.dueDate) : null;
          const overdue = until !== null && until < 0;
          return (
            <li
              key={`${transition.id}-${task.id}`}
              className={`${GRID} rounded-lg border border-line bg-white px-4 py-2.5 shadow-card`}>

                <div className="min-w-0">
                  <button
                  type="button"
                  onClick={() => onOpenTask(transition, task)}
                  className="block max-w-full truncate text-left text-[13px] font-medium text-ink hover:text-brand-700 hover:underline">

                    {task.name}
                  </button>
                  {blocker &&
                <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted">
                      <LinkIcon className="h-3 w-3 shrink-0 text-amber-600" />
                      <span className="text-amber-600">Depends on:</span> {blocker.name}
                    </p>
                }
                </div>
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-[13px] font-medium text-ink">
                    {transition.candidate.firstName} {transition.candidate.lastName}
                  </p>
                  <p className="truncate text-[11px] uppercase tracking-wide text-muted">{task.department}</p>
                </div>
                <Owners ownerIds={task.ownerIds} currentUserId={currentUserId} />
                <div className="leading-tight">
                  {until === null ?
                <p className="text-[12px] text-muted">No due date</p> :

                <>
                      <p
                    className={`flex items-center gap-1 text-[13px] font-medium ${
                    overdue ? 'text-red-600' : 'text-emerald-700'}`
                    }>

                        {overdue && <ClockIcon className="h-3 w-3" />}
                        {overdue ? `${plural(-until)} ago` : until === 0 ? 'Today' : plural(until)}
                      </p>
                      <p className="text-[11px] text-muted">{formatDate(task.dueDate)}</p>
                    </>
                }
                </div>
                <span>
                  <PriorityBadge priority={task.priority} />
                </span>
                <StatusSelect
                compact
                label={`Status of ${task.name}`}
                value={task.status}
                onChange={(next) => {
                  if (next !== task.status) onStatusChange(transition, task, next);
                }}
                disabledReason={(option) =>
                option === 'Completed' && blocker ? `Blocked until ${blocker.name} is completed` : undefined
                } />

                <Menu
                label={`Actions for ${task.name}`}
                items={[{ label: 'View task details', onSelect: () => onOpenTask(transition, task) }]} />

              </li>);

        })}
        </ul>
      }
    </section>);

}
