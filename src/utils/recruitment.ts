import type { RecruitmentCandidate, Transition } from '../types';
import { statusGroup } from './transitions';

const sameEmail = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Candidates who can be onboarded: anyone without an active onboarding transition. */
export function onboardableCandidates(
candidates: RecruitmentCandidate[],
transitions: Transition[])
: RecruitmentCandidate[] {
  const active = transitions.filter(
    (transition) => transition.kind === 'Onboarding' && statusGroup(transition) === 'Active'
  );
  return candidates.filter(
    (candidate) => !active.some((transition) => sameEmail(transition.candidate.personalEmail, candidate.personalEmail))
  );
}

export function candidateName(candidate: RecruitmentCandidate): string {
  return `${candidate.firstName} ${candidate.lastName}`;
}

/** Matches on the candidate's full name or their campaign name. */
export function matchesCandidate(candidate: RecruitmentCandidate, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return (
    candidateName(candidate).toLowerCase().includes(needle) ||
    candidate.campaignName.toLowerCase().includes(needle));

}
