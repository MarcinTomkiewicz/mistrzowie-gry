const pad2 = (n: number) => n.toString().padStart(2, '0');

/**
 * Tiny formatter used for filenames etc.
 * Supported tokens: yyyy MM dd HH mm ss
 */
export function formatDate(d: Date, fmt: string): string {
  return fmt
    .replace(/yyyy/g, String(d.getFullYear()))
    .replace(/MM/g, pad2(d.getMonth() + 1))
    .replace(/dd/g, pad2(d.getDate()))
    .replace(/HH/g, pad2(d.getHours()))
    .replace(/mm/g, pad2(d.getMinutes()))
    .replace(/ss/g, pad2(d.getSeconds()));
}
