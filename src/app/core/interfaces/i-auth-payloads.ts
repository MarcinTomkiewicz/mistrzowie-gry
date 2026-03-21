export interface IUserProfileFormData {
  firstName: string | null;
  phoneNumber: string | null;
  city: string | null;
  street: string | null;
  houseNumber: string | null;
  apartmentNumber: string | null;
  postalCode: string | null;
  age: number | null;
  shortDescription: string | null;
  longDescription: string | null;
  extendedDescription: string | null;
  nickname: string | null;
  useNickname: boolean | null;
}

export interface ILoginPayload {
  email: string;
  password: string;
}

export interface IRegisterPayload {
  email: string;
  password: string;
  profile: IUserProfileFormData;
}

export type IUpdateUserProfilePayload = Partial<IUserProfileFormData>;