import type {
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';

import { isRecord } from '../utils/is-record';

export function commercialProductValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const value: unknown = control.getRawValue();
  if (!isRecord(value)) return { commercialSessions: true };

  const durationMode = value['durationMode'];
  const durationMinutes = value['durationMinutes'];

  if (
    durationMode === 'custom' &&
    !isPositiveInteger(durationMinutes)
  ) {
    return { commercialDuration: true };
  }

  const participantsMode = value['participantsMode'];
  const participantsMin = value['participantsMin'];
  const participantsMax = value['participantsMax'];
  const perFacilitatorMax = value['participantsPerFacilitatorMax'];
  const participantLimits = [
    participantsMin,
    participantsMax,
    perFacilitatorMax,
  ];
  const missingParticipantLimit = participantLimits.every(
    (value) => value === null,
  );
  const invalidParticipantLimit = participantLimits.some(
    (value) => value !== null && !isPositiveInteger(value),
  );
  const invalidParticipantRange =
    isPositiveInteger(participantsMin) &&
    isPositiveInteger(participantsMax) &&
    participantsMin > participantsMax;

  if (
    participantsMode === 'custom' &&
    (missingParticipantLimit ||
      invalidParticipantLimit ||
      invalidParticipantRange)
  ) {
    return { commercialParticipants: true };
  }

  const sessionsMode = value['sessionsMode'];
  const sessionsCount = value['sessionsCount'];
  const invalidSessions =
    sessionsMode === 'total' || sessionsMode === 'per_month'
      ? !isPositiveInteger(sessionsCount)
      : sessionsMode !== 'not_applicable';

  if (invalidSessions) return { commercialSessions: true };

  const id = value['id'];
  const kind = value['kind'];
  const includedAddonIds = stringArrayValue(value['includedAddonIds']);
  const invalidIncludedAddons =
    (kind !== 'product' && kind !== 'addon') ||
    (kind === 'addon' && includedAddonIds.length > 0) ||
    (typeof id === 'string' && includedAddonIds.includes(id)) ||
    new Set(includedAddonIds).size !== includedAddonIds.length;

  if (invalidIncludedAddons) {
    return { commercialIncludedAddons: true };
  }

  const meetingMin = value['meetingCountMin'];
  const meetingMax = value['meetingCountMax'];

  return meetingMin !== null &&
      meetingMax !== null &&
      typeof meetingMin === 'number' &&
      typeof meetingMax === 'number' &&
      meetingMin > meetingMax
    ? { commercialMeetingRange: true }
    : null;
}

export function commercialProductsValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const products: unknown = control.getRawValue();
  if (!Array.isArray(products)) return { commercialProducts: true };

  const productKinds = new Map<string, unknown>();

  for (const product of products) {
    if (!isRecord(product)) return { commercialProducts: true };

    const id = product['id'];
    if (typeof id !== 'string' || productKinds.has(id)) {
      return { commercialProducts: true };
    }

    productKinds.set(id, product['kind']);
  }

  for (const product of products) {
    if (!isRecord(product)) return { commercialProducts: true };

    const includedAddonIds = stringArrayValue(product['includedAddonIds']);
    if (
      includedAddonIds.some((addonId) => productKinds.get(addonId) !== 'addon')
    ) {
      return { commercialIncludedAddons: true };
    }
  }

  return null;
}

export function commercialProductFieldValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const value: unknown = control.getRawValue();
  if (!isRecord(value) || !Array.isArray(value['labelOverrides'])) return null;

  const productIds = value['labelOverrides']
    .map((override: unknown) =>
      isRecord(override) && typeof override['productId'] === 'string'
        ? override['productId']
        : null,
    )
    .filter((productId): productId is string => productId !== null);

  return new Set(productIds).size === productIds.length
    ? null
    : { commercialDuplicateLabelOverride: true };
}

export function commercialProductCollectionValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const value: unknown = control.getRawValue();
  if (!isRecord(value)) return null;

  const productIds = stringArrayValue(value['productIds']);
  const collectionProductIds = new Set(productIds);
  const fields = value['fields'];

  if (!Array.isArray(fields)) return null;

  const hasStaleReference = fields.some((field: unknown) => {
    if (!isRecord(field)) return false;

    const fieldProductIds = stringArrayValue(field['productIds']);
    const visibleProductIds = new Set(
      field['productIds'] === null
        ? productIds
        : fieldProductIds,
    );
    const overrides = field['labelOverrides'];

    return fieldProductIds.some((productId) =>
      !collectionProductIds.has(productId)
    ) || Array.isArray(overrides) && overrides.some((override: unknown) =>
      isRecord(override) &&
      typeof override['productId'] === 'string' &&
      !visibleProductIds.has(override['productId'])
    );
  });

  const presentation = value['presentation'];
  const presentationType = isRecord(presentation)
    ? presentation['type']
    : null;
  const comparisonSections = isRecord(presentation)
    ? presentation['sections']
    : null;
  const fieldIds = new Set(
    fields.flatMap((field: unknown) =>
      isRecord(field) && typeof field['id'] === 'string'
        ? [field['id']]
        : []
    ),
  );
  const hasInvalidComparison =
    presentationType === 'comparison_table' &&
    (!Array.isArray(comparisonSections) ||
      comparisonSections.some((section: unknown) =>
        !isRecord(section) ||
        !Array.isArray(section['rows']) ||
        section['rows'].some((row: unknown) => {
          if (!isRecord(row)) return true;

          const rowFieldIds = stringArrayValue(row['fieldIds']);
          return rowFieldIds.length === 0 ||
            new Set(rowFieldIds).size !== rowFieldIds.length ||
            rowFieldIds.some((fieldId) => !fieldIds.has(fieldId));
        })
      ));

  if (hasStaleReference) return { commercialStaleProductReference: true };
  return hasInvalidComparison ? { commercialComparison: true } : null;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function stringArrayValue(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}
