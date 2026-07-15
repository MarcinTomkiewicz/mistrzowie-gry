import {
  CoreRpcErrorsCopy,
  EditionRpcErrorsCopy,
} from '../types/i18n/admin-events';
import { RpcError } from '../types/rpc-error';
import { joinTextParts } from './normalize-text';

export function resolveEventCoreAdminErrorMessage(
  error: unknown,
  copy: CoreRpcErrorsCopy,
): string {
  if (!(error instanceof RpcError)) {
    return copy.unknown;
  }

  switch (error.code) {
    case '42501':
      return copy.forbidden;
    case 'P0002':
      return copy.notFound;
    case '22023':
    case '22P02':
      return copy.invalid;
    case '23505':
      return copy.duplicateKey;
    case '23514':
      return copy.constraint;
    case '40001':
      return copy.conflict;
    default:
      return copy.unknown;
  }
}

export function resolveEventEditionAdminErrorMessage(
  error: unknown,
  copy: EditionRpcErrorsCopy,
): string {
  if (!(error instanceof RpcError)) {
    return copy.unknown;
  }

  switch (error.code) {
    case '42501':
      return copy.forbidden;
    case 'P0002':
      return copy.notFound;
    case '22023':
    case '22P02':
    case '22007':
      return copy.invalid;
    case '23503':
      return copy.foreignKey;
    case '23505':
      return resolveEditionUniqueError(error, copy);
    case '23514':
      return copy.constraint;
    case '40001':
      return copy.conflict;
    default:
      return copy.unknown;
  }
}

function resolveEditionUniqueError(
  error: RpcError,
  copy: EditionRpcErrorsCopy,
): string {
  const errorText = joinTextParts([
    error.message,
    error.details,
    error.hint,
  ]).toLowerCase();

  if (
    errorText.includes('is_default_public') ||
    errorText.includes('default_public') ||
    errorText.includes('public default')
  ) {
    return copy.defaultPublicConflict;
  }

  if (errorText.includes('slug')) {
    return copy.duplicateSlug;
  }

  if (errorText.includes('city') || errorText.includes('miast')) {
    return copy.activeCityConflict;
  }

  return copy.uniqueConflict;
}
