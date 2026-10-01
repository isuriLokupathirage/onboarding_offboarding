import React, { useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { LinkIcon, ShieldOffIcon } from 'lucide-react';
import type { Employee, EmployeeForm, FormPart, Transition } from '../../types';
import { PortalShell, type PortalTab } from '../../components/portal/PortalShell';
import { PortalMessage } from '../../components/portal/PortalMessage';
import { MyFormsList } from '../../components/portal/MyFormsList';
import { PortalFormView } from '../../components/portal/PortalFormView';
import { PortalEvents } from './PortalEvents';
import { useAppData } from '../../contexts/AppDataContext';
import { useEmployeeData } from '../../contexts/EmployeeDataContext';
import { formatDate } from '../../utils/format';
import {
  employeePortalForms,
  formParts,
  transitionPortalForms,
  uploadsFromSubmission,
  type PortalFormItem } from
'../../utils/portal';
import { useScreenInit } from '../../useScreenInit.js';

const CONFIRM_BODY = 'Your details will be sent to HR and cannot be edited afterwards.';

export function PortalEntry() {
  const { transitions } = useAppData();
  const active = transitions.find((transition) => transition.portalAccess === 'Active');
  if (!active) return <Navigate to="/onboarding/transitions" replace />;
  return <Navigate to={`/portal/${active.portalToken}`} replace />;
}

/** The one portal a recipient gets: per onboarding transition, or per employee. */
export function Portal({ eventsEmpty = false }: {eventsEmpty?: boolean;}) {
  const { token } = useParams();
  const { transitions } = useAppData();
  const { employees } = useEmployeeData();

  const transition = transitions.find((item) => item.portalToken === token);
  const employee = transition ? undefined : employees.find((item) => item.portalToken === token);

  if (transition) return <TransitionPortal transition={transition} eventsEmpty={eventsEmpty} />;
  if (employee) return <EmployeePortal employee={employee} />;
  return (
    <PortalMessage
      icon={LinkIcon}
      title="This link is not valid"
      body="The link you followed does not match a portal we have on record. It may have been mistyped." />);


}

function Unavailable() {
  // Names no recipient, because a closed link may have been forwarded to someone else.
  return (
    <PortalMessage
      icon={ShieldOffIcon}
      title="This portal is no longer available"
      body="Your forms can no longer be opened or submitted here. If you think this is a mistake, please contact us." />);


}

/** Tab and open-form state shared by both portals. `?form=<id>` opens a form directly. */
function usePortalNavigation(defaultTab: string) {
  const screenInit = useScreenInit() as {tab?: string;form?: string;};
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<string>(screenInit.tab ?? defaultTab);
  const [openFormId, setOpenFormId] = useState<string | null>(
    searchParams.get('form') ?? screenInit.form ?? null
  );

  const openForm = (id: string | null) => {
    setOpenFormId(id);
    setSearchParams(id ? { form: id } : {}, { replace: true });
    window.scrollTo({ top: 0 });
  };
  const changeTab = (value: string) => {
    setTab(value);
    if (openFormId) openForm(null);
  };
  return { tab, changeTab, openFormId, openForm };
}

function TransitionPortal({ transition, eventsEmpty }: {transition: Transition;eventsEmpty: boolean;}) {
  const { forms, saveTransitionDraft, submitTransitionForm } = useAppData();
  const { tab, changeTab, openFormId, openForm } = usePortalNavigation('forms');

  if (
  transition.portalAccess !== 'Active' ||
  transition.status === 'Cancelled' ||
  transition.status === 'Completed')
  {
    return <Unavailable />;
  }

  const formById = (id: string) => forms.find((form) => form.id === id);
  const items = transitionPortalForms(transition, (id) => formById(id)?.name ?? 'Form');
  const tabs: PortalTab[] = [
  { value: 'forms', label: 'My Forms' },
  { value: 'schedule', label: 'My Schedule' }];

  const activeTab = tabs.some((item) => item.value === tab) ? tab : 'forms';
  const openItem = items.find((item) => item.id === openFormId);
  const openItemForm = openItem ? formById(openItem.formId) : undefined;
  const emailFor = (item: PortalFormItem) => transition.emails.find((email) => email.id === item.id);
  const submissionFor = (item: PortalFormItem) =>
  transition.submissions.find((submission) => submission.emailId === item.id);
  // A submitted part shows what was sent to HR; a part still open shows the saved draft.
  const partSubmitted = (item: PortalFormItem, part: FormPart) =>
  item.status === 'Submitted' || Boolean(item.submittedParts[part]);
  const { candidate } = transition;

  return (
    <PortalShell
      illustration
      recipientName={`${candidate.firstName} ${candidate.lastName}`}
      details={[
      candidate.position,
      `${transition.kind === 'Onboarding' ? 'Starts' : 'Last working day'} ${formatDate(candidate.hireDate)}`]
      }
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={changeTab}>

      {activeTab === 'forms' && (
      openItem && openItemForm ?
      <PortalFormView
        key={openItem.id}
        form={openItemForm}
        item={openItem}
        initialValues={
        partSubmitted(openItem, 'details') ?
        submissionFor(openItem)?.responses ?? {} :
        emailFor(openItem)?.draft?.responses ?? {}
        }
        initialUploads={
        partSubmitted(openItem, 'documents') ?
        uploadsFromSubmission(openItemForm, submissionFor(openItem)?.documents ?? []) :
        emailFor(openItem)?.draft?.documents ?? {}
        }
        draftSavedAt={emailFor(openItem)?.draft?.savedAt}
        confirmBody={CONFIRM_BODY}
        onSaveDraft={(values, uploads) =>
        saveTransitionDraft(transition.id, openItem.id, values, uploads)
        }
        onSubmit={(part, values, documents) =>
        submitTransitionForm(transition.id, openItem.id, part, values, documents)
        }
        onBack={() => openForm(null)} /> :


      <MyFormsList
        items={items}
        hasDraft={(item) => Boolean(emailFor(item)?.draft)}
        onOpen={(item) => openForm(item.id)} />)

      }
      {activeTab === 'schedule' && <PortalEvents empty={eventsEmpty} />}
    </PortalShell>);

}

function fieldLabels(form: EmployeeForm): Record<string, string> {
  const map: Record<string, string> = {};
  form.sections.forEach((section) => {
    section.fields.forEach((field) => {
      map[field.id] = field.name;
    });
    (section.conditionalGroups ?? []).forEach((group) => {
      [...group.fields, ...(group.repeating?.fields ?? [])].forEach((field) => {
        map[field.id] = field.name;
      });
    });
  });
  return map;
}

function EmployeePortal({ employee }: {employee: Employee;}) {
  const { forms } = useAppData();
  const { assignmentsFor, saveDraft, submitAssignment } = useEmployeeData();
  const { changeTab, openFormId, openForm } = usePortalNavigation('forms');

  if (employee.status !== 'Active') return <Unavailable />;

  const assignments = assignmentsFor(employee.id);
  const items = employeePortalForms(assignments);
  const openItem = items.find((item) => item.id === openFormId);
  const assignment = assignments.find((item) => item.id === openItem?.id);
  const form = forms.find((item) => item.id === openItem?.formId);

  return (
    <PortalShell
      recipientName={`${employee.firstName} ${employee.lastName}`}
      tabs={[{ value: 'forms', label: 'My Forms' }]}
      activeTab="forms"
      onTabChange={changeTab}>

      {openItem && assignment && form ?
      <PortalFormView
        key={openItem.id}
        form={form}
        item={openItem}
        initialValues={{ ...employee.record, ...assignment.responses }}
        initialUploads={
        openItem.status === 'Submitted' || openItem.submittedParts.documents ?
        uploadsFromSubmission(form, assignment.submittedDocuments) :
        assignment.documentDrafts
        }
        draftSavedAt={null}
        prefilled={openItem.status === 'Submitted' ? undefined : employee.record}
        confirmBody={`${CONFIRM_BODY} Any changes will update your employee profile.`}
        onSaveDraft={(values, uploads) => saveDraft(assignment.id, values, uploads)}
        onSubmit={(part, values, documents) =>
        submitAssignment(assignment.id, part, formParts(form), values, fieldLabels(form), documents)
        }
        onBack={() => openForm(null)} /> :


      <MyFormsList
        items={items}
        hasDraft={(item) => Boolean(assignments.find((entry) => entry.id === item.id)?.draftSaved)}
        onOpen={(item) => openForm(item.id)} />

      }
    </PortalShell>);

}
