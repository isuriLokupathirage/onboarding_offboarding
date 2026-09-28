import React, { useState } from 'react';
import { ChevronDownIcon, GitBranchIcon, InfoIcon, RepeatIcon } from 'lucide-react';
import type { EmployeeForm } from '../../types';
import { Badge } from '../ui/Badge';
import { Toggle } from '../ui/Toggle';
import { Tooltip } from '../ui/Tooltip';
import { FieldRow } from './FieldRow';
import { useAppData } from '../../contexts/AppDataContext';

export function EmployeeDetailsTab({ form }: {form: EmployeeForm;}) {
  const { setFieldState, toggleSection, setEmployeeDetailsEnabled } = useAppData();
  const [open, setOpen] = useState<string[]>(['personal']);
  const active = form.employeeDetailsEnabled;

  const enabledFieldTotal = form.sections.
  filter((section) => section.enabled).
  reduce(
    (total, section) =>
    total +
    section.fields.filter((field) => field.state !== 'Hidden').length +
    (section.conditionalGroups ?? []).reduce(
      (sum, group) =>
      sum +
      group.fields.filter((field) => field.state !== 'Hidden').length +
      (group.repeating?.fields ?? []).filter((field) => field.state !== 'Hidden').length,
      0
    ),
    0
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-line bg-white px-5 py-4">
        <div className="max-w-xl">
          <p className="text-[13px] font-medium text-ink">Collect employee details</p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">
            Turn this off to leave the tab empty and send a documents-only form. Turning it on always
            enables the fields Employee Management requires and locks them as required.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge>{active ? `${enabledFieldTotal} fields enabled` : 'Documents only'}</Badge>
          <Toggle
            checked={active}
            onChange={(next) => setEmployeeDetailsEnabled(form.id, next)}
            label="Collect employee details" />
          
        </div>
      </div>

      {!active &&
      <div className="flex items-start gap-2.5 rounded-lg bg-sky-50 px-3.5 py-3 ring-1 ring-inset ring-sky-200">
          <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
          <p className="text-[13px] leading-relaxed text-sky-900">
            This form asks for documents only. The recipient will see the Required Documents tab and no
            Employee Data Form.
          </p>
        </div>
      }

      <div className={active ? '' : 'pointer-events-none opacity-50'}>
        <div className="space-y-2">
          {form.sections.map((section) => {
            const isOpen = open.includes(section.id);
            const groupFields = (section.conditionalGroups ?? []).flatMap((group) => [
            ...group.fields,
            ...(group.repeating?.fields ?? [])]
            );
            const allFields = [...section.fields, ...groupFields];
            const enabledCount = allFields.filter((field) => field.state !== 'Hidden').length;
            const hasLocked = allFields.some((field) => field.locked);

            return (
              <section key={section.id} className="overflow-hidden rounded-xl border border-line bg-white">
                <div className="flex items-center gap-3 bg-slate-50/70 px-4 py-3">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() =>
                    setOpen((prev) =>
                    prev.includes(section.id) ?
                    prev.filter((id) => id !== section.id) :
                    [...prev, section.id]
                    )
                    }
                    className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                    
                    <ChevronDownIcon
                      className={`h-4 w-4 shrink-0 text-subtle transition-transform duration-150 ease-out ${
                      isOpen ? '' : '-rotate-90'}`
                      } />
                    
                    <span className="text-[13px] font-medium text-ink">{section.title}</span>
                    <Badge>
                      {enabledCount} of {allFields.length} enabled
                    </Badge>
                    {section.repeating &&
                    <Tooltip label="The recipient can add and remove entries">
                        <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 ring-1 ring-inset ring-violet-200">
                          <RepeatIcon className="h-3 w-3" />
                          Repeating
                        </span>
                      </Tooltip>
                    }
                    {section.conditionalGroups &&
                    <Tooltip label="Shown based on Civil Status">
                        <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 ring-1 ring-inset ring-sky-200">
                          <GitBranchIcon className="h-3 w-3" />
                          Conditional
                        </span>
                      </Tooltip>
                    }
                  </button>

                  {hasLocked ?
                  <Tooltip label="Contains a field required by Employee Management">
                      <span>
                        <Toggle
                        checked={section.enabled}
                        onChange={() => undefined}
                        label={`Enable ${section.title}`}
                        disabled
                        disabledReason="Contains a field required by Employee Management" />
                      
                      </span>
                    </Tooltip> :

                  <Toggle
                    checked={section.enabled}
                    onChange={() => toggleSection(form.id, section.id)}
                    label={`Enable ${section.title}`} />

                  }
                </div>

                {isOpen &&
                <div className={section.enabled ? '' : 'pointer-events-none opacity-50'}>
                    <div className="divide-y divide-line">
                      {section.fields.map((field) =>
                    <FieldRow
                      key={field.id}
                      field={field}
                      onChange={(state) => setFieldState(form.id, field.id, state)} />

                    )}
                    </div>

                    {(section.conditionalGroups ?? []).map((group) =>
                  <div key={group.id} className="border-t border-line">
                        <div className="flex items-center gap-2 bg-slate-50/60 px-4 py-2">
                          <span className="text-[12px] font-medium text-ink">{group.label}</span>
                          <Badge className="bg-sky-50 text-sky-700 ring-sky-200">
                            Shown when {group.condition}
                          </Badge>
                        </div>
                        <div className="divide-y divide-line">
                          {group.fields.map((field) =>
                      <FieldRow
                        key={field.id}
                        field={field}
                        onChange={(state) => setFieldState(form.id, field.id, state)} />

                      )}
                        </div>

                        {group.repeating &&
                    <div className="border-t border-line">
                            <div className="flex items-center gap-2 bg-slate-50/40 px-4 py-2 pl-8">
                              <span className="text-[12px] font-medium text-ink">
                                {group.repeating.label}
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 ring-1 ring-inset ring-violet-200">
                                <RepeatIcon className="h-3 w-3" />
                                Repeating
                              </span>
                            </div>
                            <div className="divide-y divide-line">
                              {group.repeating.fields.map((field) =>
                        <FieldRow
                          key={field.id}
                          field={field}
                          onChange={(state) => setFieldState(form.id, field.id, state)} />

                        )}
                            </div>
                          </div>
                    }
                      </div>
                  )}
                  </div>
                }
              </section>);

          })}
        </div>
      </div>
    </div>);

}