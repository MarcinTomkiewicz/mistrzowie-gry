export const AUTH_ERROR_CODES = [
  'invalid_credentials',
  'email_already_registered',
  'email_not_confirmed',
  'weak_password',
  'user_not_found',
  'profile_not_found',
  'session_not_found',
  'unauthorized',
  'network_error',
  'unknown',
] as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[number];

export class AppAuthError extends Error {
  constructor(
    public readonly code: AuthErrorCode,
    message?: string,
    public override readonly cause?: unknown,
  ) {
    super(message ?? code);
    this.name = 'AppAuthError';
  }
}