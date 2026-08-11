import { FormControl, FormGroup, Validators } from '@angular/forms';

import type {
  CommercialEditorProduct,
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
const nonNegativeIntegerValidators = [
  integerValidator(),
  Validators.min(0),
];

export function createCommercialProductEditorForm(
  product: CommercialEditorProduct | null = null,
): CommercialProductEditorForm {
  const form = new FormGroup(
    {
      id: new FormControl(product?.id ?? crypto.randomUUID(), {
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
        { validators: nonNegativeIntegerValidators },
      ),
      participantsMax: new FormControl(
        product?.participants.mode === 'custom'
          ? product.participants.max
          : null,
        { validators: nonNegativeIntegerValidators },
      ),
      participantsPerFacilitatorMax: new FormControl(
        product?.participants.mode === 'custom'
          ? product.participants.perFacilitatorMax
          : null,
        { validators: nonNegativeIntegerValidators },
      ),
      sessions: optionalPositiveIntegerControl(product?.sessions ?? null),
      sessionsPerMonth: optionalPositiveIntegerControl(
        product?.sessionsPerMonth ?? null,
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
            min: requireNumber(value.participantsMin),
            max: requireNumber(value.participantsMax),
            perFacilitatorMax: value.participantsPerFacilitatorMax,
          }
        : {
            mode: value.participantsMode,
            min: null,
            max: null,
            perFacilitatorMax: null,
          },
    sessions: value.sessions,
    sessionsPerMonth: value.sessionsPerMonth,
    meetingCountMin: value.meetingCountMin,
    meetingCountMax: value.meetingCountMax,
    facilitatorCount: value.facilitatorCount,
    tableCount: value.tableCount,
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
