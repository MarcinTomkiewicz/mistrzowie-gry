// These forms describe the current Polish resource, not a language-independent inflection rule.
export type PolishEntityStatusForms = {
  masculine: string;
  feminine: string;
  neuter: string;
  pluralMasculinePersonal: string;
  pluralNonMasculinePersonal: string;
};

export type CommonEntityStatusesTranslations = Record<
  | 'active'
  | 'inactive'
  | 'planned'
  | 'draft'
  | 'pending'
  | 'available'
  | 'completed'
  | 'cancelled'
  | 'submitted'
  | 'sent'
  | 'accepted'
  | 'approved'
  | 'confirmed'
  | 'rejected'
  | 'withdrawn'
  | 'published'
  | 'archived'
  | 'public'
  | 'private',
  PolishEntityStatusForms
>;

export type CommonStatusPhrasesTranslations = {
  inProgress: string;
  requiresAction: string;
  submittedForReview: string;
  acknowledged: string;
  awaitingAcceptance: string;
  awaitingDecision: string;
  editable: string;
  readOnly: string;
};
