import type { Department, EmploymentType } from '../types';
import { clients, departments } from './people';

/** One employment, as headcount counts it. People who have left also carry their exit date. */
export interface EmploymentRecord {
  organizationUnit: Department;
  employmentType: EmploymentType;
  client: string;
  joinedOn: string;
  leftOn?: string;
}

/**
 * Employment records are kept from this date. Before it, headcount cannot be determined, so turnover
 * for a period that starts earlier is unavailable.
 */
export const HEADCOUNT_RECORDS_FROM = '2025-01-01';

// Weighted so the larger organization units hold more people.
const UNIT_PATTERN: Department[] = [
'Engineering',
'IT Ops',
'Finance',
'Engineering',
'HR',
'Security',
'Engineering',
'IT Ops',
'Finance',
'Engineering'];


const typeFor = (index: number): EmploymentType => {
  const slot = index % 10;
  if (slot < 7) return 'Permanent';
  if (slot < 9) return 'Contract';
  return index % 20 === 9 ? 'Internship' : 'Consultant';
};

const addDays = (iso: string, days: number) => {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

/**
 * People employed now who have not left. Joining dates run from 2014 to mid-2026, so headcount
 * grows across the period. Leavers come from completed offboardings and are added in the report.
 */
export const currentStaff: EmploymentRecord[] = Array.from({ length: 130 }, (_, index) => ({
  organizationUnit: UNIT_PATTERN[index % UNIT_PATTERN.length] ?? departments[0],
  employmentType: typeFor(index),
  client: clients[(index * 3 + 1) % clients.length],
  joinedOn: addDays('2014-01-06', index * 35)
}));
