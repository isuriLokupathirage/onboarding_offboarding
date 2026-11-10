import React, { useState } from 'react';
import {
  CheckCircle2Icon,
  ChevronRightIcon,
  FileTextIcon,
  MessageSquareTextIcon,
  PencilLineIcon,
  SearchXIcon } from
'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { FacetedFilter } from '../ui/FacetedFilter';
import { SearchInput } from '../ui/SearchInput';
import {
  PORTAL_FORM_STATUSES,
  PORTAL_FORM_TYPES,
  filterPortalForms,
  hasPortalFilters,
  type PortalFormItem,
  type PortalFormStatus,
  type PortalFormType } from
'../../utils/portal';
import { formatDate } from '../../utils/format';

const statusStyles: Record<PortalFormStatus, string> = {
  'To complete': 'bg-amber-50 text-amber-700 ring-amber-200',
  Submitted: 'bg-emerald-50 text-emerald-700 ring-emerald-200'
};

const typeIcons: Record<PortalFormType, React.ComponentType<{className?: string;}>> = {
  'Employee Details': FileTextIcon,
  'Exit Feedback': MessageSquareTextIcon
};

/**
 * Portal → My Forms: every form the recipient has been sent, employee details and exit feedback
 * alike, searchable by name and filterable by type and status. Revoked and expired forms are not
 * passed in, and submitted ones are not outstanding.
 */
export function MyFormsList({
  items,
  hasDraft,
  onOpen




}: {items: PortalFormItem[];hasDraft: (item: PortalFormItem) => boolean;onOpen: (item: PortalFormItem) => void;}) {
  const [query, setQuery] = useState('');
  const [types, setTypes] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const filters = { query, types, statuses };
  const shown = filterPortalForms(items, filters);
  const outstanding = items.filter((item) => item.status === 'To complete').length;
  const clearFilters = () => {
    setQuery('');
    setTypes([]);
    setStatuses([]);
  };

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
      <div className="mt-6 flex flex-wrap items-center gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Search forms by name" className="w-full sm:w-72" />
          <FacetedFilter
          title="Type"
          options={PORTAL_FORM_TYPES.map((type) => ({
            value: type,
            label: type,
            count: items.filter((item) => item.type === type).length
          }))}
          selected={types}
          onChange={setTypes}
          searchable={false} />

          <FacetedFilter
          title="Status"
          options={PORTAL_FORM_STATUSES.map((status) => ({
            value: status,
            label: status,
            count: items.filter((item) => item.status === status).length
          }))}
          selected={statuses}
          onChange={setStatuses}
          searchable={false} />

          {hasPortalFilters(filters) &&
        <Button size="sm" variant="ghost" onClick={clearFilters}>
              Clear filters
            </Button>
        }
        </div>
      }

      {items.length > 0 && shown.length === 0 &&
      <div className="mt-4">
          <EmptyState
          icon={SearchXIcon}
          title="No forms match your search"
          description="Try a different name, or clear the filters to see all your forms."
          action={<Button size="sm" onClick={clearFilters}>Clear filters</Button>} />

        </div>
      }

      {shown.length > 0 &&
      <ul className="mt-4 divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
          {shown.map((item) => {
          const submitted = item.status === 'Submitted';
          const draft = !submitted && hasDraft(item);
          const partsIn = submitted ? 0 : Object.keys(item.submittedParts).length;
          const TypeIcon = typeIcons[item.type];
          return (
            <li key={item.id}>
                <button
                type="button"
                onClick={() => onOpen(item)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors duration-150 ease-out hover:bg-slate-50">

                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 ring-1 ring-inset ring-brand-200">
                    <TypeIcon className="h-4 w-4 text-brand-600" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-ink">{item.formName}</span>
                    <span className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[12px] text-muted">
                      <span>{item.type}</span>
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
