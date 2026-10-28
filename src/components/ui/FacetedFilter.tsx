import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckIcon, PlusCircleIcon, SearchIcon, XIcon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export interface FacetOption {
  value: string;
  label: string;
  /** How many records have this value, before this filter is applied. */
  count?: number;
}

/**
 * The "+ Title" filter used by Recruitment → Campaigns: a dashed button that opens a searchable
 * checklist. Selected values show as chips beside the title; each chip can be removed on its own.
 */
export function FacetedFilter({
  title,
  options,
  selected,
  onChange,
  searchable = true






}: {title: string;options: FacetOption[];selected: string[];onChange: (values: string[]) => void;searchable?: boolean;}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return needle ? options.filter((option) => option.label.toLowerCase().includes(needle)) : options;
  }, [options, search]);

  const toggle = (value: string) =>
  onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);

  const chosen = options.filter((option) => selected.includes(option.value));

  return (
    <div ref={ref} className="relative">
      <div
        className={twMerge(
          'flex h-10 items-center gap-1 rounded-lg border border-dashed bg-white pl-2.5 pr-1.5 text-[13px] font-medium text-ink transition-colors duration-150 ease-out',
          open ? 'border-brand-400' : 'border-slate-300 hover:bg-slate-50'
        )}>

        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex h-full items-center gap-1.5 pr-1 focus:outline-none">

          <PlusCircleIcon className="h-4 w-4 text-subtle" />
          {title}
        </button>
        {chosen.length > 0 &&
        <>
            <span className="mx-1 h-4 w-px bg-line" aria-hidden="true" />
            <span className="flex items-center gap-1">
              {chosen.map((option) =>
            <span
              key={option.value}
              className="inline-flex items-center gap-0.5 rounded bg-slate-100 py-0.5 pl-1.5 pr-0.5 text-[12px] font-normal text-ink">

                  <span className="max-w-[140px] truncate">{option.label}</span>
                  <button
                type="button"
                aria-label={`Remove ${option.label} from ${title}`}
                onClick={() => toggle(option.value)}
                className="rounded p-0.5 text-subtle transition-colors duration-150 ease-out hover:bg-slate-200 hover:text-ink">

                    <XIcon className="h-3 w-3" />
                  </button>
                </span>
            )}
            </span>
          </>
        }
      </div>

      <AnimatePresence>
        {open &&
        <motion.div
          role="listbox"
          aria-multiselectable="true"
          aria-label={title}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14, ease: [0.23, 1, 0.32, 1] }}
          className="absolute left-0 top-11 z-30 w-64 overflow-hidden rounded-lg border border-line bg-white shadow-pop">

            {searchable &&
          <div className="flex items-center gap-2 border-b border-line px-3">
                <SearchIcon className="h-3.5 w-3.5 text-subtle" />
                <input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={title}
              aria-label={`Search ${title}`}
              className="h-9 w-full bg-transparent text-[13px] text-ink placeholder:text-subtle focus:outline-none" />

              </div>
          }
            <div className="scroll-thin max-h-60 overflow-y-auto py-1">
              {visible.length === 0 ?
            <p className="px-3 py-4 text-center text-[13px] text-muted">No results found.</p> :

            visible.map((option) => {
              const isSelected = selected.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => toggle(option.value)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-ink transition-colors duration-150 ease-out hover:bg-slate-50">

                      <span
                    className={twMerge(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border',
                      isSelected ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-300'
                    )}>

                        {isSelected && <CheckIcon className="h-3 w-3" />}
                      </span>
                      <span className="flex-1 truncate" title={option.label}>
                        {option.label}
                      </span>
                      {option.count !== undefined &&
                  <span className="font-mono text-[11px] text-subtle">{option.count}</span>
                  }
                    </button>);

            })
            }
            </div>
            {selected.length > 0 &&
          <button
            type="button"
            onClick={() => onChange([])}
            className="block w-full border-t border-line px-3 py-2 text-center text-[13px] font-medium text-ink transition-colors duration-150 ease-out hover:bg-slate-50">

                Clear filters
              </button>
          }
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}
