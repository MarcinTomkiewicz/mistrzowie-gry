export const ToastKind = {
  info: 'info',
  success: 'success',
  warn: 'warn',
  danger: 'danger',
  arcane: 'arcane',
} as const;

export type ToastKind = (typeof ToastKind)[keyof typeof ToastKind];

export const PrimeToastSeverity = {
  info: 'info',
  success: 'success',
  warn: 'warn',
  error: 'error',
} as const;

export type PrimeToastSeverity =
  (typeof PrimeToastSeverity)[keyof typeof PrimeToastSeverity];

export type ToastOptions = {
  summary: string;
  detail: string;
  life?: number;
  icon?: string;
};