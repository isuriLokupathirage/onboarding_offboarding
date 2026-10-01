import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type {
  EmployeeForm,
  FieldState,
  FormPart,
  FormSection,
  FormSubmission,
  RequiredDocument,
  Task,
  Template,
  OboPermission,
  Transition,
  SubmittedDocument,
  TransitionTaskStatus } from
'../types';
import { seedTasks } from '../data/tasks';
import { seedTemplates } from '../data/templates';
import { seedTransitions } from '../data/transitions';
import { buildSections, seedForms } from '../data/forms';
import { peopleById } from '../data/people';
import {
  FORM_LINK_EXPIRY_DAYS,
  canReceiveForm,
  canRevokeEmail,
  isOpenFormEmail,
  isTaskOpen,
  managePermissionFor,
  openFormEmail,
  statusGroup } from
'../utils/transitions';
import { addDays } from '../utils/format';
import { formParts, partLabels } from '../utils/portal';

interface AppData {
  canManageForms: boolean;
  currentUserId: string;
  oboPermissions: OboPermission[];
  hasOboPermission: (permission: OboPermission) => boolean;
  updateTaskStatus: (transitionId: string, taskId: string, status: TransitionTaskStatus) => void;
  cancelTransition: (transitionId: string, date: string, reason: string) => void;
  createForm: () => string;
  duplicateForm: (formId: string) => string | undefined;
  deleteForm: (formId: string) => void;
  tasks: Task[];
  templates: Template[];
  transitions: Transition[];
  forms: EmployeeForm[];
  addTask: (task: Task) => void;
  addTemplate: (template: Template) => void;
  deleteTasks: (ids: string[]) => void;
  addTransition: (transition: Transition) => void;
  setFieldState: (formId: string, fieldId: string, state: FieldState) => void;
  toggleSection: (formId: string, sectionId: string) => void;
  setEmployeeDetailsEnabled: (formId: string, enabled: boolean) => void;
  setPortalAccess: (transitionId: string, access: Transition['portalAccess']) => void;
  updateForm: (formId: string, patch: Partial<EmployeeForm>) => void;
  addDocument: (formId: string, doc: RequiredDocument) => void;
  updateDocument: (formId: string, docId: string, patch: Partial<RequiredDocument>) => void;
  removeDocument: (formId: string, docId: string) => void;
  revokeEmail: (transitionId: string, emailId: string) => void;
  sendTransitionForm: (transitionIds: string[], formId: string) => void;
  /** Stores the candidate's entries against one form. Does not submit or change its expiry. */
  saveTransitionDraft: (
  transitionId: string,
  emailId: string,
  responses: Record<string, string>,
  documents: Record<string, string[]>)
  => void;
  submitTransitionForm: (
  transitionId: string,
  emailId: string,
  part: FormPart,
  responses: Record<string, string>,
  documents: SubmittedDocument[])
  => void;
}

const AppDataContext = createContext<AppData | null>(null);

const DEFAULT_OBO_PERMISSIONS: OboPermission[] = [
'View All Transitions',
'Manage Onboarding Transitions',
'Manage Offboarding Transitions',
'Update Task Progress',
'View Restricted Tasks'];

function enforceMandatory(form: EmployeeForm): EmployeeForm {
  return {
    ...form,
    employeeDetailsEnabled: true,
    sections: form.sections.map((section) => {
      const hasLocked = section.fields.some((field) => field.locked);
      return {
        ...section,
        enabled: hasLocked ? true : section.enabled,
        fields: section.fields.map((field) =>
        field.locked ? { ...field, state: 'Required' as FieldState } : field
        )
      };
    })
  };
}

function mapSectionFields(section: FormSection, fieldId: string, state: FieldState): FormSection {
  return {
    ...section,
    fields: section.fields.map((field) =>
    field.id === fieldId && !field.locked ? { ...field, state } : field
    ),
    conditionalGroups: section.conditionalGroups?.map((group) => ({
      ...group,
      fields: group.fields.map((field) =>
      field.id === fieldId && !field.locked ? { ...field, state } : field
      ),
      repeating: group.repeating ?
      {
        ...group.repeating,
        fields: group.repeating.fields.map((field) =>
        field.id === fieldId && !field.locked ? { ...field, state } : field
        )
      } :
      undefined
    }))
  };
}

