export interface IGmStyle {
  id: string;
  slug: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface IGmProfileStyle {
  gmProfileId: string;
  gmStyleId: string;
  createdAt: string | null;
}

export interface ISessionStyle {
  gmStandardSessionId: string;
  gmStyleId: string;
  createdAt: string | null;
}

export interface IGmStyleOption {
  id: string;
  slug: string;
  label: string;
}