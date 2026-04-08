export interface ICoworkerProfile {
  userId: string;
  firstName: string;
  lastName: string;
  street?: string | null;
  houseNumber?: string | null;
  apartmentNumber?: string | null;
  postalCode?: string | null;
  city?: string | null;
  peselCiphertext?: string | null;
  bankAccountCiphertext?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}
