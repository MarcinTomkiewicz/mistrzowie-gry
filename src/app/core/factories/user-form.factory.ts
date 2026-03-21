import {
  AbstractControlOptions,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';

import { IUserProfileFormData } from '../interfaces/i-auth-payloads';
import { normalizeText } from '../utils/normalize-text';
import { profileIdentityValidator } from '../validators/profile-identity.validator';
import { displayPreferenceValidator } from '../validators/display-preference.validator';


export interface IUserFormFactoryOptions {
  includeEmail?: boolean;
  includePassword?: boolean;
  includeProfile?: boolean;
  initial?: Partial<IUserProfileFormData> & {
    email?: string | null;
    password?: string | null;
  };
}

export type UserFormGroup = FormGroup<{
  email: FormControl<string | null>;
  password: FormControl<string | null>;
  firstName: FormControl<string | null>;
  nickname: FormControl<string | null>;
  useNickname: FormControl<boolean>;
  phoneNumber: FormControl<string | null>;
  city: FormControl<string | null>;
  street: FormControl<string | null>;
  houseNumber: FormControl<string | null>;
  apartmentNumber: FormControl<string | null>;
  postalCode: FormControl<string | null>;
  age: FormControl<number | null>;
  shortDescription: FormControl<string | null>;
  longDescription: FormControl<string | null>;
  extendedDescription: FormControl<string | null>;
}>;

export function createUserForm(
  fb: FormBuilder,
  options?: IUserFormFactoryOptions,
): UserFormGroup {
  const includeEmail = !!options?.includeEmail;
  const includePassword = !!options?.includePassword;
  const includeProfile = options?.includeProfile !== false;
  const initial = options?.initial;

  return fb.group(
    {
      email: fb.control<string | null>(initial?.email ?? null, {
        validators: includeEmail
          ? [Validators.required, Validators.email]
          : [],
      }),
      password: fb.control<string | null>(initial?.password ?? null, {
        validators: includePassword
          ? [Validators.required, Validators.minLength(8)]
          : [],
      }),

      firstName: fb.control<string | null>(initial?.firstName ?? null),
      nickname: fb.control<string | null>(initial?.nickname ?? null),
      useNickname: fb.nonNullable.control(initial?.useNickname ?? false),

      phoneNumber: fb.control<string | null>(initial?.phoneNumber ?? null),
      city: fb.control<string | null>(initial?.city ?? null),
      street: fb.control<string | null>(initial?.street ?? null),
      houseNumber: fb.control<string | null>(initial?.houseNumber ?? null),
      apartmentNumber: fb.control<string | null>(initial?.apartmentNumber ?? null),
      postalCode: fb.control<string | null>(initial?.postalCode ?? null),
      age: fb.control<number | null>(initial?.age ?? null),

      shortDescription: fb.control<string | null>(initial?.shortDescription ?? null, {
        validators: [Validators.maxLength(150)],
      }),
      longDescription: fb.control<string | null>(initial?.longDescription ?? null, {
        validators: [Validators.maxLength(255)],
      }),
      extendedDescription: fb.control<string | null>(
        initial?.extendedDescription ?? null,
      ),
    },
    {
      validators: includeProfile
        ? [profileIdentityValidator(), displayPreferenceValidator()]
        : [],
    } as AbstractControlOptions,
  );
}

export function mapUserFormToProfilePayload(
  form: UserFormGroup,
): IUserProfileFormData {
  const value = form.getRawValue();

  return {
    firstName: normalizeText(value.firstName),
    phoneNumber: normalizeText(value.phoneNumber),
    city: normalizeText(value.city),
    street: normalizeText(value.street),
    houseNumber: normalizeText(value.houseNumber),
    apartmentNumber: normalizeText(value.apartmentNumber),
    postalCode: normalizeText(value.postalCode),
    age: value.age ?? null,
    shortDescription: normalizeText(value.shortDescription),
    longDescription: normalizeText(value.longDescription),
    extendedDescription: normalizeText(value.extendedDescription),
    nickname: normalizeText(value.nickname),
    useNickname: value.useNickname,
  };
}