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
