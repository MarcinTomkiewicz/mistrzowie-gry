import type {
  ICoworkerQuestionnaireCatalogReference,
  ICoworkerQuestionnaireLegacyReference,
} from '../interfaces/i-coworker-questionnaire-reference';

export type QuestionnaireYesNo = 'yes' | 'no' | null;

export type QuestionnaireIdentificationBasis =
  | 'pesel'
  | 'identity_document'
  | null;

export type QuestionnaireIdentityDocumentKind =
  | 'id_card'
  | 'passport'
  | 'other'
  | null;

export type QuestionnaireJoinDeclineAnswer =
  | 'join'
  | 'decline'
  | null;

export type QuestionnaireDisabilityDegree =
  | 'none'
  | 'light'
  | 'moderate'
  | 'severe'
  | null;

export type QuestionnaireStatementKey =
  'coworker.questionnaire.final-declaration';

export type QuestionnaireInstitutionReference =
  | ICoworkerQuestionnaireCatalogReference
  | ICoworkerQuestionnaireLegacyReference
  | null;
