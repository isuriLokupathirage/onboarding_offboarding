import React, { useState } from 'react';
import { CheckCircle2Icon } from 'lucide-react';
import type { EmployeeForm } from '../../types';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { DocumentUploads } from '../../components/portal/DocumentUploads';

export function PortalDocuments({ form }: {form: EmployeeForm;}) {
  const [uploads, setUploads] = useState<Record<string, string[]>>({});
  const [confirming, setConfirming] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  return (
    <section>
      <h2 className="text-2xl font-semibold tracking-tight text-ink">Upload Your Documents</h2>
      <p className="mt-1.5 text-[13px] text-muted">
        Accepted formats are PDF, PNG, JPG, JPEG and DOCX, up to 25 MB per field. You can save what you
        have uploaded and come back later.
      </p>

      {submitted &&
      <div className="mt-5 flex items-center gap-2.5 rounded-lg bg-emerald-50 px-4 py-3 text-[13px] text-emerald-900 ring-1 ring-inset ring-emerald-200">
          <CheckCircle2Icon className="h-4 w-4" />
          Your documents have been sent to HR.
        </div>
      }
      {draftSaved && !submitted &&
      <div className="mt-5 rounded-lg bg-sky-50 px-4 py-3 text-[13px] text-sky-900 ring-1 ring-inset ring-sky-200">
          Draft saved. Your uploads are kept against this link until you submit.
        </div>
      }

      <div className="mt-6">
        <DocumentUploads
          documents={form.documents}
          uploads={uploads}
          readOnly={submitted}
          onAdd={(docId, names) =>
          setUploads((prev) => ({ ...prev, [docId]: [...(prev[docId] ?? []), ...names] }))
          }
          onRemove={(docId, name) =>
          setUploads((prev) => ({
            ...prev,
            [docId]: (prev[docId] ?? []).filter((item) => item !== name)
          }))
          } />
        
      </div>

      {!submitted &&
      <div className="mt-6 flex justify-end gap-2">
          <Button
          onClick={() => {
            setDraftSaved(true);
            window.setTimeout(() => setDraftSaved(false), 4000);
          }}>
          
            Save as Draft
          </Button>
          <Button variant="primary" onClick={() => setConfirming(true)}>
            Submit Documents
          </Button>
        </div>
      }

      <Dialog
        open={confirming}
        title="Submit Documents"
        body="Your documents will be sent to HR and cannot be edited afterwards."
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          setSubmitted(true);
        }} />
      
    </section>);

}