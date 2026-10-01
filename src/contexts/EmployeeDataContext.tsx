import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type {
  ChangedValue,
  Employee,
  EmployeeFormAssignment,
  FormActivityAction,
  SubmittedDocument } from
'../types';
import { employees as seedEmployees } from '../data/employees';
import { seedAssignments } from '../data/employeeAssignments';
import { addDays } from '../utils/format';

export const EXPIRY_DAYS = 14;

/** A form the employee can still complete. Only open forms can be revoked. */
export function isOpenAssignment(assignment: EmployeeFormAssignment): boolean {
  return assignment.status === 'Sent' && new Date(assignment.expiresAt).getTime() >= Date.now();
}

interface EmployeeData {
  currentUser: string;
  canSendForms: boolean;
  employees: Employee[];
  assignments: EmployeeFormAssignment[];
  assignmentsFor: (employeeId: string) => EmployeeFormAssignment[];
  latestAssignment: (employeeId: string) => EmployeeFormAssignment | undefined;
  sendForm: (employeeIds: string[], formId: string, formName: string) => void;
  /** Returns false when the form is no longer open (submitted, expired or already revoked). */
  revokeForm: (assignmentId: string) => boolean;
  saveDraft: (
  assignmentId: string,
  responses: Record<string, string>,
  documentDrafts?: Record<string, string[]>)
  => void;
  submitAssignment: (
  assignmentId: string,
  responses: Record<string, string>,
  labels: Record<string, string>,
  documents: SubmittedDocument[])
  => void;
}

const EmployeeDataContext = createContext<EmployeeData | null>(null);

export function EmployeeDataProvider({
  children,
  canSendForms = true,
  currentUser = 'Nimal Perera'




}: {children: React.ReactNode;canSendForms?: boolean;currentUser?: string;}) {
  const [employees, setEmployees] = useState<Employee[]>(seedEmployees);
  const [assignments, setAssignments] = useState<EmployeeFormAssignment[]>(seedAssignments);

  const log = useCallback(
    (action: FormActivityAction, actor: string, detail?: string) => ({
      id: `act-${Date.now()}-${Math.round(Math.random() * 1000)}`,
      action,
      detail,
      actor,
      at: new Date().toISOString()
    }),
    []
  );

  const assignmentsFor = useCallback(
    (employeeId: string) =>
    assignments.
    filter((assignment) => assignment.employeeId === employeeId).
    sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()),
    [assignments]
  );

  const latestAssignment = useCallback(
    (employeeId: string) => assignmentsFor(employeeId)[0],
    [assignmentsFor]
  );

  const sendForm = useCallback(
    (employeeIds: string[], formId: string, formName: string) => {
      if (!canSendForms) return;
      const now = new Date().toISOString();
      const created: EmployeeFormAssignment[] = employeeIds.map((employeeId, index) => ({
        id: `asg-${Date.now()}-${index}`,
        employeeId,
        formId,
        formName,
        status: 'Sent',
        sentAt: now,
        expiresAt: addDays(now, EXPIRY_DAYS),
        submittedAt: null,
        draftSaved: false,
        responses: {},
        documentDrafts: {},
        submittedDocuments: [],
        changes: [],
        activity: [log('Sent', currentUser, formName)]
      }));
      setAssignments((prev) => [...created, ...prev]);
    },
    [canSendForms, currentUser, log]
  );

  const revokeForm = useCallback(
    (assignmentId: string) => {
      if (!canSendForms) return false;
      const target = assignments.find((assignment) => assignment.id === assignmentId);
      if (!target || !isOpenAssignment(target)) return false;
      setAssignments((prev) =>
      prev.map((assignment) =>
      assignment.id === assignmentId && isOpenAssignment(assignment) ?
      {
        ...assignment,
        status: 'Revoked',
        activity: [...assignment.activity, log('Revoked', currentUser)]
      } :
      assignment
      )
      );
      return true;
    },
    [assignments, canSendForms, currentUser, log]
  );

  const saveDraft = useCallback(
    (
    assignmentId: string,
    responses: Record<string, string>,
    documentDrafts?: Record<string, string[]>) =>
    {
      setAssignments((prev) =>
      prev.map((assignment) => {
        if (assignment.id !== assignmentId || !isOpenAssignment(assignment)) return assignment;
        return {
          ...assignment,
          draftSaved: true,
          responses,
          documentDrafts: documentDrafts ?? assignment.documentDrafts
        };
      })
      );
    },
    []
  );

  const submitAssignment = useCallback(
    (
    assignmentId: string,
    responses: Record<string, string>,
    labels: Record<string, string>,
    documents: SubmittedDocument[]) =>
    {
      const now = new Date().toISOString();
      const assignment = assignments.find((item) => item.id === assignmentId);
      if (!assignment || !isOpenAssignment(assignment)) return;
      const employee = employees.find((item) => item.id === assignment.employeeId);
      const actor = employee ? `${employee.firstName} ${employee.lastName}` : 'Employee';

      const changes: ChangedValue[] = Object.entries(responses).
      filter(([fieldId, value]) => {
        const previous = employee?.record[fieldId];
        return previous !== undefined && value.trim() !== '' && value.trim() !== previous;
      }).
      map(([fieldId, value]) => ({
        fieldId,
        label: labels[fieldId] ?? fieldId,
        previous: employee?.record[fieldId] ?? '',
        submitted: value.trim()
      }));

      if (employee && changes.length > 0) {
        const applied = Object.fromEntries(changes.map((change) => [change.fieldId, change.submitted]));
        setEmployees((prev) =>
        prev.map((item) =>
        item.id === employee.id ? { ...item, record: { ...item.record, ...applied } } : item
        )
        );
      }

      setAssignments((prev) =>
      prev.map((item) =>
      item.id === assignmentId ?
      {
        ...item,
        status: 'Submitted',
        submittedAt: now,
        draftSaved: false,
        documentDrafts: {},
        submittedDocuments: documents,
        responses,
        changes,
        activity: [
        ...item.activity,
        log(
          'Submitted',
          actor,
          changes.length > 0 ?
          `${changes.length} value${changes.length === 1 ? '' : 's'} updated on the employee profile` :
          'Details confirmed with no changes'
        ),
        ...changes.map((change) =>
        log(
          'Profile updated',
          actor,
          `${change.label}: ${change.previous} → ${change.submitted}`
        )
        )]

      } :
      item
      )
      );
    },
    [assignments, employees, log]
  );

  const value = useMemo<EmployeeData>(
    () => ({
      currentUser,
      canSendForms,
      employees,
      assignments,
      assignmentsFor,
      latestAssignment,
      sendForm,
      revokeForm,
      saveDraft,
      submitAssignment
    }),
    [
    currentUser,
    canSendForms,
    employees,
    assignments,
    assignmentsFor,
    latestAssignment,
    sendForm,
    revokeForm,
    saveDraft,
    submitAssignment]

  );

  return <EmployeeDataContext.Provider value={value}>{children}</EmployeeDataContext.Provider>;
}

export function useEmployeeData(): EmployeeData {
  const context = useContext(EmployeeDataContext);
  if (!context) throw new Error('useEmployeeData must be used inside EmployeeDataProvider');
  return context;
}