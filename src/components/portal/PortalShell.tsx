import React from 'react';
import { CalendarClockIcon } from 'lucide-react';
import { formatDate } from '../../utils/format';

export interface PortalTab {
  value: string;
  label: string;
}

export function PortalShell({
  recipientName,
  subtitle,
  greeting,
  expiresAt,
  tabs,
  activeTab,
  onTabChange,
  illustration = false,
  children










}: {recipientName: string;subtitle?: string;greeting?: string;expiresAt?: string;tabs: PortalTab[];activeTab: string;onTabChange: (value: string) => void;illustration?: boolean;children: React.ReactNode;}) {
  return (
    <div className="min-h-full w-full bg-white">
      <div className="relative overflow-hidden border-b border-line bg-brand-50/50">
        {illustration &&
        <img
          src="/35d8c234-bc83-4490-b722-3e0a5cb9616a.jpg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-6 -top-10 hidden h-64 w-64 object-contain opacity-90 md:block" />

        }
        <div className="relative mx-auto max-w-4xl px-6 pb-4 pt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">
                A
              </span>
              <span className="text-sm font-semibold text-ink">Accxis 360</span>
            </div>
            {expiresAt &&
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[12px] text-muted ring-1 ring-inset ring-line">
                <CalendarClockIcon className="h-3.5 w-3.5 text-subtle" />
                This link expires on {formatDate(expiresAt)}
              </span>
            }
          </div>

          {greeting && <p className="mt-6 text-[13px] text-brand-700">{greeting}</p>}
          <h1 className="mt-1 text-lg font-semibold tracking-tight text-ink">{recipientName}</h1>
          {subtitle && <p className="mt-1 max-w-xl text-[13px] text-muted">{subtitle}</p>}

          <nav className="mt-6 flex flex-wrap items-center gap-1" aria-label="Portal sections">
            {tabs.map((tab) => {
              const active = tab.value === activeTab;
              return (
                <button
                  key={tab.value}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => onTabChange(tab.value)}
                  className={`-mb-px rounded-t-lg border px-4 py-2.5 text-[13px] font-medium transition-colors duration-150 ease-out ${
                  active ?
                  'border-line border-b-white bg-white text-ink' :
                  'border-transparent text-muted hover:bg-white/60 hover:text-ink'}`
                  }>
                  
                  {tab.label}
                </button>);

            })}
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-10">{children}</div>

      <footer className="mx-auto max-w-4xl px-6 pb-10">
        <p className="border-t border-line pt-5 text-[12px] text-muted">
          Need help? Email people@accxis.lk or call +94 11 234 5678.
        </p>
      </footer>
    </div>);

}