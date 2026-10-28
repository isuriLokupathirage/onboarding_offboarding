import { useState } from 'react';
import { RefreshCwIcon } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { ActiveTransitions } from '../../components/onboarding/ActiveTransitions';
import { AttentionSummary } from '../../components/onboarding/AttentionSummary';
import { NeedsAttention } from '../../components/onboarding/NeedsAttention';
import { MyTasksSection } from '../../components/onboarding/MyTasksSection';
import { UpcomingTransitions } from '../../components/onboarding/UpcomingTransitions';
import { TaskDetailPanel } from '../../components/tasks/TaskDetailPanel';
import { useAppData } from '../../contexts/AppDataContext';
import { managePermissionFor, statusGroup, visibleKinds } from '../../utils/transitions';
import { attentionEntries, todayKey } from '../../utils/attention';

export function Overview() {
  const {
    transitions: allTransitions,
    oboPermissions,
    hasOboPermission,
    currentUserId,
    updateTaskStatus
  } = useAppData();
  const transitions = allTransitions.filter((t) => statusGroup(t) === 'Active');
  // Refreshing re-reads the data against the current date and time.
  const [refreshedAt, setRefreshedAt] = useState(() => new Date());
  const permittedKinds = visibleKinds(oboPermissions);
  const permitted = transitions.filter((t) => permittedKinds.includes(t.kind));

  const today = todayKey(refreshedAt);
  const canSeeRestricted = hasOboPermission('View Restricted Tasks');
  const attention = attentionEntries(permitted, canSeeRestricted, today);

  // The task open in the side panel, looked up fresh so a status change shows straight away.
  const [openRef, setOpenRef] = useState<{transitionId: string;taskId: string;} | null>(null);
  const openTransition = allTransitions.find((t) => t.id === openRef?.transitionId);
  const openTask = openTransition?.tasks.find((task) => task.id === openRef?.taskId);
  const canUpdateOpenTask = Boolean(
    openTransition &&
    openTask && (
    hasOboPermission(managePermissionFor(openTransition.kind)) ||
    openTask.ownerIds.includes(currentUserId) && hasOboPermission('Update Task Progress'))
  );

  return (
    <div>
      <PageHeader
        title="Dashboard"
        breadcrumb={[{ label: 'Onboarding & Offboarding' }, { label: 'Dashboard' }]}
        actions={
        <>
            <AttentionSummary
            transitions={permitted}
            canSeeRestricted={canSeeRestricted}
            today={today} />

            <button
            type="button"
            aria-label="Refresh dashboard"
            title={`Refresh · updated ${refreshedAt.toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit'
            })}`}
            onClick={() => setRefreshedAt(new Date())}
            className="ml-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-slate-50 text-muted transition-colors duration-150 ease-out hover:bg-slate-100 hover:text-ink focus:outline-none focus:ring-2 focus:ring-brand-200">

              <RefreshCwIcon className="h-4 w-4" />
            </button>
          </>
        } />


      <div className="space-y-6 px-8 py-6">
        <ActiveTransitions transitions={permitted} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <NeedsAttention
            entries={attention}
            onResolve={(entry) =>
            setOpenRef({ transitionId: entry.transition.id, taskId: entry.task.id })
            } />

          <UpcomingTransitions transitions={permitted} today={today} />
        </div>

        {hasOboPermission('Update Task Progress') &&
        <MyTasksSection
          transitions={permitted}
          currentUserId={currentUserId}
          canSeeRestricted={canSeeRestricted}
          today={today}
          onOpenTask={(transition, task) =>
          setOpenRef({ transitionId: transition.id, taskId: task.id })
          }
          onStatusChange={(transition, task, status) =>
          updateTaskStatus(transition.id, task.id, status)
          } />

        }
      </div>

      <TaskDetailPanel
        transition={openTask ? openTransition : undefined}
        task={openTask}
        canUpdate={canUpdateOpenTask}
        onClose={() => setOpenRef(null)}
        onSave={(status) => {
          if (openRef) updateTaskStatus(openRef.transitionId, openRef.taskId, status);
          setOpenRef(null);
        }} />

    </div>);

}
