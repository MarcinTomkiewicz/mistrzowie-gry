import { FormBuilder, Validators } from '@angular/forms';

import {
  ICreateSessionPayload,
  ISessionFormData,
  IUpdateSessionPayload,
} from '../interfaces/i-session';
import {
  ISessionFormFactoryOptions,
  SessionFormGroup,
} from '../interfaces/i-session-form';
import { SessionDifficultyLevel } from '../types/sessions';
import { normalizeText } from '../utils/normalize-text';
import { requiredTrimmedValidator } from '../validators/required-trimmed.validator';
import { sessionPlayersRangeValidator } from '../validators/session-players-range.validator';

type SessionFormSource = Partial<{
  systemId: string | null;
  title: string | null;
  description: string | null;
  image: string | null;
  difficultyLevel: SessionDifficultyLevel | null;
  minPlayers: number | null;
  maxPlayers: number | null;
  minAge: number | null;
  triggerIds: string[];
  gmStyleIds: string[];
  sortOrder: number | null;
}>;

export function createSessionForm(
  fb: FormBuilder,
  options?: ISessionFormFactoryOptions,
): SessionFormGroup {
  const initial = options?.initial;

  return fb.group(
    {
      systemId: fb.control<string | null>(initial?.systemId ?? null, {
        validators: [Validators.required],
      }),
      title: fb.control<string | null>(initial?.title ?? null, {
        validators: [Validators.required, requiredTrimmedValidator()],
      }),
      description: fb.control<string | null>(initial?.description ?? null, {
        validators: [Validators.required, requiredTrimmedValidator()],
      }),
      image: fb.control<string | null>(initial?.image ?? null, {
        validators: [Validators.required, requiredTrimmedValidator()],
      }),
      difficultyLevel: fb.control<SessionDifficultyLevel | null>(
        initial?.difficultyLevel ?? SessionDifficultyLevel.Beginner,
        {
          validators: [Validators.required],
        },
      ),
      minPlayers: fb.control<number | null>(initial?.minPlayers ?? 1, {
        validators: [Validators.required, Validators.min(1), Validators.max(5)],
      }),
      maxPlayers: fb.control<number | null>(initial?.maxPlayers ?? 5, {
        validators: [Validators.required, Validators.min(1), Validators.max(5)],
      }),
      minAge: fb.control<number | null>(initial?.minAge ?? 0, {
        validators: [Validators.required, Validators.min(0)],
      }),
      triggerIds: fb.nonNullable.control<string[]>(initial?.triggerIds ?? []),
      gmStyleIds: fb.nonNullable.control<string[]>(initial?.gmStyleIds ?? []),
      sortOrder: fb.control<number | null>(initial?.sortOrder ?? 0, {
        validators: [Validators.required, Validators.min(0)],
      }),
    },
    {
      validators: [sessionPlayersRangeValidator()],
    },
  ) as SessionFormGroup;
}

export function mapSessionFormToPayload(
  form: SessionFormGroup,
): ICreateSessionPayload | IUpdateSessionPayload {
  const value = form.getRawValue();

  return {
    systemId: value.systemId ?? '',
    title: normalizeText(value.title) ?? '',
    description: normalizeText(value.description) ?? '',
    image: normalizeText(value.image) ?? '',
    difficultyLevel: value.difficultyLevel ?? SessionDifficultyLevel.Beginner,
    minPlayers: value.minPlayers ?? 1,
    maxPlayers: value.maxPlayers ?? 5,
    minAge: value.minAge ?? 0,
    triggerIds: [...new Set((value.triggerIds ?? []).filter(Boolean))],
    gmStyleIds: [...new Set((value.gmStyleIds ?? []).filter(Boolean))],
    sortOrder: value.sortOrder ?? 0,
  };
}

export function mapSessionToFormData(
  session: SessionFormSource,
): ISessionFormData {
  return {
    systemId: session.systemId ?? null,
    title: session.title ?? null,
    description: session.description ?? null,
    image: session.image ?? null,
    difficultyLevel: session.difficultyLevel ?? SessionDifficultyLevel.Beginner,
    minPlayers: session.minPlayers ?? 1,
    maxPlayers: session.maxPlayers ?? 5,
    minAge: session.minAge ?? 0,
    triggerIds: [...new Set((session.triggerIds ?? []).filter(Boolean))],
    gmStyleIds: [...new Set((session.gmStyleIds ?? []).filter(Boolean))],
    sortOrder: session.sortOrder ?? 0,
  };
}