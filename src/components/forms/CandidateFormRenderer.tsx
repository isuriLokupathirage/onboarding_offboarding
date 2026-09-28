import React, { useMemo, useState } from 'react';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import type { EmployeeForm, FormField, FormSection } from '../../types';
import { Button } from '../ui/Button';
import { Input, Select, Textarea } from '../ui/Field';

function visibleFields(fields: FormField[]): FormField[] {
  return fields.filter((field) => field.state !== 'Hidden');
}

interface ControlProps {
  value?: string;
  onChange?: (value: string) => void;
}

function FieldControl({ field, id, value, onChange }: {field: FormField;id: string;} & ControlProps) {
  const controlled = value !== undefined;
  const shared = controlled ?
  { value, onChange: (event: {target: {value: string;};}) => onChange?.(event.target.value) } :
  {};

  if (field.dataType === 'Dropdown') {
    return (
      <Select id={id} required={field.state === 'Required'} {...shared}>
        <option value="">Select an option</option>
        {(field.options ?? []).map((option) =>
        <option key={option} value={option}>
            {option}
          </option>
        )}
      </Select>);

  }
  if (field.dataType === 'Long text') {
    return <Textarea id={id} required={field.state === 'Required'} {...shared} />;
  }
  const type =
  field.dataType === 'Date' ?
  'date' :
  field.dataType === 'Email' ?
  'email' :
  field.dataType === 'Phone' ?
  'tel' :
  'text';
  return (
    <Input
      id={id}
      type={type}
      required={field.state === 'Required'}
      placeholder={field.dataType === 'Phone' ? '+94 7X XXX XXXX' : undefined}
      {...shared} />);


}

function FieldBlock({
  field,
  prefix,
  valueKey,
  values,
  onValueChange,
  prefilled







}: {field: FormField;prefix: string;valueKey: string;values?: Record<string, string>;onValueChange?: (key: string, value: string) => void;prefilled?: Record<string, string>;}) {
  const id = `${prefix}-${field.id}`;
  const original = prefilled?.[valueKey];
  const current = values?.[valueKey];
  const changed = original !== undefined && current !== undefined && current !== original;
  const otherKey = `${valueKey}__other`;
  const showOther = Boolean(field.allowOther) && (current ?? '') === 'Other';

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-[13px] font-medium text-ink">
          {field.name}
          {field.state === 'Required' && <span className="ml-0.5 text-red-500">*</span>}
        </label>
        {changed ?
        <span className="text-[11px] font-medium text-brand-700">Changed</span> :

        original !== undefined && <span className="text-[11px] text-sky-700">from your record</span>
        }
      </div>
      <FieldControl
        field={field}
        id={id}
        value={values ? current ?? '' : undefined}
        onChange={values ? (next) => onValueChange?.(valueKey, next) : undefined} />
      
      {showOther &&
      <div className="mt-2">
          <label htmlFor={`${id}-other`} className="mb-1 block text-[12px] text-muted">
            Please specify
            {field.state === 'Required' && <span className="ml-0.5 text-red-500">*</span>}
          </label>
          <Input
          id={`${id}-other`}
          type="text"
          value={values ? values[otherKey] ?? '' : undefined}
          onChange={values ? (event) => onValueChange?.(otherKey, event.target.value) : undefined}
          placeholder={`Tell us your ${field.name.toLowerCase()}`} />
        
        </div>
      }
    </div>);

}

