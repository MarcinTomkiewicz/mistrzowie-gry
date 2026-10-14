import { IUser } from './i-user';
import { IGmProfileWithRelations } from './i-gm-profile';
import type { ISessionWithRelations, SessionPresentation } from './i-session';

export interface IGmPublicProfile {
  user: IUser;
  profile: IGmProfileWithRelations;
  sessions: ISessionWithRelations[];
}

export type GmProfilePresentation = {
  user: Pick<IUser, 'id' | 'firstName' | 'nickname' | 'useNickname'> &
    Partial<Pick<IUser, 'email'>>;
  profile: Omit<IGmProfileWithRelations, 'styles' | 'languages'> &
    Pick<SessionPresentation, 'styles' | 'languages'>;
  sessions: SessionPresentation[];
};
