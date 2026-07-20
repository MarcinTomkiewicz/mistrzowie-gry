import { HttpStatusCode } from '@angular/common/http';
import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from '@supabase/supabase-js';

import { EdgeFunctionError } from '../types/edge-function-error';
import { isEdgeObject } from './edge-contract';

const INVALID_ERROR_MESSAGE = 'Edge Function returned an invalid error response.';
const INVALID_SUCCESS_MESSAGE = 'Edge Function returned an invalid success response.';

export async function createEdgeFunctionError(
  error: unknown,
): Promise<EdgeFunctionError> {
  if (error instanceof EdgeFunctionError) {
    return error;
  }

  if (error instanceof FunctionsHttpError) {
    return createHttpError(error);
  }

  if (error instanceof FunctionsRelayError) {
    return new EdgeFunctionError(
      readResponseStatus(error.context),
      'EDGE_RELAY_ERROR',
      'The Edge Function relay could not complete the request.',
      {},
      error,
    );
  }

  if (error instanceof FunctionsFetchError) {
    return new EdgeFunctionError(
      null,
      'EDGE_FETCH_ERROR',
      'The Edge Function request could not be sent.',
      {},
      error,
    );
  }

  return new EdgeFunctionError(
    null,
    'EDGE_INVALID_SUCCESS_RESPONSE',
    INVALID_SUCCESS_MESSAGE,
    {},
    error,
  );
}

export function normalizeEdgeFunctionError(
  error: unknown,
  fallbackMessage: string,
): EdgeFunctionError {
  if (error instanceof EdgeFunctionError) {
    return error;
  }

  return new EdgeFunctionError(
    null,
    'UNEXPECTED_ERROR',
    fallbackMessage,
    {},
    error,
  );
}

export function isEdgeAccessError(
  error: EdgeFunctionError | null | undefined,
): boolean {
  return error?.status === HttpStatusCode.Unauthorized ||
    error?.status === HttpStatusCode.Forbidden;
}

async function createHttpError(error: FunctionsHttpError): Promise<EdgeFunctionError> {
  const context: unknown = error.context;

  if (!(context instanceof Response)) {
    return invalidErrorResponse(null, error);
  }

  const status = context.status;

  try {
    const payload: unknown = await context.json();
    return parseErrorResponse(payload, status, error);
  } catch {
    return invalidErrorResponse(status, error);
  }
}

function parseErrorResponse(
  value: unknown,
  status: number,
  cause: unknown,
): EdgeFunctionError {
  if (!isEdgeObject(value)) {
    return invalidErrorResponse(status, cause);
  }

  const code = value['code'];
  const message = value['message'];

  if (typeof code !== 'string' || code === '' || typeof message !== 'string' || message === '') {
    return invalidErrorResponse(status, cause);
  }

  const parsedFieldErrors: Record<string, string> = {};
  const fieldErrors = value['fieldErrors'];

  if (fieldErrors !== undefined) {
    if (!isEdgeObject(fieldErrors)) {
      return invalidErrorResponse(status, cause);
    }

    for (const [field, fieldMessage] of Object.entries(fieldErrors)) {
      if (typeof fieldMessage !== 'string' || fieldMessage === '') {
        return invalidErrorResponse(status, cause);
      }
      parsedFieldErrors[field] = fieldMessage;
    }
  }

  return new EdgeFunctionError(
    status,
    code,
    message,
    parsedFieldErrors,
    cause,
  );
}

function invalidErrorResponse(
  status: number | null,
  cause: unknown,
): EdgeFunctionError {
  return new EdgeFunctionError(
    status,
    'EDGE_INVALID_ERROR_RESPONSE',
    INVALID_ERROR_MESSAGE,
    {},
    cause,
  );
}

function readResponseStatus(value: unknown): number | null {
  return value instanceof Response ? value.status : null;
}
