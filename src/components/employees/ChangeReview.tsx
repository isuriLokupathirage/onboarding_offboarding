import React from 'react';
import { ArrowRightIcon } from 'lucide-react';
import type { EmployeeFormAssignment } from '../../types';
import { Badge } from '../ui/Badge';

export function ChangeReview({ assignment }: {assignment: EmployeeFormAssignment;}) {
  if (assignment.changes.length === 0) {
    return (
      <p className="rounded-lg bg-slate-50 px-3.5 py-3 text-[13px] text-muted">
        The employee confirmed their details with no changes to the profile.
      </p>);

  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-[13px] font-medium text-ink">Values updated on submission</h4>
        <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200">
          {assignment.changes.length} applied to profile
        </Badge>
      </div>
      <p className="mt-1 text-[12px] text-muted">
        These values replaced the previous ones on the employee profile and are recorded in the audit
        trail below.
      </p>

      <ul className="mt-3 space-y-2">
        {assignment.changes.map((change) =>
        <li
          key={change.fieldId}
          className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-line px-3.5 py-3">
          
            <span className="w-44 shrink-0 text-[13px] font-medium text-ink">{change.label}</span>
            <span className="flex flex-1 flex-wrap items-center gap-2 text-[13px]">
              <span className="text-muted line-through decoration-slate-300">{change.previous}</span>
              <ArrowRightIcon className="h-3.5 w-3.5 text-subtle" />
              <span className="font-medium text-ink">{change.submitted}</span>
            </span>
          </li>
        )}
      </ul>
    </div>);

}