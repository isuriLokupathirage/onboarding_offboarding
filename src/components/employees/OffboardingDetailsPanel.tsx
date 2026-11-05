import { Link } from 'react-router-dom';
import { ArrowUpRightIcon, FileTextIcon } from 'lucide-react';
import type { Transition } from '../../types';
import { Badge } from '../ui/Badge';
import { offboardingMilestones } from '../../data/people';
import { OTHER_EXIT_REASON } from '../../data/exitReasons';
import { formatDate } from '../../utils/format';
import { statusGroup } from '../../utils/transitions';

/**
 * The Offboarding Details tab on an employee record. It reads the exit details from the
 * offboarding transition, so a change made during the transition shows here straight away.
 */
export function OffboardingDetailsPanel({
  transition,
  onOpenDocuments



}: {transition: Transition;onOpenDocuments: () => void;}) {
  const exit = transition.exit;
  if (!exit) return null;
  const completed = statusGroup(transition) === 'Completed';
  const recordedDates = offboardingMilestones.filter((milestone) => exit.dates[milestone]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <section className="rounded-xl border border-line bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[13px] font-semibold text-ink">Exit</h3>
          {completed ?
          <Badge className="bg-slate-100 text-slate-700 ring-slate-200">Offboarded</Badge> :
          <Badge className="bg-amber-50 text-amber-800 ring-amber-200">Offboarding in progress</Badge>
          }
        </div>
        <dl className="mt-3 space-y-2.5">
          <Row label="Offboarding Type" value={exit.type} />
          <Row label="Exit Reason" value={exit.reason} />
          {exit.reason === OTHER_EXIT_REASON && <Row label="Specified Reason" value={exit.otherReason} />}
          <Row label="Template" value={transition.templateName} />
          <Row label="Started" value={formatDate(transition.startedOn)} />
        </dl>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3 text-[12px]">
          <Link
            to={`/onboarding/transitions/${transition.id}`}
            className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline">

            View transition
            <ArrowUpRightIcon className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={onOpenDocuments}
            className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline">

            <FileTextIcon className="h-3.5 w-3.5" />
            {exit.documents.length} offboarding document{exit.documents.length === 1 ? '' : 's'}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-line bg-white p-5">
        <h3 className="text-[13px] font-semibold text-ink">Exit Dates</h3>
        {recordedDates.length > 0 ?
        <dl className="mt-3 space-y-2.5">
            {recordedDates.map((milestone) =>
          <Row key={milestone} label={milestone} value={formatDate(exit.dates[milestone])} />
          )}
          </dl> :

        <p className="mt-3 text-[13px] text-muted">No exit dates were recorded for this offboarding.</p>
        }
      </section>
    </div>);

}

function Row({ label, value }: {label: string;value?: string;}) {
  return (
    <div className="flex flex-wrap gap-x-3">
      <dt className="w-44 shrink-0 text-[13px] text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-[13px] text-ink">{value || '—'}</dd>
    </div>);

}
