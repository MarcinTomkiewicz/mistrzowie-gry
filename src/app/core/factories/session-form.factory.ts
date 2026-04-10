import { FormBuilder, Validators } from '@angular/forms';

import {
  ICreateSessionPayload,
  ISessionFormData,
  ISessionFormInitialData,
  IUpdateSessionPayload,
} from '../interfaces/i-session';
import { SessionFormGroup } from '../interfaces/i-session-form';
import { requiredTrimmedValidator } from '../validators/required-trimmed.validator';
import { sessionCharacterSheetsCountValidator } from '../validators/session-character-sheets-count.validator';
import { sessionPlayersRangeValidator } from '../validators/session-players-range.validator';

export function createSessionForm(fb: FormBuilder): SessionFormGroup {
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
      hasReadyCharacterSheets: fb.nonNullable.control(false),
      allowsScenarioCustomization: fb.nonNullable.control(true),
      languageIds: fb.nonNullable.control<string[]>([]),
      characterSheetsCount: fb.control<number | null>(0, {
        validators: [Validators.min(0)],
        nonNullable: false,
      }),
      triggerIds: fb.control<string[]>([], {
        nonNullable: true,
      }),
      gmStyleIds: fb.control<string[]>([], {
        nonNullable: true,
      }),
      sortOrder: fb.control<number | null>(0, {
        validators: [Validators.min(0)],
        nonNullable: false,
      }),
    },
    {
      validators: [
        sessionPlayersRangeValidator(),
        sessionCharacterSheetsCountValidator(),
      ],
    },
  );
}

export function mapSessionToFormData(
  value: ISessionFormInitialData | null | undefined,
): ISessionFormData {
  return {
    systemId: value?.systemId ?? value?.system?.id ?? null,
    title: value?.title ?? null,
    description: value?.description ?? null,
    image: value?.image ?? null,
    difficultyLevel: value?.difficultyLevel ?? null,
    minPlayers: value?.minPlayers ?? 1,
    maxPlayers: value?.maxPlayers ?? 5,
    minAge: value?.minAge ?? 0,
    hasReadyCharacterSheets: value?.hasReadyCharacterSheets ?? false,
    allowsScenarioCustomization: value?.allowsScenarioCustomization ?? true,
    languageIds:
      value?.languageIds ??
      (value?.languages ?? []).map((language) => language.id),
    characterSheetsCount:
      value?.characterSheetsCount ?? value?.characterSheets?.length ?? 0,
    triggerIds:
      value?.triggerIds ?? (value?.triggers ?? []).map((trigger) => trigger.id),
    gmStyleIds:
      value?.gmStyleIds ?? (value?.styles ?? []).map((style) => style.id),
    sortOrder: value?.sortOrder ?? 0,
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
    hasReadyCharacterSheets: raw.hasReadyCharacterSheets,
    allowsScenarioCustomization: raw.allowsScenarioCustomization,
    languageIds: raw.languageIds,
    characterSheetsCount: raw.characterSheetsCount ?? 0,
    triggerIds: raw.triggerIds,
    gmStyleIds: raw.gmStyleIds,
    sortOrder: raw.sortOrder ?? 0,
  };
}
