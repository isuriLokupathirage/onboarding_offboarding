import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { ChevronDownIcon, SearchIcon, XIcon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { Avatar } from '../ui/Avatar';
import type { RecruitmentCandidate } from '../../types';
import { candidateName, matchesCandidate } from '../../utils/recruitment';

/** Single-select dropdown of recruitment candidates, searchable by candidate or campaign name. */
export function CandidatePicker({
  candidates,
  value,
  onChange,
  disabled = false






}: {candidates: RecruitmentCandidate[];value: string;onChange: (id: string) => void;disabled?: boolean;}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const selected = candidates.find((candidate) => candidate.id === value);
  const results = useMemo(
    () => candidates.filter((candidate) => matchesCandidate(candidate, query)),
    [candidates, query]
  );

  useEffect(() => {
    if (!open) return undefined;
    searchRef.current?.focus();
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  useEffect(() => setActive(0), [query]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const choose = (id: string) => {
    onChange(id);
    close();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((prev) => Math.min(prev + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((prev) => Math.max(prev - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (results[active]) choose(results[active].id);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close();
    }
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((prev) => !prev)}
          className={twMerge(
            'flex h-10 w-full items-center gap-2 rounded-lg border border-line bg-white pl-3 pr-9 text-left text-sm transition-colors duration-150 ease-out focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100',
            disabled && 'cursor-not-allowed bg-slate-50 text-subtle',
            open && 'border-brand-400 ring-2 ring-brand-100'
          )}>

          {selected ?
          <span className="flex min-w-0 items-center gap-2">
              <span className="truncate text-ink">{candidateName(selected)}</span>
              <span className="truncate text-[12px] text-muted">· {selected.campaignName}</span>
            </span> :

          <span className="text-subtle">Select a candidate</span>
          }
        </button>
        {selected && !disabled ?
        <button
          type="button"
          aria-label="Clear candidate"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-subtle transition-colors duration-150 ease-out hover:bg-slate-100 hover:text-ink">

            <XIcon className="h-3.5 w-3.5" />
          </button> :

        <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
        }
      </div>

      {open &&
      <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-line bg-white shadow-pop">
          <div className="relative border-b border-line">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle" />
            <input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search by candidate or campaign name"
            aria-label="Search candidates"
            aria-controls={listId}
            className="h-9 w-full bg-white pl-9 pr-3 text-[13px] text-ink placeholder:text-subtle focus:outline-none" />

          </div>
          <ul id={listId} role="listbox" className="scroll-thin max-h-64 overflow-y-auto py-1">
            {results.map((candidate, index) =>
          <li key={candidate.id} role="option" aria-selected={candidate.id === value}>
                <button
              type="button"
              onClick={() => choose(candidate.id)}
              onMouseEnter={() => setActive(index)}
              className={twMerge(
                'flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors duration-150 ease-out',
                index === active && 'bg-slate-50',
                candidate.id === value && 'bg-brand-50/60'
              )}>

                  <Avatar name={candidateName(candidate)} size="sm" />
                  <span className="min-w-0 leading-tight">
                    <span className="block truncate text-[13px] text-ink">{candidateName(candidate)}</span>
                    <span className="block truncate text-[11px] text-muted">
                      {candidate.campaignName} · {candidate.position}
                    </span>
                  </span>
                </button>
              </li>
          )}
            {results.length === 0 &&
          <li className="px-3 py-6 text-center text-[12px] text-muted">
                {candidates.length === 0 ?
            'No candidates are ready for onboarding.' :
            `No candidates match "${query.trim()}".`}
              </li>
          }
          </ul>
        </div>
      }
    </div>);

}
