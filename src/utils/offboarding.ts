import type {
  DueRule,
  Employee,
  ExitDetails,
  ExitDetailsDraft,
  ExitDocument,
  OffboardingMilestone,
  Task } from
'../types';
import { offboardingMilestones } from '../data/people';
import { OTHER_EXIT_REASON } from '../data/exitReasons';
import { applyDueRuleOffset } from './format';

export type ExitDates = ExitDetails['dates'];

const isExitDate = (milestone: string): milestone is OffboardingMilestone =>
(offboardingMilestones as string[]).includes(milestone);

/** An offboarding task's due date from the exit date its rule names, or null when that date is not entered. */
export function resolveExitDueDate(rule: DueRule | null, dates: ExitDates): string | null {
  if (!rule || !isExitDate(rule.milestone)) return null;
  const base = dates[rule.milestone];
  return base ? applyDueRuleOffset(base, rule) : null;
}

/** For each exit date, how many of these tasks calculate their due date from it. A date with no tasks stays optional. */
export function exitDateUsage(tasks: Task[]): Partial<Record<OffboardingMilestone, number>> {
  const usage: Partial<Record<OffboardingMilestone, number>> = {};
  tasks.forEach((task) => {
    const milestone = task.dueRule?.milestone;
    if (milestone && isExitDate(milestone)) usage[milestone] = (usage[milestone] ?? 0) + 1;
  });
  return usage;
}

export interface ExitDetailsErrors {
  reason?: string;
  otherReason?: string;
  dates: OffboardingMilestone[];
}

/** What still blocks Step 2: the exit reason, the Other reason and any mandatory date left blank. */
export function exitDetailsErrors(exit: ExitDetailsDraft, requiredDates: OffboardingMilestone[]): ExitDetailsErrors {
  return {
    reason: exit.reason ? undefined : 'Select an exit reason',
    otherReason:
    exit.reason === OTHER_EXIT_REASON && !exit.otherReason?.trim() ? 'Specify the exit reason' : undefined,
    dates: requiredDates.filter((milestone) => !exit.dates[milestone])
  };
}

export const hasExitErrors = (errors: ExitDetailsErrors): boolean =>
Boolean(errors.reason || errors.otherReason || errors.dates.length > 0);

/**
 * The date the offboarding works towards: the Last Working Date, else the Actual Exit Date,
 * else the latest date entered. Empty when no date is entered.
 */
export function exitTargetDate(dates: ExitDates): string {
  if (dates['Last Working Date']) return dates['Last Working Date'];
  if (dates['Actual Exit Date']) return dates['Actual Exit Date'];
  return Object.values(dates).filter((value): value is string => Boolean(value)).sort().pop() ?? '';
}

/** The reason as it should read on the transition: the typed reason when Other was picked. */
export function exitReasonLabel(exit: ExitDetailsDraft): string {
  return exit.reason === OTHER_EXIT_REASON ? exit.otherReason?.trim() || OTHER_EXIT_REASON : exit.reason;
}

export const employeeFullName = (employee: Employee): string => `${employee.firstName} ${employee.lastName}`;

/* ---------- Exit documents ---------- */

export const EXIT_DOCUMENT_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'docx'];
export const EXIT_DOCUMENT_ACCEPT = EXIT_DOCUMENT_EXTENSIONS.map((extension) => `.${extension}`).join(',');
export const EXIT_DOCUMENTS_MAX_BYTES = 25 * 1024 * 1024;

const extensionOf = (name: string) => name.split('.').pop()?.toLowerCase() ?? '';

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Adds picked files to the exit documents. Files in another format are refused, and so is the
 * whole pick when it would take the combined size over 25 MB.
 */
export function addExitDocuments(
current: ExitDocument[],
picked: {name: string;size: number;}[])
: {documents: ExitDocument[];error?: string;} {
  const unsupported = picked.filter((file) => !EXIT_DOCUMENT_EXTENSIONS.includes(extensionOf(file.name)));
  const accepted = picked.filter((file) => !unsupported.includes(file));
  const errors: string[] = [];
  if (unsupported.length > 0) {
    errors.push(
      `${unsupported.map((file) => file.name).join(', ')} ${unsupported.length === 1 ? 'is' : 'are'} not a PDF, PNG, JPG, JPEG or DOCX file.`
    );
  }
  const used = current.reduce((total, doc) => total + doc.bytes, 0);
  const adding = accepted.reduce((total, file) => total + file.size, 0);
  if (accepted.length > 0 && used + adding > EXIT_DOCUMENTS_MAX_BYTES) {
    errors.push(
      `Adding ${accepted.length === 1 ? accepted[0].name : `these ${accepted.length} files`} (${formatFileSize(adding)}) would take the documents over the 25 MB total. ${formatFileSize(EXIT_DOCUMENTS_MAX_BYTES - used)} is left.`
    );
    return { documents: current, error: errors.join(' ') };
  }
  const stamp = Date.now();
  return {
    documents: [
    ...current,
    ...accepted.map((file, index) => ({ id: `exd-${stamp}-${index}`, name: file.name, bytes: file.size }))],

    error: errors.length > 0 ? errors.join(' ') : undefined
  };
}
