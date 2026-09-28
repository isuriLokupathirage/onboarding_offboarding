import React from 'react';
import { twMerge } from 'tailwind-merge';
import type { FieldState } from '../../types';

const states: FieldState[] = ['Hidden', 'Optional', 'Required'];

const activeStyles: Record<FieldState, string> = {
  Hidden: 'bg-white text-slate-600 shadow-sm',
  Optional: 'bg-white text-sky-700 shadow-sm',
  Required: 'bg-white text-brand-700 shadow-sm'
};

export function StateSegmented({
  value,
  onChange,
  disabled,
  ariaLabel





}: {value: FieldState;onChange: (state: FieldState) => void;disabled?: boolean;ariaLabel: string;}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={twMerge(
        'inline-flex items-center gap-0.5 rounded-lg bg-slate-100 p-0.5',
        disabled && 'opacity-70'
      )}>
      
      {states.map((state) => {
        const active = state === value;
        return (
          <button
            key={state}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => !disabled && onChange(state)}
            className={twMerge(
              'h-6 rounded-md px-2 text-[11px] font-medium transition-colors duration-150 ease-out',
              active ? activeStyles[state] : 'text-muted hover:text-ink',
              disabled && 'cursor-not-allowed'
            )}>
            
            {state}
          </button>);

      })}
    </div>);

}