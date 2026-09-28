import React from 'react';
import { twMerge } from 'tailwind-merge';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
type Size = 'sm' | 'md';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 shadow-sm disabled:bg-brand-200',
  secondary: 'bg-white text-ink ring-1 ring-line hover:bg-slate-50 disabled:text-subtle',
  ghost: 'text-muted hover:bg-slate-100 hover:text-ink',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  link: 'text-brand-600 hover:text-brand-700 underline-offset-4 hover:underline px-0'
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-10 px-4 text-sm'
};

export function Button({ variant = 'secondary', size = 'md', className, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={twMerge(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 ease-out disabled:cursor-not-allowed',
        sizes[size],
        variants[variant],
        className
      )} />);


}