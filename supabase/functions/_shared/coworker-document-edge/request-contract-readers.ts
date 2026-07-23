import {
  type ContractReaderConfig,
  isObject,
  isOneOf,
  type UnknownObject,
  UUID_PATTERN,
} from "./contract-reader-foundation.ts";

export interface NullableRequestOptions {
  required?: boolean;
  allowEmptyString?: boolean;
}

export function createRequestContractReaders<Context>(
  config: ContractReaderConfig<Context>,
) {
  const isTimestamp = config.isTimestamp ??
    ((value: string) => !Number.isNaN(Date.parse(value)));

  function requestObject(
    value: unknown,
    path: string,
    errors: { [field: string]: string },
  ): UnknownObject {
    if (!isObject(value)) {
      errors[path || "request"] = "Expected an object.";
      return {};
    }
    return value;
  }

  function assertOnlyKeys(
    source: UnknownObject,
    allowedKeys: readonly string[],
    path: string,
    errors: { [field: string]: string },
  ): void {
    const allowed = new Set(allowedKeys);
    for (const key of Object.keys(source)) {
      if (!allowed.has(key)) {
        errors[path === "" ? key : `${path}.${key}`] = "Unexpected field.";
      }
    }
  }

  function requestString(
    source: UnknownObject,
    key: string,
    path: string,
    maxLength: number,
    errors: { [field: string]: string },
  ): string {
    const value = source[key];
    if (typeof value !== "string" || value.trim() === "") {
      errors[path] = "Expected a non-empty string.";
      return "";
    }
    const normalized = value.trim();
    if (normalized.length > maxLength) {
      errors[path] = `Maximum length is ${maxLength}.`;
    }
    return normalized;
  }

  function requestNullableString(
    source: UnknownObject,
    key: string,
    path: string,
    maxLength: number,
    errors: { [field: string]: string },
    options: NullableRequestOptions = {},
  ): string | null {
    const value = source[key];
    if (value === undefined) {
      if (options.required) {
        errors[path] = "Expected a string or null.";
      }
      return null;
    }
    if (value === null) {
      return null;
    }
    if (typeof value !== "string") {
      errors[path] = "Expected a string or null.";
      return null;
    }
    const normalized = value.trim();
    if (normalized === "") {
      if (options.allowEmptyString === false) {
        errors[path] = "Expected a string or null.";
      }
      return null;
    }
    if (normalized.length > maxLength) {
      errors[path] = `Maximum length is ${maxLength}.`;
    }
    return normalized;
  }

  function requestUuid(
    source: UnknownObject,
    key: string,
    path: string,
    errors: { [field: string]: string },
  ): string {
    const value = requestString(source, key, path, 36, errors);
    if (value !== "" && !UUID_PATTERN.test(value)) {
      errors[path] = "Expected a valid UUID.";
    }
    return value;
  }

  function requestNullableUuid(
    source: UnknownObject,
    key: string,
    path: string,
    errors: { [field: string]: string },
    options: NullableRequestOptions = {},
  ): string | null {
    const value = requestNullableString(
      source,
      key,
      path,
      36,
      errors,
      options,
    );
    if (value !== null && !UUID_PATTERN.test(value)) {
      errors[path] = "Expected a valid UUID or null.";
    }
    return value;
  }

  function requestBoolean(
    source: UnknownObject,
    key: string,
    path: string,
    errors: { [field: string]: string },
  ): boolean {
    const value = source[key];
    if (typeof value !== "boolean") {
      errors[path] = "Expected a boolean.";
      return false;
    }
    return value;
  }

  function requestInteger(
    source: UnknownObject,
    key: string,
    path: string,
    minimum: number,
    maximum: number,
    errors: { [field: string]: string },
  ): number {
    const value = source[key];
    if (
      typeof value !== "number" ||
      !Number.isInteger(value) ||
      value < minimum ||
      value > maximum
    ) {
      errors[path] = `Expected an integer from ${minimum} to ${maximum}.`;
      return minimum;
    }
    return value;
  }

  function requestNullableInteger(
    source: UnknownObject,
    key: string,
    path: string,
    minimum: number,
    maximum: number,
    errors: { [field: string]: string },
  ): number | null {
    const value = source[key];
    if (value === undefined || value === null) {
      return null;
    }
    if (
      typeof value !== "number" ||
      !Number.isInteger(value) ||
      value < minimum ||
      value > maximum
    ) {
      errors[path] =
        `Expected null or an integer from ${minimum} to ${maximum}.`;
      return null;
    }
    return value;
  }

  function requestNullableTimestamp(
    source: UnknownObject,
    key: string,
    path: string,
    errors: { [field: string]: string },
  ): string | null {
    const value = requestNullableString(source, key, path, 100, errors);
    if (value !== null && !isTimestamp(value)) {
      errors[path] = "Expected a valid timestamp or null.";
    }
    return value;
  }

  function requestStringArray(
    source: UnknownObject,
    key: string,
    path: string,
    maxItems: number,
    maxItemLength: number,
    errors: { [field: string]: string },
  ): string[] {
    const value = source[key];
    if (!Array.isArray(value) || value.length === 0) {
      errors[path] = "Expected a non-empty string array.";
      return [];
    }
    if (value.length > maxItems) {
      errors[path] = `Maximum item count is ${maxItems}.`;
    }

    const result: string[] = [];
    for (let index = 0; index < value.length; index += 1) {
      const item = value[index];
      if (typeof item !== "string" || item.trim() === "") {
        errors[`${path}.${index}`] = "Expected a non-empty string.";
        continue;
      }
      const normalized = item.trim();
      if (normalized.length > maxItemLength) {
        errors[`${path}.${index}`] = `Maximum length is ${maxItemLength}.`;
      }
      result.push(normalized);
    }
    return result;
  }

  function requestEnum<const Value extends string>(
    source: UnknownObject,
    key: string,
    allowedValues: readonly Value[],
    path: string,
    errors: { [field: string]: string },
  ): Value {
    const value = source[key];
    if (!isOneOf(value, allowedValues)) {
      errors[path] = `Expected one of: ${allowedValues.join(", ")}.`;
      return allowedValues[0];
    }
    return value;
  }

  function assertUnique(
    values: string[],
    path: string,
    errors: { [field: string]: string },
  ): void {
    if (new Set(values).size !== values.length) {
      errors[path] = "Duplicate values are not allowed.";
    }
  }

  function throwIfRequestInvalid(
    errors: { [field: string]: string },
  ): void {
    if (Object.keys(errors).length > 0) {
      throw config.createRequestError(errors);
    }
  }

  function validated<Value>(
    value: Value,
    errors: { [field: string]: string },
  ): Value {
    throwIfRequestInvalid(errors);
    return value;
  }

  return {
    assertOnlyKeys,
    assertUnique,
    requestBoolean,
    requestEnum,
    requestInteger,
    requestNullableInteger,
    requestNullableString,
    requestNullableTimestamp,
    requestNullableUuid,
    requestObject,
    requestString,
    requestStringArray,
    requestUuid,
    throwIfRequestInvalid,
    validated,
  };
}
