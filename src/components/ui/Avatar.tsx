import React from 'react';
import { twMerge } from 'tailwind-merge';
import { avatarColor, initials } from '../../data/people';

export function Avatar({
  name,
  size = 'sm',
  className




}: {name: string;size?: 'xs' | 'sm' | 'md' | 'lg';className?: string;}) {
  const sizes = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-7 w-7 text-[11px]',
    md: 'h-9 w-9 text-xs',
    lg: 'h-12 w-12 text-sm'
  };
  return (
    <span
      title={name}
      aria-hidden="true"
      className={twMerge(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-2 ring-white',
        sizes[size],
        avatarColor(name),
        className
      )}>
      
      {initials(name)}
    </span>);

}

export function AvatarGroup({
  names,
  max = 3,
  size = 'sm'




}: {names: string[];max?: number;size?: 'xs' | 'sm' | 'md';}) {
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  return (
    <span className="flex items-center" aria-label={names.join(', ')}>
      <span className="flex -space-x-2">
        {shown.map((name) =>
        <Avatar key={name} name={name} size={size} />
        )}
      </span>
      {rest > 0 && <span className="ml-2 text-xs font-medium text-muted">+{rest}</span>}
    </span>);

}