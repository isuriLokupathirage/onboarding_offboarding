import type { Department, TransitionKind, TransitionTask } from '../types';

export type SetupGrouping = 'department' | 'timeline';

export type TimelineGroup = 'before' | 'on' | 'after' | 'none';

export const TIMELINE_ORDER: TimelineGroup[] = ['before', 'on', 'after', 'none'];

export interface TaskGroup {
  key: string;
  label: string;
  tasks: TransitionTask[];
}

/** The date the timeline is measured from: the hire date, or the last working date when offboarding. */
export function baseDateLabel(kind: TransitionKind): string {
  return kind === 'Offboarding' ? 'Last Working Date' : 'Hire Date';
}

export function timelineLabel(group: TimelineGroup, kind: TransitionKind): string {
  const base = baseDateLabel(kind);
  switch (group) {
    case 'before':
      return `Before ${base}`;
    case 'on':
      return `On ${base}`;
    case 'after':
      return `After ${base}`;
    default:
      return 'No Date Set';
  }
}

/** Dates are ISO yyyy-mm-dd, so string comparison is date order. */
export function timelineGroupOf(dueDate: string | null, baseDate: string): TimelineGroup {
  if (!dueDate) return 'none';
  if (dueDate < baseDate) return 'before';
  if (dueDate > baseDate) return 'after';
  return 'on';
}

/** Earliest date first; tasks without a date go last, then by name. */
export function byDueDate(a: TransitionTask, b: TransitionTask): number {
  if (a.dueDate !== b.dueDate) {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate < b.dueDate ? -1 : 1;
  }
  return a.name.localeCompare(b.name);
}

/**
 * Groups tasks for Step 3. Department groups follow the order departments first appear in the
 * template. Timeline always shows all four groups, so a task visibly moves when its date changes.
 */
export function groupSetupTasks(
tasks: TransitionTask[],
grouping: SetupGrouping,
kind: TransitionKind,
baseDate: string)
: TaskGroup[] {
  if (grouping === 'timeline') {
    return TIMELINE_ORDER.map((group) => ({
      key: `timeline-${group}`,
      label: timelineLabel(group, kind),
      tasks: tasks.filter((task) => timelineGroupOf(task.dueDate, baseDate) === group).sort(byDueDate)
    }));
  }
  const byDepartment = new Map<Department, TransitionTask[]>();
  tasks.forEach((task) => {
    byDepartment.set(task.department, [...(byDepartment.get(task.department) ?? []), task]);
  });
  return Array.from(byDepartment.entries()).map(([department, departmentTasks]) => ({
    key: `department-${department}`,
    label: department,
    tasks: [...departmentTasks].sort(byDueDate)
  }));
}

/** Why a task blocks creating the transition, or undefined when it is ready. */
export function setupTaskProblem(task: TransitionTask): string | undefined {
  const missing = [
  task.ownerIds.length === 0 && 'an owner',
  task.showInCandidateEvents && !task.dueDate && 'a date'].
  filter(Boolean);
  return missing.length > 0 ? `needs ${missing.join(' and ')}` : undefined;
}
