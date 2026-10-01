import { Badge } from '../ui/Badge';
import type { TransitionTaskStatus } from '../../types';

const styles: Record<TransitionTaskStatus, string> = {
  'Not Started': 'bg-slate-50 text-slate-600 ring-slate-200',
  'In Progress': 'bg-amber-50 text-amber-700 ring-amber-200',
  Completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Skipped: 'bg-slate-100 text-slate-500 ring-slate-200',
  Cancelled: 'bg-slate-100 text-slate-500 ring-slate-200'
};

export function TaskStatusBadge({ status }: {status: TransitionTaskStatus;}) {
  return <Badge className={styles[status]}>{status}</Badge>;
}
