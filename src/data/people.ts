import type { Department, Person } from '../types';

export const departments: Department[] = ['HR', 'IT Ops', 'Engineering', 'Finance', 'Security'];

export const people: Person[] = [
{ id: 'u1', name: 'Nimal Perera', role: 'HR Manager', department: 'HR', canUpdateTaskProgress: true },
{ id: 'u2', name: 'Kasun Fernando', role: 'IT Ops Lead', department: 'IT Ops', canUpdateTaskProgress: true },
{ id: 'u3', name: 'Dilani Jayawardena', role: 'HR Executive', department: 'HR', canUpdateTaskProgress: true },
{ id: 'u4', name: 'Ruwan Silva', role: 'Engineering Manager', department: 'Engineering', canUpdateTaskProgress: true },
{ id: 'u5', name: 'Thilini Gunasekara', role: 'Finance Executive', department: 'Finance', canUpdateTaskProgress: true },
{ id: 'u6', name: 'Sanjaya Bandara', role: 'Security Officer', department: 'Security', canUpdateTaskProgress: true },
{ id: 'u7', name: 'Amaya Wickramasinghe', role: 'Talent Acquisition Lead', department: 'HR', canUpdateTaskProgress: true },
{ id: 'u8', name: 'Pradeep Rathnayake', role: 'Systems Administrator', department: 'IT Ops', canUpdateTaskProgress: true },
{ id: 'u9', name: 'Ishara Mendis', role: 'Tech Lead', department: 'Engineering', canUpdateTaskProgress: true },
{ id: 'u10', name: 'Chathuri Ekanayake', role: 'Payroll Officer', department: 'Finance', canUpdateTaskProgress: true },
{ id: 'u11', name: 'Harsha Dias', role: 'Recruitment Coordinator', department: 'HR', canUpdateTaskProgress: false },
{ id: 'u12', name: 'Menaka Rodrigo', role: 'Finance Assistant', department: 'Finance', canUpdateTaskProgress: false }];


export const peopleById: Record<string, Person> = people.reduce(
  (acc, p) => {
    acc[p.id] = p;
    return acc;
  },
  {} as Record<string, Person>
);

export function personName(id: string): string {
  return peopleById[id]?.name ?? 'Unassigned';
}

export function initials(name: string): string {
  return name.
  split(' ').
  filter(Boolean).
  slice(0, 2).
  map((part) => part[0]?.toUpperCase() ?? '').
  join('');
}

const avatarPalette = [
'bg-brand-100 text-brand-700',
'bg-sky-100 text-sky-700',
'bg-emerald-100 text-emerald-700',
'bg-violet-100 text-violet-700',
'bg-rose-100 text-rose-700',
'bg-amber-100 text-amber-700',
'bg-teal-100 text-teal-700'];


export function avatarColor(seed: string): string {
  let total = 0;
  for (let i = 0; i < seed.length; i += 1) total += seed.charCodeAt(i);
  return avatarPalette[total % avatarPalette.length];
}

export const clients = [
'Accxis Holdings (Pvt) Ltd',
'Zenlanka Technologies',
'Ceylon Fin Services',
'Serendib Logistics'];


export const employmentTypes = ['Permanent', 'Contract', 'Internship', 'Consultant'] as const;

export const milestones = [
'Hire Date',
'First Working Day',
'End of First Week',
'End of First Month',
'Probation End Date'] as
const;