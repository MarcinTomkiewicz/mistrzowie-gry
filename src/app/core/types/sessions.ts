export enum SessionDifficultyLevel {
  Beginner = 'beginner',
  Intermediate = 'intermediate',
  Advanced = 'advanced',
}

export const SESSION_DIFFICULTY_LEVEL_OPTIONS = [
  SessionDifficultyLevel.Beginner,
  SessionDifficultyLevel.Intermediate,
  SessionDifficultyLevel.Advanced,
] as const;