import { IGmStyle } from './i-gm-style';
import { ISessionWithRelations } from './i-session';
import { ISystem } from './i-system';

export interface IGmPublicProfile {
  id: string;
  firstName: string | null;
  nickname: string | null;
  useNickname: boolean | null;
  age: number | null;
  shortDescription: string | null;
  experience: string | null;
  image: string | null;
  quote: string | null;
  styles: IGmStyle[];
}

export interface IGmPublicSystem {
  systemId: string;
  system: ISystem | null;
  sessions: ISessionWithRelations[];
}

export interface IGmProfileWithSessions extends IGmPublicProfile {
  sessions: ISessionWithRelations[];
  systems: IGmPublicSystem[];
}