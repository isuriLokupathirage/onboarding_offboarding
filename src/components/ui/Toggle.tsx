import React from 'react';
import { twMerge } from 'tailwind-merge';

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
  disabledReason






}: {checked: boolean;onChange: (next: boolean) => void;label: string;disabled?: boolean;disabledReason?: string;}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={disabled ? disabledReason : label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={twMerge(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-150 ease-out',
        checked ? 'bg-brand-500' : 'bg-slate-300',
        disabled && 'cursor-not-allowed opacity-50'
      )}>
      
      <span
        className={twMerge(
          'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-150 ease-out',
          checked ? 'translate-x-4' : 'translate-x-0.5'
        )} />
      
    </button>);

}

export function PillToggle<T extends string>({
  options,
  value,
  onChange




}: {options: {value: T;label: string;}[];value: T;onChange: (value: T) => void;}) {
  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-line bg-white">
      {options.map((option, index) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={twMerge(
              'h-8 px-3 text-[12px] font-medium transition-colors duration-150 ease-out',
              index > 0 && 'border-l border-line',
              active ? 'bg-brand-50 text-brand-700' : 'text-muted hover:bg-slate-50'
            )}>
            
            {option.label}
          </button>);

      })}
    </div>);

}