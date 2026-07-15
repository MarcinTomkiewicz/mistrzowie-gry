import { SessionSlotDifficultyTranslations } from '../../../core/types/i18n/sessions';
import { SessionDifficultyLevel } from '../../../core/types/sessions';

export function resolveAltDifficultyLevel(
  difficulty: SessionDifficultyLevel | null | undefined,
  labels: SessionSlotDifficultyTranslations,
  fallbackLabel: string,
): { badgeClass: string; label: string } {
  switch (difficulty) {
    case SessionDifficultyLevel.Beginner:
      return { badgeClass: 'tag-badge--success', label: labels.beginner };
    case SessionDifficultyLevel.Intermediate:
      return { badgeClass: 'tag-badge--arcane', label: labels.intermediate };
    case SessionDifficultyLevel.Advanced:
      return { badgeClass: 'tag-badge--danger', label: labels.advanced };
    default:
      return { badgeClass: 'tag-badge--muted', label: fallbackLabel };
  }
}
