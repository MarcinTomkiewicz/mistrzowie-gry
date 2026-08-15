export interface SessionFormTranslations {
  titleLabel: string;
  descriptionLabel: string;
  difficultyLabel: string;
  minPlayersLabel: string;
  maxPlayersLabel: string;
  minAgeLabel: string;
  stylesLabel: string;
  triggersLabel: string;
  allowsScenarioCustomizationLabel: string;
  hasReadyCharacterSheetsLabel: string;
  characterSheetsLabel: string;
  chooseCharacterSheetsLabel: string;
  characterSheetsHint: string;
  characterSheetsRequirementHint: string;
  removeCharacterSheetsLabel: string;
  playersRangeLabel: string;
  minAgeRangeLabel: string;
}

export interface SessionDifficultyTranslations {
  intermediate: string;
  advanced: string;
}

export interface SessionErrorsTranslations {
  invalidPlayersRange: string;
  invalidCharacterSheetsCount: string;
}

export interface SessionListLabelsTranslations {
  playersHeaderLabel: string;
}

export type SessionSlotDifficultyTranslations = {
  beginner: string;
  intermediate: string;
  advanced: string;
};

export type SessionSlotFallbacksTranslations = {
  noStyles: string;
  noTriggers: string;
  noLanguages: string;
  noCharacterSheets: string;
  emptySession: string;
};

export type SessionConfirmationTranslations = {
  deleteSession: string;
};
