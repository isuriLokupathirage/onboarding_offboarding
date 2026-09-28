import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type {
  EmployeeForm,
  FieldState,
  FormSection,
  RequiredDocument,
  Task,
  Template,
  Transition } from
'../types';
import { seedTasks } from '../data/tasks';
import { seedTemplates } from '../data/templates';
import { seedTransitions } from '../data/transitions';
import { buildSections, seedForms } from '../data/forms';

interface AppData {
  canManageForms: boolean;
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
  resendEmail: (transitionId: string, emailId: string) => void;
}

const AppDataContext = createContext<AppData | null>(null);

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
  canManageForms = true



}: {children: React.ReactNode;canManageForms?: boolean;}) {
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [templates, setTemplates] = useState<Template[]>(seedTemplates);
  const [transitions, setTransitions] = useState<Transition[]>(seedTransitions);
  const [forms, setForms] = useState<EmployeeForm[]>(seedForms);

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

  const revokeEmail = useCallback((transitionId: string, emailId: string) => {
    setTransitions((prev) =>
    prev.map((transition) =>
    transition.id === transitionId ?
    {
      ...transition,
      emails: transition.emails.map((email) =>
      email.id === emailId ? { ...email, status: 'Revoked' } : email
      )
    } :
    transition
    )
    );
  }, []);

  const resendEmail = useCallback((transitionId: string, emailId: string) => {
    const now = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    setTransitions((prev) =>
    prev.map((transition) =>
    transition.id === transitionId ?
    {
      ...transition,
      emails: transition.emails.map((email) =>
      email.id === emailId ?
      { ...email, status: 'Delivered', sentAt: `${now}, just now` } :
      email
      )
    } :
    transition
    )
    );
  }, []);

  const value = useMemo<AppData>(
    () => ({
      canManageForms,
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
      resendEmail
    }),
    [
    canManageForms,
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
    resendEmail]

  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppData {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData must be used inside AppDataProvider');
  return context;
}