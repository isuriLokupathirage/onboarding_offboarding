import React, { useMemo } from 'react';
import { Dialog } from '../ui/Dialog';
import { useAppData } from '../../contexts/AppDataContext';
import { taskUsage, taskUsageLabel } from '../../utils/library';

/**
 * Confirms deleting one task (`bulk` false) or a selection. Tasks in use are never deleted: a bulk
 * delete lists them as skipped. Child tasks of a deleted parent stay in the library without a parent,
 * and lose any "parent task completion is required" setting.
 */
export function DeleteTasksDialog({
  taskIds,
  bulk,
  onCancel,
  onDeleted






}: {taskIds: string[] | null;bulk: boolean;onCancel: () => void;onDeleted: (message: string) => void;}) {
  const { tasks, templates, transitions, deleteTasks } = useAppData();

  const plan = useMemo(() => {
    const chosen = tasks.filter((task) => taskIds?.includes(task.id));
    const withUsage = chosen.map((task) => ({ task, usage: taskUsage(task.id, templates, transitions) }));
    const deletable = withUsage.filter((item) => !item.usage.inUse).map((item) => item.task);
    const skipped = withUsage.filter((item) => item.usage.inUse);
    const deletableIds = deletable.map((task) => task.id);
    // Children that are not being deleted themselves are left without a parent.
    const orphans = tasks.filter(
      (task) => task.parentId && deletableIds.includes(task.parentId) && !deletableIds.includes(task.id)
    );
    const requiring = orphans.filter((task) => task.parentCompletionRequired);
    return { chosen, deletable, skipped, orphans, requiring };
  }, [taskIds, tasks, templates, transitions]);

  const open = Boolean(taskIds && plan.chosen.length > 0);
  const single = !bulk ? plan.chosen[0] : undefined;
  const count = plan.deletable.length;

  const childNote =
  plan.orphans.length > 0 &&
  <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2.5 text-[13px] text-amber-900 ring-1 ring-inset ring-amber-200">
      <p>
        {single ? 'This task has' : 'The tasks being deleted have'} {plan.orphans.length} child task
        {plan.orphans.length === 1 ? '' : 's'}: {plan.orphans.map((task) => task.name).join(', ')}.{' '}
        {plan.orphans.length === 1 ? 'It' : 'They'} will stay in the task library without a parent.
      </p>
      {plan.requiring.length > 0 &&
    <p className="mt-1.5">
          {plan.requiring.length} of them require{plan.requiring.length === 1 ? 's' : ''} parent task
          completion — that requirement will be removed.
        </p>
    }
    </div>;


  const body = single ?
  plan.skipped.length > 0 ?
  <p>
        This task cannot be deleted. {taskUsageLabel(plan.skipped[0].usage)}.
      </p> :

  <>
        <p>
          <span className="font-medium text-ink">{single.name}</span> ({single.code}) will be removed from
          the task library. Its task code will not be reused.
        </p>
        {childNote}
      </> :


  <>
      <p>
        {count === 0 ?
      'None of the selected tasks can be deleted.' :
      `${count} task${count === 1 ? '' : 's'} will be removed from the task library.`}
      </p>
      {plan.skipped.length > 0 &&
    <div className="mt-3">
          <p className="text-[13px] font-medium text-ink">
            {plan.skipped.length} in-use task{plan.skipped.length === 1 ? '' : 's'} will be skipped:
          </p>
          <ul className="mt-1.5 max-h-36 space-y-1 overflow-y-auto text-[13px]">
            {plan.skipped.map(({ task, usage }) =>
        <li key={task.id}>
                <span className="font-mono text-[11px] text-subtle">{task.code}</span>{' '}
                <span className="text-ink">{task.name}</span>{' '}
                <span className="text-muted">· {taskUsageLabel(usage)}</span>
              </li>
        )}
          </ul>
        </div>
    }
      {childNote}
    </>;


  const handleConfirm = () => {
    deleteTasks(plan.deletable.map((task) => task.id));
    const deleted = `${count} task${count === 1 ? '' : 's'} deleted`;
    onDeleted(
      single ?
      `"${single.name}" was deleted.` :
      plan.skipped.length > 0 ?
      `${deleted}, ${plan.skipped.length} skipped because ${plan.skipped.length === 1 ? 'it is' : 'they are'} in use.` :
      `${deleted}.`
    );
  };

  return (
    <Dialog
      open={open}
      title={single ? `Delete "${single.name}"?` : `Delete ${count} task${count === 1 ? '' : 's'}?`}
      body={body}
      confirmLabel="Delete"
      confirmVariant="danger"
      confirmDisabled={count === 0}
      onCancel={onCancel}
      onConfirm={handleConfirm} />);


}
