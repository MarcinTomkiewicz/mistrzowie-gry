import {
  CoreRpcErrorsCopy,
  EditionRpcErrorsCopy,
} from '../../../core/types/i18n/admin-events';
import { RpcError } from '../../../core/types/rpc-error';
import { joinTextParts } from '../../../core/utils/normalize-text';
import type { EventGlobalSaveFailure, EventGlobalSaveGuard } from '../../../core/interfaces/i-event-global-saved-summary';
import type { EventGlobalPublicationCopy } from '../../../core/types/i18n/event-global-draft';

export class EventGlobalSaveError extends Error {
  constructor(readonly reason: EventGlobalSaveFailure, readonly guard: EventGlobalSaveGuard | null = null,
    readonly context: Readonly<Record<string, unknown>> | null = null) {
    super(`[GLOBAL_SAVE] ${reason}${guard ? `: ${guard}` : ''}`);
  }
}

export function requireEventGlobalPreview(preview: { valid: boolean }): void {
  if (!preview.valid) throw new EventGlobalSaveError('previewRejected');
}

export function isDefiniteEventAdminRpcRejection(error: unknown): error is RpcError {
  return error instanceof RpcError && (/^23[0-9A-Z]{3}$/.test(error.code) ||
    ['42501', '22023', '22P02', '40001', '40P01', '55000', 'P0001', 'P0002'].includes(error.code));
}

export function presentEventGlobalPreviewError(error: unknown) {
  if (error instanceof EventGlobalSaveError) return [
    { key: 'message' as const, value: error.message },
    ...(error.context === null ? [] : [{ key: 'details' as const, value: JSON.stringify(error.context, null, 2) }]),
  ];
  if (error instanceof RpcError) {
    return (['code', 'message', 'details', 'hint'] as const)
      .filter(key => error[key])
      .map(key => ({ key, value: error[key] }));
  }
  if (error instanceof Error || typeof error === 'string') {
    return [{ key: 'message' as const, value: typeof error === 'string' ? error : error.message }];
  }
  return [];
}

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

export function resolveEventProgramPublicationError(error: RpcError, copy: EventGlobalPublicationCopy['signupRelease']['errors']): string | null {
  const reasons: Record<string, keyof typeof copy> = {
    'Manual session cannot be released in this Event state.': 'eventState',
    'Empty slot has no session to publish.': 'emptySlot',
    'Session is not approved or no longer eligible.': 'sessionNotEligible',
    'Source session changed; resave draft and approve again.': 'sourceChanged',
    ACTIVITY_NOT_PUBLICATION_READY: 'activityNotReady',
    ACTIVITY_KIND_NOT_ACTIVE: 'activityKindInactive',
    CONCURRENT_ACTIVITY_CHANGE: 'concurrentActivity',
    'Selected session does not belong to the assigned GM.': 'sourceNotOwned',
    'Unsupported Staffing session source kind.': 'unsupportedSource',
    EFS095_ARCHIVED_EVENT_DATA_IMMUTABLE: 'archived',
    'Manual slot not found.': 'slotNotFound',
    ACTIVITY_SLOT_NOT_FOUND: 'slotNotFound',
    'Slot ID required.': 'slotIdRequired',
    ACTIVITY_SLOT_ID_REQUIRED: 'slotIdRequired',
    'Staffing session ID and GM user ID are required.': 'sourceIdRequired',
  };
  const key = reasons[error.message];
  return key ? copy[key] : null;
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
