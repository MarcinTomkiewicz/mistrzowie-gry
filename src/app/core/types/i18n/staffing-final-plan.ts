import type { StaffingFinalPlanConflict, StaffingFinalPlanMaterialChangeType } from '../../interfaces/admin-staffing-final-plan';

export type StaffingFinalPlanCopy = {
  title: string;
  description: string;
  readOnly: string;
  noDays: string;
  noSlots: string;
  unfilled: string;
  assignments: string;
  hasConflicts: string;
  conflicts: Record<NonNullable<StaffingFinalPlanConflict>, string>;
  provenance: { proposed: string; coordinator: string; saved: string };
  addAssignment: string;
  save: string;
  invalid: string;
  validation: { duplicateCandidatePerSlot: string; effectivePlayersRange: string };
  loadFailed: string;
  candidateLoadFailed: string;
  noCandidates: string;
  noSessions: string;
  saveSuccess: string;
  saveFailed: string;
  preview: string;
  proposal: { title: string; empty: string };
  override: { title: string; hint: string; inherit: string; image: string };
  changes: {
    title: string;
    empty: string;
    before: string;
    after: string;
    types: Record<StaffingFinalPlanMaterialChangeType, string>;
  };
};
