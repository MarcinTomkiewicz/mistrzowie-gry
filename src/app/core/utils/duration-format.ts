import type { DurationTranslations } from '../types/duration-format';
import { formatPluralNumber } from './number-format';

export function formatDuration(
  minutes: number,
  translations: DurationTranslations,
  locale: string,
): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const parts: string[] = [];

  if (hours) {
    parts.push(formatPluralNumber(hours, translations.hours, locale));
  }

  if (remainingMinutes || !hours) {
    parts.push(
      formatPluralNumber(
        remainingMinutes,
        translations.minutes,
        locale,
      ),
    );
  }

  return parts.join(' ');
}
