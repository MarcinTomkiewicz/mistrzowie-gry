import { IGmPublicProfile } from '../interfaces/i-gm-public-profile';
import { IUser } from '../interfaces/i-user';

export function getUserDisplayName(
  user: Pick<IUser, 'firstName' | 'nickname' | 'useNickname'> | null | undefined,
): string {
  if (!user) {
    return '';
  }

  const firstName = user.firstName?.trim() || '';
  const nickname = user.nickname?.trim() || '';

  return user.useNickname ? nickname || firstName : firstName || nickname;
}

export function getGmPublicProfileDisplayName(gm: IGmPublicProfile): string {
  return getUserDisplayName(gm.user) || gm.user.email;
}
