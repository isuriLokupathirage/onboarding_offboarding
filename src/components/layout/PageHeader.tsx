import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon, PanelLeftCloseIcon, PanelLeftOpenIcon } from 'lucide-react';
import { useSidebarControl } from './AppShell';

export function PageHeader({
  title,
  subtitle,
  actions,
  backTo,
  backLabel,
  meta,
  breadcrumb







}: {title: string;subtitle?: string;actions?: React.ReactNode;backTo?: string;backLabel?: string;meta?: React.ReactNode;breadcrumb?: {label: string;to?: string;}[];}) {
  const sidebar = useSidebarControl();

  // With a breadcrumb the header is a slim top bar: sidebar toggle, trail, then actions.
  if (breadcrumb) {
    const ToggleIcon = sidebar?.open ? PanelLeftCloseIcon : PanelLeftOpenIcon;
    return (
      <header className="flex min-h-[60px] flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line bg-white px-6 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          {sidebar &&
          <>
              <button
              type="button"
              onClick={sidebar.toggle}
              aria-label={sidebar.open ? 'Hide sidebar' : 'Show sidebar'}
              className="rounded-md p-1.5 text-ink transition-colors duration-150 ease-out hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-200">

                <ToggleIcon className="h-4 w-4" />
              </button>
              <span className="h-5 w-px bg-line" aria-hidden="true" />
            </>
          }
          <h1 className="sr-only">{title}</h1>
          <nav aria-label="Breadcrumb" className="min-w-0">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-muted">
              {breadcrumb.map((crumb, index) => {
                const last = index === breadcrumb.length - 1;
                return (
                  <li key={crumb.label} className="inline-flex items-center gap-2">
                    {crumb.to && !last ?
                    <Link to={crumb.to} className="transition-colors duration-150 ease-out hover:text-ink">
                        {crumb.label}
                      </Link> :

                    <span
                      aria-current={last ? 'page' : undefined}
                      className={last ? 'font-medium text-ink' : undefined}>

                        {crumb.label}
                      </span>
                    }
                    {!last && <ChevronRightIcon className="h-4 w-4 text-subtle" />}
                  </li>);

              })}
            </ol>
          </nav>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>);

  }

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