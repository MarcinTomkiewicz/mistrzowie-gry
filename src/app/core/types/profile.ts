export type EditProfileTabId = 'profile' | 'gm-profile';

export type EditProfileTabDefinition = {
  id: EditProfileTabId;
  order: number;
  icon: string;
};

export const EDIT_PROFILE_TABS: readonly EditProfileTabDefinition[] = [
  {
    id: 'profile',
    order: 1,
    icon: 'pi pi-overlord',
  },
  {
    id: 'gm-profile',
    order: 2,
    icon: 'pi pi-blacksmith',
  },
] as const;