import type { StaffingCandidateSessionMapping } from '../../interfaces/staffing-candidate-session-proposals';
import { compareByPosition } from '../../utils/compare-by-position';

export function normalizeStaffingSessionMappings(
  mappings: readonly StaffingCandidateSessionMapping[],
  requiredSessionMappingsPerSlot: number | null,
): StaffingCandidateSessionMapping[] {
  const sorted = [...mappings].sort(compareByPosition);
  return requiredSessionMappingsPerSlot === null ? sorted : sorted.slice(0, requiredSessionMappingsPerSlot);
}
