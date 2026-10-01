import React from 'react';
import { CalendarClockIcon } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatShortDate } from '../../utils/format';

const events = [
{ id: 'e1', name: 'First Day Orientation', date: '2026-10-01', detail: '9.00 a.m. · Level 4 Training Room' },
{ id: 'e2', name: 'IT Setup Session', date: '2026-10-01', detail: '1.30 p.m. · IT Ops Desk' },
{ id: 'e3', name: 'Security Training', date: '2026-10-07', detail: '10.00 a.m. · Level 2 Meeting Room' }];


export function PortalEvents({ empty }: {empty: boolean;}) {
  return (
    <section>
      <h2 className="text-2xl font-semibold tracking-tight text-ink">My Schedule</h2>
      <p className="mt-1.5 text-[13px] text-muted">
        These are the sessions your team has scheduled for your first days. We will email you if anything changes.
      </p>

      {empty ?
      <div className="mt-6">
          <EmptyState
          icon={CalendarClockIcon}
          title="No events scheduled yet"
          description="Your onboarding team will add sessions here as soon as your first week is planned." />
        
        </div> :

      <ul className="mt-6 flex flex-wrap gap-4">
          {events.map((event) => {
          const { day, month } = formatShortDate(event.date);
          return (
            <li
              key={event.id}
              className="w-56 rounded-xl border border-line bg-white p-4 shadow-card">
              
                <div className="flex h-16 w-16 flex-col items-center justify-center rounded-xl bg-brand-50 ring-1 ring-inset ring-brand-200">
                  <span className="text-xl font-semibold leading-none text-brand-700">{day}</span>
                  <span className="mt-1 text-[11px] font-medium tracking-wide text-brand-600">
                    {month}
                  </span>
                </div>
                <p className="mt-3 text-[13px] font-medium text-ink">{event.name}</p>
                <p className="mt-1 text-[12px] text-muted">{event.detail}</p>
              </li>);

        })}
        </ul>
      }
    </section>);

}