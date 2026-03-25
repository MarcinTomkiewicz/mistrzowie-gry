import { IGmStyle } from './i-gm-style';

export interface IGmProfile {
  id: string;
  experience: string | null;
  image: string | null;
  quote: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface IGmProfileFormData {
  experience: string | null;
  image: string | null;
  quote: string | null;
  gmStyleIds: string[];
}

export interface ICreateGmProfilePayload extends IGmProfileFormData {}

export interface IUpdateGmProfilePayload extends IGmProfileFormData {}

export interface IGmProfileWithRelations extends IGmProfile {
  styles: IGmStyle[];
}