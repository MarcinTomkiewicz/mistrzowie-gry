import { AppAuthError } from '../types/auth-error';

export function mapAuthError(error: unknown): AppAuthError {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (message.includes('invalid login credentials')) {
    return new AppAuthError('invalid_credentials', undefined, error);
  }

  if (message.includes('user already registered')) {
    return new AppAuthError('email_already_registered', undefined, error);
  }

  if (message.includes('email not confirmed')) {
    return new AppAuthError('email_not_confirmed', undefined, error);
  }

  if (message.includes('password')) {
    return new AppAuthError('weak_password', undefined, error);
  }

  if (message.includes('network')) {
    return new AppAuthError('network_error', undefined, error);
  }

  return new AppAuthError('unknown', undefined, error);
}