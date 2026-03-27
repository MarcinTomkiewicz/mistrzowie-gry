import { IUser } from './i-user';
import { IGmProfileWithRelations } from './i-gm-profile';
import { ISessionWithRelations } from './i-session';

export interface IGmPublicProfile {
  user: IUser;
  profile: IGmProfileWithRelations;
  sessions: ISessionWithRelations[];
}