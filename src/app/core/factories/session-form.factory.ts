import { FormBuilder, Validators } from '@angular/forms';

import {
  ICreateSessionPayload,
  ISessionFormData,
  IUpdateSessionPayload,
} from '../interfaces/i-session';
import { requiredTrimmedValidator } from '../validators/required-trimmed.validator';
import { sessionPlayersRangeValidator } from '../validators/session-players-range.validator';

export function createSessionForm(fb: FormBuilder) {
  return fb.group(
    {
      systemId: fb.control<string | null>(null, {
        validators: [Validators.required],
        nonNullable: false,
      }),
      title: fb.control<string | null>(null, {
        validators: [Validators.required, requiredTrimmedValidator(), Validators.maxLength(120)],
        nonNullable: false,
      }),
      description: fb.control<string | null>(null, {
        validators: [Validators.required, requiredTrimmedValidator()],
        nonNullable: false,
      }),
      image: fb.control<string | null>(null, {
        validators: [Validators.required, requiredTrimmedValidator()],
        nonNullable: false,
      }),
      difficultyLevel: fb.control<ISessionFormData['difficultyLevel']>(null, {
        validators: [Validators.required],
        nonNullable: false,
      }),
      minPlayers: fb.control<number | null>(1, {
        validators: [Validators.required, Validators.min(1), Validators.max(5)],
        nonNullable: false,
      }),
      maxPlayers: fb.control<number | null>(5, {
        validators: [Validators.required, Validators.min(1), Validators.max(5)],
        nonNullable: false,
      }),
      minAge: fb.control<number | null>(0, {
        validators: [Validators.required, Validators.min(0)],
        nonNullable: false,
      }),
      triggerIds: fb.control<string[]>([], {
        nonNullable: true,
      }),
      gmStyleIds: fb.control<string[]>([], {
        nonNullable: true,
      }),
    },
    {
      validators: [sessionPlayersRangeValidator()],
    },
  );
}

export function mapSessionToFormData(
  value: Partial<ISessionFormData> | null | undefined,
): ISessionFormData {
  return {
    systemId: value?.systemId ?? null,
    title: value?.title ?? null,
    description: value?.description ?? null,
    image: value?.image ?? null,
    difficultyLevel: value?.difficultyLevel ?? null,
    minPlayers: value?.minPlayers ?? 1,
    maxPlayers: value?.maxPlayers ?? 5,
    minAge: value?.minAge ?? 0,
    triggerIds: value?.triggerIds ?? [],
    gmStyleIds: value?.gmStyleIds ?? [],
  };
}

export function mapSessionFormToPayload(
  form: ReturnType<typeof createSessionForm>,
): ICreateSessionPayload | IUpdateSessionPayload {
  const raw = form.getRawValue();

  return {
    systemId: raw.systemId!,
    title: raw.title!,
    description: raw.description!,
    image: raw.image!,
    difficultyLevel: raw.difficultyLevel!,
    minPlayers: raw.minPlayers!,
    maxPlayers: raw.maxPlayers!,
    minAge: raw.minAge!,
    triggerIds: raw.triggerIds,
    gmStyleIds: raw.gmStyleIds,
  };
}