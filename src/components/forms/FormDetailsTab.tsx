import React from 'react';
import type { EmployeeForm, EmploymentType } from '../../types';
import { FieldGroup, Input, Select, Textarea } from '../ui/Field';
import { Badge } from '../ui/Badge';
import { employmentTypes } from '../../data/people';
import { useAppData } from '../../contexts/AppDataContext';

export function FormDetailsTab({ form }: {form: EmployeeForm;}) {
  const { updateForm } = useAppData();
  const draft = Boolean(form.isDraft);

  return (
    <div className={draft ? 'max-w-2xl' : 'grid grid-cols-1 gap-6 lg:grid-cols-3'}>
      <div className="space-y-5 lg:col-span-2">
        <FieldGroup label="Form Name" required>
          <Input value={form.name} onChange={(event) => updateForm(form.id, { name: event.target.value })} />
        </FieldGroup>
        <FieldGroup label="Employment Type" required className="max-w-xs">
          <Select
            value={form.employmentType}
            onChange={(event) =>
            updateForm(form.id, { employmentType: event.target.value as EmploymentType })
            }>
            
            {employmentTypes.map((type) =>
            <option key={type} value={type}>
                {type}
              </option>
            )}
          </Select>
        </FieldGroup>
        <FieldGroup label="Description">
          <Textarea
            value={form.description}
            onChange={(event) => updateForm(form.id, { description: event.target.value })} />
          
        </FieldGroup>
      </div>

      {draft ? null :
      <aside className="rounded-xl border border-line bg-slate-50/60 p-5">
        <h3 className="text-[13px] font-medium text-ink">Form record</h3>
        <dl className="mt-3 space-y-3">
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-subtle">Form code</dt>
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
            <dt className="text-[11px] uppercase tracking-wide text-subtle">Created by</dt>
            <dd className="mt-0.5 text-[13px] text-ink">{form.createdBy}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-subtle">Last modified</dt>
            <dd className="mt-0.5 text-[13px] text-ink">{form.lastModified}</dd>
          </div>
        </dl>
        <p className="mt-4 text-[12px] leading-relaxed text-muted">
          Form code, status and audit details are managed by the system and cannot be edited here.
        </p>
      </aside>
      }
    </div>);

}