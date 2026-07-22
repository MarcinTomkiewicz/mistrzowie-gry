import type {
  ICustomSessionCharacterSheetRow,
  IGmSessionTemplateCharacterSheetRow,
  ISessionCharacterSheet,
} from '../interfaces/i-session';

export type SessionCharacterSheetRow =
  | IGmSessionTemplateCharacterSheetRow
  | ICustomSessionCharacterSheetRow;

export type NewSessionCharacterSheet = {
  id: string;
  file: File;
  previewUrl: string;
};

export type ExistingSessionCharacterSheetCard = Pick<
  ISessionCharacterSheet,
  'id' | 'fileName'
> & {
  kind: 'existing';
  previewUrl: string | null;
};

export type NewSessionCharacterSheetCard = NewSessionCharacterSheet & {
  kind: 'new';
  fileName: string;
};

export type SessionCharacterSheetCard =
  | ExistingSessionCharacterSheetCard
  | NewSessionCharacterSheetCard;

export type SessionCharacterSheetPreview = {
  title: string;
  url: string;
};
