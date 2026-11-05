import type { OffboardingType } from '../types';

export const OFFBOARDING_TYPES: OffboardingType[] = ['Voluntary', 'Involuntary', 'Mutual'];

/** Picking this reason asks for the reason in free text. */
export const OTHER_EXIT_REASON = 'Other';

export const exitReasons: Record<OffboardingType, string[]> = {
  Voluntary: [
  'Career Advancement',
  'Better Employment Opportunity',
  'Personal Reasons',
  'Family Commitments',
  'Relocation',
  'Further Education',
  'Retirement',
  'Health Reasons',
  'Compensation and Benefits',
  'Work-Life Balance',
  'Job Dissatisfaction',
  'Work Environment',
  'Change of Career',
  OTHER_EXIT_REASON],

  Involuntary: [
  'Poor Performance',
  'Misconduct',
  'Violation of Company Policies',
  'Redundancy',
  'Organizational Restructuring',
  'Position Elimination',
  'Failed Probation',
  'Attendance or Disciplinary Issues',
  'Business Closure',
  OTHER_EXIT_REASON],

  Mutual: [
  'Mutual Agreement',
  'Mutual Separation Agreement',
  'Contract Non-Renewal',
  'Organizational Changes',
  'Retirement by Mutual Agreement',
  'Health or Personal Circumstances',
  OTHER_EXIT_REASON]

};
