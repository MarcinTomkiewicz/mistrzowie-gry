export interface ILanguage {
  id: string;
  code: string;
  label: string;
  flagCode: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string | null;
}

export interface IGmProfileLanguage {
  gmProfileId: string;
  languageId: string;
  createdAt: string | null;
}