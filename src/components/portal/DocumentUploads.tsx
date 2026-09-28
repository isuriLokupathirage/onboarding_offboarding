import React from 'react';
import { CheckCircle2Icon, UploadCloudIcon, XIcon } from 'lucide-react';
import type { RequiredDocument } from '../../types';

export function DocumentUploads({
  documents,
  uploads,
  onAdd,
  onRemove,
  readOnly = false






}: {documents: RequiredDocument[];uploads: Record<string, string[]>;onAdd: (documentId: string, names: string[]) => void;onRemove: (documentId: string, name: string) => void;readOnly?: boolean;}) {
  return (
    <div className="space-y-3">
      {documents.map((doc) =>
      <div key={doc.id} className="rounded-xl border border-line bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[13px] font-medium text-ink">
                {doc.name}
                {doc.required && <span className="ml-0.5 text-red-500">*</span>}
              </p>
              <p className="mt-0.5 text-[12px] text-muted">
                {doc.type} · {doc.required ? 'Required' : 'Optional'} ·{' '}
                {doc.multiple ? 'Multiple files allowed' : 'Single file'}
              </p>
            </div>
          </div>

          {!readOnly &&
        <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-line bg-slate-50/60 px-6 py-7 text-center transition-colors duration-150 ease-out hover:border-brand-300 hover:bg-brand-50/40">
              <UploadCloudIcon className="h-5 w-5 text-subtle" />
              <span className="mt-2 text-[13px] text-ink">
                Drag and drop, or <span className="text-brand-600">choose a file</span>
              </span>
              <span className="mt-0.5 text-[12px] text-muted">
                PDF, PNG, JPG, JPEG or DOCX up to 25 MB
              </span>
              <input
            type="file"
            multiple={doc.multiple}
            className="hidden"
            onChange={(event) => {
              const names = Array.from(event.target.files ?? []).map((file) => file.name);
              if (names.length > 0) onAdd(doc.id, names);
            }} />
          
            </label>
        }

          {(uploads[doc.id] ?? []).length > 0 &&
        <ul className="mt-2.5 space-y-1.5">
              {(uploads[doc.id] ?? []).map((name, index) =>
          <li
            key={`${name}-${index}`}
            className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[12px] text-ink">
            
                  <CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="flex-1 truncate">{name}</span>
                  {!readOnly &&
            <button
              type="button"
              aria-label={`Remove ${name}`}
              onClick={() => onRemove(doc.id, name)}
              className="rounded p-1 text-subtle transition-colors duration-150 ease-out hover:bg-slate-200 hover:text-ink">
              
                      <XIcon className="h-3 w-3" />
                    </button>
            }
                </li>
          )}
            </ul>
        }
        </div>
      )}
    </div>);

}