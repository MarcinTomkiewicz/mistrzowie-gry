import type {
  MyStaffingCandidate,
  MyStaffingRealizationHub,
} from '../../interfaces/my-staffing-realization';

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
  };
  fields: {
    selfApplicationEnabled: string;
    sessionsRequiredAtApplication: string;
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
  sessionRequirementHint: string;
  archivedCandidateHint: string;
};
