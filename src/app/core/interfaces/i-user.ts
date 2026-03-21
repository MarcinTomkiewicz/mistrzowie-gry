import { AppRole } from "../types/app-role";

export interface IUser {
  id: string;
  email: string;

  appRole: AppRole;

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

  isTestUser: boolean | null;

  createdAt: string | null;
  updatedAt: string | null;
}