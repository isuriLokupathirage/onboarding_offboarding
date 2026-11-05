import type { AuditEntry } from '../types';

/** Changes to employee records, newest last. Offboarding entries match the seeded transitions. */
export const seedEmployeeAudit: Record<string, AuditEntry[]> = {
  emp9: [
  {
    id: 'eau-emp9-1',
    action: 'Offboarding started',
    actor: 'Nimal Perera',
    at: '2026-08-29T09:00:00',
    detail: 'Standard Resignation Offboarding · Voluntary: Better Employment Opportunity · Last Working Date 18 Sept 2026'
  },
  {
    id: 'eau-emp9-2',
    action: 'Offboarding documents added',
    actor: 'Nimal Perera',
    at: '2026-08-29T09:00:00',
    detail: 'Resignation_Letter_Malith_Senanayake.pdf, Resignation_Acceptance_Letter.pdf'
  }],

  emp8: [
  {
    id: 'eau-emp8-1',
    action: 'Offboarding started',
    actor: 'Sanjaya Bandara',
    at: '2026-06-02T10:15:00',
    detail: 'Standard Resignation Offboarding · Involuntary: Redundancy · Last Working Date 27 Jun 2026'
  },
  {
    id: 'eau-emp8-2',
    action: 'Offboarding documents added',
    actor: 'Sanjaya Bandara',
    at: '2026-06-02T10:15:00',
    detail: 'Redundancy_Notice_Nethmi_Gunawardena.pdf, Final_Settlement_Statement.docx'
  },
  {
    id: 'eau-emp8-3',
    action: 'Exit details updated',
    actor: 'Nimal Perera',
    at: '2026-06-12T14:40:00',
    detail: 'Last Working Date: 27 Jun 2026 → 30 Jun 2026; Actual Exit Date: 27 Jun 2026 → 30 Jun 2026'
  },
  {
    id: 'eau-emp8-4',
    action: 'Employee deactivated',
    actor: 'Nimal Perera',
    at: '2026-07-01T08:30:00',
    detail: 'Offboarding completed'
  }]

};