export function AppDataProvider({
  children,
  canManageForms = true,
  currentUserId = 'u1',
  oboPermissions = DEFAULT_OBO_PERMISSIONS
}: {
  children: React.ReactNode;
  canManageForms?: boolean;
  currentUserId?: string;
  oboPermissions?: OboPermission[];
}) {
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [templates, setTemplates] = useState<Template[]>(seedTemplates);
  const [transitions, setTransitions] = useState<Transition[]>(seedTransitions);
  const [forms, setForms] = useState<EmployeeForm[]>(seedForms);

  const hasOboPermission = useCallback(
    (permission: OboPermission) => oboPermissions.includes(permission),
    [oboPermissions]
  );

  const updateTaskStatus = useCallback(
    (transitionId: string, taskId: string, status: TransitionTaskStatus) => {
      setTransitions((prev) =>
      prev.map((transition) =>
      transition.id === transitionId ?
      {
        ...transition,
        tasks: transition.tasks.map((task) => task.id === taskId ? { ...task, status } : task)
      } :
      transition
      )
      );
    },
    []
  );

  const cancelTransition = useCallback(
    (transitionId: string, date: string, reason: string) => {
      const actor = peopleById[currentUserId]?.name ?? currentUserId;
      const recordedAt = new Date().toISOString();
      setTransitions((prev) =>
      prev.map((transition) => {
        if (
        transition.id !== transitionId ||
        statusGroup(transition) !== 'Active' ||
        !oboPermissions.includes(managePermissionFor(transition.kind)))

        return transition;
        return {
          ...transition,
          status: 'Cancelled',
          tasks: transition.tasks.map((task) =>
          isTaskOpen(task) ? { ...task, status: 'Cancelled' } : task
          ),
          cancellation: { date, reason, cancelledBy: actor, recordedAt },
          auditTrail: [
          ...transition.auditTrail,
          {
            id: `au-${Date.now()}`,
            action: 'Transition cancelled',
            actor,
            at: recordedAt,
            detail: reason
          }]

        };
      })
      );
    },
    [currentUserId, oboPermissions]
  );

  const addTask = useCallback((task: Task) => setTasks((prev) => [...prev, task]), []);
  const addTemplate = useCallback((template: Template) => setTemplates((prev) => [...prev, template]), []);
  const deleteTasks = useCallback(
    (ids: string[]) => setTasks((prev) => prev.filter((task) => !ids.includes(task.id))),
    []
  );
  const addTransition = useCallback(
    (transition: Transition) => setTransitions((prev) => [transition, ...prev]),
    []
  );

  const setFieldState = useCallback((formId: string, fieldId: string, state: FieldState) => {
    setForms((prev) =>
    prev.map((form) => {
      if (form.id !== formId) return form;
      const updated: EmployeeForm = {
        ...form,
        sections: form.sections.map((s) => mapSectionFields(s, fieldId, state))
      };
      return state === 'Hidden' ? updated : enforceMandatory(updated);
    })
    );
  }, []);

  const toggleSection = useCallback((formId: string, sectionId: string) => {
    setForms((prev) =>
    prev.map((form) => {
      if (form.id !== formId) return form;
      const target = form.sections.find((section) => section.id === sectionId);
      const enabling = !target?.enabled;
      const updated: EmployeeForm = {
        ...form,
        sections: form.sections.map((section) =>
        section.id === sectionId ? { ...section, enabled: enabling } : section
        )
      };
      return enabling ? enforceMandatory(updated) : updated;
    })
    );
  }, []);

  const setEmployeeDetailsEnabled = useCallback((formId: string, enabled: boolean) => {
    setForms((prev) =>
    prev.map((form) => {
      if (form.id !== formId) return form;
      if (enabled) return enforceMandatory(form);
      return {
        ...form,
        employeeDetailsEnabled: false,
        sections: form.sections.map((section) => ({ ...section, enabled: false }))
      };
    })
    );
  }, []);

  const setPortalAccess = useCallback(
    (transitionId: string, access: Transition['portalAccess']) => {
      setTransitions((prev) =>
      prev.map((transition) =>
      transition.id === transitionId ? { ...transition, portalAccess: access } : transition
      )
      );
    },
    []
  );

  const updateForm = useCallback((formId: string, patch: Partial<EmployeeForm>) => {
    setForms((prev) => prev.map((form) => form.id === formId ? { ...form, ...patch } : form));
  }, []);

  const createForm = useCallback(() => {
    const id = `frm-${Date.now()}`;
    const today = new Date();
    setForms((prev) => {
      const numbers = prev.
      map((form) => Number(form.code.split('-')[1])).
      filter((value) => !Number.isNaN(value));
      const blank: EmployeeForm = {
        id,
        code: `FRM-${String(Math.max(0, ...numbers) + 1).padStart(3, '0')}`,
        name: '',
        employmentType: 'Permanent',
        description: '',
        employeeDetailsEnabled: true,
        status: 'Active',
        isDraft: true,
        createdBy: 'Nimal Perera',
        createdOn: today.toISOString().slice(0, 10),
        lastModified: '—',
        sections: buildSections().map((section) => {
          const hasLocked = section.fields.some((field) => field.locked);
          return {
            ...section,
            enabled: hasLocked,
            fields: section.fields.map((field) =>
            field.locked ? { ...field } : { ...field, state: 'Hidden' as FieldState }
            ),
            conditionalGroups: section.conditionalGroups?.map((group) => ({
              ...group,
              fields: group.fields.map((field) => ({ ...field, state: 'Hidden' as FieldState })),
              repeating: group.repeating ?
              {
                ...group.repeating,
                fields: group.repeating.fields.map((field) => ({
                  ...field,
                  state: 'Hidden' as FieldState
                }))
              } :
              undefined
            }))
          };
        }),
        documents: []
      };
      return [...prev, blank];
    });
    return id;
  }, []);

  const duplicateForm = useCallback(
    (formId: string) => {
      const source = forms.find((form) => form.id === formId);
      if (!source) return undefined;
      const id = `frm-${Date.now()}`;
      const numbers = forms.
      map((form) => Number(form.code.split('-')[1])).
      filter((value) => !Number.isNaN(value));
      const code = `FRM-${String(Math.max(0, ...numbers) + 1).padStart(3, '0')}`;
      const today = new Date();
      setForms((prev) => [
      ...prev,
      {
        ...source,
        id,
        code,
        name: `${source.name} (Copy)`,
        status: 'Inactive',
        createdBy: 'Nimal Perera',
        createdOn: today.toISOString().slice(0, 10),
        lastModified: `${today.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })}, just now`,
        sections: source.sections.map((section) => ({
          ...section,
          fields: section.fields.map((field) => ({ ...field })),
          conditionalGroups: section.conditionalGroups?.map((group) => ({
            ...group,
            fields: group.fields.map((field) => ({ ...field })),
            repeating: group.repeating ?
            { ...group.repeating, fields: group.repeating.fields.map((field) => ({ ...field })) } :
            undefined
          }))
        })),
        documents: source.documents.map((doc) => ({ ...doc }))
      }]
      );
      return id;
    },
    [forms]
  );

  const deleteForm = useCallback((formId: string) => {
    setForms((prev) => prev.filter((form) => form.id !== formId));
  }, []);

  const addDocument = useCallback((formId: string, doc: RequiredDocument) => {
    setForms((prev) =>
    prev.map((form) => form.id === formId ? { ...form, documents: [...form.documents, doc] } : form)
    );
  }, []);

  const updateDocument = useCallback((formId: string, docId: string, patch: Partial<RequiredDocument>) => {
    setForms((prev) =>
    prev.map((form) =>
    form.id === formId ?
    {
      ...form,
      documents: form.documents.map((doc) => doc.id === docId ? { ...doc, ...patch } : doc)
    } :
    form
    )
    );
  }, []);

  const removeDocument = useCallback((formId: string, docId: string) => {
    setForms((prev) =>
    prev.map((form) =>
    form.id === formId ? { ...form, documents: form.documents.filter((d) => d.id !== docId) } : form
    )
    );
  }, []);

  const revokeEmail = useCallback(
    (transitionId: string, emailId: string) => {
      const actor = peopleById[currentUserId]?.name ?? currentUserId;
      setTransitions((prev) =>
      prev.map((transition) => {
        if (transition.id !== transitionId || !canRevokeEmail(transition, emailId)) return transition;
        return {
          ...transition,
          emails: transition.emails.map((email) =>
          email.id === emailId ? { ...email, linkRevoked: true } : email
          ),
          emailEvents: [
          ...transition.emailEvents,
          {
            id: `ev-${Date.now()}`,
            emailId,
            action: 'Link revoked',
            actor,
            at: new Date().toISOString()
          }]

        };
      })
      );
    },
    [currentUserId]
  );

  const sendTransitionForm = useCallback(
    (transitionIds: string[], formId: string) => {
      const form = forms.find((item) => item.id === formId);
      if (!form || !oboPermissions.includes('Manage Onboarding Transitions')) return;
      const now = new Date();
      const sentAt = now.toISOString();
      const expiresAt = addDays(sentAt, FORM_LINK_EXPIRY_DAYS);
      setTransitions((prev) =>
      prev.map((transition, index) => {
        if (!transitionIds.includes(transition.id) || !canReceiveForm(transition)) return transition;
        const emailId = `em-${now.getTime()}-${index}`;
        // Other forms in the portal are untouched. Only an open copy of this same form is
        // replaced, and its draft moves to the new one.
        const previous = openFormEmail(transition, form.id);
        return {
          ...transition,
          candidate: { ...transition.candidate, employeeFormId: form.id },
          formStatus: previous?.draft ? 'In Progress' : 'Sent',
          // A part already submitted on the open copy stays submitted on the new one.
          submissions: transition.submissions.map((submission) =>
          previous && submission.emailId === previous.id ? { ...submission, emailId } : submission
          ),
          emails: [
          ...transition.emails.map((email) =>
          email.id === previous?.id ? { ...email, replacedBy: emailId, draft: undefined } : email
          ),
          {
            id: emailId,
            subject: `Complete your ${form.name}`,
            recipient: transition.candidate.personalEmail,
            sentAt,
            content: 'form',
            formId: form.id,
            linkExpiresAt: expiresAt,
            draftCarriedForward: Boolean(previous?.draft),
            draft: previous?.draft
          }]

        };
      })
      );
    },
    [forms, oboPermissions]
  );

  const saveTransitionDraft = useCallback(
    (
    transitionId: string,
    emailId: string,
    responses: Record<string, string>,
    documents: Record<string, string[]>) =>
    {
      const savedAt = new Date().toISOString();
      setTransitions((prev) =>
      prev.map((transition) => {
        if (transition.id !== transitionId) return transition;
        return {
          ...transition,
          formStatus: transition.formStatus === 'Submitted' ? transition.formStatus : 'In Progress',
          emails: transition.emails.map((email) =>
          email.id === emailId && isOpenFormEmail(transition, email) ?
          { ...email, draft: { savedAt, responses, documents } } :
          email
          )
        };
      })
      );
    },
    []
  );

  const submitTransitionForm = useCallback(
    (
    transitionId: string,
    emailId: string,
    part: FormPart,
    responses: Record<string, string>,
    documents: SubmittedDocument[]) =>
    {
      const submittedAt = new Date().toISOString();
      setTransitions((prev) =>
      prev.map((transition) => {
        const email = transition.emails.find((item) => item.id === emailId);
        if (transition.id !== transitionId || !email || !isOpenFormEmail(transition, email)) return transition;
        const form = forms.find((item) => item.id === email.formId);
        const existing = transition.submissions.find((item) => item.emailId === emailId);
        const parts = { ...existing?.parts, [part]: submittedAt };
        const pendingParts = (form ? formParts(form) : []).filter((item) => !parts[item]);
        const complete = pendingParts.length === 0;
        const submission: FormSubmission = {
          emailId,
          formId: email.formId,
          submittedAt,
          responses: part === 'details' ? responses : existing?.responses ?? {},
          documents: part === 'documents' ? documents : existing?.documents ?? [],
          parts,
          pendingParts
        };
        const count = part === 'details' ? Object.keys(responses).length : documents.length;
        const unit = part === 'details' ? 'field' : 'document';
        return {
          ...transition,
          formStatus: complete ? 'Submitted' : 'In Progress',
          // What is saved for a part still to submit is kept until the whole form is in.
          emails: transition.emails.map((item) =>
          item.id === emailId && complete ? { ...item, draft: undefined } : item
          ),
          submissions: [
          ...transition.submissions.filter((item) => item.emailId !== emailId),
          submission],

          auditTrail: [
          ...transition.auditTrail,
          {
            id: `au-${Date.now()}`,
            action: 'Form submitted',
            actor: `${transition.candidate.firstName} ${transition.candidate.lastName}`,
            at: submittedAt,
            detail: `${form?.name ?? email.subject} · ${partLabels[part]} · ${count} ${unit}${
            count === 1 ? '' : 's'}`
          }]

        };
      })
      );
    },
    [forms]
  );

  const value = useMemo<AppData>(
    () => ({
      canManageForms,
      currentUserId,
      oboPermissions,
      hasOboPermission,
      updateTaskStatus,
      cancelTransition,
      createForm,
      duplicateForm,
      deleteForm,
      tasks,
      templates,
      transitions,
      forms,
      addTask,
      addTemplate,
      deleteTasks,
      addTransition,
      setFieldState,
      toggleSection,
      setEmployeeDetailsEnabled,
      setPortalAccess,
      updateForm,
      addDocument,
      updateDocument,
      removeDocument,
      revokeEmail,
      sendTransitionForm,
      saveTransitionDraft,
      submitTransitionForm
    }),
    [
    canManageForms,
    currentUserId,
    oboPermissions,
    hasOboPermission,
    updateTaskStatus,
    cancelTransition,
    createForm,
    duplicateForm,
    deleteForm,
    tasks,
    templates,
    transitions,
    forms,
    addTask,
    addTemplate,
    deleteTasks,
    addTransition,
    setFieldState,
    toggleSection,
    setEmployeeDetailsEnabled,
    setPortalAccess,
    updateForm,
    addDocument,
    updateDocument,
    removeDocument,
    revokeEmail,
    sendTransitionForm,
    saveTransitionDraft,
    submitTransitionForm]

  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppData {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData must be used inside AppDataProvider');
  return context;
}