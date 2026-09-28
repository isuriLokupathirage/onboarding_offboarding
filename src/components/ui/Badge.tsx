import React from 'react';
import { twMerge } from 'tailwind-merge';
import type { Priority } from '../../types';
import { priorityStyles } from '../../utils/format';

export function Badge({
  children,
  className



}: {children: React.ReactNode;className?: string;}) {
  return (
    <span
      className={twMerge(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset',
        'bg-slate-50 text-muted ring-line',
        className
      )}>
      
      {children}
    </span>);

}

export function PriorityBadge({ priority }: {priority: Priority;}) {
  return <Badge className={priorityStyles[priority]}>{priority}</Badge>;
}

export function DepartmentChip({ department }: {department: string;}) {
  return <Badge className="bg-slate-100 text-slate-700 ring-slate-200">{department}</Badge>;
}