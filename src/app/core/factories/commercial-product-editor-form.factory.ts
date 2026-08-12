import { FormControl, FormGroup, Validators } from '@angular/forms';

import type {
  CommercialEditorProduct,
  CommercialSessionCount,
} from '../types/commercial-page-builder';
import type { CommercialProductEditorForm } from '../types/commercial-page-editor-form';
import { setControlEnabled } from '../utils/form-controls';
import {
  commercialProductValidator,
} from '../validators/commercial-builder-editor.validator';
import { integerValidator } from '../validators/form-value.validator';
import { requiredTrimmedValidator } from '../validators/required-trimmed.validator';
import {
  createCommercialPriceEditorForm,
  mapCommercialPriceEditorForm,
} from './commercial-price-editor-form.factory';
import {
  createCommercialRichContentEditorControl,
  mapCommercialRichContentEditorControl,
} from './commercial-rich-content-editor-form.factory';

const positiveIntegerValidators = [integerValidator(), Validators.min(1)];

export function createCommercialProductEditorForm(
  product: CommercialEditorProduct | null = null,
): CommercialProductEditorForm {
  const form = new FormGroup(
    {
      id: new FormControl(product?.id ?? crypto.randomUUID(), {
        nonNullable: true,
      }),
      kind: new FormControl(product?.kind ?? 'product', {
        nonNullable: true,
      }),
      name: new FormControl(product?.name ?? '', {
        nonNullable: true,
        validators: [requiredTrimmedValidator()],
      }),
      description: createCommercialRichContentEditorControl(
        product?.description ?? null,
        false,
      ),
      price: createCommercialPriceEditorForm(product?.price ?? null),
      durationMode: new FormControl(
        product?.duration.mode ?? 'not_applicable',
        { nonNullable: true },
      ),
      durationMinutes: new FormControl(
        product?.duration.mode === 'custom'
          ? product.duration.minutes
          : null,
        { validators: positiveIntegerValidators },
      ),
      participantsMode: new FormControl(
        product?.participants.mode ?? 'not_applicable',
        { nonNullable: true },
      ),
      participantsMin: new FormControl(
        product?.participants.mode === 'custom'
          ? product.participants.min
          : null,
        { validators: positiveIntegerValidators },
      ),
      participantsMax: new FormControl(
        product?.participants.mode === 'custom'
          ? product.participants.max
          : null,
        { validators: positiveIntegerValidators },
      ),
      participantsPerFacilitatorMax: new FormControl(
        product?.participants.mode === 'custom'
          ? product.participants.perFacilitatorMax
          : null,
        { validators: positiveIntegerValidators },
      ),
      sessionsMode: new FormControl(
        product?.sessions.mode ?? 'not_applicable',
        { nonNullable: true },
      ),
      sessionsCount: optionalPositiveIntegerControl(
        product?.sessions.count ?? null,
      ),
      meetingCountMin: optionalPositiveIntegerControl(
        product?.meetingCountMin ?? null,
      ),
      meetingCountMax: optionalPositiveIntegerControl(
        product?.meetingCountMax ?? null,
      ),
      facilitatorCount: optionalPositiveIntegerControl(
        product?.facilitatorCount ?? null,
      ),
      tableCount: optionalPositiveIntegerControl(product?.tableCount ?? null),
      includedAddonIds: new FormControl(product?.includedAddonIds ?? [], {
        nonNullable: true,
      }),
    },
    { validators: [commercialProductValidator] },
  );

  syncCommercialProductEditorControls(form);
  return form;
}

export function mapCommercialProductEditorForm(
  form: CommercialProductEditorForm,
  position: number,
): CommercialEditorProduct {
  const value = form.getRawValue();

  return {
    id: value.id,
    position,
    kind: value.kind,
    name: value.name.trim(),
    description: mapCommercialRichContentEditorControl(
      form.controls.description,
      false,
    ),
    price: mapCommercialPriceEditorForm(form.controls.price),
    duration:
      value.durationMode === 'custom'
        ? { mode: 'custom', minutes: requireNumber(value.durationMinutes) }
        : { mode: value.durationMode, minutes: null },
    participants:
      value.participantsMode === 'custom'
        ? {
            mode: 'custom',
            min: value.participantsMin,
            max: value.participantsMax,
            perFacilitatorMax: value.participantsPerFacilitatorMax,
          }
        : {
            mode: value.participantsMode,
            min: null,
            max: null,
            perFacilitatorMax: null,
          },
    sessions: mapCommercialSessionCount(
      value.sessionsMode,
      value.sessionsCount,
    ),
    meetingCountMin: value.meetingCountMin,
    meetingCountMax: value.meetingCountMax,
    facilitatorCount: value.facilitatorCount,
    tableCount: value.tableCount,
    includedAddonIds: value.includedAddonIds,
  };
}

export function syncCommercialProductEditorControls(
  form: CommercialProductEditorForm,
): void {
  setControlEnabled(
    form.controls.durationMinutes,
    form.controls.durationMode.getRawValue() === 'custom',
  );

  const customParticipants =
    form.controls.participantsMode.getRawValue() === 'custom';
  setControlEnabled(form.controls.participantsMin, customParticipants);
  setControlEnabled(form.controls.participantsMax, customParticipants);
  setControlEnabled(
    form.controls.participantsPerFacilitatorMax,
    customParticipants,
  );

  const hasSessions =
    form.controls.sessionsMode.getRawValue() !== 'not_applicable';
  setControlEnabled(form.controls.sessionsCount, hasSessions);

  setControlEnabled(
    form.controls.includedAddonIds,
    form.controls.kind.getRawValue() === 'product',
  );
}

export function syncCommercialProductKind(
  form: CommercialProductEditorForm,
): void {
  if (
    form.controls.kind.getRawValue() === 'addon' &&
    form.controls.includedAddonIds.getRawValue().length
  ) {
    form.controls.includedAddonIds.setValue([]);
    form.controls.includedAddonIds.markAsDirty();
  }

  syncCommercialProductEditorControls(form);
}

function optionalPositiveIntegerControl(value: number | null) {
  return new FormControl(value, { validators: positiveIntegerValidators });
}

function requireNumber(value: number | null): number {
  if (value === null) {
    throw new TypeError('A valid product mode requires a numeric value.');
  }

  return value;
}

function mapCommercialSessionCount(
  mode: CommercialSessionCount['mode'],
  count: number | null,
): CommercialSessionCount {
  switch (mode) {
    case 'not_applicable':
      return { mode, count: null };
    case 'total':
    case 'per_month':
      return { mode, count: requireNumber(count) };
    default:
      return unsupportedCommercialSessionMode(mode);
  }
}

function unsupportedCommercialSessionMode(mode: never): never {
  throw new TypeError(`Unsupported commercial session mode: ${String(mode)}`);
}
