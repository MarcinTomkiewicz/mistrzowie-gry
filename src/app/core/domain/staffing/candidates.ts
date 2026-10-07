import type { StaffingCandidate } from '../../interfaces/staffing-candidate';

export function isCurrentStaffingCandidate(candidate: StaffingCandidate): boolean {
  return candidate.withdrawnAt === null &&
    candidate.gmDecision !== 'rejected' && candidate.adminDecision !== 'rejected';
}

export function selectCurrentStaffingCandidates(candidates: readonly StaffingCandidate[]): StaffingCandidate[] {
  const currentByGm = new Map<string, StaffingCandidate>();
  for (const candidate of candidates) {
    const key = `${candidate.realizationId}:${candidate.gmUserId}`;
    const previous = currentByGm.get(key);
    if (!previous || compareCandidates(candidate, previous) > 0) {
      currentByGm.set(key, candidate);
    }
  }
  return [...currentByGm.values()];
}

function compareCandidates(candidate: StaffingCandidate, previous: StaffingCandidate): number {
  return Number(isCurrentStaffingCandidate(candidate)) - Number(isCurrentStaffingCandidate(previous)) ||
    Date.parse(candidate.createdAt) - Date.parse(previous.createdAt) ||
    Date.parse(candidate.updatedAt) - Date.parse(previous.updatedAt) ||
    candidate.id.localeCompare(previous.id);
}
