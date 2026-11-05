import type { RecruitmentCampaign, RecruitmentCandidate, Transition } from '../types';
import { campaignsById } from '../data/campaigns';
import { statusGroup } from './transitions';

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export function candidateName(candidate: RecruitmentCandidate): string {
  return `${candidate.firstName} ${candidate.lastName}`;
}

export function candidateCampaign(candidate: RecruitmentCandidate): RecruitmentCampaign | undefined {
  return campaignsById[candidate.campaignId];
}

/** The same person: matched on personal email, or on full name when no email was extracted. */
function isSamePerson(candidate: RecruitmentCandidate, transition: Transition): boolean {
  if (candidate.personalEmail) return same(transition.candidate.personalEmail, candidate.personalEmail);
  return same(`${transition.candidate.firstName} ${transition.candidate.lastName}`, candidateName(candidate));
}

/** Candidates who can be onboarded: anyone without an active onboarding transition. */
export function onboardableCandidates(
candidates: RecruitmentCandidate[],
transitions: Transition[])
: RecruitmentCandidate[] {
  const active = transitions.filter(
    (transition) => transition.kind === 'Onboarding' && statusGroup(transition) === 'Active'
  );
  return candidates.filter((candidate) => !active.some((transition) => isSamePerson(candidate, transition)));
}

/** Matches on the candidate's full name or their campaign name. */
export function matchesCandidate(candidate: RecruitmentCandidate, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return (
    candidateName(candidate).toLowerCase().includes(needle) ||
    (candidateCampaign(candidate)?.name.toLowerCase().includes(needle) ?? false));

}
