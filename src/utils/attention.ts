import type { Transition, TransitionTask } from '../types';
import { blockingTask, isTaskOpen, statusGroup } from './transitions';

export type AttentionFilter = 'overdue' | 'blocked' | 'due-today';

export const attentionLabels: Record<AttentionFilter, string> = {
  overdue: 'Overdue',
  blocked: 'Blocked',
  'due-today': 'Due Today'
};

export function isAttentionFilter(value: string | null): value is AttentionFilter {
  return value === 'overdue' || value === 'blocked' || value === 'due-today';
}

/** Today's date as YYYY-MM-DD in local time, to compare against task due dates. */
export function todayKey(now = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function matches(
transition: Transition,
task: TransitionTask,
filter: AttentionFilter,
today: string)
: boolean {
  if (filter === 'blocked') return Boolean(blockingTask(transition, task));
  const due = task.dueDate?.slice(0, 10);
  if (!due) return false;
  return filter === 'overdue' ? due < today : due === today;
}

/** Open tasks on an active transition that fall in the set. Restricted tasks need permission. */
export function attentionTasks(
transition: Transition,
filter: AttentionFilter,
canSeeRestricted: boolean,
today = todayKey())
: TransitionTask[] {
  if (statusGroup(transition) !== 'Active') return [];
  return transition.tasks.filter(
    (task) =>
    isTaskOpen(task) && (
    !task.restricted || canSeeRestricted) &&
    matches(transition, task, filter, today)
  );
}

/** Whole days from one YYYY-MM-DD date to another. Positive when `to` is later. */
export function daysBetween(from: string, to: string): number {
  const utc = (value: string) => {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    return Date.UTC(year, month - 1, day);
  };
  return Math.round((utc(to) - utc(from)) / 86_400_000);
}

export interface AttentionEntry {
  transition: Transition;
  task: TransitionTask;
  /** Days past the task's due date, or 0 when it is not overdue. */
  overdueDays: number;
  /** The task this one is waiting on, when blocked. */
  blocker?: TransitionTask;
  /** Days since the blocking task's own due date passed. There is no record of when it became blocked. */
  blockedDays: number;
  /** The longer of the two, used for ordering. */
  outstandingDays: number;
}

/** Overdue or blocked tasks across the given transitions, longest outstanding first. */
export function attentionEntries(
transitions: Transition[],
canSeeRestricted: boolean,
today = todayKey())
: AttentionEntry[] {
  return transitions.
  flatMap((transition) => {
    const overdue = new Set(attentionTasks(transition, 'overdue', canSeeRestricted, today));
    const blocked = new Set(attentionTasks(transition, 'blocked', canSeeRestricted, today));
    return transition.tasks.
    filter((task) => overdue.has(task) || blocked.has(task)).
    map((task): AttentionEntry => {
      const blocker = blocked.has(task) ? blockingTask(transition, task) : undefined;
      const overdueDays = overdue.has(task) && task.dueDate ? daysBetween(task.dueDate, today) : 0;
      const blockedDays = blocker?.dueDate ? Math.max(0, daysBetween(blocker.dueDate, today)) : 0;
      return {
        transition,
        task,
        overdueDays,
        blocker,
        blockedDays,
        outstandingDays: Math.max(overdueDays, blockedDays)
      };
    });
  }).
  sort((a, b) => b.outstandingDays - a.outstandingDays);
}
