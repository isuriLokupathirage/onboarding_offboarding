import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { ChevronDownIcon, SearchIcon, XIcon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { Avatar } from './Avatar';

export interface SearchableOption {
  value: string;
  label: string;
  /** Second line in the list, and shown beside the label once selected. */
  description?: string;
  /** Extra text the search matches on, besides the label. */
  keywords?: string[];
}

/** Single-select dropdown with a search box, for lists too long for a plain select. */
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search',
  emptyText = 'No options available.',
  disabled = false,
  invalid = false,
  clearable = false,
  withAvatars = false,
  id











}: {options: SearchableOption[];value: string;onChange: (value: string) => void;placeholder?: string;searchPlaceholder?: string;emptyText?: string;disabled?: boolean;invalid?: boolean;clearable?: boolean;withAvatars?: boolean;id?: string;}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const selected = options.find((option) => option.value === value);
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((option) =>
    [option.label, ...(option.keywords ?? [])].some((text) => text.toLowerCase().includes(needle))
    );
  }, [options, query]);

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

  const choose = (next: string) => {
    onChange(next);
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
      if (results[active]) choose(results[active].value);
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
          id={id}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((prev) => !prev)}
          className={twMerge(
            'flex h-10 w-full items-center gap-2 rounded-lg border border-line bg-white pl-3 pr-9 text-left text-sm transition-colors duration-150 ease-out focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100',
            disabled && 'cursor-not-allowed bg-slate-50 text-subtle',
            invalid && 'border-red-300',
            open && 'border-brand-400 ring-2 ring-brand-100'
          )}>

          {selected ?
          <span className="flex min-w-0 items-center gap-2">
              <span className="truncate text-ink">{selected.label}</span>
              {selected.description &&
            <span className="truncate text-[12px] text-muted">· {selected.description}</span>
            }
            </span> :

          <span className="text-subtle">{placeholder}</span>
          }
        </button>
        {clearable && selected && !disabled ?
        <button
          type="button"
          aria-label={`Clear ${selected.label}`}
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
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            aria-controls={listId}
            className="h-9 w-full bg-white pl-9 pr-3 text-[13px] text-ink placeholder:text-subtle focus:outline-none" />

          </div>
          <ul id={listId} role="listbox" className="scroll-thin max-h-64 overflow-y-auto py-1">
            {results.map((option, index) =>
          <li key={option.value} role="option" aria-selected={option.value === value}>
                <button
              type="button"
              onClick={() => choose(option.value)}
              onMouseEnter={() => setActive(index)}
              className={twMerge(
                'flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors duration-150 ease-out',
                index === active && 'bg-slate-50',
                option.value === value && 'bg-brand-50/60'
              )}>

                  {withAvatars && <Avatar name={option.label} size="sm" />}
                  <span className="min-w-0 leading-tight">
                    <span className="block truncate text-[13px] text-ink">{option.label}</span>
                    {option.description &&
                <span className="block truncate text-[11px] text-muted">{option.description}</span>
                }
                  </span>
                </button>
              </li>
          )}
            {results.length === 0 &&
          <li className="px-3 py-6 text-center text-[12px] text-muted">
                {options.length === 0 ? emptyText : `Nothing matches "${query.trim()}".`}
              </li>
          }
          </ul>
        </div>
      }
    </div>);

}
