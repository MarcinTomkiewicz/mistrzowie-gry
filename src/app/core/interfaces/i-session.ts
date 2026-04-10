import { SessionDifficultyLevel } from '../types/sessions';
import { IContentTrigger } from './i-content-trigger';
import { IGmStyle } from './i-gm-style';
import { ILanguage } from './i-languages';
import { ISystem } from './i-system';

export interface ISession {
  id: string;
  gmProfileId: string;
  systemId: string;
  title: string;
  description: string;
  image: string;
  sortOrder: number;
  difficultyLevel: SessionDifficultyLevel;
  minPlayers: number;
  maxPlayers: number;
  minAge: number;
  hasReadyCharacterSheets: boolean;
  allowsScenarioCustomization: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ISessionTrigger {
  sessionId: string;
  contentTriggerId: string;
  createdAt: string | null;
}

export interface ISessionFormData {
  systemId: string | null;
  title: string | null;
  description: string | null;
  image: string | null;
  difficultyLevel: SessionDifficultyLevel | null;
  minPlayers: number | null;
  maxPlayers: number | null;
  minAge: number | null;
  hasReadyCharacterSheets: boolean;
  allowsScenarioCustomization: boolean;
  languageIds: string[];
  characterSheetsCount: number | null;
  triggerIds: string[];
  gmStyleIds: string[];
  sortOrder: number | null;
}

export interface ISessionCharacterSheet {
  id: string;
  storagePath: string;
  fileName: string;
  createdAt: string | null;
}

export interface ISessionFormInitialData extends Partial<ISessionFormData> {
  system?: ISystem | null;
  triggers?: Pick<IContentTrigger, 'id'>[] | null;
  styles?: Pick<IGmStyle, 'id'>[] | null;
  languages?: Pick<ILanguage, 'id'>[] | null;
  characterSheets?: ISessionCharacterSheet[] | null;
}

export interface ICreateSessionPayload {
  systemId: string;
  title: string;
  description: string;
  image: string;
  difficultyLevel: SessionDifficultyLevel;
  minPlayers: number;
  maxPlayers: number;
  minAge: number;
  hasReadyCharacterSheets: boolean;
  allowsScenarioCustomization: boolean;
  languageIds: string[];
  characterSheetsCount: number;
  triggerIds: string[];
  gmStyleIds: string[];
  sortOrder?: number;
}

export interface IUpdateSessionPayload {
  systemId: string;
  title: string;
  description: string;
  image: string;
  difficultyLevel: SessionDifficultyLevel;
  minPlayers: number;
  maxPlayers: number;
  minAge: number;
  hasReadyCharacterSheets: boolean;
  allowsScenarioCustomization: boolean;
  languageIds: string[];
  characterSheetsCount: number;
  triggerIds: string[];
  gmStyleIds: string[];
  sortOrder?: number;
}

export interface ISessionFormSubmitData {
  payload: ICreateSessionPayload | IUpdateSessionPayload;
  newCharacterSheetFiles: File[];
  removedCharacterSheetIds: string[];
}

export interface ISessionWithRelations extends ISession {
  system: ISystem;
  triggers: IContentTrigger[];
  styles: IGmStyle[];
  languages: ILanguage[];
  characterSheets: ISessionCharacterSheet[];
}

export interface ISessionListLabels {
  systemLabel: string;
  titleLabel: string;
  difficultyLabel: string;
  playersLabel: string;
  minAgeLabel: string;
  editLabel: string;
  deleteLabel: string;
}


export interface IGmSessionTemplateStyleRow {
  gmSessionTemplateId: string;
  gmStyleId: string;
  createdAt: string | null;
}

export interface IGmSessionTemplateTriggerRow {
  gmSessionTemplateId: string;
  contentTriggerId: string;
  createdAt: string | null;
}

export interface ICustomSessionStyleRow {
  customSessionId: string;
  gmStyleId: string;
  createdAt: string | null;
}

export interface ICustomSessionTriggerRow {
  customSessionId: string;
  contentTriggerId: string;
  createdAt: string | null;
}

export interface IGmSessionTemplateLanguageRow {
  gmSessionTemplateId: string;
  languageId: string;
  createdAt: string | null;
}

export interface ICustomSessionLanguageRow {
  customSessionId: string;
  languageId: string;
  createdAt: string | null;
}

export interface IGmSessionTemplateCharacterSheetRow {
  id: string;
  gmSessionTemplateId: string;
  storagePath: string;
  fileName: string;
  createdAt: string | null;
}

export interface ICustomSessionCharacterSheetRow {
  id: string;
  customSessionId: string;
  storagePath: string;
  fileName: string;
  createdAt: string | null;
}
