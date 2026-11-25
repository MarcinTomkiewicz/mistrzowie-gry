import { DocumentRequestError } from "./document-api.ts";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function readObject(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new DocumentRequestError();
  return value;
}

export function readText(value: unknown): string {
  if (
    typeof value !== "string" || value.trim() === "" || value.includes("\0")
  ) {
    throw new DocumentRequestError();
  }
  return value.trim();
}

export function readUuid(value: unknown, pattern = UUID_PATTERN): string {
  const id = readText(value);
  if (!pattern.test(id)) throw new DocumentRequestError();
  return id;
}

export function readEnum<const Value extends string>(
  value: unknown,
  allowed: readonly Value[],
): Value {
  const match = allowed.find((item) => item === value);
  if (match === undefined) throw new DocumentRequestError();
  return match;
}

export function readFiles(form: FormData, key: string): File[] {
  const files = form.getAll(key);
  if (files.length === 0 || !files.every((file) => file instanceof File)) {
    throw new DocumentRequestError();
  }
  return files;
}

export function readSingleFile(form: FormData, key: string): File {
  const files = readFiles(form, key);
  if (files.length !== 1) throw new DocumentRequestError();
  return files[0];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
