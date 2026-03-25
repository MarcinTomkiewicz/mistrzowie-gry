export type EditProfileTabId = 'profile';

export type EditProfileTabDefinition = {
  id: EditProfileTabId;
};

export const EDIT_PROFILE_TABS: readonly EditProfileTabDefinition[] = [
  {
    id: 'profile',
  },
] as const;