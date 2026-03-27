import { IGmStyle } from './i-gm-style';
import { ILanguage } from './i-languages';

export interface IGmProfile {
  id: string;
  experience: number | null;
  description: string | null;
  image: string | null;
  quote: string | null;
  isPublic: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface IGmProfileFormData {
  experience: number | null;
  description: string | null;
  image: string | null;
  quote: string | null;
  gmStyleIds: string[];
  languageIds: string[];
}

export interface ICreateGmProfilePayload extends IGmProfileFormData {}

export interface IUpdateGmProfilePayload extends IGmProfileFormData {}

export interface IGmProfileWithRelations extends IGmProfile {
  styles: IGmStyle[];
  languages: ILanguage[];
}