import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon } from 'lucide-react';

export function PageHeader({
  title,
  subtitle,
  actions,
  backTo,
  backLabel,
  meta







}: {title: string;subtitle?: string;actions?: React.ReactNode;backTo?: string;backLabel?: string;meta?: React.ReactNode;}) {
  return (
    <header className="border-b border-line bg-white px-8 py-5">
      {backTo &&
      <Link
        to={backTo}
        className="mb-2 inline-flex items-center gap-1 text-[13px] text-muted transition-colors duration-150 ease-out hover:text-ink">
        
          <ChevronLeftIcon className="h-4 w-4" />
          {backLabel ?? 'Back'}
        </Link>
      }
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
          {subtitle && <p className="mt-1 max-w-2xl text-[13px] text-muted">{subtitle}</p>}
          {meta}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </header>);

}