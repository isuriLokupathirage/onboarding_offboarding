import React, { useMemo, useState } from 'react';
import { SearchIcon, XIcon } from 'lucide-react';
import { people, peopleById } from '../../data/people';
import type { Person } from '../../types';
import { Avatar } from '../ui/Avatar';

export function PeoplePicker({
  selectedIds,
  onChange,
  placeholder = 'Search people',
  emptyHint,
  isEligible
}: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  emptyHint?: string;
  isEligible?: (person: Person) => boolean;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return people.
    filter((person) => !selectedIds.includes(person.id) && (!isEligible || isEligible(person))).
    filter(
      (person) =>
      !needle ||
      person.name.toLowerCase().includes(needle) ||
      person.role.toLowerCase().includes(needle) ||
      person.department.toLowerCase().includes(needle)
    ).
    slice(0, 6);
  }, [query, selectedIds, isEligible]);

  return (
    <div className="rounded-lg border border-line bg-white">
      <div className="flex flex-wrap items-center gap-1.5 p-2">
        {selectedIds.map((id) =>
        <span
          key={id}
          className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-0.5 pl-0.5 pr-1.5 text-[12px] text-ink">
          
            <Avatar name={peopleById[id]?.name ?? id} size="xs" />
            {peopleById[id]?.name ?? id}
            <button
            type="button"
            aria-label={`Remove ${peopleById[id]?.name ?? id}`}
            onClick={() => onChange(selectedIds.filter((value) => value !== id))}
            className="rounded-full p-0.5 text-subtle transition-colors duration-150 ease-out hover:bg-slate-200 hover:text-ink">
            
              <XIcon className="h-3 w-3" />
            </button>
          </span>
        )}
        {selectedIds.length === 0 && emptyHint &&
        <span className="px-1 text-[12px] text-subtle">{emptyHint}</span>
        }
      </div>
      <div className="relative border-t border-line">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-9 w-full rounded-b-lg bg-white pl-9 pr-3 text-[13px] text-ink placeholder:text-subtle focus:outline-none" />
        
        {open && results.length > 0 &&
        <ul className="absolute left-0 right-0 top-full z-20 max-h-56 overflow-y-auto rounded-lg border border-line bg-white py-1 shadow-pop">
            {results.map((person) =>
          <li key={person.id}>
                <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange([...selectedIds, person.id]);
                setQuery('');
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors duration-150 ease-out hover:bg-slate-50">
              
                  <Avatar name={person.name} size="sm" />
                  <span className="leading-tight">
                    <span className="block text-[13px] text-ink">{person.name}</span>
                    <span className="block text-[11px] text-muted">
                      {person.role} · {person.department}
                    </span>
                  </span>
                </button>
              </li>
          )}
          </ul>
        }
      </div>
    </div>);

}