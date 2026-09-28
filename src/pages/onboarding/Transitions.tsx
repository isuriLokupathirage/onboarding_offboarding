import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDaysIcon, PlusIcon, UsersIcon } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Segmented } from '../../components/ui/Segmented';
import { SearchInput } from '../../components/ui/SearchInput';
import { Avatar, AvatarGroup } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Progress } from '../../components/ui/Progress';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAppData } from '../../contexts/AppDataContext';
import { peopleById } from '../../data/people';
import { formatDate } from '../../utils/format';

type Filter = 'all' | 'Onboarding' | 'Offboarding';

export function Transitions() {
  const navigate = useNavigate();
  const { transitions } = useAppData();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return transitions.
    filter((transition) => filter === 'all' || transition.kind === filter).
    filter((transition) => {
      if (!needle) return true;
      const name = `${transition.candidate.firstName} ${transition.candidate.lastName}`.toLowerCase();
      return (
        name.includes(needle) ||
        transition.candidate.position.toLowerCase().includes(needle) ||
        transition.templateName.toLowerCase().includes(needle));

    });
  }, [transitions, filter, query]);

  return (
    <div>
      <PageHeader
        title="Transitions"
        subtitle="Every joiner and leaver currently moving through a template."
        actions={
        <Button variant="primary" onClick={() => navigate('/onboarding/transitions/new')}>
            <PlusIcon className="h-4 w-4" />
            New Transition
          </Button>
        } />
      

      <div className="px-8 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented
            options={[
            { value: 'all', label: 'All', count: transitions.length },
            {
              value: 'Onboarding',
              label: 'Onboarding',
              count: transitions.filter((t) => t.kind === 'Onboarding').length
            },
            {
              value: 'Offboarding',
              label: 'Offboarding',
              count: transitions.filter((t) => t.kind === 'Offboarding').length
            }]
            }
            value={filter}
            onChange={setFilter} />
          
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search by name, role or template"
            className="w-72" />
          
        </div>

        <h2 className="mt-6 text-sm font-semibold text-ink">Active Transitions</h2>

        <div className="mt-3 space-y-2">
          {visible.length === 0 ?
          <EmptyState
            icon={UsersIcon}
            title="No transitions found"
            description="Adjust the filters or start a new transition to see it listed here."
            action={
            <Button variant="primary" size="sm" onClick={() => navigate('/onboarding/transitions/new')}>
                  New Transition
                </Button>
            } /> :


          visible.map((transition) => {
            const done = transition.tasks.filter((task) => task.status === 'Completed').length;
            const progress = Math.round(done / Math.max(1, transition.tasks.length) * 100);
            const fullName = `${transition.candidate.firstName} ${transition.candidate.lastName}`;
            return (
              <article
                key={transition.id}
                className="flex flex-wrap items-center gap-5 rounded-xl border border-line bg-white px-5 py-4 shadow-card transition-colors duration-150 ease-out hover:border-slate-300">
                
                  <Avatar name={fullName} size="md" />

                  <div className="min-w-[180px] flex-1">
                    <p className="text-sm font-medium text-ink">{fullName}</p>
                    <p className="text-[12px] text-muted">{transition.candidate.position}</p>
                  </div>

                  <div className="w-36">
                    <span className="inline-flex items-center gap-2 text-[13px] text-ink">
                      <span
                      className={`h-2 w-2 rounded-full ${
                      transition.kind === 'Onboarding' ? 'bg-emerald-500' : 'bg-violet-500'}`
                      }
                      aria-hidden="true" />
                    
                      {transition.kind}
                    </span>
                    {transition.status === 'At Risk' &&
                  <Badge className="mt-1 block w-fit bg-amber-50 text-amber-700 ring-amber-200">
                        At risk
                      </Badge>
                  }
                  </div>

                  <div className="w-48">
                    <p className="truncate text-[13px] text-muted">{transition.templateName}</p>
                  </div>

                  <div className="w-40">
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="text-muted">
                        {done}/{transition.tasks.length}
                      </span>
                      <span className="font-semibold text-ink">{progress}%</span>
                    </div>
                    <Progress value={progress} tone={transition.status === 'At Risk' ? 'amber' : 'brand'} />
                  </div>

                  <div className="w-24">
                    <AvatarGroup
                    names={transition.ownerIds.map((id) => peopleById[id]?.name ?? '')}
                    size="xs" />
                  
                  </div>

                  <div className="w-40 text-[12px]">
                    <p className="inline-flex items-center gap-1.5 font-medium text-ink">
                      <CalendarDaysIcon className="h-3.5 w-3.5 text-subtle" />
                      {transition.daysRemaining} days remaining
                    </p>
                    <p className="mt-0.5 pl-5 text-muted">{formatDate(transition.targetDate)}</p>
                  </div>

                  <Link to={`/onboarding/transitions/${transition.id}`}>
                    <Button size="sm">View Details</Button>
                  </Link>
                </article>);

          })
          }
        </div>
      </div>
    </div>);

}