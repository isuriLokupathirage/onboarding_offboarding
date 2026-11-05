import { Link } from 'react-router-dom';
import { ArrowRightIcon, UsersIcon } from 'lucide-react';
import type { Transition, TransitionKind, TransitionTask } from '../../types';
import { Avatar } from '../ui/Avatar';
import { EmptyState } from '../ui/EmptyState';
import { Progress } from '../ui/Progress';
import { formatDate } from '../../utils/format';
import { isTaskOpen, statusGroup, transitionProgress } from '../../utils/transitions';

const NO_DATE = Number.POSITIVE_INFINITY;

function dueTime(task: TransitionTask | undefined): number {
  return task?.dueDate ? new Date(task.dueDate).getTime() : NO_DATE;
}

/** The open task due soonest. Tasks with no date come after dated ones. */
function nextTask(transition: Transition): TransitionTask | undefined {
  return transition.tasks.
  filter(isTaskOpen).
  sort((a, b) => dueTime(a) - dueTime(b))[0];
}

/** Transition type as a coloured dot and label. */
export function KindDot({ kind }: {kind: TransitionKind;}) {
  const onboarding = kind === 'Onboarding';
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${
      onboarding ? 'text-emerald-700' : 'text-red-600'}`
      }>

      <span className={`h-1.5 w-1.5 rounded-full ${onboarding ? 'bg-emerald-500' : 'bg-red-500'}`} />
      {kind}
    </span>);

}

/** How many recent transitions get their own tile. */
const TILE_COUNT = 3;

/** The Transitions list, opened on the Active tab. */
const ACTIVE_TRANSITIONS_PATH = '/onboarding/transitions?status=Active';

/**
 * The three most recently started active transitions as tiles, then a tile counting the rest.
 * Nothing scrolls: anything beyond the tiles is reached through View All.
 */
export function ActiveTransitions({ transitions }: {transitions: Transition[];}) {
  const active = transitions.
  filter((transition) => statusGroup(transition) === 'Active').
  sort((a, b) => b.startedOn.localeCompare(a.startedOn));
  const recent = active.slice(0, TILE_COUNT);
  const further = active.length - recent.length;

  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ink">Active Transitions ({active.length})</h2>
        <Link
          to={ACTIVE_TRANSITIONS_PATH}
          className="text-[13px] font-medium text-ink transition-colors duration-150 ease-out hover:text-brand-700">

          View All
        </Link>
      </div>

      {active.length === 0 ?
      <div className="mt-3">
          <EmptyState
          icon={UsersIcon}
          title="No active transitions"
          description="Onboardings and offboardings in progress will appear here." />

        </div> :

      <ul className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {recent.map((transition) =>
        <li key={transition.id}>
              <TransitionTile transition={transition} />
            </li>
        )}
          {further > 0 &&
        <li>
              <Link
            to={ACTIVE_TRANSITIONS_PATH}
            aria-label={`View all active transitions, ${further} more`}
            className="flex h-full min-h-[150px] flex-col items-center justify-center rounded-xl border border-dashed border-line bg-white px-4 py-5 text-center shadow-card transition-colors duration-150 ease-out hover:border-brand-300 hover:bg-brand-50/40 focus:outline-none focus:ring-2 focus:ring-brand-200">

                <span className="text-3xl font-semibold tracking-tight text-ink">+{further}</span>
                <span className="mt-1 text-[13px] text-muted">more active</span>
                <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-brand-700">
                  View All
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </span>
              </Link>
            </li>
        }
        </ul>
      }
    </section>);

}

function TransitionTile({ transition }: {transition: Transition;}) {
  const { candidate } = transition;
  const fullName = `${candidate.firstName} ${candidate.lastName}`;
  const next = nextTask(transition);
  const { percent } = transitionProgress(transition);
  return (
    <Link
      to={`/onboarding/transitions/${transition.id}`}
      className="block h-full rounded-xl border border-line bg-white shadow-card transition-colors duration-150 ease-out hover:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-200">

      <div className="flex items-start gap-3 px-4 pb-3 pt-4">
        <Avatar name={fullName} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-medium text-ink">{fullName}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="max-w-[140px] truncate rounded-md border border-slate-400 px-1.5 py-0.5 text-[11px] font-medium text-ink">
              {candidate.position}
            </span>
            <KindDot kind={transition.kind} />
          </div>
        </div>
      </div>
      <div className="border-t border-line px-4 pb-4 pt-3">
        <p className="text-[11px] text-muted">Next Task</p>
        <div className="mt-0.5 flex items-baseline justify-between gap-3">
          <p className="min-w-0 truncate text-[13px] font-medium text-ink">{next ? next.name : 'All tasks are closed'}</p>
          {next &&
          <span className="shrink-0 text-[12px] text-muted">{next.dueDate ? formatDate(next.dueDate) : 'No date'}</span>
          }
        </div>
        <div className="mt-2.5" aria-label={`${percent}% complete`}>
          <Progress value={percent} />
        </div>
      </div>
    </Link>);

}
