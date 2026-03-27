export enum SessionDifficultyLevel {
  Beginner = 'beginner',
  Intermediate = 'intermediate',
  Advanced = 'advanced',
}

export const SESSION_DIFFICULTY_LEVEL_OPTIONS = [
  {
    value: SessionDifficultyLevel.Beginner,
    i18nKey: 'beginner',
  },
  {
    value: SessionDifficultyLevel.Intermediate,
    i18nKey: 'intermediate',
  },
  {
    value: SessionDifficultyLevel.Advanced,
    i18nKey: 'advanced',
  },
] as const;