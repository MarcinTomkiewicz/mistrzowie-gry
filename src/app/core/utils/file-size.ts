import { formatNumber } from './number-format';

export function formatFileSizeMiB(
  sizeBytes: number,
  locale: string = 'pl-PL',
): string {
  const sizeMiB = sizeBytes / (1024 * 1024);
  const value = formatNumber(sizeMiB, locale, {
    maximumFractionDigits: 2,
  });

  return `${value} MiB`;
}
