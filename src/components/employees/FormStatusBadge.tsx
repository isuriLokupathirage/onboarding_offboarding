import React from 'react';
import type { EmployeeFormStatus } from '../../types';
import { Badge } from '../ui/Badge';

const styles: Record<EmployeeFormStatus, string> = {
  'Not Sent': 'bg-slate-100 text-slate-600 ring-slate-200',
  Sent: 'bg-sky-50 text-sky-700 ring-sky-200',
  'In Progress': 'bg-amber-50 text-amber-700 ring-amber-200',
  Submitted: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Expired: 'bg-slate-100 text-slate-700 ring-slate-300',
  Revoked: 'bg-red-50 text-red-700 ring-red-200'
};

export function FormStatusBadge({ status }: {status: EmployeeFormStatus;}) {
  return <Badge className={styles[status]}>{status}</Badge>;
}