import React from 'react';
import { CheckCircle2Icon, ChevronRightIcon, FileTextIcon, PencilLineIcon } from 'lucide-react';
import { Badge } from '../ui/Badge';
import type { PortalFormItem, PortalFormStatus } from '../../utils/portal';
import { formatDate } from '../../utils/format';

const statusStyles: Record<PortalFormStatus, string> = {
  'To complete': 'bg-amber-50 text-amber-700 ring-amber-200',
  Submitted: 'bg-emerald-50 text-emerald-700 ring-emerald-200'
};

export function MyFormsList({
  items,
  hasDraft,
  onOpen




}: {items: PortalFormItem[];hasDraft: (item: PortalFormItem) => boolean;onOpen: (item: PortalFormItem) => void;}) {
  const outstanding = items.filter((item) => item.status === 'To complete').length;

  return (
    <section>
      <h2 className="text-2xl font-semibold tracking-tight text-ink">My Forms</h2>
      <p className="mt-1.5 max-w-2xl text-[13px] text-muted">
        Every form you have been asked to complete is listed here. Each one is saved, submitted and
        closes on its own date, so you can finish them in any order.
      </p>

      {outstanding === 0 &&
      <div className="mt-6 flex items-start gap-3 rounded-xl bg-emerald-50 px-4 py-3.5 ring-1 ring-inset ring-emerald-200">
          <CheckCircle2Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <div>
            <p className="text-[13px] font-medium text-emerald-900">You're all caught up</p>
            <p className="mt-0.5 text-[13px] text-emerald-900/80">
              There is nothing for you to complete right now. We'll email you if a new form is sent.
            </p>
          </div>
        </div>
      }

      {items.length > 0 &&
      <ul className="mt-6 divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
          {items.map((item) => {
          const submitted = item.status === 'Submitted';
          const draft = !submitted && hasDraft(item);
          const partsIn = submitted ? 0 : Object.keys(item.submittedParts).length;
          return (
            <li key={item.id}>
                <button
                type="button"
                onClick={() => onOpen(item)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors duration-150 ease-out hover:bg-slate-50">

                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 ring-1 ring-inset ring-brand-200">
                    <FileTextIcon className="h-4 w-4 text-brand-600" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-ink">{item.formName}</span>
                    <span className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[12px] text-muted">
                      <span>Sent {formatDate(item.sentAt)}</span>
                      {submitted ?
                    <span>Submitted {formatDate(item.submittedAt)}</span> :

                    <span>Expires {formatDate(item.expiresAt)}</span>
                    }
                      {partsIn > 0 &&
                    <span className="text-emerald-700">{partsIn} of 2 sections submitted</span>
                    }
                      {draft &&
                    <span className="inline-flex items-center gap-1 text-sky-700">
                          <PencilLineIcon className="h-3 w-3" />
                          Draft saved
                        </span>
                    }
                    </span>
                  </span>
                  <Badge className={statusStyles[item.status]}>{item.status}</Badge>
                  <ChevronRightIcon className="h-4 w-4 shrink-0 text-subtle" />
                </button>
              </li>);

        })}
        </ul>
      }
    </section>);

}
