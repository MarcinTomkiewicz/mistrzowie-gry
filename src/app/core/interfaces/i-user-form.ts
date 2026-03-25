import { FormControl, FormGroup } from "@angular/forms";
import { IUserProfileFormData } from "./i-auth-payloads";

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