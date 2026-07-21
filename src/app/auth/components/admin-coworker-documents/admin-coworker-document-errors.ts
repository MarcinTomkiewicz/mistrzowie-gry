import { HttpStatusCode } from '@angular/common/http';

import { ADMIN_COWORKER_DOCUMENT_ERROR_CODE } from '../../../core/types/admin-coworker-document';
import { EdgeFunctionError } from '../../../core/types/edge-function-error';
import { AdminCoworkerDocErrorCopy } from '../../../core/types/i18n/admin-coworker-document';

export function resolveAdminCoworkerDocumentError(
  error: EdgeFunctionError,
  copy: AdminCoworkerDocErrorCopy,
  fallback: string,
  commandError = true,
): string {
  if (error.code === 'EDGE_INVALID_SUCCESS_RESPONSE') {
    return copy.invalidResponse;
  }
  if (error.status === HttpStatusCode.Unauthorized) return copy.unauthorized;
  if (error.status === HttpStatusCode.Forbidden) return copy.forbidden;
  if (!commandError) return fallback;

  switch (error.code) {
    case ADMIN_COWORKER_DOCUMENT_ERROR_CODE.resourceNotFound:
      return copy.notFound;
    case ADMIN_COWORKER_DOCUMENT_ERROR_CODE.documentConflict:
      return copy.documentConflict;
    case ADMIN_COWORKER_DOCUMENT_ERROR_CODE.concurrentModification:
      return copy.conflict;
    default:
      return fallback;
  }
}

export function isAdminCoworkerDocumentStaleError(
  error: EdgeFunctionError,
): boolean {
  return (
    error.code === ADMIN_COWORKER_DOCUMENT_ERROR_CODE.resourceNotFound ||
    error.code === ADMIN_COWORKER_DOCUMENT_ERROR_CODE.concurrentModification
  );
}
