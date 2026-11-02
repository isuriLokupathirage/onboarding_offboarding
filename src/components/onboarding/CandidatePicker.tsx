import { useMemo } from 'react';
import { SearchableSelect, type SearchableOption } from '../ui/SearchableSelect';
import type { RecruitmentCandidate } from '../../types';
import { candidateCampaign, candidateName } from '../../utils/recruitment';

/** Recruitment candidates, searchable by candidate or campaign name. */
export function CandidatePicker({
  candidates,
  value,
  onChange,
  disabled = false






}: {candidates: RecruitmentCandidate[];value: string;onChange: (id: string) => void;disabled?: boolean;}) {
  const options = useMemo<SearchableOption[]>(
    () =>
    candidates.map((candidate) => {
      const campaign = candidateCampaign(candidate);
      return {
        value: candidate.id,
        label: candidateName(candidate),
        description: campaign ? `${campaign.name} · ${campaign.jobTitle}` : undefined,
        keywords: campaign ? [campaign.name] : []
      };
    }),
    [candidates]
  );

  return (
    <SearchableSelect
      options={options}
      value={value}
      onChange={onChange}
      disabled={disabled}
      clearable
      withAvatars
      placeholder="Select a candidate"
      searchPlaceholder="Search by candidate or campaign name"
      emptyText="No candidates are ready for onboarding." />);


}
