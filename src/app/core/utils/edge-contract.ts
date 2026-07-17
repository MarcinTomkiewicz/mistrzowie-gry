import { EdgeFunctionError } from '../types/edge-function-error';

export function isEdgeFunctionSuccess<TResult>(
  response: {
    data: TResult | null;
    error: unknown;
  },
): response is {
  data: TResult;
  error: null;
} {
  return response.error === null;
}

export function isEdgeObject(
  value: unknown,
): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function readEdgeObject(
  value: unknown,
  path: string,
): Readonly<Record<string, unknown>> {
  if (!isEdgeObject(value)) {
    throw invalidEdgeResponse(path, 'an object');
  }

  return value;
}

export function readEdgeArray(value: unknown, path: string): readonly unknown[] {
  if (!Array.isArray(value)) {
    throw invalidEdgeResponse(path, 'an array');
  }

  return value;
}

export function readEdgeString(value: unknown, path: string): string {
  if (typeof value !== 'string') {
    throw invalidEdgeResponse(path, 'a string');
  }

  return value;
}

export function readEdgeBoolean(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') {
    throw invalidEdgeResponse(path, 'a boolean');
  }

  return value;
}

export function readEdgeInteger(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw invalidEdgeResponse(path, 'an integer');
  }

  return value;
}

function invalidEdgeResponse(path: string, expected: string): EdgeFunctionError {
  const message = `Invalid Edge Function response: ${path} must be ${expected}.`;

  return new EdgeFunctionError(
    null,
    'EDGE_INVALID_SUCCESS_RESPONSE',
    message,
    {},
    new TypeError(message),
  );
}
