import React from 'react';
import { CheckIcon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export function WizardSteps({
  steps,
  current



}: {steps: string[];current: number;}) {
  return (
    <ol className="flex items-center gap-3">
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={step} className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className={twMerge(
                  'inline-flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-semibold transition-colors duration-150 ease-out',
                  done && 'bg-brand-500 text-white',
                  active && 'bg-brand-50 text-brand-700 ring-1 ring-brand-300',
                  !done && !active && 'bg-slate-100 text-subtle'
                )}>
                
                {done ? <CheckIcon className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span
                className={twMerge(
                  'text-[13px]',
                  active ? 'font-medium text-ink' : done ? 'text-ink' : 'text-subtle'
                )}>
                
                {step}
              </span>
            </div>
            {index < steps.length - 1 && <span className="h-px w-10 bg-line" aria-hidden="true" />}
          </li>);

      })}
    </ol>);

}