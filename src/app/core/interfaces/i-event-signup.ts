import { FormControl, FormGroup } from '@angular/forms';

import { IContentTrigger } from './i-content-trigger';
import { IEvent } from './i-event';
import { IEventOccurrence } from './i-event-occurence';
import { IEventProgramItem } from './i-event-program-item';
import { IGmStyle } from './i-gm-style';
import { ISelectOption } from './i-select-option';
import {
  ISessionFormSubmitData,
  ISessionWithRelations,
} from './i-session';
import { ISystem } from './i-system';
import { ILanguage } from './i-languages';

export type EventSignupMode = 'template' | 'custom';

export type IEventSignupModeOption = ISelectOption<EventSignupMode>;

export type EventSignupFormGroup = FormGroup<{
  mode: FormControl<EventSignupMode>;
  customSessionId: FormControl<string | null>;
}>;

export type EventSignupForm = FormGroup<{
  eventId: FormControl<string | null>;
}>;

export interface IEventSignupSelection {
  eventId: string;
  occurrenceId: string;
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

export type IEventSignupSavePayload = IEventSignupSubmitPayload & {
  signupId?: string | null;
};

export interface IEventSignupPageData {
  event: IEvent | null;
  occurrence: IEventOccurrence | null;
  mySignup: IEventProgramItem | null;
  signupCount: number;
  isFull: boolean;
  canAccess: boolean;
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

export interface IEventSignupOccurrenceVm {
  occurrence: IEventOccurrence;
  label: string;
  signupCount: number;
  isFull: boolean;
  mySignup: IEventProgramItem | null;
  canOpen: boolean;
}

export interface IEventSignupEventVm {
  event: IEvent;
  occurrences: IEventSignupOccurrenceVm[];
}
