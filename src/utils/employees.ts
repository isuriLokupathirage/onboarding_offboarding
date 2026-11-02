import type { Employee, Transition } from '../types';
import { statusGroup } from './transitions';

const sameText = (a: string | undefined, b: string | undefined) =>
Boolean(a && b && a.trim().toLowerCase() === b.trim().toLowerCase());

/** Whether a transition is for this employee: matched on personal email, or on full name. */
export function isTransitionFor(transition: Transition, employee: Employee): boolean {
  const { candidate } = transition;
  if (candidate.personalEmail) return sameText(candidate.personalEmail, employee.personalEmail);
  return sameText(candidate.firstName, employee.firstName) && sameText(candidate.lastName, employee.lastName);
}

/** The employee's offboarding transition that is still in progress, if any. */
export function activeOffboardingFor(employee: Employee, transitions: Transition[]): Transition | undefined {
  return transitions.find(
    (transition) =>
    transition.kind === 'Offboarding' && statusGroup(transition) === 'Active' && isTransitionFor(transition, employee)
  );
}

/**
 * Why Start Offboarding is unavailable for this employee, or undefined when it can be used.
 * Permission is checked first, so the reason shown is the one the user can't work around.
 */
export function startOffboardingBlockReason(
employee: Employee,
transitions: Transition[],
canManageOffboarding: boolean)
: string | undefined {
  if (!canManageOffboarding) {
    return 'You need the Manage Offboarding Transitions permission (obo.offboarding.transition.manage).';
  }
  if (employee.status !== 'Active') {
    return 'This employee is deactivated, so offboarding can’t be started.';
  }
  if (activeOffboardingFor(employee, transitions)) {
    return 'This employee already has an offboarding transition in progress.';
  }
  return undefined;
}

/** Active employees who can be offboarded: no offboarding transition in progress. */
export function offboardableEmployees(employees: Employee[], transitions: Transition[]): Employee[] {
  return employees.filter(
    (employee) => employee.status === 'Active' && !activeOffboardingFor(employee, transitions)
  );
}
