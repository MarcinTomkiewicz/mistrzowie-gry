import type {
  MyStaffingCandidate,
  MyStaffingRealizationHub,
} from '../../interfaces/my-staffing-realization';
import type { StaffingParticipationEndReason } from '../staffing-realization';

export type GmStaffingHubCopy = {
  page: {
    subtitle: string;
    loadErrorTitle: string;
  };
  sections: Record<keyof MyStaffingRealizationHub, {
    title: string;
    emptyDescription: string;
  }>;
  card: {
    candidateStatus: string;
  };
};

export type GmStaffingDetailCopy = {
  title: string;
  sections: {
    description: string;
    recruitmentPolicy: string;
    candidate: string;
  };
  empty: {
    description: string;
    days: string;
    recruitmentPolicy: string;
    travelTerms: string;
  };
  errors: {
    loadFailed: string;
    notFound: string;
    actionFailed: string;
  };
  fields: {
    selfApplicationEnabled: string;
    origin: string;
    scope: string;
    gmDecision: string;
    adminDecision: string;
    submittedAt: string;
    withdrawnAt: string;
    gmDecidedAt: string;
    adminDecidedAt: string;
  };
  candidateOrigins: Record<MyStaffingCandidate['origin'], string>;
  candidateDecisions: Record<MyStaffingCandidate['gmDecision'], string>;
  tabs: {
    information: string;
    travelTerms: string;
    participation: string;
  };
  application: {
    create: string;
    submit: string;
    withdraw: string;
    scopeTitle: string;
    draftHint: string;
    pendingHint: string;
    unavailableHint: string;
    withdrawConfirm: string;
    createSuccess: string;
    submitSuccess: string;
    withdrawSuccess: string;
  };
  proposal: {
    accept: string;
    reject: string;
    acceptConfirm: string;
    rejectConfirm: string;
    acceptSuccess: string;
    rejectSuccess: string;
  };
  participation: {
    active: string;
    ended: string;
    endedAt: string;
    endReason: string;
    withdraw: string;
    startedHint: string;
    replacementLabel: string;
    replacementRequiredHint: string;
    replacementOptionalHint: string;
    replacementHint: string;
    replacementLoadFailed: string;
    withdrawConfirm: string;
    withdrawWithReplacementConfirm: string;
    withdrawSuccess: string;
    withdrawWithReplacementSuccess: string;
  };
  participationEndReasons: Record<StaffingParticipationEndReason, string>;
  sessionProposalHint: string;
  archivedCandidateHint: string;
};
