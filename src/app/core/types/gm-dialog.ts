export type GmProfileDialogTabId = 'profile' | 'sessions';

export type GmProfileDialogTabDefinition = {
  id: GmProfileDialogTabId;
  order: number;
  icon: string;
};

export const GM_PROFILE_DIALOG_TABS: readonly GmProfileDialogTabDefinition[] = [
  {
    id: 'profile',
    order: 1,
    icon: 'pi pi-overlord',
  },
  {
    id: 'sessions',
    order: 2,
    icon: 'pi pi-evil-book',
  },
] as const;