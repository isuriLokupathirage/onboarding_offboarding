import React from 'react';
import { SearchIcon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search',
  className





}: {value: string;onChange: (value: string) => void;placeholder?: string;className?: string;}) {
  return (
    <div className={twMerge('relative', className)}>
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-sm text-ink placeholder:text-subtle transition-colors duration-150 ease-out focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
      
    </div>);

}