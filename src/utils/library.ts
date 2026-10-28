import type { Milestone, OboPermission, Task, Template, Transition } from '../types';
import { milestones, offboardingMilestones } from '../data/people';
import { statusGroup } from './transitions';

export const TEMPLATE_PERMISSION_NOTE = 'Requires the Manage Templates permission';
export const TASK_PERMISSION_NOTE = 'Requires the Manage Task Library permission';
export const RESTRICTED_PERMISSION_NOTE = 'Restricted task. Requires the View Restricted Tasks permission';

/** Who can reach the Templates screen. The task library opens with the same access. */
export function canOpenTemplates(permissions: OboPermission[]): boolean {
  return (
    permissions.includes('View Templates') ||
    permissions.includes('Manage Templates') ||
    permissions.includes('Manage Task Library'));

}

export interface TaskUsage {
  templates: Template[];
  activeTransitions: Transition[];
  inUse: boolean;
}

/** A task is in use while any template lists it or any active transition was started with it. */
export function taskUsage(taskId: string, templates: Template[], transitions: Transition[]): TaskUsage {
  const usedBy = templates.filter((template) => template.taskIds.includes(taskId));
  const activeTransitions = transitions.filter(
    (transition) =>
    statusGroup(transition) === 'Active' && transition.tasks.some((task) => task.taskId === taskId)
  );
  return {
    templates: usedBy,
    activeTransitions,
    inUse: usedBy.length > 0 || activeTransitions.length > 0
  };
}

export function taskUsageLabel(usage: TaskUsage): string {
  const parts: string[] = [];
  if (usage.templates.length > 0) {
    parts.push(`${usage.templates.length} template${usage.templates.length === 1 ? '' : 's'}`);
  }
  if (usage.activeTransitions.length > 0) {
    const count = usage.activeTransitions.length;
    parts.push(`${count} active transition${count === 1 ? '' : 's'}`);
  }
  return parts.length ? `Used in ${parts.join(' and ')}` : 'Not used in any template or active transition';
}

/** A template is in use once any transition, in any status, has been started from it. */
export function templateTransitions(templateId: string, transitions: Transition[]): Transition[] {
  return transitions.filter((transition) => transition.templateId === templateId);
}

export interface TemplatePhase {
  label: string;
  tasks: Task[];
}

const UNSCHEDULED = 'No due date';

function phaseKey(task: Task): {label: string;order: number;} {
  const rule = task.dueRule;
  if (!rule) return { label: UNSCHEDULED, order: Number.MAX_SAFE_INTEGER };
  const index = [...milestones, ...offboardingMilestones].indexOf(rule.milestone as Milestone);
  if (rule.kind === 'relative' && rule.direction === 'before') {
    return { label: `Before ${rule.milestone}`, order: index * 2 };
  }
  return { label: rule.milestone, order: index * 2 + 1 };
}

/** Groups a template's tasks into phases by when they fall due, earliest phase first. */
export function templatePhases(tasks: Task[]): TemplatePhase[] {
  const phases = new Map<string, {order: number;tasks: Task[];}>();
  tasks.forEach((task) => {
    const { label, order } = phaseKey(task);
    const phase = phases.get(label) ?? { order, tasks: [] };
    phase.tasks.push(task);
    phases.set(label, phase);
  });
  return Array.from(phases.entries()).
  sort((a, b) => a[1].order - b[1].order).
  map(([label, phase]) => ({ label, tasks: phase.tasks }));
}
