export type UnknownObject = { [key: string]: unknown };

export interface ContractReaderConfig<Context> {
  createRequestError(
    fieldErrors: { [field: string]: string },
  ): Error;
  createBackendError(context: Context): Error;
  allowEmptyBackendNullableString?: boolean;
  isTimestamp?: (value: string) => boolean;
}

export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isOneOf<Value extends string>(
  value: unknown,
  allowedValues: readonly Value[],
): value is Value {
  return typeof value === "string" &&
    allowedValues.some((allowedValue) => allowedValue === value);
}

export function isObject(value: unknown): value is UnknownObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
