export type QuestionnaireYesNo = 'yes' | 'no';

export type QuestionnaireYesNoNotApplicable =
  | QuestionnaireYesNo
  | 'not_applicable';

export type QuestionnaireIdentificationBasis =
  | 'pesel'
  | 'identity_document';

export type QuestionnaireIdentityDocumentKind =
  | 'id_card'
  | 'passport'
  | 'other';

export type QuestionnaireSicknessInsuranceChoice =
  | 'join'
  | 'decline';

export type QuestionnaireDisabilityDegree =
  | 'none'
  | 'light'
  | 'moderate'
  | 'severe';
