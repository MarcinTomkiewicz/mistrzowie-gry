export enum SessionDifficultyLevel {
  Beginner = 'beginner',
  Intermediate = 'intermediate',
  Advanced = 'advanced',
}

export const SESSION_DIFFICULTY_LEVEL_OPTIONS = [
  {
    value: SessionDifficultyLevel.Beginner,
    i18nKey: 'beginnerDifficultyLabel',
  },
  {
    value: SessionDifficultyLevel.Intermediate,
    i18nKey: 'intermediateDifficultyLabel',
  },
  {
    value: SessionDifficultyLevel.Advanced,
    i18nKey: 'advancedDifficultyLabel',
  },
] as const;