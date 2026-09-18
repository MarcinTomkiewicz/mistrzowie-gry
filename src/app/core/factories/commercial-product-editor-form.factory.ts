import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';

import type {
  CommercialCooperationLength,
  CommercialEditorProduct,
  CommercialFrequency,
  CommercialSessionCount,
} from '../types/commercial-product';
import type { CommercialProductEditorForm } from '../types/commercial-page-editor-form';
import { setControlEnabled } from '../utils/form-controls';
import { normalizeText } from '../utils/normalize-text';
import {
  commercialProductValidator,
} from '../validators/commercial-builder-editor.validator';
import { integerValidator } from '../validators/form-value.validator';
import { requiredTrimmedValidator } from '../validators/required-trimmed.validator';
import {
  createCommercialProductPriceEditorForm,
  mapCommercialProductPriceEditorForm,
} from './commercial-product-price-editor-form.factory';
import {
  createRichContentEditorControl,
  mapRichContentEditorControl,
} from './rich-content-editor-form.factory';
import { createUuidFormControl } from './form-control.factory';

export function createCommercialProductEditorForm(
  product: CommercialEditorProduct | null = null,
): CommercialProductEditorForm {
  const form = new FormGroup(
    {
      id: createUuidFormControl(product?.id),
      kind: new FormControl(product?.kind ?? 'product', {
        nonNullable: true,
      }),
      name: new FormControl(product?.name ?? '', {
        nonNullable: true,
        validators: [requiredTrimmedValidator()],
      }),
      description: createRichContentEditorControl(
        product?.description ?? null,
        false,
      ),
      prices: new FormArray(
        product
          ? product.prices.map((price) =>
              createCommercialProductPriceEditorForm(price)
            )
          : [createCommercialProductPriceEditorForm(null, true)],
      ),
      settlement: new FormControl(product?.settlement ?? '', {
        nonNullable: true,
      }),
      durationMode: new FormControl(
        product?.duration.mode ?? 'not_applicable',
        { nonNullable: true },
      ),
      durationMinutes: positiveIntegerControl(
        product?.duration.mode === 'custom'
          ? product.duration.minutes
          : null,
      ),
      participantsMode: new FormControl(
        product?.participants.mode ?? 'not_applicable',
        { nonNullable: true },
      ),
      participantsMin: positiveIntegerControl(
        product?.participants.mode === 'custom'
          ? product.participants.min
          : null,
      ),
      participantsMax: positiveIntegerControl(
        product?.participants.mode === 'custom'
          ? product.participants.max
          : null,
      ),
      participantsPerFacilitatorMax: positiveIntegerControl(
        product?.participants.mode === 'custom'
          ? product.participants.perFacilitatorMax
          : null,
      ),
      sessionsMode: new FormControl(
        product?.sessions.mode ?? 'not_applicable',
        { nonNullable: true },
      ),
      sessionsCount: positiveIntegerControl(
        product?.sessions.count ?? null,
      ),
      frequencyMode: new FormControl(
        product?.frequency.mode ?? 'not_applicable',
        { nonNullable: true },
      ),
      frequencyCount: positiveIntegerControl(
        product?.frequency.count ?? null,
      ),
      cooperationLengthMode: new FormControl(
        product?.cooperationLength.mode ?? 'not_applicable',
        { nonNullable: true },
      ),
      cooperationLengthSemesters: positiveIntegerControl(
        product?.cooperationLength.semesters ?? null,
      ),
      meetingCountMin: positiveIntegerControl(
        product?.meetingCountMin ?? null,
      ),
      meetingCountMax: positiveIntegerControl(
        product?.meetingCountMax ?? null,
      ),
      facilitatorCount: positiveIntegerControl(
        product?.facilitatorCount ?? null,
      ),
      tableCount: positiveIntegerControl(product?.tableCount ?? null),
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
    description: mapRichContentEditorControl(
      form.controls.description,
      false,
    ),
    prices: form.controls.prices.controls.map(
      mapCommercialProductPriceEditorForm,
    ),
    settlement: normalizeText(value.settlement),
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
    frequency: mapCommercialFrequency(
      value.frequencyMode,
      value.frequencyCount,
    ),
    cooperationLength: mapCommercialCooperationLength(
      value.cooperationLengthMode,
      value.cooperationLengthSemesters,
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

  const frequencyMode = form.controls.frequencyMode.getRawValue();
  setControlEnabled(
    form.controls.frequencyCount,
    frequencyMode === 'weekly' || frequencyMode === 'monthly',
  );

  const cooperationLengthMode =
    form.controls.cooperationLengthMode.getRawValue();
  setControlEnabled(
    form.controls.cooperationLengthSemesters,
    cooperationLengthMode === 'exact' || cooperationLengthMode === 'minimum',
  );

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

function positiveIntegerControl(value: number | null) {
  return new FormControl(value, {
    validators: [integerValidator(), Validators.min(1)],
  });
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

function mapCommercialFrequency(
  mode: CommercialFrequency['mode'],
  count: number | null,
): CommercialFrequency {
  switch (mode) {
    case 'not_applicable':
    case 'one_time':
      return { mode, count: null };
    case 'weekly':
    case 'monthly':
      return { mode, count: requireNumber(count) };
  }
}

function mapCommercialCooperationLength(
  mode: CommercialCooperationLength['mode'],
  semesters: number | null,
): CommercialCooperationLength {
  switch (mode) {
    case 'not_applicable':
    case 'one_time':
      return { mode, semesters: null };
    case 'exact':
    case 'minimum':
      return { mode, semesters: requireNumber(semesters) };
  }
}

function unsupportedCommercialSessionMode(mode: never): never {
  throw new TypeError(`Unsupported commercial session mode: ${String(mode)}`);
}
