export type EditProfileTabId =
  | 'profile'
  | 'gm-profile'
  | 'gm-sessions'
  | 'gm-availability';

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
  {
    id: 'gm-sessions',
    order: 3,
    icon: 'pi pi-evil-book',
  },
  {
    id: 'gm-availability',
    order: 4,
    icon: 'pi pi-horus',
  },
] as const;
