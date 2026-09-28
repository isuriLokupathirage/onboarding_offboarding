import React from 'react';
import { FileTextIcon, GitBranchIcon, LockIcon, RepeatIcon } from 'lucide-react';
import type { EmployeeForm, FormField } from '../../types';
import { Badge } from '../ui/Badge';
import { Tooltip } from '../ui/Tooltip';
import { EmptyState } from '../ui/EmptyState';
import { LOCK_TOOLTIP } from '../../data/forms';

function shown(fields: FormField[]): FormField[] {
  return fields.filter((field) => field.state !== 'Hidden');
}

function FieldLine({ field }: {field: FormField;}) {
  return (
    <li className="flex items-center gap-3 px-4 py-2.5">
      <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{field.name}</span>
      <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-subtle">
        {field.dataType}
      </span>
      {field.locked &&
      <Tooltip label={LOCK_TOOLTIP}>
          <span
          tabIndex={0}
          aria-label={LOCK_TOOLTIP}
          className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
          
            <LockIcon className="h-3 w-3" />
            Required by employee record
          </span>
        </Tooltip>
      }
      <Badge
        className={
        field.state === 'Required' ?
        'bg-brand-50 text-brand-700 ring-brand-200' :
        'bg-sky-50 text-sky-700 ring-sky-200'
        }>
        
        {field.state}
      </Badge>
    </li>);

}

export function FieldsSummary({ form }: {form: EmployeeForm;}) {
  const sections = form.employeeDetailsEnabled ?
  form.sections.filter((section) => {
    if (!section.enabled) return false;
    const groups = section.conditionalGroups ?? [];
    return (
      shown(section.fields).length > 0 ||
      groups.some(
        (group) =>
        shown(group.fields).length > 0 || shown(group.repeating?.fields ?? []).length > 0
      ));

  }) :
  [];

  if (sections.length === 0) {
    return (
      <EmptyState
        icon={FileTextIcon}
        title="This form does not collect employee details"
        description="Only the Required Documents tab is shown to the recipient." />);


  }

  return (
    <div className="space-y-3">
      {sections.map((section) => {
        const fields = shown(section.fields);
        return (
          <section key={section.id} className="overflow-hidden rounded-xl border border-line bg-white">
            <div className="flex flex-wrap items-center gap-2 border-b border-line bg-slate-50/70 px-4 py-2.5">
              <h3 className="text-[13px] font-medium text-ink">{section.title}</h3>
              <Badge>{fields.length} fields</Badge>
              {section.repeating &&
              <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 ring-1 ring-inset ring-violet-200">
                  <RepeatIcon className="h-3 w-3" />
                  Repeating
                </span>
              }
              {section.conditionalGroups &&
              <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 ring-1 ring-inset ring-sky-200">
                  <GitBranchIcon className="h-3 w-3" />
                  Conditional on Civil Status
                </span>
              }
            </div>

            {fields.length > 0 &&
            <ul className="divide-y divide-line">
                {fields.map((field) =>
              <FieldLine key={field.id} field={field} />
              )}
              </ul>
            }

            {(section.conditionalGroups ?? []).map((group) => {
              const groupFields = shown(group.fields);
              const childFields = shown(group.repeating?.fields ?? []);
              if (groupFields.length === 0 && childFields.length === 0) return null;
              return (
                <div key={group.id} className="border-t border-line">
                  <div className="flex items-center gap-2 bg-slate-50/60 px-4 py-2">
                    <span className="text-[12px] font-medium text-ink">{group.label}</span>
                    <Badge className="bg-sky-50 text-sky-700 ring-sky-200">
                      Shown when {group.condition}
                    </Badge>
                  </div>
                  {groupFields.length > 0 &&
                  <ul className="divide-y divide-line">
                      {groupFields.map((field) =>
                    <FieldLine key={field.id} field={field} />
                    )}
                    </ul>
                  }
                  {group.repeating && childFields.length > 0 &&
                  <div className="border-t border-line">
                      <div className="flex items-center gap-2 bg-slate-50/40 px-4 py-2 pl-8">
                        <span className="text-[12px] font-medium text-ink">{group.repeating.label}</span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 ring-1 ring-inset ring-violet-200">
                          <RepeatIcon className="h-3 w-3" />
                          Repeating
                        </span>
                      </div>
                      <ul className="divide-y divide-line">
                        {childFields.map((field) =>
                      <FieldLine key={field.id} field={field} />
                      )}
                      </ul>
                    </div>
                  }
                </div>);

            })}
          </section>);

      })}
    </div>);

}