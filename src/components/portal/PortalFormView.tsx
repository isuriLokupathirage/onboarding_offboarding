import React, { useState } from 'react';
import { AlertCircleIcon, ArrowLeftIcon, CheckCircle2Icon, LockIcon } from 'lucide-react';
import type { EmployeeForm, SubmittedDocument } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { DocumentUploads } from './DocumentUploads';
import {
  CandidateFormRenderer,
  formHasFields,
  missingRequiredFields } from
'../forms/CandidateFormRenderer';
import type { PortalFormItem } from '../../utils/portal';
import { formatDate, formatDateTime } from '../../utils/format';

type Status = 'Single' | 'Married';

function toSubmittedDocuments(form: EmployeeForm, uploads: Record<string, string[]>): SubmittedDocument[] {
  return form.documents.flatMap((doc) =>
  (uploads[doc.id] ?? []).map((fileName) => ({ name: doc.name, fileName }))
  );
}

/**
 * One form inside the portal. Shows its Employee Details and Required Documents together,
 * with Save as Draft and Submit. A submitted form is shown read-only.
 */
export function PortalFormView({
  form,
  item,
  initialValues,
  initialUploads,
  draftSavedAt,
  prefilled,
  confirmBody,
  onSaveDraft,
  onSubmit,
  onBack











}: {form: EmployeeForm;item: PortalFormItem;initialValues: Record<string, string>;initialUploads: Record<string, string[]>;draftSavedAt?: string | null;prefilled?: Record<string, string>;confirmBody: string;onSaveDraft: (values: Record<string, string>, uploads: Record<string, string[]>) => void;onSubmit: (values: Record<string, string>, documents: SubmittedDocument[]) => void;onBack: () => void;}) {
  const readOnly = item.status === 'Submitted';
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [uploads, setUploads] = useState<Record<string, string[]>>(initialUploads);
  const [savedAt, setSavedAt] = useState<string | null>(draftSavedAt ?? null);
  const [missing, setMissing] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);

  const maritalStatus: Status = values.marital === 'Married' ? 'Married' : 'Single';
  const showDetails = formHasFields(form);
  const showDocuments = form.documents.length > 0;

  const findMissing = () => [
  ...(showDetails ? missingRequiredFields(form, values, maritalStatus) : []),
  ...form.documents.
  filter((doc) => doc.required && (uploads[doc.id] ?? []).length === 0).
  map((doc) => doc.name)];


  const handleSubmit = () => {
    const gaps = findMissing();
    setMissing(gaps);
    if (gaps.length === 0) setConfirming(true);
  };

  const handleSaveDraft = () => {
    onSaveDraft(values, uploads);
    setSavedAt(new Date().toISOString());
  };

  const filled = () =>
  Object.fromEntries(Object.entries(values).filter(([, value]) => value.trim() !== ''));

  return (
    <section>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[13px] text-muted transition-colors duration-150 ease-out hover:bg-slate-100 hover:text-ink">

        <ArrowLeftIcon className="h-3.5 w-3.5" />
        All forms
      </button>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">{form.name}</h2>
          <p className="mt-1.5 text-[13px] text-muted">
            Sent {formatDate(item.sentAt)} ·{' '}
            {readOnly ?
            `Submitted ${formatDateTime(item.submittedAt)}` :
            `Complete by ${formatDate(item.expiresAt)}`}
          </p>
        </div>
        <Badge
          className={
          readOnly ?
          'bg-emerald-50 text-emerald-700 ring-emerald-200' :
          'bg-amber-50 text-amber-700 ring-amber-200'
          }>

          {item.status}
        </Badge>
      </div>

      {readOnly &&
      <div className="mt-5 flex items-start gap-2.5 rounded-lg bg-emerald-50 px-4 py-3 text-[13px] text-emerald-900 ring-1 ring-inset ring-emerald-200">
          <LockIcon className="mt-0.5 h-4 w-4 shrink-0" />
          You submitted this form on {formatDateTime(item.submittedAt)}. It has been sent to HR and can no
          longer be edited.
        </div>
      }

      {!readOnly && savedAt &&
      <div
        role="status"
        className="mt-5 flex items-start gap-2.5 rounded-lg bg-sky-50 px-4 py-3 text-[13px] text-sky-900 ring-1 ring-inset ring-sky-200">

          <CheckCircle2Icon className="mt-0.5 h-4 w-4 shrink-0" />
          Draft saved {formatDateTime(savedAt)}. Nothing is sent to HR until you submit. The form still
          closes on {formatDate(item.expiresAt)}.
        </div>
      }

      {missing.length > 0 &&
      <div
        role="alert"
        className="mt-5 flex items-start gap-2.5 rounded-lg bg-red-50 px-4 py-3 text-[13px] text-red-900 ring-1 ring-inset ring-red-200">

          <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Complete the required items before submitting</p>
            <ul className="mt-1 list-disc pl-4 text-red-900/90">
              {missing.map((name) =>
            <li key={name}>{name}</li>
            )}
            </ul>
          </div>
        </div>
      }

      {showDetails &&
      <div className="mt-8">
          <h3 className="text-base font-semibold text-ink">Employee Details</h3>
          {!readOnly &&
        <p className="mt-1 text-[13px] text-muted">Fields marked with an asterisk are required.</p>
        }
          <div className="mt-4">
            <CandidateFormRenderer
            form={form}
            readOnly={readOnly}
            maritalStatus={maritalStatus}
            onMaritalStatusChange={(status) => setValues((prev) => ({ ...prev, marital: status }))}
            values={values}
            onValueChange={(key, value) => setValues((prev) => ({ ...prev, [key]: value }))}
            prefilled={prefilled} />

          </div>
        </div>
      }

      {showDocuments &&
      <div className="mt-8">
          <h3 className="text-base font-semibold text-ink">Required Documents</h3>
          {!readOnly &&
        <p className="mt-1 text-[13px] text-muted">
              Accepted formats are PDF, PNG, JPG, JPEG and DOCX, up to 25 MB per field.
            </p>
        }
          <div className="mt-4">
            <DocumentUploads
            documents={form.documents}
            uploads={uploads}
            readOnly={readOnly}
            onAdd={(docId, names) =>
            setUploads((prev) => ({ ...prev, [docId]: [...(prev[docId] ?? []), ...names] }))
            }
            onRemove={(docId, name) =>
            setUploads((prev) => ({
              ...prev,
              [docId]: (prev[docId] ?? []).filter((file) => file !== name)
            }))
            } />

          </div>
        </div>
      }

      {!readOnly &&
      <div className="mt-8 flex justify-end gap-2 border-t border-line pt-5">
          <Button onClick={handleSaveDraft}>Save as Draft</Button>
          <Button variant="primary" onClick={handleSubmit}>
            Submit
          </Button>
        </div>
      }

      <Dialog
        open={confirming}
        title={`Submit ${form.name}?`}
        body={confirmBody}
        confirmLabel="Submit"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          onSubmit(filled(), toSubmittedDocuments(form, uploads));
        }} />

    </section>);

}
