import { EdgeFunctionError } from '../types/edge-function-error';
import {
  EdgeLiteral,
  EdgeObjectReaderResult,
  EdgeReader,
  EdgeReaderMap,
} from '../types/edge-contract';

const BASE64_PATTERN =
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

export function createEdgeObjectReader<const TReaders extends EdgeReaderMap>(
  readers: TReaders,
): EdgeReader<EdgeObjectReaderResult<TReaders>> {
  return (value, path) => {
    const source = readEdgeObject(value, path);
    const result = Object.fromEntries(
      Object.entries(readers).map(([field, reader]) => [
        field,
        reader(source[field], joinEdgePath(path, field)),
      ]),
    );

    return result as EdgeObjectReaderResult<TReaders>;
  };
}

export function createEdgeArrayReader<TResult>(
  itemReader: EdgeReader<TResult>,
): EdgeReader<TResult[]> {
  return (value, path) =>
    readEdgeArray(value, path).map((item, index) =>
      itemReader(item, `${path}[${index}]`),
    );
}

export function createEdgeNullableReader<TResult>(
  reader: EdgeReader<TResult>,
): EdgeReader<TResult | null> {
  return (value, path) => value === null ? null : reader(value, path);
}

export function readEdgeString(value: unknown, path: string): string {
  if (typeof value !== 'string') {
    throw invalidEdgeResponse(path, 'a string');
  }

  return value;
}

export function readEdgeNonBlankString(
  value: unknown,
  path: string,
): string {
  const parsed = readEdgeString(value, path).trim();
  if (parsed === '') {
    throw invalidEdgeResponse(path, 'a non-blank string');
  }

  return parsed;
}

export function readEdgeUuid(value: unknown, path: string): string {
  const parsed = readEdgeString(value, path);
  if (!UUID_PATTERN.test(parsed)) {
    throw invalidEdgeResponse(path, 'a UUID');
  }

  return parsed;
}

export function readEdgeBase64(
  value: unknown,
  path: string,
  expectedDecodedLength?: number,
): string {
  const parsed = readEdgeString(value, path);
  const decodedLength = base64ByteLength(parsed);
  if (
    decodedLength === null ||
    (expectedDecodedLength !== undefined &&
      decodedLength !== expectedDecodedLength)
  ) {
    throw invalidEdgeResponse(
      path,
      expectedDecodedLength === undefined
        ? 'Base64'
        : `Base64 decoding to ${expectedDecodedLength} bytes`,
    );
  }

  return parsed;
}

export function readEdgeBoolean(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') {
    throw invalidEdgeResponse(path, 'a boolean');
  }

  return value;
}

export function readEdgeNullableBoolean(
  value: unknown,
  path: string,
): boolean | null {
  return value === null ? null : readEdgeBoolean(value, path);
}

export function readEdgeInteger(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw invalidEdgeResponse(path, 'an integer');
  }

  return value;
}

export function readEdgePositiveInteger(value: unknown, path: string): number {
  const parsed = readEdgeInteger(value, path);
  if (parsed < 1) {
    throw invalidEdgeResponse(path, 'a positive integer');
  }

  return parsed;
}

export function readEdgeNullableString(
  value: unknown,
  path: string,
): string | null {
  return value === null ? null : readEdgeString(value, path);
}

export function readEdgeNullableInteger(
  value: unknown,
  path: string,
): number | null {
  return value === null ? null : readEdgeInteger(value, path);
}

export function readEdgeTimestamp(value: unknown, path: string): string {
  const parsed = readEdgeString(value, path);
  if (Number.isNaN(Date.parse(parsed))) {
    throw invalidEdgeResponse(path, 'a timestamp');
  }

  return parsed;
}

export function readEdgeNullableTimestamp(
  value: unknown,
  path: string,
): string | null {
  return value === null ? null : readEdgeTimestamp(value, path);
}

export function readEdgeLiteral<TValue extends EdgeLiteral>(
  value: unknown,
  path: string,
  allowedValues: readonly TValue[],
): TValue {
  if (!isAllowedLiteral(value, allowedValues)) {
    throw invalidEdgeResponse(path, `one of: ${allowedValues.join(', ')}`);
  }
  return value;
}

export function readEdgeNonNegativeInteger(
  value: unknown,
  path: string,
): number {
  const parsed = readEdgeInteger(value, path);
  if (parsed < 0) {
    throw invalidEdgeResponse(path, 'a non-negative integer');
  }

  return parsed;
}

export function createEdgeLiteralReader<
  const TValues extends readonly EdgeLiteral[],
>(allowedValues: TValues): EdgeReader<TValues[number]> {
  return (value, path) => readEdgeLiteral(value, path, allowedValues);
}

export function createEdgeSuccessReader<const TAction extends EdgeLiteral>(
  expectedAction: TAction,
): EdgeReader<void> {
  const reader = createEdgeObjectReader({
    ok: createEdgeLiteralReader([true] as const),
    action: createEdgeLiteralReader([expectedAction] as const),
  });

  return (value, path) => {
    reader(value, path);
  };
}

export function readEdgeNullableLiteral<TValue extends EdgeLiteral>(
  value: unknown,
  path: string,
  allowedValues: readonly TValue[],
): TValue | null {
  return value === null ? null : readEdgeLiteral(value, path, allowedValues);
}

export function assertEdgeContract(
  condition: boolean,
  path: string,
  expected: string,
): asserts condition {
  if (!condition) {
    throw invalidEdgeResponse(path, expected);
  }
}

function invalidEdgeResponse(
  path: string,
  expected: string,
): EdgeFunctionError {
  const message = `Invalid Edge Function response: ${path} must be ${expected}.`;

  return new EdgeFunctionError(
    null,
    'EDGE_INVALID_SUCCESS_RESPONSE',
    message,
    {},
    new TypeError(message),
  );
}

function joinEdgePath(path: string, field: string): string {
  return path === '' ? field : `${path}.${field}`;
}

function base64ByteLength(value: string): number | null {
  if (
    value === '' ||
    value.length % 4 !== 0 ||
    !BASE64_PATTERN.test(value)
  ) {
    return null;
  }

  try {
    return atob(value).length;
  } catch {
    return null;
  }
}

function isAllowedLiteral<TValue extends EdgeLiteral>(
  value: unknown,
  allowedValues: readonly TValue[],
): value is TValue {
  return allowedValues.some((allowedValue) => allowedValue === value);
}
