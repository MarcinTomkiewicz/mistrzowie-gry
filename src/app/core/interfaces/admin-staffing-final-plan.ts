import type { SessionSourceKind } from '../types/session-source';
import type { SessionDifficultyLevel } from '../types/sessions';

export type StaffingFinalPlanSourceKind = SessionSourceKind;
export type StaffingFinalSessionDifficultyLevel = `${SessionDifficultyLevel}`;
export type StaffingFinalPlanConflict = 'candidate_not_confirmed' | 'participation_ended' | null;

export interface StaffingFinalSessionSnapshot {
  systemId: string;
  title: string;
  description: string;
  image: string;
  difficultyLevel: StaffingFinalSessionDifficultyLevel;
  minPlayers: number;
  maxPlayers: number;
  minAge: number;
  hasReadyCharacterSheets: boolean;
  allowsScenarioCustomization: boolean;
  sourceUpdatedAt: string;
}

export interface StaffingFinalSessionOverride {
  title?: string;
  description?: string;
  image?: string;
  difficultyLevel?: StaffingFinalSessionDifficultyLevel;
  minPlayers?: number;
  maxPlayers?: number;
  minAge?: number;
  hasReadyCharacterSheets?: boolean;
  allowsScenarioCustomization?: boolean;
}

export interface StaffingFinalSessionOverrideInput {
  title?: string | null;
  description?: string | null;
  image?: string | null;
  difficultyLevel?: StaffingFinalSessionDifficultyLevel | null;
  minPlayers?: number | null;
  maxPlayers?: number | null;
  minAge?: number | null;
  hasReadyCharacterSheets?: boolean | null;
  allowsScenarioCustomization?: boolean | null;
}

export type StaffingFinalEffectiveSession = StaffingFinalSessionSnapshot;

export interface AdminStaffingFinalPlanAssignment {
  id: string;
  candidateId: string;
  gmUserId: string;
  position: number;
  sourceKind: StaffingFinalPlanSourceKind;
  sessionId: string;
  selectedFromCandidateProposal: boolean;
  sessionSnapshot: StaffingFinalSessionSnapshot;
  sessionOverride: StaffingFinalSessionOverride;
  effectiveSession: StaffingFinalEffectiveSession;
  participationActive: boolean;
  conflict: StaffingFinalPlanConflict;
}

export interface AdminStaffingFinalPlanSlot {
  slotId: string;
  label: string;
  startTime: string;
  endTime: string;
  position: number;
  assignments: AdminStaffingFinalPlanAssignment[];
}

export interface AdminStaffingFinalPlanDay {
  dayId: string;
  date: string;
  requiredGmCount: number;
  slots: AdminStaffingFinalPlanSlot[];
}

export interface AdminStaffingFinalPlan {
  realizationId: string;
  editable: boolean;
  hasConflicts: boolean;
  days: AdminStaffingFinalPlanDay[];
}

export interface StaffingFinalPlanPersistedItem extends AdminStaffingFinalPlanAssignment {
  slotId: string;
}

export interface StaffingFinalPlanSaveItem {
  id?: string | null;
  slotId: string;
  candidateId: string;
  sourceKind: StaffingFinalPlanSourceKind;
  sessionId: string;
  position: number;
  sessionOverride?: StaffingFinalSessionOverrideInput | null;
}

export type StaffingFinalPlanExistingChangeType =
  | 'gm_changed'
  | 'slot_changed'
  | 'session_changed'
  | 'session_override_changed';

export type StaffingFinalPlanMaterialChangeType =
  | 'assignment_added'
  | 'assignment_removed'
  | StaffingFinalPlanExistingChangeType;

export type StaffingFinalPlanMaterialChange =
  | {
      itemId: string;
      changeTypes: ['assignment_added'];
      old: null;
      new: StaffingFinalPlanPersistedItem;
    }
  | {
      itemId: string;
      changeTypes: ['assignment_removed'];
      old: StaffingFinalPlanPersistedItem;
      new: null;
    }
  | {
      itemId: string;
      changeTypes: StaffingFinalPlanExistingChangeType[];
      old: StaffingFinalPlanPersistedItem;
      new: StaffingFinalPlanPersistedItem;
    };

export interface StaffingFinalPlanSaveResult {
  plan: AdminStaffingFinalPlan;
  materialChanges: StaffingFinalPlanMaterialChange[];
}
