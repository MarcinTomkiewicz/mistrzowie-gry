export function formatFileSizeMiB(
  sizeBytes: number,
  locale: string = 'pl-PL',
): string {
  const sizeMiB = sizeBytes / (1024 * 1024);
  const value = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  }).format(sizeMiB);

  return `${value} MiB`;
}
