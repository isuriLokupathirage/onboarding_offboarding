import React from 'react';
import { twMerge } from 'tailwind-merge';
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

export function StatTile({ label, value, note }: {label: string;value: string;note?: string;}) {
  return (
    <div className="rounded-xl border border-line bg-white px-4 py-3.5 shadow-card">
      <p className="text-[12px] font-medium text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-ink">{value}</p>
      {note && <p className="mt-0.5 text-[12px] text-subtle">{note}</p>}
    </div>);

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

/** Vertical columns, one per period, with the count above each and the label below. */
export function ColumnChart({ entries, noun }: {entries: CountEntry[];noun: string;}) {
  const max = Math.max(1, ...entries.map((entry) => entry.count));
  return (
    <div>
      <ul className="flex h-48 items-end gap-2 border-b border-line">
        {entries.map((entry) =>
        <li
          key={entry.label}
          title={`${entry.label}: ${entry.count} ${noun}`}
          aria-label={`${entry.label}: ${entry.count} ${noun}`}
          className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end">

            <span className="mb-1 font-mono text-[11px] font-medium text-ink">{entry.count > 0 ? entry.count : ''}</span>
            <span
            className="w-full max-w-[36px] rounded-t bg-brand-500 transition-colors duration-150 ease-out group-hover:bg-brand-600"
            style={{ height: `${entry.count / max * 80}%`, minHeight: entry.count > 0 ? 4 : 0 }} />

          </li>
        )}
      </ul>
      <div className="mt-1.5 flex gap-2" aria-hidden="true">
        {entries.map((entry) =>
        <span key={entry.label} className="min-w-0 flex-1 truncate text-center text-[11px] text-muted">
            {entry.label}
          </span>
        )}
      </div>
    </div>);

}
