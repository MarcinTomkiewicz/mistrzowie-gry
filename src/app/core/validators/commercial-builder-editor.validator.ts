import type {
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

import type {
  RichContent,
  RichContentBlock,
  RichContentInlineNode,
} from '../types/rich-content';

export function commercialRichContentValidator(required: boolean): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: unknown = control.value;

    if (!isRichContent(value)) return { richContent: true };
    if (hasInvalidRichContentLink(value)) return { richContentLink: true };

    return required && !hasCommercialRichContent(value)
      ? { richContent: true }
      : null;
  };
}

export function hasCommercialRichContent(content: RichContent): boolean {
  return content.sections.some((section) =>
    !!section.title?.trim() || section.blocks.some(hasBlockContent),
  );
}

export const commercialProductValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const durationMode = valueOf(control, 'durationMode');
  const durationMinutes = valueOf(control, 'durationMinutes');

  if (
    durationMode === 'custom' &&
    !isPositiveInteger(durationMinutes)
  ) {
    return { commercialDuration: true };
  }

  const participantsMode = valueOf(control, 'participantsMode');
  const participantsMin = valueOf(control, 'participantsMin');
  const participantsMax = valueOf(control, 'participantsMax');
  const perFacilitatorMax = valueOf(
    control,
    'participantsPerFacilitatorMax',
  );
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

  const meetingMin = valueOf(control, 'meetingCountMin');
  const meetingMax = valueOf(control, 'meetingCountMax');

  return meetingMin !== null &&
      meetingMax !== null &&
      typeof meetingMin === 'number' &&
      typeof meetingMax === 'number' &&
      meetingMin > meetingMax
    ? { commercialMeetingRange: true }
    : null;
};

export const commercialProductFieldValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const overrides = control.get('labelOverrides');
  if (!overrides || !Array.isArray(overrides.value)) return null;

  const productIds = overrides.value
    .map((override: unknown) =>
      typeof override === 'object' && override !== null &&
        'productId' in override && typeof override.productId === 'string'
        ? override.productId
        : null,
    )
    .filter((productId): productId is string => productId !== null);

  return new Set(productIds).size === productIds.length
    ? null
    : { commercialDuplicateLabelOverride: true };
};

export const commercialProductCollectionValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const productIds = stringArrayValue(control.get('productIds')?.value);
  const collectionProductIds = new Set(productIds);
  const fields: unknown = control.get('fields')?.value;

  if (!Array.isArray(fields)) return null;

  const hasStaleReference = fields.some((field: unknown) => {
    if (typeof field !== 'object' || field === null) return false;

    const fieldProductIds = stringArrayValue(
      'productIds' in field ? field.productIds : null,
    );
    const visibleProductIds = new Set(
      'productIds' in field && field.productIds === null
        ? productIds
        : fieldProductIds,
    );
    const overrides = 'labelOverrides' in field ? field.labelOverrides : null;

    return fieldProductIds.some((productId) =>
      !collectionProductIds.has(productId)
    ) || Array.isArray(overrides) && overrides.some((override: unknown) =>
      typeof override === 'object' && override !== null &&
      'productId' in override && typeof override.productId === 'string' &&
      !visibleProductIds.has(override.productId)
    );
  });

  return hasStaleReference
    ? { commercialStaleProductReference: true }
    : null;
};

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function valueOf(control: AbstractControl, name: string): unknown {
  return control.get(name)?.value;
}

function stringArrayValue(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function isRichContent(value: unknown): value is RichContent {
  return typeof value === 'object' &&
    value !== null &&
    'sections' in value &&
    Array.isArray(value.sections);
}

function hasBlockContent(block: RichContentBlock): boolean {
  if (block.type === 'paragraph') {
    return !!block.text?.trim() || hasInlineContent(block.content);
  }

  return block.items.some((item) =>
    !!item.text?.trim() ||
    hasInlineContent(item.content) ||
    item.blocks?.some(hasBlockContent),
  );
}

function hasInvalidRichContentLink(content: RichContent): boolean {
  return content.sections.some((section) =>
    section.blocks.some(hasInvalidBlockLink),
  );
}

function hasInvalidBlockLink(block: RichContentBlock): boolean {
  if (block.type === 'paragraph') {
    return hasInvalidInlineLink(block.content);
  }

  return block.items.some((item) =>
    hasInvalidInlineLink(item.content) ||
    item.blocks?.some(hasInvalidBlockLink),
  );
}

function hasInvalidInlineLink(
  nodes: RichContentInlineNode[] | undefined,
): boolean {
  return nodes?.some((node) =>
    node.type === 'link' && !node.href.trim()
  ) ?? false;
}

function hasInlineContent(nodes: RichContentInlineNode[] | undefined): boolean {
  return nodes?.some((node) => !!node.text.trim()) ?? false;
}
