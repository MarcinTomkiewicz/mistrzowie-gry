import {
  EventProgramItemSourceKind,
  EventProgramItemStatus,
} from '../enums/event';
import { SessionDifficultyLevel } from '../types/sessions';
import { IContentTrigger } from './i-content-trigger';
import { IGmPublicProfile } from './i-gm-public-profile';
import { IGmStyleOption } from './i-gm-style';
import { ISessionWithRelations } from './i-session';

export interface IEventProgramItem {
  id: string;
  occurrenceId: string;
  hostUserId: string;

  sourceKind: EventProgramItemSourceKind;
  gmSessionTemplateId: string | null;
  customSessionId: string | null;

  status: EventProgramItemStatus;
  displayOrder: number | null;

  createdAt: string;
  updatedAt: string;
}

export interface IEventProgramItemSessionDetails {
  title: string;
  description: string;
  image: string;
  systemId: string;
  systemName: string;
  difficultyLevel: SessionDifficultyLevel;
  minPlayers: number;
  maxPlayers: number;
  minAge: number;
  styles: IGmStyleOption[];
  triggers: IContentTrigger[];
}

export interface IEventProgramItemHostDetails {
  userId: string;
  gmProfileId: string;
  displayName: string;
  quote: string | null;
  avatarUrl: string | null;
}

export interface IEventProgramItemWithDetails extends IEventProgramItem {
  session: ISessionWithRelations;
  host: IGmPublicProfile;
}
