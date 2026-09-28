import React from 'react';
import type { EmployeeForm } from '../../types';
import { Badge } from '../ui/Badge';
import { formatDate } from '../../utils/format';

export function FormSummary({ form }: {form: EmployeeForm;}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <section className="rounded-xl border border-line bg-white p-5 lg:col-span-2">
        <h3 className="text-[13px] font-semibold text-ink">Form Details</h3>
        <dl className="mt-4 space-y-4">
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-subtle">Form Name</dt>
            <dd className="mt-0.5 text-sm font-medium text-ink">{form.name}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-subtle">Employment Type</dt>
            <dd className="mt-0.5 text-[13px] text-ink">{form.employmentType}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-subtle">Description</dt>
            <dd className="mt-0.5 max-w-2xl text-[13px] leading-relaxed text-ink">
              {form.description || 'No description added.'}
            </dd>
          </div>
        </dl>
      </section>

      <aside className="rounded-xl border border-line bg-slate-50/60 p-5">
        <h3 className="text-[13px] font-semibold text-ink">Form record</h3>
        <dl className="mt-3 space-y-3">
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-subtle">Form Code</dt>
            <dd className="mt-0.5 font-mono text-[13px] text-ink">{form.code}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-subtle">Status</dt>
            <dd className="mt-1">
              <Badge
                className={
                form.status === 'Active' ?
                'bg-emerald-50 text-emerald-700 ring-emerald-200' :
                'bg-slate-100 text-slate-600 ring-slate-200'
                }>
                
                {form.status}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-subtle">Created By</dt>
            <dd className="mt-0.5 text-[13px] text-ink">{form.createdBy}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-subtle">Created Date</dt>
            <dd className="mt-0.5 text-[13px] text-ink">{formatDate(form.createdOn)}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-subtle">Last Modified</dt>
            <dd className="mt-0.5 text-[13px] text-ink">{form.lastModified}</dd>
          </div>
        </dl>
      </aside>
    </div>);

}