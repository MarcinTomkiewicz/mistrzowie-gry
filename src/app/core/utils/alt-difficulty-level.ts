import { EventSlotsDifficultyTranslations } from '../types/common-i18n';
import { SessionDifficultyLevel } from '../types/sessions';

export interface IAltDifficultyLevelVm {
  badgeClass: string;
  label: string;
}

export function resolveAltDifficultyLevel(
  difficulty: SessionDifficultyLevel | null | undefined,
  labels: EventSlotsDifficultyTranslations,
  fallbackLabel: string,
): IAltDifficultyLevelVm {
  switch (difficulty) {
    case SessionDifficultyLevel.Beginner:
      return {
        badgeClass: 'tag-badge--success',
        label: labels.beginner,
      };
    case SessionDifficultyLevel.Intermediate:
      return {
        badgeClass: 'tag-badge--arcane',
        label: labels.intermediate,
      };
    case SessionDifficultyLevel.Advanced:
      return {
        badgeClass: 'tag-badge--danger',
        label: labels.advanced,
      };
    default:
      return {
        badgeClass: 'tag-badge--muted',
        label: fallbackLabel,
      };
  }
}
