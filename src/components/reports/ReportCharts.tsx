import React from 'react';
import { InfoIcon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { Tooltip } from '../ui/Tooltip';
import type { CountEntry } from '../../utils/reports';

/** A titled card that holds one chart or table. */
export function ReportCard({
  title,
  description,
  actions,
  children,
  className
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={twMerge('rounded-xl border border-line bg-white p-5 shadow-card', className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          {description && <p className="mt-0.5 text-[12px] text-muted">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>);

}

/**
 * One headline figure. A tile with a `formula` shows how the figure is calculated on hover and on
 * keyboard focus.
 */
export function StatTile({
  label,
  value,
  note,
  formula,
  muted = false
}: {
  label: string;
  value: string;
  note?: string;
  formula?: string;
  /** For a figure that is unavailable rather than a number. */
  muted?: boolean;
}) {
  const tile =
  <div
    tabIndex={formula ? 0 : undefined}
    className={twMerge(
      'flex-1 rounded-xl border border-line bg-white px-4 py-3.5 text-left shadow-card',
      formula && 'cursor-help outline-none transition-colors duration-150 ease-out hover:border-brand-200 focus-visible:ring-2 focus-visible:ring-brand-300'
    )}>

      <p className="flex items-center gap-1 text-[12px] font-medium text-muted">
        {label}
        {formula && <InfoIcon className="h-3 w-3 text-subtle" aria-hidden="true" />}
      </p>
      <p className={twMerge('mt-1 font-semibold tracking-tight', muted ? 'text-lg text-subtle' : 'text-2xl text-ink')}>
        {value}
      </p>
      {note && <p className="mt-0.5 text-[12px] text-subtle">{note}</p>}
      {formula && <span className="sr-only">. How it is calculated: {formula}</span>}
    </div>;

  return formula ?
  <Tooltip label={formula} multiline className="flex w-full">
      {tile}
    </Tooltip> :

  tile;

}

/**
 * Horizontal bars in the order given. Each bar is a button: selecting one filters the leavers
 * table, and selecting it again clears that filter.
 */
export function BarList({
  entries,
  selected,
  onSelect,
  noun
}: {
  entries: CountEntry[];
  selected?: string;
  onSelect: (label: string) => void;
  /** Used in each bar's hover text and accessible name, such as "leavers". */
  noun: string;
}) {
  const max = Math.max(1, ...entries.map((entry) => entry.count));
  return (
    <ul className="space-y-1">
      {entries.map((entry) => {
        const isSelected = selected === entry.label;
        const dimmed = Boolean(selected) && !isSelected;
        const summary = `${entry.label}: ${entry.count} ${noun}`;
        return (
          <li key={entry.label}>
            <button
              type="button"
              aria-pressed={isSelected}
              title={summary}
              aria-label={`${summary}. ${isSelected ? 'Selected. Select again to clear.' : 'Select to filter the table.'}`}
              onClick={() => onSelect(entry.label)}
              className={twMerge(
                'grid w-full grid-cols-[minmax(110px,40%)_1fr_32px] items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors duration-150 ease-out',
                isSelected ? 'bg-brand-50 ring-1 ring-inset ring-brand-200' : 'hover:bg-slate-50'
              )}>

              <span className={twMerge('truncate text-[13px]', dimmed ? 'text-subtle' : 'text-ink')}>
                {entry.label}
              </span>
              <span className="h-2.5 rounded-full bg-slate-100">
                <span
                  className={twMerge(
                    'block h-full rounded-full transition-colors duration-150 ease-out',
                    dimmed ? 'bg-brand-200' : 'bg-brand-500'
                  )}
                  style={{ width: `${entry.count / max * 100}%` }} />

              </span>
              <span className="text-right font-mono text-[12px] font-medium text-ink">{entry.count}</span>
            </button>
          </li>);

      })}
    </ul>);

}

export interface ColumnEntry {
  key: string;
  label: string;
  /** Null when the figure cannot be determined for this column. */
  value: number | null;
  /** Shown above the column, such as "3" or "1.4%". Empty hides it. */
  valueLabel: string;
  /** Hover text. It may run over several lines. */
  hover: string;
}

/**
 * Vertical columns, one per period, with the value above each and the label below. A column whose
 * value is unavailable shows a dashed stub, so a gap is never mistaken for zero.
 */
export function ColumnChart({ entries, label }: {entries: ColumnEntry[];label: string;}) {
  const max = Math.max(0, ...entries.map((entry) => entry.value ?? 0)) || 1;
  return (
    <div>
      <ul className="flex h-48 items-end gap-2 border-b border-line" aria-label={label}>
        {entries.map((entry) =>
        <li
          key={entry.key}
          title={entry.hover}
          aria-label={entry.hover.replace(/\n/g, '. ')}
          className="group flex h-full min-w-0 flex-1 cursor-default flex-col items-center justify-end">

            <span className="mb-1 font-mono text-[11px] font-medium text-ink">{entry.valueLabel}</span>
            {entry.value === null ?
          <span className="h-3 w-full max-w-[36px] rounded-t border border-b-0 border-dashed border-slate-300" /> :

          <span
            className="w-full max-w-[36px] rounded-t bg-brand-500 transition-colors duration-150 ease-out group-hover:bg-brand-600"
            style={{ height: `${entry.value / max * 80}%`, minHeight: entry.value > 0 ? 4 : 0 }} />

          }
          </li>
        )}
      </ul>
      <div className="mt-1.5 flex gap-2" aria-hidden="true">
        {entries.map((entry) =>
        <span key={entry.key} className="min-w-0 flex-1 truncate text-center text-[11px] text-muted">
            {entry.label}
          </span>
        )}
      </div>
    </div>);

}
