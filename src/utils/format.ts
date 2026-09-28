import type { DueRule, Priority, Task } from '../types';

export function formatDueRule(rule: DueRule | null): string {
  if (!rule) return 'No due date';
  if (rule.kind === 'milestone') return `On ${rule.milestone}`;
  const unit = rule.amount === 1 ? rule.unit.replace(/s$/, '') : rule.unit;
  return `${rule.amount} ${unit} ${rule.direction} ${rule.milestone}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return `${date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })}, ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
}

export function addDays(iso: string, days: number): string {
  const date = new Date(iso);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export function formatShortDate(iso: string | null | undefined): {day: string;month: string;} {
  if (!iso) return { day: '--', month: '---' };
  const date = new Date(iso);
  return {
    day: date.toLocaleDateString('en-GB', { day: '2-digit' }),
    month: date.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()
  };
}

export function resolveDueDate(rule: DueRule | null, hireDate: string): string | null {
  if (!rule || !hireDate) return null;
  const base = new Date(hireDate);
  if (Number.isNaN(base.getTime())) return null;
  const applyMilestone = (date: Date, milestone: DueRule['milestone']) => {
    switch (milestone) {
      case 'First Working Day':
        date.setDate(date.getDate() + 1);
        break;
      case 'End of First Week':
        date.setDate(date.getDate() + 7);
        break;
      case 'End of First Month':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'Probation End Date':
        date.setMonth(date.getMonth() + 6);
        break;
      default:
        break;
    }
    return date;
  };
  const date = applyMilestone(new Date(base), rule.milestone);
  if (rule.kind === 'relative') {
    const sign = rule.direction === 'before' ? -1 : 1;
    if (rule.unit === 'days') date.setDate(date.getDate() + sign * rule.amount);
    if (rule.unit === 'weeks') date.setDate(date.getDate() + sign * rule.amount * 7);
    if (rule.unit === 'months') date.setMonth(date.getMonth() + sign * rule.amount);
  }
  return date.toISOString().slice(0, 10);
}

export const priorityStyles: Record<Priority, string> = {
  Low: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Medium: 'bg-amber-50 text-amber-700 ring-amber-200',
  High: 'bg-red-50 text-red-700 ring-red-200'
};

export function wordCount(text: string): number {
  return text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
}

export function sortWithChildren(tasks: Task[]): Task[] {
  const parents = tasks.filter((t) => !t.parentId || !tasks.some((p) => p.id === t.parentId));
  const result: Task[] = [];
  parents.forEach((parent) => {
    result.push(parent);
    tasks.filter((t) => t.parentId === parent.id).forEach((child) => result.push(child));
  });
  tasks.forEach((t) => {
    if (!result.includes(t)) result.push(t);
  });
  return result;
}

export function nextCode(prefix: string, existing: string[], pad = 4): string {
  const numbers = existing.
  filter((code) => code.startsWith(`${prefix}-`)).
  map((code) => Number(code.split('-')[1])).
  filter((n) => !Number.isNaN(n));
  const next = (numbers.length ? Math.max(...numbers) : 0) + 1;
  return `${prefix}-${String(next).padStart(pad, '0')}`;
}