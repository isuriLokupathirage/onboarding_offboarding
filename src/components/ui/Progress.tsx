import React from 'react';
import { twMerge } from 'tailwind-merge';

export function Progress({
  value,
  className,
  tone = 'brand'




}: {value: number;className?: string;tone?: 'brand' | 'emerald' | 'amber';}) {
  const tones = {
    brand: 'bg-brand-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500'
  };
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className={twMerge('h-1.5 w-full overflow-hidden rounded-full bg-slate-200', className)}>
      
      <div
        className={twMerge('h-full rounded-full transition-[width] duration-300 ease-out', tones[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      
    </div>);

}