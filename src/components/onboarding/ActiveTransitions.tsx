import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon, UsersIcon } from 'lucide-react';
import type { Transition, TransitionKind, TransitionTask } from '../../types';
import { Avatar } from '../ui/Avatar';
import { EmptyState } from '../ui/EmptyState';
import { Progress } from '../ui/Progress';
import { formatDate } from '../../utils/format';
import { isTaskOpen, transitionProgress } from '../../utils/transitions';

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

const arrowClass =
'rounded-md border border-line bg-white p-1 text-muted transition-colors duration-150 ease-out hover:bg-slate-50 hover:text-ink focus:outline-none focus:ring-2 focus:ring-brand-200';

/** Active transitions as a scrollable row of cards, soonest next task first. */
export function ActiveTransitions({ transitions }: {transitions: Transition[];}) {
  const rowRef = useRef<HTMLUListElement>(null);

  const cards = transitions.
  map((transition) => ({ transition, next: nextTask(transition) })).
  sort((a, b) => dueTime(a.next) - dueTime(b.next));

  const scroll = (direction: -1 | 1) => {
    const row = rowRef.current;
    if (row) row.scrollBy({ left: direction * row.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-ink">Active Transitions ({cards.length})</h2>
          {cards.length > 0 &&
          <>
              <span className="h-px w-5 bg-slate-300" aria-hidden="true" />
              <span className="flex items-center gap-1.5">
                <button
                type="button"
                aria-label="Previous transitions"
                onClick={() => scroll(-1)}
                className={arrowClass}>

                  <ChevronLeftIcon className="h-3.5 w-3.5" />
                </button>
                <button
                type="button"
                aria-label="Next transitions"
                onClick={() => scroll(1)}
                className={arrowClass}>

                  <ChevronRightIcon className="h-3.5 w-3.5" />
                </button>
              </span>
            </>
          }
        </div>
        <Link
          to="/onboarding/transitions"
          className="text-[13px] font-medium text-ink transition-colors duration-150 ease-out hover:text-brand-700">

          View All
        </Link>
      </div>

      {cards.length === 0 ?
      <div className="mt-3">
          <EmptyState
          icon={UsersIcon}
          title="No active transitions"
          description="Onboardings and offboardings in progress will appear here." />

        </div> :

      <ul ref={rowRef} className="scroll-thin -mx-1 mt-3 flex gap-4 overflow-x-auto px-1 pb-3 pt-1">
          {cards.map(({ transition, next }) => {
          const { candidate } = transition;
          const fullName = `${candidate.firstName} ${candidate.lastName}`;
          const { percent } = transitionProgress(transition);
          return (
            <li key={transition.id} className="w-[300px] shrink-0">
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
                      <p className="min-w-0 truncate text-[13px] font-medium text-ink">
                        {next ? next.name : 'All tasks are closed'}
                      </p>
                      {next &&
                    <span className="shrink-0 text-[12px] text-muted">
                          {next.dueDate ? formatDate(next.dueDate) : 'No date'}
                        </span>
                    }
                    </div>
                    <div className="mt-2.5" aria-label={`${percent}% complete`}>
                      <Progress value={percent} />
                    </div>
                  </div>
                </Link>
              </li>);

        })}
        </ul>
      }
    </section>);

}
