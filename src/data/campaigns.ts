import type { RecruitmentCampaign } from '../types';

/** Recruitment campaigns. A candidate's Job Title comes from their campaign. */
export const campaigns: RecruitmentCampaign[] = [
{ id: 'cmp1', name: 'Frontend Engineers – Q4 2026', jobTitle: 'Frontend Engineer' },
{ id: 'cmp2', name: 'Backend Engineers – Q4 2026', jobTitle: 'Backend Engineer' },
{ id: 'cmp3', name: 'Finance Graduate Intake 2026', jobTitle: 'Finance Analyst' },
{ id: 'cmp4', name: 'Warehouse & Logistics Hiring', jobTitle: 'Logistics Coordinator' },
{ id: 'cmp5', name: 'QA Engineers – Q4 2026', jobTitle: 'QA Engineer' },
{ id: 'cmp6', name: 'Design Team Expansion', jobTitle: 'Senior UX Designer' },
{ id: 'cmp7', name: 'Mobile Engineers – Q3 2026', jobTitle: 'Mobile Engineer' },
{ id: 'cmp8', name: 'Software Engineers – Q3 2026', jobTitle: 'Software Engineer' },
{ id: 'cmp9', name: 'Engineering Internship 2026', jobTitle: 'Engineering Intern' }];


export const campaignsById: Record<string, RecruitmentCampaign> = Object.fromEntries(
  campaigns.map((campaign) => [campaign.id, campaign])
);
