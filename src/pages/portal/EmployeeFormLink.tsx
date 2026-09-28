import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2Icon, LinkIcon, UnlinkIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { PortalShell, type PortalTab } from '../../components/portal/PortalShell';
import { PortalMessage } from '../../components/portal/PortalMessage';
import { DocumentUploads } from '../../components/portal/DocumentUploads';
import {
  CandidateFormRenderer,
  formHasFields } from
'../../components/forms/CandidateFormRenderer';
import { useAppData } from '../../contexts/AppDataContext';
import { useEmployeeData } from '../../contexts/EmployeeDataContext';
import { formatDateTime } from '../../utils/format';
import { useScreenInit } from '../../useScreenInit.js';

export function EmployeeFormLink() {
  const { assignmentId } = useParams();
  const { forms } = useAppData();
  const { assignments, employees, saveDraft, submitAssignment } = useEmployeeData();

  const assignment = assignments.find((item) => item.id === assignmentId);
  const employee = employees.find((item) => item.id === assignment?.employeeId);
  const form = forms.find((item) => item.id === assignment?.formId);

  const prefilled = useMemo(() => ({ ...(employee?.record ?? {}) }), [employee]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [uploads, setUploads] = useState<Record<string, string[]>>({});
  const [maritalStatus, setMaritalStatus] = useState<'Single' | 'Married'>('Single');
  const [confirming, setConfirming] = useState<'form' | 'documents' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const tabs = useMemo<PortalTab[]>(() => {
    const list: PortalTab[] = [];
    if (form && formHasFields(form)) list.push({ value: 'form', label: 'Employee Data Form' });
    if (form && form.documents.length > 0)
    list.push({ value: 'documents', label: 'Required Documents' });
    return list;
  }, [form]);

  const screenInit = useScreenInit();
  const [tab, setTab] = useState<string>(screenInit.tab ?? 'form');

  useEffect(() => {
    if (tabs.length > 0 && !tabs.some((item) => item.value === tab)) setTab(tabs[0].value);
  }, [tabs, tab]);

  useEffect(() => {
    if (!assignment || !employee) return;
    setValues({ ...employee.record, ...assignment.responses });
    setUploads({ ...assignment.documentDrafts });
    setMaritalStatus(
      (assignment.responses.marital ?? employee.record.marital) === 'Married' ? 'Married' : 'Single'
    );
  }, [assignment?.id, employee?.id]);

  const labels = useMemo(() => {
    const map: Record<string, string> = {};
    form?.sections.forEach((section) => {
      section.fields.forEach((field) => {
        map[field.id] = field.name;
      });
      (section.conditionalGroups ?? []).forEach((group) => {
        ;[...group.fields, ...(group.repeating?.fields ?? [])].forEach((field) => {
          map[field.id] = field.name;
        });
      });
    });
    return map;
  }, [form]);

  if (!assignment || !employee || !form) {
    return (
      <PortalMessage
        icon={LinkIcon}
        title="This link is not valid"
        body="The link you followed does not match a form we have on record. It may have been replaced by a newer one." />);


  }

  const employeeName = `${employee.firstName} ${employee.lastName}`;

  // Revoked and expired links share one neutral screen. It names no employee or form,
  // because a closed link may have been forwarded to someone else.
  if (assignment.status === 'Revoked' || assignment.status === 'Expired') {
    return (
      <PortalMessage
        icon={UnlinkIcon}
        title="This form is no longer available"
        body="This link can't be used any more. If you still need to complete this form, contact your HR team and they'll send you a new link." />);


  }

  if (assignment.status === 'Submitted') {
    return (
      <PortalMessage
        icon={CheckCircle2Icon}
        tone="emerald"
        recipientName={employeeName}
        title="Your details have been submitted"
        body={`We received your ${assignment.formName} on ${formatDateTime(
          assignment.submittedAt
        )} and your profile has been updated.`} />);


  }

  const changedCount = Object.entries(values).filter(
    ([key, value]) => prefilled[key] !== undefined && value !== prefilled[key]
  ).length;

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 4500);
  };

  return (
    <PortalShell
      greeting={`Hello, ${employee.firstName}`}
      recipientName="Confirm your employee details"
      subtitle={`${assignment.formName} · ${employee.jobTitle}`}
      expiresAt={assignment.expiresAt}
      tabs={tabs}
      activeTab={tab}
      onTabChange={setTab}>
      
      {notice &&
      <div className="mb-5 rounded-lg bg-sky-50 px-4 py-3 text-[13px] text-sky-900 ring-1 ring-inset ring-sky-200">
          {notice}
        </div>
      }

      {tab === 'form' &&
      <section>
          <h2 className="text-2xl font-semibold tracking-tight text-ink">Check What We Hold</h2>
          <p className="mt-1.5 max-w-2xl text-[13px] text-muted">
            We have filled in the details already on your record. Correct anything out of date and
            submit. Saving a draft keeps your entries without sending them and does not change the
            expiry date.
          </p>

          {changedCount > 0 &&
        <div className="mt-5 rounded-lg bg-brand-50 px-4 py-3 text-[13px] text-brand-800 ring-1 ring-inset ring-brand-200">
              {changedCount} field{changedCount === 1 ? '' : 's'} changed. Submitting will update your
              employee profile.
            </div>
        }

          <div className="mt-6">
            <CandidateFormRenderer
            form={form}
            maritalStatus={maritalStatus}
            onMaritalStatusChange={(status) => {
              setMaritalStatus(status);
              setValues((prev) => ({ ...prev, marital: status }));
            }}
            values={values}
            onValueChange={(key, value) => setValues((prev) => ({ ...prev, [key]: value }))}
            prefilled={prefilled} />
          
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button
            onClick={() => {
              saveDraft(assignment.id, values, uploads);
              flash('Draft saved. Come back to this link any time before it expires.');
            }}>
            
              Save as Draft
            </Button>
            <Button variant="primary" onClick={() => setConfirming('form')}>
              Submit Details
            </Button>
          </div>
        </section>
      }

      {tab === 'documents' &&
      <section>
          <h2 className="text-2xl font-semibold tracking-tight text-ink">Upload Your Documents</h2>
          <p className="mt-1.5 max-w-2xl text-[13px] text-muted">
            Accepted formats are PDF, PNG, JPG, JPEG and DOCX, up to 25 MB per field. Uploads are saved
            against this link when you save a draft.
          </p>

          <div className="mt-6">
            <DocumentUploads
            documents={form.documents}
            uploads={uploads}
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

          <div className="mt-6 flex justify-end gap-2">
            <Button
            onClick={() => {
              saveDraft(assignment.id, values, uploads);
              flash('Draft saved. Your uploads are kept against this link until you submit.');
            }}>
            
              Save as Draft
            </Button>
            <Button variant="primary" onClick={() => setConfirming('documents')}>
              Submit Documents
            </Button>
          </div>
        </section>
      }

      <Dialog
        open={confirming === 'form'}
        title="Submit Details"
        body="Your details will be sent to HR, your profile will be updated and you will not be able to edit them afterwards."
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          setConfirming(null);
          submitAssignment(assignment.id, values, labels);
        }} />
      

      <Dialog
        open={confirming === 'documents'}
        title="Submit Documents"
        body={
        tabs.some((item) => item.value === 'form') ?
        'Your documents will be sent to HR. Your details are submitted separately from the Employee Data Form tab.' :
        'Your documents will be sent to HR and cannot be edited afterwards.'
        }
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          setConfirming(null);
          if (tabs.some((item) => item.value === 'form')) {
            saveDraft(assignment.id, values, uploads);
            flash('Documents received. Submit the Employee Data Form tab to finish.');
          } else {
            submitAssignment(assignment.id, values, labels);
          }
        }} />
      
    </PortalShell>);

}