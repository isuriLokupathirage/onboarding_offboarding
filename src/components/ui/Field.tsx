import React from 'react';
import { twMerge } from 'tailwind-merge';

export function Label({
  htmlFor,
  children,
  required,
  hint





}: {htmlFor?: string;children: React.ReactNode;required?: boolean;hint?: React.ReactNode;}) {
  return (
    <div className="mb-1.5 flex items-center justify-between gap-2">
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink">
        {children}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {hint}
    </div>);

}

const controlBase =
'w-full rounded-lg border border-line bg-white px-3 text-sm text-ink placeholder:text-subtle transition-colors duration-150 ease-out focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50 disabled:text-subtle';

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={twMerge(controlBase, 'h-10', className)} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={twMerge(controlBase, 'min-h-[88px] py-2', className)} />;
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={twMerge(controlBase, 'h-10 appearance-none bg-[length:16px] pr-9', className)}
      style={{
        backgroundImage:
        "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 10px center'
      }}>
      
      {children}
    </select>);

}

export function Checkbox({
  label,
  description,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {label?: React.ReactNode;description?: string;}) {
  return (
    <label
      className={twMerge(
        'flex items-start gap-2.5',
        props.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        className
      )}>
      
      <input
        type="checkbox"
        {...props}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-500 focus:ring-brand-200" />
      
      {(label || description) &&
      <span className="leading-tight">
          {label && <span className="block text-[13px] text-ink">{label}</span>}
          {description && <span className="mt-0.5 block text-xs text-muted">{description}</span>}
        </span>
      }
    </label>);

}

export function FieldGroup({
  label,
  required,
  hint,
  children,
  className






}: {label: string;required?: boolean;hint?: React.ReactNode;children: React.ReactNode;className?: string;}) {
  return (
    <div className={className}>
      <Label required={required} hint={hint}>
        {label}
      </Label>
      {children}
    </div>);

}