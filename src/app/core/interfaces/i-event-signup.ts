import { IContentTrigger } from './i-content-trigger';
import { IEvent } from './i-event';
import { IEventOccurrence } from './i-event-occurence';
import { IEventProgramItem } from './i-event-program-item';
import { IGmStyle } from './i-gm-style';
import {
  ISessionFormSubmitData,
  ISessionWithRelations,
} from './i-session';
import { ISystem } from './i-system';
import { ILanguage } from './i-languages';

export interface IEventSignupSelection {
  eventId: string;
  occurrenceId: string;
}

export interface IEventSignupRange {
  fromIso?: string;
  toIso?: string;
}

export interface IEventTemplateSignupSubmitPayload {
  selection: IEventSignupSelection;
  mode: 'template';
  templateSessionId: string;
}

export interface IEventCustomSignupSubmitPayload {
  selection: IEventSignupSelection;
  mode: 'custom';
  customSourceSessionId: string | null;
  customSessionPayload: ISessionFormSubmitData;
}

export type IEventSignupSubmitPayload =
  | IEventTemplateSignupSubmitPayload
  | IEventCustomSignupSubmitPayload;

export type IEventSignupSavePayload =
  | (IEventTemplateSignupSubmitPayload & {
      signupId?: string | null;
    })
  | (IEventCustomSignupSubmitPayload & {
      signupId?: string | null;
    });

export interface IEventSignupPageData {
  event: IEvent | null;
  occurrence: IEventOccurrence | null;
  mySignup: IEventProgramItem | null;
  signupCount: number;
  isFull: boolean;
  canAccess: boolean;
  isAdmin: boolean;
}

export interface IEventSignupResourcesData {
  templateSessions: ISessionWithRelations[];
  customSessions: ISessionWithRelations[];
  systems: ISystem[];
  styles: IGmStyle[];
  triggers: IContentTrigger[];
  languages: ILanguage[];
}

export interface IEventSignupLoadData {
  page: IEventSignupPageData;
  resources: IEventSignupResourcesData;
}
