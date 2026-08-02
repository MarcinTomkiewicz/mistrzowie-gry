import {
  type ContractReaderConfig,
  isObject,
  isOneOf,
  type UnknownObject,
  UUID_PATTERN,
} from "./contract-reader-foundation.ts";

export function createBackendContractReaders<Context>(
  config: ContractReaderConfig<Context>,
) {
  const isTimestamp = config.isTimestamp ??
    ((value: string) => !Number.isNaN(Date.parse(value)));

  function backendObject(
    value: unknown,
    context: Context,
    expectedKeys?: readonly string[],
  ): UnknownObject {
    if (!isObject(value)) {
      throw config.createBackendError(context);
    }
    if (expectedKeys !== undefined) {
      const actualKeys = Object.keys(value);
      if (
        actualKeys.length !== expectedKeys.length ||
        actualKeys.some((key) => !expectedKeys.includes(key))
      ) {
        throw config.createBackendError(context);
      }
    }
    return value;
  }

  function backendArray(
    source: UnknownObject,
    key: string,
    context: Context,
  ): unknown[] {
    return backendArrayValue(source[key], context);
  }

  function backendArrayValue(
    value: unknown,
    context: Context,
  ): unknown[] {
    if (!Array.isArray(value)) {
      throw config.createBackendError(context);
    }
    return value;
  }

  function backendString(
    source: UnknownObject,
    key: string,
    context: Context,
  ): string {
    const value = source[key];
    if (typeof value !== "string" || value === "") {
      throw config.createBackendError(context);
    }
    return value;
  }

  function backendNullableString(
    source: UnknownObject,
    key: string,
    context: Context,
  ): string | null {
    const value = source[key];
    if (value === null) {
      return null;
    }
    if (
      typeof value !== "string" ||
      (config.allowEmptyBackendNullableString === false && value === "")
    ) {
      throw config.createBackendError(context);
    }
    return value;
  }

  function backendUuid(
    source: UnknownObject,
    key: string,
    context: Context,
  ): string {
    const value = backendString(source, key, context);
    if (!UUID_PATTERN.test(value)) {
      throw config.createBackendError(context);
    }
    return value;
  }

  function backendNullableUuid(
    source: UnknownObject,
    key: string,
    context: Context,
  ): string | null {
    return source[key] === null ? null : backendUuid(source, key, context);
  }

  function backendBoolean(
    source: UnknownObject,
    key: string,
    context: Context,
  ): boolean {
    const value = source[key];
    if (typeof value !== "boolean") {
      throw config.createBackendError(context);
    }
    return value;
  }

  function backendInteger(
    source: UnknownObject,
    key: string,
    context: Context,
  ): number {
    const value = source[key];
    if (typeof value !== "number" || !Number.isInteger(value)) {
      throw config.createBackendError(context);
    }
    return value;
  }

  function backendPositiveInteger(
    source: UnknownObject,
    key: string,
    context: Context,
  ): number {
    const value = source[key];
    if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
      throw config.createBackendError(context);
    }
    return value;
  }

  function backendNonNegativeInteger(
    source: UnknownObject,
    key: string,
    context: Context,
  ): number {
    const value = source[key];
    if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
      throw config.createBackendError(context);
    }
    return value;
  }

  function backendNullablePositiveInteger(
    source: UnknownObject,
    key: string,
    context: Context,
  ): number | null {
    return source[key] === null
      ? null
      : backendPositiveInteger(source, key, context);
  }

  function backendTimestamp(
    source: UnknownObject,
    key: string,
    context: Context,
  ): string {
    const value = backendString(source, key, context);
    if (!isTimestamp(value)) {
      throw config.createBackendError(context);
    }
    return value;
  }

  function backendNullableTimestamp(
    source: UnknownObject,
    key: string,
    context: Context,
  ): string | null {
    return source[key] === null ? null : backendTimestamp(source, key, context);
  }

  function backendEnum<const Value extends string>(
    source: UnknownObject,
    key: string,
    allowedValues: readonly Value[],
    context: Context,
  ): Value {
    const value = source[key];
    if (!isOneOf(value, allowedValues)) {
      throw config.createBackendError(context);
    }
    return value;
  }

  function backendNullableEnum<const Value extends string>(
    source: UnknownObject,
    key: string,
    allowedValues: readonly Value[],
    context: Context,
  ): Value | null {
    return source[key] === null
      ? null
      : backendEnum(source, key, allowedValues, context);
  }

  function backendLiteral<const Value extends string | boolean>(
    source: UnknownObject,
    key: string,
    expected: Value,
    context: Context,
  ): Value {
    if (source[key] !== expected) {
      throw config.createBackendError(context);
    }
    return expected;
  }

  function backendPatternString(
    source: UnknownObject,
    key: string,
    pattern: RegExp,
    context: Context,
  ): string {
    const value = backendString(source, key, context);
    if (!pattern.test(value)) {
      throw config.createBackendError(context);
    }
    return value;
  }

  function backendNullablePatternString(
    source: UnknownObject,
    key: string,
    pattern: RegExp,
    context: Context,
  ): string | null {
    return source[key] === null
      ? null
      : backendPatternString(source, key, pattern, context);
  }

  return {
    backendArray,
    backendArrayValue,
    backendBoolean,
    backendEnum,
    backendInteger,
    backendLiteral,
    backendNonNegativeInteger,
    backendNullableEnum,
    backendNullablePatternString,
    backendNullablePositiveInteger,
    backendNullableString,
    backendNullableTimestamp,
    backendNullableUuid,
    backendObject,
    backendPatternString,
    backendPositiveInteger,
    backendString,
    backendTimestamp,
    backendUuid,
  };
}
