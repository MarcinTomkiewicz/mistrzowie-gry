import { IContentTrigger } from './i-content-trigger';
import { IGmStyle } from './i-gm-style';
import { ISystem } from './i-system';

export interface ISession {
  id: string;
  gmProfileId: string;
  systemId: string;
  title: string;
  description: string;
  image: string;
  sortOrder: number;
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
  triggerIds: string[];
  gmStyleIds: string[];
  sortOrder: number | null;
}

export interface ICreateSessionPayload {
  systemId: string;
  title: string;
  description: string;
  image: string;
  triggerIds: string[];
  gmStyleIds: string[];
  sortOrder?: number;
}

export interface IUpdateSessionPayload {
  systemId: string;
  title: string;
  description: string;
  image: string;
  triggerIds: string[];
  gmStyleIds: string[];
  sortOrder?: number;
}

export interface ISessionWithRelations extends ISession {
  system: ISystem | null;
  triggers: IContentTrigger[];
  styles: IGmStyle[];
}