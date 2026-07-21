import { HttpStatusCode } from '@angular/common/http';

import { ADMIN_OPERATIONAL_ERROR_CODE } from '../../../core/types/admin-coworker-operational-document';
import { EdgeFunctionError } from '../../../core/types/edge-function-error';
import { AdminOperationalCopy } from '../../../core/types/i18n/admin-coworker-operational-document';

export function resolveAdminOperationalError(
  error: EdgeFunctionError,
  copy: AdminOperationalCopy['errors'],
  fallback: string,
): string {
  if (
    error.code === 'EDGE_INVALID_SUCCESS_RESPONSE' ||
    error.code === 'BACKEND_CONTRACT_ERROR'
  ) {
    return copy.invalidResponse;
  }
  if (error.status === HttpStatusCode.Unauthorized) return copy.unauthorized;
  if (error.status === HttpStatusCode.Forbidden) return copy.forbidden;

  switch (error.code) {
    case ADMIN_OPERATIONAL_ERROR_CODE.notFound:
      return copy.notFound;
    case ADMIN_OPERATIONAL_ERROR_CODE.conflict:
      return copy.conflict;
    case ADMIN_OPERATIONAL_ERROR_CODE.invalidState:
      return copy.invalidState;
    default:
      return fallback;
  }
}
