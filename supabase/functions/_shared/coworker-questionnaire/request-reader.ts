import type {
  FieldErrors,
  UnknownObject,
} from "./contracts.ts";
import { QuestionnaireValidationError } from "./errors.ts";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createFieldErrors(): FieldErrors {
  const errors: FieldErrors = Object.create(null);
  return errors;
}

export function requestObject(
  value: unknown,
  path: string,
  expectedKeys: readonly string[],
  optionalKeys: readonly string[],
  errors: FieldErrors,
): UnknownObject {
  if (!isObject(value)) {
    errors[path || "request"] = "Value must be an object.";
    return {};
  }

  for (const key of expectedKeys) {
    if (!optionalKeys.includes(key) && !hasOwn(value, key)) {
      errors[joinPath(path, key)] = "Field is required.";
    }
  }

  for (const key of Object.keys(value)) {
    if (!expectedKeys.includes(key)) {
      errors[joinPath(path, key)] = "Unexpected field.";
    }
  }

  return value;
}

export function requestString(
  source: UnknownObject,
  key: string,
  path: string,
  errors: FieldErrors,
): string {
  const value = source[key];
  if (typeof value !== "string") {
    errors[path] = "Value must be a string.";
    return "";
  }
  return value;
}

export function requestUuid(
  source: UnknownObject,
  key: string,
  path: string,
  errors: FieldErrors,
): string {
  const value = requestString(source, key, path, errors);
  if (!UUID_PATTERN.test(value)) {
    errors[path] = "Value must be a UUID.";
  }
  return value;
}

export function requestEnum<const TValue extends string>(
  source: UnknownObject,
  key: string,
  path: string,
  allowedValues: readonly TValue[],
  errors: FieldErrors,
): TValue {
  const value = requestString(source, key, path, errors);
  if (!allowedValues.includes(value as TValue)) {
    errors[path] = "Value is not allowed.";
  }
  return value as TValue;
}

export function requestNullableString(
  source: UnknownObject,
  key: string,
  path: string,
  errors: FieldErrors,
): string | null {
  const value = source[key];
  if (value === null) {
    return null;
  }
  if (typeof value !== "string") {
    errors[path] = "Value must be a string or null.";
    return null;
  }
  return value;
}

export function requestOptionalNullableString(
  source: UnknownObject,
  key: string,
  path: string,
  errors: FieldErrors,
): { missing: boolean; value: string | null } {
  if (!hasOwn(source, key)) {
    return { missing: true, value: null };
  }
  return {
    missing: false,
    value: requestNullableString(source, key, path, errors),
  };
}

export function requestBoolean(
  source: UnknownObject,
  key: string,
  path: string,
  errors: FieldErrors,
): boolean {
  const value = source[key];
  if (typeof value !== "boolean") {
    errors[path] = "Value must be a boolean.";
    return false;
  }
  return value;
}

export function requestNullableBoolean(
  source: UnknownObject,
  key: string,
  path: string,
  errors: FieldErrors,
): boolean | null {
  if (source[key] === null) {
    return null;
  }
  return requestBoolean(source, key, path, errors);
}

export function requestNullablePositiveInteger(
  source: UnknownObject,
  key: string,
  path: string,
  errors: FieldErrors,
): number | null {
  const value = source[key];
  if (value === null) {
    return null;
  }
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    errors[path] = "Value must be a positive integer or null.";
    return null;
  }
  return value;
}

export function requestPositiveInteger(
  source: UnknownObject,
  key: string,
  path: string,
  errors: FieldErrors,
): number {
  const value = source[key];
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    errors[path] = "Value must be a positive integer.";
    return 0;
  }
  return value;
}

export function requestNullableEnum<const TValue extends string>(
  source: UnknownObject,
  key: string,
  path: string,
  allowedValues: readonly TValue[],
  errors: FieldErrors,
): TValue | null {
  const value = source[key];
  if (value === null) {
    return null;
  }
  if (
    typeof value !== "string" ||
    !allowedValues.includes(value as TValue)
  ) {
    errors[path] = "Value is not allowed.";
    return null;
  }
  return value as TValue;
}

export function requestTrue(
  source: UnknownObject,
  key: string,
  path: string,
  errors: FieldErrors,
): true {
  if (source[key] !== true) {
    errors[path] = "Value must be true.";
  }
  return true;
}

export function requestNull(
  source: UnknownObject,
  key: string,
  path: string,
  errors: FieldErrors,
): null {
  if (source[key] !== null) {
    errors[path] = "Value must be null.";
  }
  return null;
}

export function throwIfRequestInvalid(errors: FieldErrors): void {
  if (Object.keys(errors).length > 0) {
    throw new QuestionnaireValidationError(errors);
  }
}

export function hasOwn(source: UnknownObject, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(source, key);
}

function isObject(value: unknown): value is UnknownObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function joinPath(path: string, key: string): string {
  return path === "" ? key : `${path}.${key}`;
}
