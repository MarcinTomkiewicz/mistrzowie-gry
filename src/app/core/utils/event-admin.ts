import { CoreRpcErrorsCopy } from '../types/i18n/admin-events';
import { RpcError } from '../types/rpc-error';

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
