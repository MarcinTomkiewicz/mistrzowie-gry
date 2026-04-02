export interface SessionFormTranslations {
  titleLabel: string;
  systemLabel: string;
  descriptionLabel: string;
  difficultyLabel: string;
  minPlayersLabel: string;
  maxPlayersLabel: string;
  minAgeLabel: string;
  sortOrderLabel: string;
  stylesLabel: string;
  triggersLabel: string;
  playersRangeLabel: string;
  minAgeRangeLabel: string;
  sortOrderRangeLabel: string;
}

export interface SessionDifficultyTranslations {
  beginner: string;
  intermediate: string;
  advanced: string;
}

export interface SessionErrorsTranslations {
  invalidPlayersRange: string;
}

export interface SessionListLabelsTranslations {
  playersHeaderLabel: string;
  minAgeHeaderLabel: string;
}

export type SessionSlotDifficultyTranslations = {
  beginner: string;
  intermediate: string;
  advanced: string;
};

export type SessionSlotFallbacksTranslations = {
  none: string;
  nonePlural: string;
  noStyles: string;
  noTriggers: string;
  missingData: string;
  emptySession: string;
};

export type SessionSlotLabelsTranslations = {
  gm: string;
};

export type SessionDetailsLabelsTranslations = {
  primaryInfo: string;
  additionalInfo: string;
};

export type SessionConfirmationTranslations = {
  deleteSession: string;
};
