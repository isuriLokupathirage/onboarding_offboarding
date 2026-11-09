import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type {
  EmailRecord,
  EmployeeForm,
  ExitDetailsDraft,
  FieldState,
  FormPart,
  FormSection,
  FormSubmission,
  ReportExportRecord,
  RequiredDocument,
  Task,
  Template,
  OboPermission,
  Transition,
  SubmittedDocument,
  TransitionKind,
  TransitionTaskStatus } from
'../types';
import { seedTasks } from '../data/tasks';
import { ALL_OBO_PERMISSIONS } from '../data/permissions';
import { seedTemplates } from '../data/templates';
import { seedTransitions } from '../data/transitions';
import { buildSections, seedForms } from '../data/forms';
import { peopleById } from '../data/people';
import {
  FORM_LINK_EXPIRY_DAYS,
  formEmailSubject,
  prototypeNow,
  canReceiveForm,
  canRevokeEmail,
  isOpenFormEmail,
  isTaskOpen,
  managePermissionFor,
  portalStatus,
  openFormEmail,
  statusGroup } from
'../utils/transitions';
import { addDays, formatDate, nextCode } from '../utils/format';
import { describeExitChanges, exitTargetDate, resolveExitDueDate } from '../utils/offboarding';
import { formParts, partLabels } from '../utils/portal';

interface AppData {
  canManageForms: boolean;
  /** Whether the tenant has purchased the Onboarding & Offboarding module. */
  oboModulePurchased: boolean;
  currentUserId: string;
  oboPermissions: OboPermission[];
  hasOboPermission: (permission: OboPermission) => boolean;
  /** Prototype only: lets testers try the module as different roles. */
  setOboPermissions: (permissions: OboPermission[]) => void;
  setOboModulePurchased: (purchased: boolean) => void;
  /** Whether the tenant has purchased the Recruitment module. Recruitment candidates can only be picked when it has. */
  recruitmentModulePurchased: boolean;
  setRecruitmentModulePurchased: (purchased: boolean) => void;
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
  /** Saves changes to an existing task. Its id and task code stay the same. */
  updateTask: (id: string, patch: Omit<Task, 'id' | 'code' | 'kind'>) => void;
  /** Saves changes to an existing template. Its id and template code stay the same. */
  updateTemplate: (id: string, patch: Pick<Template, 'name' | 'client' | 'employmentType' | 'taskIds'>) => void;
  /** Removes tasks. Their child tasks stay in the library without a parent. */
  deleteTasks: (ids: string[]) => void;
  deleteTemplates: (ids: string[]) => void;
  /** The next unused task code. Codes of deleted tasks are never issued again. */
  nextTaskCode: (kind: TransitionKind) => string;
  /** The next unused template code. Codes of deleted templates are never issued again. */
  nextTemplateCode: (kind: TransitionKind) => string;
  addTransition: (transition: Transition) => void;
  /**
   * Saves new exit details on an offboarding in progress. Due dates still calculated from the
   * exit dates are recalculated; overridden ones are kept. Returns what changed, empty when nothing did.
   */
  updateTransitionExit: (transitionId: string, next: ExitDetailsDraft) => string[];
  setFieldState: (formId: string, fieldId: string, state: FieldState) => void;
  toggleSection: (formId: string, sectionId: string) => void;
  setEmployeeDetailsEnabled: (formId: string, enabled: boolean) => void;
  setPortalAccess: (transitionId: string, access: Transition['portalAccess']) => void;
  updateForm: (formId: string, patch: Partial<EmployeeForm>) => void;
  addDocument: (formId: string, doc: RequiredDocument) => void;
  updateDocument: (formId: string, docId: string, patch: Partial<RequiredDocument>) => void;
  removeDocument: (formId: string, docId: string) => void;
  revokeEmail: (transitionId: string, emailId: string) => void;
  /** Closes the candidate's portal and expires every form still open in it. */
  cancelPortalAccess: (transitionId: string) => void;
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
  /** The Reports audit trail: every export, newest first. */
  reportExports: ReportExportRecord[];
  /** Records an export as the current user. Returns null without View Reports. */
  recordReportExport: (
  record: Omit<ReportExportRecord, 'id' | 'actor' | 'at'>)
  => ReportExportRecord | null;
}

