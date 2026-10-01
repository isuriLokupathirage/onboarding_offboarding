import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckIcon, ChevronDownIcon, SearchIcon } from 'lucide-react';
import type { EmployeeForm } from '../../types';
import { Badge } from '../ui/Badge';

type FormPickerProps =
{forms: EmployeeForm[];multiple?: false;value: string;onChange: (formId: string) => void;} |
{forms: EmployeeForm[];multiple: true;value: string[];onChange: (formIds: string[]) => void;};

/** Searchable form select. With `multiple`, options toggle and the list stays open. */
export function FormPicker(props: FormPickerProps) {
  const { forms } = props;
  const selectedIds = props.multiple ? props.value : props.value ? [props.value] : [];
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = selectedIds.length === 1 ? forms.find((form) => form.id === selectedIds[0]) : undefined;

  const pick = (formId: string) => {
    if (!props.multiple) {
      props.onChange(formId);
      setOpen(false);
      return;
    }
    props.onChange(
      selectedIds.includes(formId) ?
      selectedIds.filter((id) => id !== formId) :
      [...selectedIds, formId]
    );
  };

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return forms;
    return forms.filter(
      (form) =>
      form.name.toLowerCase().includes(term) ||
      form.code.toLowerCase().includes(term) ||
      form.employmentType.toLowerCase().includes(term)
    );
  }, [forms, query]);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  useEffect(() => {
    if (open) searchRef.current?.focus();else
    setQuery('');
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 rounded-lg border border-line bg-white px-3.5 py-2.5 text-left transition-colors duration-150 ease-out hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-200">
        
        {selected ?
        <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-[13px] font-medium text-ink">{selected.name}</span>
            <Badge>{selected.employmentType}</Badge>
            <span className="font-mono text-[11px] text-subtle">{selected.code}</span>
          </span> :
        selectedIds.length > 1 ?
        <span className="text-[13px] font-medium text-ink">{selectedIds.length} forms selected</span> :

        <span className="text-[13px] text-subtle">
            {props.multiple ? 'Search and select one or more forms' : 'Search and select a form'}
          </span>
        }
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-subtle transition-transform duration-150 ease-out ${
          open ? 'rotate-180' : ''}`
          } />
        
      </button>

      {open &&
      <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-lg border border-line bg-white shadow-pop">
          <div className="flex items-center gap-2 border-b border-line px-3 py-2">
            <SearchIcon className="h-3.5 w-3.5 shrink-0 text-subtle" />
            <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search forms by name or code"
            aria-label="Search forms"
            className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-subtle" />
          
          </div>

          <ul role="listbox" aria-multiselectable={props.multiple || undefined} className="scroll-thin max-h-56 overflow-y-auto py-1">
            {results.length === 0 ?
          <li className="px-3.5 py-6 text-center text-[13px] text-muted">
                No active forms match “{query}”.
              </li> :

          results.map((form) => {
            const isSelected = selectedIds.includes(form.id);
            return (
              <li key={form.id}>
                    <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => pick(form.id)}
                  className={`flex w-full items-start gap-3 px-3.5 py-2.5 text-left transition-colors duration-150 ease-out ${
                  isSelected ? 'bg-brand-50/60' : 'hover:bg-slate-50'}`
                  }>
                  
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-[13px] font-medium text-ink">{form.name}</span>
                          <Badge>{form.employmentType}</Badge>
                        </span>
                        <span className="mt-0.5 block font-mono text-[11px] text-subtle">
                          {form.code}
                        </span>
                      </span>
                      {isSelected && <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />}
                    </button>
                  </li>);

          })
          }
          </ul>
        </div>
      }
    </div>);

}