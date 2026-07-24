import type { UnknownObject } from "./contracts.ts";
import { BackendContractError } from "./errors.ts";
import type { RpcName } from "./rpc-names.ts";

const BASE64_PATTERN =
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function backendObject(
  value: unknown,
  expectedKeys: readonly string[],
  rpcName: RpcName,
): UnknownObject {
  if (!isObject(value)) {
    throw new BackendContractError(rpcName);
  }
  const actualKeys = Object.keys(value);
  if (
    actualKeys.length !== expectedKeys.length ||
    expectedKeys.some((key) => !hasOwn(value, key))
  ) {
    throw new BackendContractError(rpcName);
  }
  return value;
}

export function backendString(
  source: UnknownObject,
  key: string,
  rpcName: RpcName,
): string {
  const value = source[key];
  if (typeof value !== "string" || value === "") {
    throw new BackendContractError(rpcName);
  }
  return value;
}

export function backendUuid(
  source: UnknownObject,
  key: string,
  rpcName: RpcName,
): string {
  const value = backendString(source, key, rpcName);
  if (!UUID_PATTERN.test(value)) {
    throw new BackendContractError(rpcName);
  }
  return value;
}

export function backendBoolean(
  source: UnknownObject,
  key: string,
  rpcName: RpcName,
): boolean {
  const value = source[key];
  if (typeof value !== "boolean") {
    throw new BackendContractError(rpcName);
  }
  return value;
}

export function backendTrue(
  source: UnknownObject,
  key: string,
  rpcName: RpcName,
): true {
  if (source[key] !== true) {
    throw new BackendContractError(rpcName);
  }
  return true;
}

export function backendPositiveInteger(
  source: UnknownObject,
  key: string,
  rpcName: RpcName,
): number {
  const value = source[key];
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new BackendContractError(rpcName);
  }
  return value;
}

export function backendTimestamp(
  source: UnknownObject,
  key: string,
  rpcName: RpcName,
): string {
  const value = backendString(source, key, rpcName);
  if (Number.isNaN(Date.parse(value))) {
    throw new BackendContractError(rpcName);
  }
  return value;
}

export function backendNullableTimestamp(
  source: UnknownObject,
  key: string,
  rpcName: RpcName,
): string | null {
  if (source[key] === null) {
    return null;
  }
  return backendTimestamp(source, key, rpcName);
}

export function backendBase64(
  source: UnknownObject,
  key: string,
  rpcName: RpcName,
  expectedLength?: number,
): string {
  const value = backendString(source, key, rpcName);
  const length = base64ByteLength(value);
  if (length === null || (expectedLength !== undefined && length !== expectedLength)) {
    throw new BackendContractError(rpcName);
  }
  return value;
}

function base64ByteLength(value: string): number | null {
  const compact = value.replace(/[\t\n\r ]/g, "");
  if (
    compact === "" ||
    compact.length % 4 !== 0 ||
    !BASE64_PATTERN.test(compact)
  ) {
    return null;
  }
  try {
    return atob(compact).length;
  } catch {
    return null;
  }
}

function isObject(value: unknown): value is UnknownObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOwn(value: UnknownObject, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}
