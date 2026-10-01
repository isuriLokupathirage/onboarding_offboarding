import { Badge } from '../ui/Badge';
import type { TransitionTaskStatus } from '../../types';

/** One colour per status, shared by the badge and the status dropdown. */
export const taskStatusStyles: Record<TransitionTaskStatus, {badge: string;dot: string;}> = {
  Open: { badge: 'bg-slate-50 text-slate-600 ring-slate-200', dot: 'bg-slate-400' },
  'In Progress': { badge: 'bg-sky-50 text-sky-700 ring-sky-200', dot: 'bg-sky-500' },
  'On Hold': { badge: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-500' },
  Completed: { badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  Cancelled: { badge: 'bg-red-50 text-red-700 ring-red-200', dot: 'bg-red-500' }
};

export function TaskStatusBadge({ status }: {status: TransitionTaskStatus;}) {
  return <Badge className={taskStatusStyles[status].badge}>{status}</Badge>;
}
