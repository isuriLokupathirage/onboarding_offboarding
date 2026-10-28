import React, { useMemo } from 'react';
import { Dialog } from '../ui/Dialog';
import { useAppData } from '../../contexts/AppDataContext';
import { templateTransitions } from '../../utils/library';

/**
 * Confirms deleting one template (`bulk` false) or a selection. A template any transition was started
 * from is never deleted: a bulk delete lists it as skipped. Its tasks stay in the task library.
 */
export function DeleteTemplatesDialog({
  templateIds,
  bulk,
  onCancel,
  onDeleted






}: {templateIds: string[] | null;bulk: boolean;onCancel: () => void;onDeleted: (message: string) => void;}) {
  const { templates, transitions, deleteTemplates } = useAppData();

  const plan = useMemo(() => {
    const chosen = templates.filter((template) => templateIds?.includes(template.id));
    const withUsage = chosen.map((template) => ({
      template,
      used: templateTransitions(template.id, transitions).length
    }));
    return {
      chosen,
      deletable: withUsage.filter((item) => item.used === 0).map((item) => item.template),
      skipped: withUsage.filter((item) => item.used > 0)
    };
  }, [templateIds, templates, transitions]);

  const open = Boolean(templateIds && plan.chosen.length > 0);
  const single = !bulk ? plan.chosen[0] : undefined;
  const count = plan.deletable.length;

  const body = single ?
  plan.skipped.length > 0 ?
  <p>This template cannot be deleted because it has been used to start a transition.</p> :

  <p>
        <span className="font-medium text-ink">{single.name}</span> ({single.code}) will be removed. Its tasks
        stay in the task library, and its template code will not be reused.
      </p> :


  <>
      <p>
        {count === 0 ?
      'None of the selected templates can be deleted.' :
      `${count} template${count === 1 ? '' : 's'} will be removed. Their tasks stay in the task library.`}
      </p>
      {plan.skipped.length > 0 &&
    <div className="mt-3">
          <p className="text-[13px] font-medium text-ink">
            {plan.skipped.length} in-use template{plan.skipped.length === 1 ? '' : 's'} will be skipped:
          </p>
          <ul className="mt-1.5 max-h-36 space-y-1 overflow-y-auto text-[13px]">
            {plan.skipped.map(({ template, used }) =>
        <li key={template.id}>
                <span className="font-mono text-[11px] text-subtle">{template.code}</span>{' '}
                <span className="text-ink">{template.name}</span>{' '}
                <span className="text-muted">
                  · used by {used} transition{used === 1 ? '' : 's'}
                </span>
              </li>
        )}
          </ul>
        </div>
    }
    </>;


  const handleConfirm = () => {
    deleteTemplates(plan.deletable.map((template) => template.id));
    const deleted = `${count} template${count === 1 ? '' : 's'} deleted`;
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
      title={
      single ? `Delete "${single.name}"?` : `Delete ${count} template${count === 1 ? '' : 's'}?`
      }
      body={body}
      confirmLabel="Delete"
      confirmVariant="danger"
      confirmDisabled={count === 0}
      onCancel={onCancel}
      onConfirm={handleConfirm} />);


}
