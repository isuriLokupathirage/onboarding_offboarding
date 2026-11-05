import type { RecruitmentCandidate } from '../types';

/**
 * Candidates who have completed a recruitment workflow. Anushka, Hiruni and Tharindu already
 * have active onboarding transitions, so they are not offered when starting a new one. Oshadi's
 * onboarding is completed and Supun's was cancelled, so they can be picked again. Dilini's
 * application had no mobile number, date of birth, address or agreed start date, so those
 * stay blank for manual entry.
 */
export const recruitmentCandidates: RecruitmentCandidate[] = [
{
  id: 'rc1',
  firstName: 'Sachini',
  lastName: 'Herath',
  personalEmail: 'sachini.herath@gmail.com',
  mobile: '+94 77 903 4416',
  campaignId: 'cmp1',
  offeredStartDate: '2026-12-01',
  workflowCompletedOn: '2026-10-24',
  dateOfBirth: '1998-04-12',
  gender: 'Female',
  country: 'Sri Lanka',
  address: '42 Flower Road, Colombo 07'
},
{
  id: 'rc2',
  firstName: 'Kasun',
  lastName: 'Bandara',
  personalEmail: 'kasun.bandara@gmail.com',
  mobile: '+94 71 552 8810',
  campaignId: 'cmp2',
  offeredStartDate: '2026-12-08',
  workflowCompletedOn: '2026-10-27',
  dateOfBirth: '1996-11-03',
  gender: 'Male',
  country: 'Sri Lanka',
  address: '7 Temple Lane, Kandy'
},
{
  id: 'rc3',
  firstName: 'Dilini',
  lastName: 'Fernando',
  personalEmail: 'dilini.fernando@gmail.com',
  campaignId: 'cmp3',
  workflowCompletedOn: '2026-10-20',
  gender: 'Female',
  country: 'Sri Lanka'
},
{
  id: 'rc4',
  firstName: 'Ruwan',
  lastName: 'Jayawardena',
  personalEmail: 'ruwan.jaya@gmail.com',
  mobile: '+94 77 640 5521',
  campaignId: 'cmp4',
  offeredStartDate: '2026-11-24',
  workflowCompletedOn: '2026-10-29',
  dateOfBirth: '1993-02-18',
  gender: 'Male',
  country: 'Sri Lanka',
  address: '15 Station Road, Negombo'
},
{
  id: 'rc5',
  firstName: 'Priyanka',
  lastName: 'Nair',
  personalEmail: 'priyanka.nair@gmail.com',
  mobile: '+91 98450 22714',
  campaignId: 'cmp5',
  offeredStartDate: '2026-12-15',
  workflowCompletedOn: '2026-10-30',
  gender: 'Female',
  country: 'India'
},
{
  id: 'rc6',
  firstName: 'Oshadi',
  lastName: 'Fonseka',
  personalEmail: 'oshadi.fonseka@gmail.com',
  mobile: '+94 70 334 9182',
  campaignId: 'cmp6',
  offeredStartDate: '2026-12-01',
  workflowCompletedOn: '2026-10-22',
  gender: 'Female',
  country: 'Sri Lanka'
},
{
  id: 'rc7',
  firstName: 'Supun',
  lastName: 'Abeywickrama',
  personalEmail: 'supun.abeywickrama@gmail.com',
  mobile: '+94 72 905 6637',
  campaignId: 'cmp7',
  offeredStartDate: '2026-11-20',
  workflowCompletedOn: '2026-10-15',
  gender: 'Male',
  country: 'Sri Lanka'
},
{
  id: 'rc8',
  firstName: 'Anushka',
  lastName: 'Rajapaksha',
  personalEmail: 'anushka.rajapaksha@gmail.com',
  mobile: '+94 77 212 4408',
  campaignId: 'cmp8',
  offeredStartDate: '2026-09-22',
  workflowCompletedOn: '2026-09-02'
},
{
  id: 'rc9',
  firstName: 'Hiruni',
  lastName: 'Dissanayake',
  personalEmail: 'hiruni.dissa@gmail.com',
  mobile: '+94 71 830 1175',
  campaignId: 'cmp9',
  offeredStartDate: '2026-10-05',
  workflowCompletedOn: '2026-09-08'
},
{
  id: 'rc10',
  firstName: 'Tharindu',
  lastName: 'Alwis',
  personalEmail: 'tharindu.alwis@gmail.com',
  mobile: '+94 76 447 2290',
  campaignId: 'cmp3',
  offeredStartDate: '2026-10-12',
  workflowCompletedOn: '2026-09-12'
}];