/** Earlier exports, so the audit trail is not empty in the prototype. */
const seedReportExports: ReportExportRecord[] = [
{
  id: 'rx2',
  report: 'Offboarding Report',
  format: 'Excel',
  period: '01 Jul 2026 – 30 Sept 2026',
  filters: ['Organization unit: Engineering'],
  actor: 'Nimal Perera',
  at: '2026-09-14T10:42:00'
},
{
  id: 'rx1',
  report: 'Onboarding Report',
  format: 'PDF',
  period: '01 Jan 2026 – 31 Dec 2026',
  filters: [],
  actor: 'Dilani Jayawardena',
  at: '2026-09-02T15:18:00'
}];


const AppDataContext = createContext<AppData | null>(null);

const DEMO_ACCESS_KEY = 'obo-demo-access';

/** The role a tester picked, kept for this browser tab so a reload does not reset it. */
interface DemoAccess {
  permissions: OboPermission[];
  purchased: boolean;
  recruitmentPurchased: boolean;
}

function storedAccess(): Partial<DemoAccess> {
  try {
    return JSON.parse(sessionStorage.getItem(DEMO_ACCESS_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function storeAccess(access: DemoAccess): void {
  try {
    sessionStorage.setItem(DEMO_ACCESS_KEY, JSON.stringify(access));
  } catch {
    // Storage can be unavailable (private mode); the choice then lasts until reload.
  }
}

const DEFAULT_OBO_PERMISSIONS = ALL_OBO_PERMISSIONS;

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
  oboModulePurchased: initialPurchased,
  recruitmentModulePurchased: initialRecruitmentPurchased,
  currentUserId = 'u1',
  oboPermissions: initialPermissions
}: {
  children: React.ReactNode;
  canManageForms?: boolean;
  oboModulePurchased?: boolean;
  recruitmentModulePurchased?: boolean;
  currentUserId?: string;
  oboPermissions?: OboPermission[];
}) {
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [templates, setTemplates] = useState<Template[]>(seedTemplates);
  const [transitions, setTransitions] = useState<Transition[]>(seedTransitions);
  const [forms, setForms] = useState<EmployeeForm[]>(seedForms);
  const [reportExports, setReportExports] = useState<ReportExportRecord[]>(seedReportExports);
  // Props set by the design canvas win; otherwise the tester's last choice, then full access.
  const [oboPermissions, setPermissionsState] = useState<OboPermission[]>(
    () => initialPermissions ?? storedAccess().permissions ?? DEFAULT_OBO_PERMISSIONS
  );
  const [oboModulePurchased, setPurchasedState] = useState<boolean>(
    () => initialPurchased ?? storedAccess().purchased ?? true
  );
  const [recruitmentModulePurchased, setRecruitmentPurchasedState] = useState<boolean>(
    () => initialRecruitmentPurchased ?? storedAccess().recruitmentPurchased ?? true
  );
  const setOboPermissions = useCallback(
    (permissions: OboPermission[]) => {
      setPermissionsState(permissions);
      storeAccess({ permissions, purchased: oboModulePurchased, recruitmentPurchased: recruitmentModulePurchased });
    },
    [oboModulePurchased, recruitmentModulePurchased]
  );
  const setOboModulePurchased = useCallback(
    (purchased: boolean) => {
      setPurchasedState(purchased);
      storeAccess({ permissions: oboPermissions, purchased, recruitmentPurchased: recruitmentModulePurchased });
    },
    [oboPermissions, recruitmentModulePurchased]
  );
  const setRecruitmentModulePurchased = useCallback(
    (recruitmentPurchased: boolean) => {
      setRecruitmentPurchasedState(recruitmentPurchased);
      storeAccess({ permissions: oboPermissions, purchased: oboModulePurchased, recruitmentPurchased });
    },
    [oboPermissions, oboModulePurchased]
  );
// Every task and template code ever issued, including deleted ones, so a code is never reused.
  const [issuedCodes, setIssuedCodes] = useState<string[]>(() => [
  ...seedTasks.map((task) => task.code),
  ...seedTemplates.map((template) => template.code)]
  );

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

  const updateTransitionExit = useCallback(
    (transitionId: string, next: ExitDetailsDraft): string[] => {
      const current = transitions.find((transition) => transition.id === transitionId);
      if (
      !current?.exit ||
      statusGroup(current) !== 'Active' ||
      !oboPermissions.includes(managePermissionFor(current.kind)))

      return [];
      const changes = describeExitChanges(current.exit, next);
      if (changes.length === 0) return [];
      const actor = peopleById[currentUserId]?.name ?? currentUserId;
      const exit = { ...current.exit, ...next, otherReason: next.otherReason?.trim() || undefined };
      const targetDate = exitTargetDate(exit.dates) || current.targetDate;
      setTransitions((prev) =>
      prev.map((transition) => {
        if (transition.id !== transitionId) return transition;
        return {
          ...transition,
          exit,
          targetDate,
          candidate: { ...transition.candidate, hireDate: targetDate },
          tasks: transition.tasks.map((task) => {
            if (task.dueSource !== 'calculated' || !isTaskOpen(task)) return task;
            const due = resolveExitDueDate(tasks.find((item) => item.id === task.taskId)?.dueRule ?? null, exit.dates);
            return { ...task, dueDate: due, calculatedDueDate: due };
          }),
          auditTrail: [
          ...transition.auditTrail,
          {
            id: `au-${Date.now()}`,
            action: 'Exit details updated',
            actor,
            at: new Date().toISOString(),
            detail: changes.join('; ')
          }]

        };
      })
      );
      return changes;
    },
    [transitions, tasks, currentUserId, oboPermissions]
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
            detail: `Cancellation date ${formatDate(date)} · ${reason}`
          }]

        };
      })
      );
    },
    [currentUserId, oboPermissions]
  );

  const nextTaskCode = useCallback(
    (kind: TransitionKind) => nextCode(kind === 'Onboarding' ? 'ONB' : 'OFB', issuedCodes, 3),
    [issuedCodes]
  );
  const nextTemplateCode = useCallback(
    (kind: TransitionKind) => nextCode(kind === 'Onboarding' ? 'ONT' : 'OFT', issuedCodes, 3),
    [issuedCodes]
  );

  const addTask = useCallback((task: Task) => {
    setTasks((prev) => [...prev, task]);
    setIssuedCodes((prev) => [...prev, task.code]);
  }, []);
  const addTemplate = useCallback((template: Template) => {
    setTemplates((prev) => [...prev, template]);
    setIssuedCodes((prev) => [...prev, template.code]);
  }, []);
  const updateTask = useCallback((id: string, patch: Omit<Task, 'id' | 'code' | 'kind'>) => {
    setTasks((prev) => prev.map((task) => task.id === id ? { ...task, ...patch } : task));
  }, []);
  const updateTemplate = useCallback(
    (id: string, patch: Pick<Template, 'name' | 'client' | 'employmentType' | 'taskIds'>) => {
      setTemplates((prev) => prev.map((template) => template.id === id ? { ...template, ...patch } : template));
    },
    []
  );
  const deleteTasks = useCallback((ids: string[]) => {
    setTasks((prev) =>
    prev.
    filter((task) => !ids.includes(task.id)).
    map((task) =>
    task.parentId && ids.includes(task.parentId) ?
    { ...task, parentId: null, parentCompletionRequired: false } :
    task
    )
    );
    setTemplates((prev) =>
    prev.map((template) =>
    template.taskIds.some((id) => ids.includes(id)) ?
    { ...template, taskIds: template.taskIds.filter((id) => !ids.includes(id)) } :
    template
    )
    );
  }, []);
  const deleteTemplates = useCallback((ids: string[]) => {
    setTemplates((prev) => prev.filter((template) => !ids.includes(template.id)));
  }, []);
  const recordReportExport = useCallback(
    (record: Omit<ReportExportRecord, 'id' | 'actor' | 'at'>): ReportExportRecord | null => {
      if (!oboPermissions.includes('View Reports')) return null;
      const entry: ReportExportRecord = {
        ...record,
        id: `rx-${Date.now()}`,
        actor: peopleById[currentUserId]?.name ?? currentUserId,
        at: prototypeNow()
      };
      setReportExports((prev) => [entry, ...prev]);
      return entry;
    },
    [oboPermissions, currentUserId]
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
        const at = prototypeNow();
        const email = transition.emails.find((item) => item.id === emailId);
        const formName = forms.find((form) => form.id === email?.formId)?.name ?? email?.subject;
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
            at
          }],

          auditTrail: [
          ...transition.auditTrail,
          {
            id: `au-${Date.now()}`,
            action: 'Form revoked',
            actor,
            at,
            detail: `${formName} · removed from the candidate's portal`
          }]

        };
      })
      );
    },
    [currentUserId, forms]
  );

  const cancelPortalAccess = useCallback(
    (transitionId: string) => {
      const by = peopleById[currentUserId]?.name ?? currentUserId;
      const at = prototypeNow();
      setTransitions((prev) =>
      prev.map((transition) => {
        if (
        transition.id !== transitionId ||
        portalStatus(transition) !== 'Active' ||
        !oboPermissions.includes(managePermissionFor(transition.kind)))

        return transition;
        const open = transition.emails.filter((email) => isOpenFormEmail(transition, email));
        const formName = (email: EmailRecord) =>
        forms.find((form) => form.id === email.formId)?.name ?? email.subject;
        return {
          ...transition,
          portalAccess: 'Revoked',
          portalCancellation: { at, by },
          emails: transition.emails.map((email) =>
          open.some((item) => item.id === email.id) ? { ...email, expiredAt: at, draft: undefined } : email
          ),
          auditTrail: [
          ...transition.auditTrail,
          {
            id: `au-${Date.now()}-portal`,
            action: 'Portal access cancelled',
            actor: by,
            at,
            detail: `Portal closed · ${open.length} open form${open.length === 1 ? '' : 's'} expired`
          },
          ...open.map((email) => ({
            id: `au-${Date.now()}-${email.id}-expired`,
            action: 'Form expired',
            actor: by,
            at,
            detail: `${formName(email)} · expired when portal access was cancelled`
          }))]

        };
      })
      );
    },
    [currentUserId, oboPermissions, forms]
  );

  const sendTransitionForm = useCallback(
    (transitionIds: string[], formId: string) => {
      const form = forms.find((item) => item.id === formId);
      if (!form || !oboPermissions.includes('Manage Onboarding Transitions')) return;
      const stamp = Date.now();
      const sentAt = prototypeNow();
      const expiresAt = addDays(sentAt, FORM_LINK_EXPIRY_DAYS);
      const actor = peopleById[currentUserId]?.name ?? currentUserId;
      setTransitions((prev) =>
      prev.map((transition, index) => {
        if (!transitionIds.includes(transition.id) || !canReceiveForm(transition)) return transition;
        const emailId = `em-${stamp}-${index}`;
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
            subject: formEmailSubject(expiresAt),
            recipient: transition.candidate.personalEmail,
            sentAt,
            content: 'form',
            formId: form.id,
            linkExpiresAt: expiresAt,
            draftCarriedForward: Boolean(previous?.draft),
            draft: previous?.draft
          }],

          auditTrail: [
          ...transition.auditTrail,
          {
            id: `au-${stamp}-${index}`,
            action: 'Form sent',
            actor,
            at: sentAt,
            detail: `${form.code} ${form.name} · ${transition.candidate.personalEmail} · expires ${formatDate(expiresAt)}${
            previous ? ' · replaces the copy sent earlier' : ''}`
          }]

        };
      })
      );
    },
    [forms, oboPermissions, currentUserId]
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
      const submittedAt = prototypeNow();
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
      oboModulePurchased,
      currentUserId,
      oboPermissions,
      hasOboPermission,
      setOboPermissions,
      setOboModulePurchased,
      recruitmentModulePurchased,
      setRecruitmentModulePurchased,
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
      updateTask,
      updateTemplate,
      deleteTasks,
      deleteTemplates,
      nextTaskCode,
      nextTemplateCode,
      addTransition,
      updateTransitionExit,
      setFieldState,
      toggleSection,
      setEmployeeDetailsEnabled,
      setPortalAccess,
      updateForm,
      addDocument,
      updateDocument,
      removeDocument,
      revokeEmail,
      cancelPortalAccess,
      sendTransitionForm,
      saveTransitionDraft,
      submitTransitionForm,
      reportExports,
      recordReportExport
    }),
    [
    canManageForms,
    oboModulePurchased,
    currentUserId,
    oboPermissions,
    hasOboPermission,
    setOboPermissions,
    setOboModulePurchased,
    recruitmentModulePurchased,
    setRecruitmentModulePurchased,
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
    updateTask,
    updateTemplate,
    deleteTasks,
    deleteTemplates,
    nextTaskCode,
    nextTemplateCode,
    addTransition,
    updateTransitionExit,
    setFieldState,
    toggleSection,
    setEmployeeDetailsEnabled,
    setPortalAccess,
    updateForm,
    addDocument,
    updateDocument,
    removeDocument,
    revokeEmail,
    cancelPortalAccess,
    sendTransitionForm,
    saveTransitionDraft,
    submitTransitionForm,
    reportExports,
    recordReportExport]

  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppData {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData must be used inside AppDataProvider');
  return context;
}