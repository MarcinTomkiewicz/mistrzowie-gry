import type {
  FieldErrors,
  InstitutionReference,
  InstitutionsData,
} from "./contracts.ts";
import {
  requestNull,
  requestObject,
  requestString,
} from "./request-reader.ts";

const KEYS = ["taxOffice", "nfzBranch"] as const;
const REFERENCE_KEYS = ["kind", "code", "name"] as const;

export function parseInstitutions(
  value: unknown,
  errors: FieldErrors,
): InstitutionsData {
  const source = requestObject(
    value,
    "data.institutions",
    KEYS,
    [],
    errors,
  );

  return {
    taxOffice: parseReference(
      source.taxOffice,
      "data.institutions.taxOffice",
      errors,
    ),
    nfzBranch: parseReference(
      source.nfzBranch,
      "data.institutions.nfzBranch",
      errors,
    ),
  };
}

function parseReference(
  value: unknown,
  path: string,
  errors: FieldErrors,
): InstitutionReference {
  if (value === null) {
    return null;
  }

  const source = requestObject(value, path, REFERENCE_KEYS, [], errors);
  const kind = source.kind;

  if (kind === "catalog") {
    return {
      kind,
      code: requestString(source, "code", `${path}.code`, errors),
      name: requestString(source, "name", `${path}.name`, errors),
    };
  }

  if (kind === "legacy") {
    return {
      kind,
      code: requestNull(source, "code", `${path}.code`, errors),
      name: requestString(source, "name", `${path}.name`, errors),
    };
  }

  errors[`${path}.kind`] = "Value is not allowed.";
  return null;
}
