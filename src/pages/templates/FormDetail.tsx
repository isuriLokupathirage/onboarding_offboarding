import React, { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { EyeIcon, PencilIcon, UsersIcon } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Segmented';
import { Menu } from '../../components/ui/Menu';
import { Tooltip } from '../../components/ui/Tooltip';
import { Dialog } from '../../components/ui/Dialog';
import { FormSummary } from '../../components/forms/FormSummary';
import { FieldsSummary } from '../../components/forms/FieldsSummary';
import { DocumentsSummary } from '../../components/forms/DocumentsSummary';
import { FormDetailsTab } from '../../components/forms/FormDetailsTab';
import { EmployeeDetailsTab } from '../../components/forms/EmployeeDetailsTab';
import { DocumentsTab } from '../../components/forms/DocumentsTab';
import {
  CandidateFormRenderer,
  formHasFields } from
'../../components/forms/CandidateFormRenderer';
import { DocumentUploads } from '../../components/portal/DocumentUploads';
import { useAppData } from '../../contexts/AppDataContext';
import { useEmployeeData } from '../../contexts/EmployeeDataContext';
import { formatDate } from '../../utils/format';
import { useScreenInit } from '../../useScreenInit.js';

type Tab = 'details' | 'employee' | 'documents' | 'preview';

const PERMISSION_NOTE = 'Requires the Manage Employee Forms permission';

export function FormDetail() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { forms, transitions, canManageForms, duplicateForm, deleteForm, updateForm } = useAppData();
  const { assignments, employees } = useEmployeeData();

  const screenInit = useScreenInit();
  const [tab, setTab] = useState<Tab>(screenInit.tab as Tab ?? 'details');
  const [editing, setEditing] = useState<boolean>(Boolean(screenInit.editing));
  const [nameError, setNameError] = useState(false);
  const [previewUploads, setPreviewUploads] = useState<Record<string, string[]>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [maritalStatus, setMaritalStatus] = useState<'Single' | 'Married'>('Single');

  const form = forms.find((item) => item.id === formId);

  const usage = useMemo(() => {
    if (!form) return { transitions: 0, employees: 0 };
    const usedByTransitions = transitions.filter(
      (transition) => transition.candidate.employeeFormId === form.id
    ).length;
    const employeeIds = new Set(
      assignments.filter((item) => item.formId === form.id).map((item) => item.employeeId)
    );
    return { transitions: usedByTransitions, employees: employeeIds.size };
  }, [form, transitions, assignments]);

  if (!form) return <Navigate to="/templates/forms/employee" replace />;

  const isDraft = Boolean(form.isDraft);
  const hasFields = formHasFields(form);

  const inUse = usage.transitions > 0 || usage.employees > 0;
  const usageLabel = inUse ?
  `In use by ${usage.transitions} transition${usage.transitions === 1 ? '' : 's'} and ${
  usage.employees} employee${
  usage.employees === 1 ? '' : 's'}` :
  'Not in use';

  const enabledFieldCount = form.employeeDetailsEnabled ?
  form.sections.
  filter((section) => section.enabled).
  reduce(
    (total, section) =>
    total +
    section.fields.filter((field) => field.state !== 'Hidden').length +
    (section.conditionalGroups ?? []).reduce(
      (sum, group) =>
      sum +
      group.fields.filter((field) => field.state !== 'Hidden').length +
      (group.repeating?.fields ?? []).filter((field) => field.state !== 'Hidden').length,
      0
    ),
    0
  ) :
  0;

  const menuItems = canManageForms ?
  [
  {
    label: 'Duplicate form',
    onSelect: () => {
      const id = duplicateForm(form.id);
      if (id) navigate(`/templates/forms/employee/${id}`);
    }
  },
  {
    label: form.status === 'Active' ? 'Deactivate form' : 'Activate form',
    onSelect: () =>
    updateForm(form.id, { status: form.status === 'Active' ? 'Inactive' : 'Active' })
  },
  ...(inUse ?
  [] :
  [
  {
    label: 'Delete form',
    danger: true,
    onSelect: () => setConfirmDelete(true)
  }])] :


  [{ label: 'Duplicate form' }, { label: 'Deactivate form' }, { label: 'Delete form' }];

  return (
    <div>
      <PageHeader
        title={isDraft ? form.name || 'New Employee Form' : form.name}
        subtitle={
        isDraft ?
        'Name the form, choose what it collects and add any documents it requires.' :
        undefined
        }
        backTo="/templates/forms/employee"
        backLabel="Back to Employee Forms"
        meta={
        isDraft ?
        <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge>{form.employmentType}</Badge>
              <span className="text-[12px] text-muted">
                {enabledFieldCount} fields · {form.documents.length} documents
              </span>
            </div> :

        <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[12px] text-subtle">{form.code}</span>
              <Badge>{form.employmentType}</Badge>
              <Badge
            className={
            form.status === 'Active' ?
            'bg-emerald-50 text-emerald-700 ring-emerald-200' :
            'bg-slate-100 text-slate-600 ring-slate-200'
            }>
            
                {form.status}
              </Badge>
              <Badge
            className={
            inUse ?
            'bg-amber-50 text-amber-700 ring-amber-200' :
            'bg-slate-50 text-muted ring-line'
            }>
            
                <UsersIcon className="h-3 w-3" />
                {usageLabel}
              </Badge>
              <span className="text-[12px] text-muted">
                {enabledFieldCount} fields · {form.documents.length} documents · created{' '}
                {formatDate(form.createdOn)}
              </span>
            </div>

        }
        actions={
        isDraft ?
        <>
              <Button
            onClick={() => {
              deleteForm(form.id);
              navigate('/templates/forms/employee');
            }}>
            
                Cancel
              </Button>
              <Button
            variant="primary"
            onClick={() => {
              if (!form.name.trim()) {
                setNameError(true);
                setTab('details');
                return;
              }
              updateForm(form.id, {
                isDraft: false,
                lastModified: `${new Date().toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}, just now`
              });
              setEditing(false);
            }}>
            
                Create Form
              </Button>
            </> :
        editing ?
        <>
              <Button onClick={() => setEditing(false)}>Cancel</Button>
              <Button
            variant="primary"
            onClick={() => {
              updateForm(form.id, {
                lastModified: `${new Date().toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}, just now`
              });
              setEditing(false);
            }}>
            
                Save changes
              </Button>
            </> :

        <>
              {canManageForms ?
          <Button variant="primary" onClick={() => setEditing(true)}>
                  <PencilIcon className="h-4 w-4" />
                  Edit
                </Button> :

          <Tooltip label={PERMISSION_NOTE}>
                  <span>
                    <Button variant="primary" disabled>
                      <PencilIcon className="h-4 w-4" />
                      Edit
                    </Button>
                  </span>
                </Tooltip>
          }
              <Menu label={`Actions for ${form.name}`} items={menuItems} />
            </>

        } />
      

      <div className="px-8 py-6">
        {!canManageForms &&
        <div className="mb-4 rounded-lg bg-sky-50 px-3.5 py-3 text-[13px] text-sky-900 ring-1 ring-inset ring-sky-200">
            You have View Employee Forms access. You can review this configuration, but editing,
            duplicating, deactivating and deleting are unavailable.
          </div>
        }
        {isDraft &&
        <div className="mb-4 rounded-lg bg-sky-50 px-3.5 py-3 text-[13px] text-sky-900 ring-1 ring-inset ring-sky-200">
            This form has not been created yet. The fields required by Employee Management are already
            switched on — enable the rest of what you need, then select Create Form.
          </div>
        }
        {nameError && !form.name.trim() &&
        <div className="mb-4 rounded-lg bg-red-50 px-3.5 py-3 text-[13px] text-red-800 ring-1 ring-inset ring-red-200">
            Give the form a name before creating it.
          </div>
        }
        {canManageForms && inUse && !editing && !isDraft &&
        <div className="mb-4 rounded-lg bg-amber-50 px-3.5 py-3 text-[13px] text-amber-900 ring-1 ring-inset ring-amber-200">
            {usageLabel}. It cannot be deleted while in use, and edits will apply to forms sent from now
            on.
          </div>
        }

        <Tabs
          options={[
          { value: 'details', label: 'Form Details' },
          { value: 'employee', label: 'Employee Details', count: enabledFieldCount },
          { value: 'documents', label: 'Required Documents', count: form.documents.length },
          { value: 'preview', label: 'Preview' }]
          }
          value={tab}
          onChange={setTab} />
        

        <div className="mt-5 max-w-5xl">
          {editing || isDraft ?
          <>
              {tab === 'details' && <FormDetailsTab form={form} />}
              {tab === 'employee' && <EmployeeDetailsTab form={form} />}
              {tab === 'documents' && <DocumentsTab form={form} />}
            </> :

          <>
              {tab === 'details' && <FormSummary form={form} />}
              {tab === 'employee' && <FieldsSummary form={form} />}
              {tab === 'documents' && <DocumentsSummary form={form} />}
            </>
          }

          {tab === 'preview' &&
          <div>
              <div className="mb-4 flex items-start gap-2.5 rounded-lg bg-sky-50 px-3.5 py-3 ring-1 ring-inset ring-sky-200">
                <EyeIcon className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                <p className="text-[13px] leading-relaxed text-sky-900">
                  This is how the recipient sees the form. Switching Civil Status changes which insurance
                  group appears, and selecting Other on a preference reveals a free text field.
                </p>
              </div>

              {hasFields &&
            <section>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h3 className="text-sm font-semibold text-ink">Employee Data Form</h3>
                    <span className="text-[12px] text-muted">
                      {enabledFieldCount} fields the recipient completes
                    </span>
                  </div>
                  <div className="mt-3">
                    <CandidateFormRenderer
                  form={form}
                  maritalStatus={maritalStatus}
                  onMaritalStatusChange={setMaritalStatus} />
                
                  </div>
                </section>
            }

              {form.documents.length > 0 &&
            <section className={hasFields ? 'mt-8 border-t border-line pt-8' : ''}>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h3 className="text-sm font-semibold text-ink">Required Documents</h3>
                    <span className="text-[12px] text-muted">
                      {form.documents.length} upload
                      {form.documents.length === 1 ? '' : 's'} · PDF, PNG, JPG, JPEG or DOCX up to 25 MB
                    </span>
                  </div>
                  <div className="mt-3">
                    <DocumentUploads
                  documents={form.documents}
                  uploads={previewUploads}
                  onAdd={(docId, names) =>
                  setPreviewUploads((prev) => ({
                    ...prev,
                    [docId]: [...(prev[docId] ?? []), ...names]
                  }))
                  }
                  onRemove={(docId, name) =>
                  setPreviewUploads((prev) => ({
                    ...prev,
                    [docId]: (prev[docId] ?? []).filter((item) => item !== name)
                  }))
                  } />
                
                  </div>
                </section>
            }

              {!hasFields && form.documents.length === 0 &&
            <p className="rounded-xl border border-dashed border-line bg-white px-5 py-10 text-center text-[13px] text-muted">
                  Nothing is configured yet, so the recipient would see an empty portal. Enable fields or
                  add documents to preview them here.
                </p>
            }
            </div>
          }
        </div>
      </div>

      <Dialog
        open={confirmDelete}
        title="Delete form"
        body={`${form.name} will be removed from the Employee Forms list. This cannot be undone.`}
        confirmLabel="Delete form"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          deleteForm(form.id);
          navigate('/templates/forms/employee');
        }} />
      
    </div>);

}