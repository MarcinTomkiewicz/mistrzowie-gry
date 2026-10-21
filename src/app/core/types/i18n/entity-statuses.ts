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
  awaitingAcceptance: string;
  awaitingDecision: string;
  editable: string;
  readOnly: string;
};
