import React from 'react';
import { FilesIcon, InfoIcon } from 'lucide-react';
import type { EmployeeForm } from '../../types';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';

export function DocumentsSummary({ form }: {form: EmployeeForm;}) {
  if (form.documents.length === 0) {
    return (
      <EmptyState
        icon={FilesIcon}
        title="No documents are requested"
        description="The recipient is not asked to upload anything on this form." />);


  }

  return (
    <div>
      <div className="flex items-start gap-2.5 rounded-lg bg-slate-50 px-3.5 py-3 ring-1 ring-inset ring-line">
        <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-subtle" />
        <p className="text-[13px] leading-relaxed text-muted">
          Accepted formats are PDF, PNG, JPG, JPEG and DOCX, up to 25 MB per field.
        </p>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-line bg-white">
        <div className="grid grid-cols-12 gap-4 border-b border-line bg-slate-50/70 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-subtle">
          <span className="col-span-5">Document name</span>
          <span className="col-span-3">Type</span>
          <span className="col-span-2">Requirement</span>
          <span className="col-span-2">Files</span>
        </div>
        <ul className="divide-y divide-line">
          {form.documents.map((doc) =>
          <li key={doc.id} className="grid grid-cols-12 items-center gap-4 px-5 py-3">
              <span className="col-span-5 text-[13px] font-medium text-ink">{doc.name}</span>
              <span className="col-span-3 text-[13px] text-muted">{doc.type}</span>
              <span className="col-span-2">
                <Badge
                className={
                doc.required ?
                'bg-brand-50 text-brand-700 ring-brand-200' :
                'bg-sky-50 text-sky-700 ring-sky-200'
                }>
                
                  {doc.required ? 'Required' : 'Optional'}
                </Badge>
              </span>
              <span className="col-span-2 text-[13px] text-muted">
                {doc.multiple ? 'Multiple files' : 'Single file'}
              </span>
            </li>
          )}
        </ul>
      </div>
    </div>);

}