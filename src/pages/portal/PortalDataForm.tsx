import React, { useState } from 'react';
import { CheckCircle2Icon } from 'lucide-react';
import type { EmployeeForm } from '../../types';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { CandidateFormRenderer } from '../../components/forms/CandidateFormRenderer';

export function PortalDataForm({ form }: {form: EmployeeForm;}) {
  const [maritalStatus, setMaritalStatus] = useState<'Single' | 'Married'>('Single');
  const [confirming, setConfirming] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  return (
    <section>
      <h2 className="text-2xl font-semibold tracking-tight text-ink">Let&apos;s Get To Know You Better</h2>
      <p className="mt-1.5 max-w-2xl text-[13px] text-muted">
        Fill in the details below so we can set up your employment records before your first day. Fields
        marked with an asterisk are required.
      </p>

      {submitted &&
      <div className="mt-5 flex items-center gap-2.5 rounded-lg bg-emerald-50 px-4 py-3 text-[13px] text-emerald-900 ring-1 ring-inset ring-emerald-200">
          <CheckCircle2Icon className="h-4 w-4" />
          Your details have been sent to HR.
        </div>
      }
      {draftSaved && !submitted &&
      <div className="mt-5 rounded-lg bg-sky-50 px-4 py-3 text-[13px] text-sky-900 ring-1 ring-inset ring-sky-200">
          Draft saved. You can come back to this page any time before you submit.
        </div>
      }

      <div className="mt-6">
        <CandidateFormRenderer
          form={form}
          maritalStatus={maritalStatus}
          onMaritalStatusChange={setMaritalStatus} />
        
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button
          onClick={() => {
            setDraftSaved(true);
            window.setTimeout(() => setDraftSaved(false), 4000);
          }}>
          
          Save as Draft
        </Button>
        <Button variant="primary" onClick={() => setConfirming(true)}>
          Submit Details
        </Button>
      </div>

      <Dialog
        open={confirming}
        title="Submit Details"
        body="Your details will be sent to HR and cannot be edited afterwards."
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          setSubmitted(true);
        }} />
      
    </section>);

}