export function CandidateFormRenderer({
  form,
  maritalStatus,
  onMaritalStatusChange,
  values,
  onValueChange,
  prefilled







}: {form: EmployeeForm;maritalStatus: 'Single' | 'Married';onMaritalStatusChange: (status: 'Single' | 'Married') => void;values?: Record<string, string>;onValueChange?: (key: string, value: string) => void;prefilled?: Record<string, string>;}) {
  const [repeats, setRepeats] = useState<Record<string, number>>({});

  const sections = useMemo(
    () =>
    form.employeeDetailsEnabled ?
    form.sections.filter(
      (section) =>
      section.enabled && (
      visibleFields(section.fields).length > 0 ||
      (section.conditionalGroups ?? []).some(
        (group) =>
        visibleFields(group.fields).length > 0 ||
        visibleFields(group.repeating?.fields ?? []).length > 0
      ))
    ) :
    [],
    [form.employeeDetailsEnabled, form.sections]
  );

  const rowsFor = (key: string) => repeats[key] ?? 1;
  const setRows = (key: string, next: number) =>
  setRepeats((prev) => ({ ...prev, [key]: Math.max(1, next) }));

  const blockProps = { values, onValueChange, prefilled };

  if (sections.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line bg-white px-5 py-8 text-center text-[13px] text-muted">
        This form does not ask for any employee details. Continue to the documents tab.
      </p>);

  }

  return (
    <div className="space-y-6">
      {sections.map((section) => {
        const fields = visibleFields(section.fields);
        const rows = rowsFor(section.id);

        return (
          <section key={section.id} className="rounded-xl border border-line bg-white p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-ink">{section.title}</h3>
              {section.repeating &&
              <Button size="sm" onClick={() => setRows(section.id, rows + 1)}>
                  <PlusIcon className="h-3.5 w-3.5" />
                  Add {section.title.replace(/s$/, '')}
                </Button>
              }
            </div>

            {section.repeating ?
            <RepeatingRows
              label={section.title.replace(/s$/, '')}
              rows={rows}
              onRemove={() => setRows(section.id, rows - 1)}
              fields={fields}
              prefix={section.id}
              {...blockProps} /> :


            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {fields.map((field) =>
              field.id === 'marital' ?
              <div key={field.id}>
                      <label
                  htmlFor="marital-status"
                  className="mb-1.5 block text-[13px] font-medium text-ink">
                  
                        {field.name}
                        {field.state === 'Required' && <span className="ml-0.5 text-red-500">*</span>}
                      </label>
                      <Select
                  id="marital-status"
                  value={maritalStatus}
                  onChange={(event) =>
                  onMaritalStatusChange(event.target.value as 'Single' | 'Married')
                  }>
                  
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                      </Select>
                    </div> :

              <FieldBlock
                key={field.id}
                field={field}
                prefix={section.id}
                valueKey={field.id}
                {...blockProps} />


              )}
              </div>
            }

            {(section.conditionalGroups ?? []).
            filter((group) => group.condition === maritalStatus).
            map((group) => {
              const groupFields = visibleFields(group.fields);
              const childFields = visibleFields(group.repeating?.fields ?? []);
              if (groupFields.length === 0 && childFields.length === 0) return null;
              const childKey = `${group.id}-repeat`;
              const childRows = rowsFor(childKey);
              return (
                <div key={group.id} className="mt-5 rounded-lg border border-line bg-slate-50/50 p-4">
                    <p className="mb-3 text-[12px] font-medium text-ink">{group.label}</p>
                    {groupFields.length > 0 &&
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {groupFields.map((field) =>
                    <FieldBlock
                      key={field.id}
                      field={field}
                      prefix={group.id}
                      valueKey={field.id}
                      {...blockProps} />

                    )}
                      </div>
                  }

                    {group.repeating && childFields.length > 0 &&
                  <div className="mt-4 border-t border-line pt-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="text-[12px] font-medium text-ink">{group.repeating.label}</p>
                          <Button size="sm" onClick={() => setRows(childKey, childRows + 1)}>
                            <PlusIcon className="h-3.5 w-3.5" />
                            Add Child
                          </Button>
                        </div>
                        <RepeatingRows
                      label="Child"
                      rows={childRows}
                      onRemove={() => setRows(childKey, childRows - 1)}
                      fields={childFields}
                      prefix={`${group.id}-child`}
                      {...blockProps} />
                    
                      </div>
                  }
                  </div>);

            })}
          </section>);

      })}
    </div>);

}

function RepeatingRows({
  label,
  rows,
  onRemove,
  fields,
  prefix,
  values,
  onValueChange,
  prefilled









}: {label: string;rows: number;onRemove: () => void;fields: FormField[];prefix: string;values?: Record<string, string>;onValueChange?: (key: string, value: string) => void;prefilled?: Record<string, string>;}) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, index) =>
      <div key={`${prefix}-${index}`} className="rounded-lg border border-line bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[12px] font-medium text-muted">
              {label} {index + 1}
            </p>
            {rows > 1 && index === rows - 1 &&
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${label} ${index + 1}`}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[12px] text-muted transition-colors duration-150 ease-out hover:bg-red-50 hover:text-red-600">
            
                <Trash2Icon className="h-3.5 w-3.5" />
                Remove
              </button>
          }
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((field) =>
          <FieldBlock
            key={field.id}
            field={field}
            prefix={`${prefix}-${index}`}
            valueKey={`${field.id}#${index}`}
            values={values}
            onValueChange={onValueChange}
            prefilled={prefilled} />

          )}
          </div>
        </div>
      )}
    </div>);

}

export function collectFormSections(form: EmployeeForm): FormSection[] {
  return form.employeeDetailsEnabled ? form.sections.filter((section) => section.enabled) : [];
}

export function formHasFields(form: EmployeeForm): boolean {
  if (!form.employeeDetailsEnabled) return false;
  return form.sections.some(
    (section) =>
    section.enabled && (
    visibleFields(section.fields).length > 0 ||
    (section.conditionalGroups ?? []).some(
      (group) =>
      visibleFields(group.fields).length > 0 ||
      visibleFields(group.repeating?.fields ?? []).length > 0
    ))
  );
}