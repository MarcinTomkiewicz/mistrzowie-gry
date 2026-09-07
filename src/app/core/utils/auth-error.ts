import {
  isAuthError,
  isAuthSessionMissingError,
} from '@supabase/supabase-js';

import { AppAuthError } from '../types/auth-error';
import type { CommonErrorsTranslations } from '../types/i18n/common';

export function normalizeAuthError(error: unknown): AppAuthError {
  return error instanceof AppAuthError
    ? error
    : new AppAuthError('unknown', undefined, error);
}

export function resolveCommonAuthErrorMessage(
  code: AppAuthError['code'],
  errors: CommonErrorsTranslations,
): string {
  return code === 'network_error'
    ? errors.network
    : code === 'unauthorized'
      ? errors.unauthorized
      : errors.generic;
}

export function mapAuthError(error: unknown): AppAuthError {
  if (
    isAuthSessionMissingError(error) ||
    (isAuthError(error) &&
      [
        'session_not_found',
        'session_expired',
        'refresh_token_not_found',
        'refresh_token_already_used',
      ].includes(error.code ?? ''))
  ) {
    return new AppAuthError('session_not_found', undefined, error);
  }

  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();

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
