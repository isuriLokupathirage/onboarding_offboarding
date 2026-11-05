import type { FeedbackForm } from '../../types';
import { Badge } from '../ui/Badge';

export function FeedbackStatusBadge({ status }: {status: FeedbackForm['status'];}) {
  return (
    <Badge
      className={
      status === 'Active' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-100 text-slate-600 ring-slate-200'
      }>

      {status}
    </Badge>);

}
