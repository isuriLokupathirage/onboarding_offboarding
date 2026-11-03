import { useEffect, useMemo, useState } from 'react';
import { XIcon } from 'lucide-react';
import type { ExitDetailsDraft, Transition } from '../../types';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { ExitDetailsStep } from './ExitDetailsStep';
import { useAppData } from '../../contexts/AppDataContext';
import { useEmployeeData } from '../../contexts/EmployeeDataContext';
import { offboardingMilestones } from '../../data/people';
import { exitDateUsage, exitDetailsErrors, hasExitErrors } from '../../utils/offboarding';

/**
 * Changes the exit type, reason and dates of an offboarding in progress. Saving updates the
 * transition and the employee record, and records the change in both audit trails.
 */
export function EditExitDetailsDrawer({
  open,
  transition,
  onClose,
  onSaved





}: {open: boolean;transition: Transition;onClose: () => void;onSaved: (changes: string[]) => void;}) {
  const { tasks, updateTransitionExit } = useAppData();
  const { logEmployeeChange } = useEmployeeData();
  const [draft, setDraft] = useState<ExitDetailsDraft | undefined>(transition.exit);
  const [submitted, setSubmitted] = useState(false);

  // Start from the saved details each time the panel opens.
  useEffect(() => {
    if (!open) return;
    setDraft(transition.exit);
    setSubmitted(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // A date stays mandatory while a task in this transition calculates its due date from it.
  const dateUsage = useMemo(
    () =>
    exitDateUsage(
      transition.tasks.flatMap((task) => tasks.filter((libraryTask) => libraryTask.id === task.taskId))
    ),
    [transition.tasks, tasks]
  );

  if (!draft || !transition.exit) return null;
  const required = offboardingMilestones.filter((milestone) => (dateUsage[milestone] ?? 0) > 0);
  const errors = exitDetailsErrors(draft, required);
  const employeeId = transition.exit.employeeId;

  const save = () => {
    setSubmitted(true);
    if (hasExitErrors(errors)) return;
    const changes = updateTransitionExit(transition.id, draft);
    if (changes.length > 0) logEmployeeChange(employeeId, 'Exit details updated', changes.join('; '));
    onSaved(changes);
  };

  return (
    <Drawer open={open} label="Edit exit details" onClose={onClose}>
      <div className="flex items-start justify-between gap-3 border-b border-line px-6 py-5">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-ink">Edit exit details</h2>
          <p className="mt-1 text-[13px] text-muted">
            Changes update the employee record. Due dates still calculated from an exit date are recalculated.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-lg p-1.5 text-subtle transition-colors duration-150 ease-out hover:bg-slate-100 hover:text-ink">

          <XIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="scroll-thin flex-1 overflow-y-auto px-6 py-5">
        <ExitDetailsStep
          exit={draft}
          onChange={setDraft}
          dateUsage={dateUsage}
          templateName="this transition"
          errors={errors}
          showErrors={submitted}
          showDocuments={false}
          compact />

      </div>

      <div className="flex items-center justify-end gap-2 border-t border-line px-6 py-4">
        {submitted && hasExitErrors(errors) &&
        <p className="mr-auto text-[12px] text-red-600">Complete the highlighted fields.</p>
        }
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={save}>
          Save changes
        </Button>
      </div>
    </Drawer>);

}
