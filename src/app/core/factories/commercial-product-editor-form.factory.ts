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
  createPriceEditorForm,
  mapPriceEditorForm,
} from './price-editor-form.factory';
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
      price: createPriceEditorForm(product?.price ?? null),
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
    price: mapPriceEditorForm(form.controls.price),
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

function unsupportedCommercialSessionMode(mode: never): never {
  throw new TypeError(`Unsupported commercial session mode: ${String(mode)}`);
}
