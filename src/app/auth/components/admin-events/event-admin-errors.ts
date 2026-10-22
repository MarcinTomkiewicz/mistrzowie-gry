import {
  CoreRpcErrorsCopy,
  EditionRpcErrorsCopy,
  OccurrenceRpcErrorsCopy,
} from '../../../core/types/i18n/admin-events';
import { RpcError } from '../../../core/types/rpc-error';
import type { EventPublicationCopy } from '../../../core/types/i18n/event-publication';
import { joinTextParts } from '../../../core/utils/normalize-text';

export function resolveEventCoreAdminErrorMessage(
  error: unknown,
  copy: CoreRpcErrorsCopy,
  conflictMessage: string,
): string {
  if (!(error instanceof RpcError)) {
    return copy.unknown;
  }

  switch (error.code) {
    case '42501':
      return copy.forbidden;
    case '22023':
    case '22P02':
      return copy.invalid;
    case '23505':
      return copy.duplicateKey;
    case '23514':
      return copy.constraint;
    case '40001':
      return conflictMessage;
    default:
      return copy.unknown;
  }
}

export function resolveEventEditionAdminErrorMessage(
  error: unknown,
  copy: EditionRpcErrorsCopy,
  conflictMessage: string,
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
      return conflictMessage;
    default:
      return copy.unknown;
  }
}

export function resolveEventOccurrenceAdminErrorMessage(
  error: unknown,
  copy: OccurrenceRpcErrorsCopy,
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
    case '23514':
      return copy.constraint;
    case '23505':
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

export function resolveEventPublicationErrorMessage(
  error: unknown,
  copy: EventPublicationCopy['errors'],
): string {
  if (!(error instanceof RpcError)) return copy.unknown;
  if (error.code === '42501') return copy.forbidden;
  if (error.code === '22023') return copy.invalid;
  if (error.code !== '23514') return copy.unknown;

  switch (error.message) {
    case 'Converted Event is not in private draft state.':
      return copy.privateDraft;
    case 'Converted Core must have exactly one Edition.':
      return copy.singleEdition;
    case 'Converted Event public metadata is incomplete.':
      return copy.metadata;
    case 'Converted Event cover is not an approved public image.':
      return copy.cover;
    case 'Converted Event occurrences are not release-ready.':
      return copy.occurrences;
    case 'Frozen scheduled slots are missing or inconsistent.':
      return copy.frozenSlots;
    case 'Frozen Staffing Program provenance is inconsistent.':
      return copy.provenance;
    default:
      return copy.constraint;
  }
}
