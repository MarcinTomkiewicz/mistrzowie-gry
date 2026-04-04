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
  const sessionValue = value as Partial<
    ISessionFormData & {
      system?: { id: string } | null;
      triggers?: Array<{ id: string }> | null;
      styles?: Array<{ id: string }> | null;
    }
  >;

  return {
    systemId: sessionValue?.systemId ?? sessionValue?.system?.id ?? null,
    title: sessionValue?.title ?? null,
    description: sessionValue?.description ?? null,
    image: sessionValue?.image ?? null,
    difficultyLevel: sessionValue?.difficultyLevel ?? null,
    minPlayers: sessionValue?.minPlayers ?? 1,
    maxPlayers: sessionValue?.maxPlayers ?? 5,
    minAge: sessionValue?.minAge ?? 0,
    triggerIds:
      sessionValue?.triggerIds ??
      (sessionValue?.triggers ?? []).map((trigger) => trigger.id),
    gmStyleIds:
      sessionValue?.gmStyleIds ??
      (sessionValue?.styles ?? []).map((style) => style.id),
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
