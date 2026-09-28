import React from 'react';
import { twMerge } from 'tailwind-merge';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  size = 'md'






}: {options: SegmentOption<T>[];value: T;onChange: (value: T) => void;className?: string;size?: 'sm' | 'md';}) {
  return (
    <div
      role="tablist"
      className={twMerge(
        'inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1',
        className
      )}>
      
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={twMerge(
              'inline-flex items-center gap-1.5 rounded-md font-medium transition-colors duration-150 ease-out',
              size === 'sm' ? 'h-7 px-2.5 text-[12px]' : 'h-8 px-3 text-[13px]',
              active ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'
            )}>
            
            {option.label}
            {option.count !== undefined &&
            <span
              className={twMerge(
                'rounded px-1.5 py-0.5 text-[11px] font-semibold',
                active ? 'bg-brand-50 text-brand-700' : 'bg-white/70 text-muted'
              )}>
              
                {option.count}
              </span>
            }
          </button>);

      })}
    </div>);

}

export function Tabs<T extends string>({
  options,
  value,
  onChange




}: {options: SegmentOption<T>[];value: T;onChange: (value: T) => void;}) {
  return (
    <div role="tablist" className="flex items-center gap-6 border-b border-line">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={twMerge(
              '-mb-px inline-flex items-center gap-2 border-b-2 pb-2.5 pt-1 text-sm font-medium transition-colors duration-150 ease-out',
              active ?
              'border-brand-500 text-ink' :
              'border-transparent text-muted hover:border-slate-300 hover:text-ink'
            )}>
            
            {option.label}
            {option.count !== undefined &&
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-muted">
                {option.count}
              </span>
            }
          </button>);

      })}
    </div>);

}