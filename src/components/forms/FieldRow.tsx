import React from 'react';
import { LockIcon } from 'lucide-react';
import type { FieldState, FormField } from '../../types';
import { StateSegmented } from '../ui/StateSegmented';
import { Tooltip } from '../ui/Tooltip';
import { LOCK_TOOLTIP } from '../../data/forms';

export function FieldRow({
  field,
  onChange



}: {field: FormField;onChange: (state: FieldState) => void;}) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate text-[13px] text-ink">{field.name}</span>
        <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-subtle">
          {field.dataType}
        </span>
        {field.locked &&
        <Tooltip label={LOCK_TOOLTIP}>
            <span
            tabIndex={0}
            aria-label={LOCK_TOOLTIP}
            className="inline-flex items-center rounded p-0.5 text-subtle">
            
              <LockIcon className="h-3.5 w-3.5" />
            </span>
          </Tooltip>
        }
      </div>
      <StateSegmented
        value={field.state}
        onChange={onChange}
        disabled={field.locked}
        ariaLabel={`Visibility for ${field.name}`} />
      
    </div>);

}