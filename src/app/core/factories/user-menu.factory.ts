import { IUserMenuSection } from "../types/user-menu";

export interface BuildUserMenuArgs {
  accountTitle: string;
  editProfileLabel: string;
}

export function buildUserMenu(args: BuildUserMenuArgs): IUserMenuSection[] {
  return [
    {
      id: 'account',
      title: args.accountTitle,
      items: [
        {
          id: 'edit-profile',
          label: args.editProfileLabel,
          path: '/auth/edit-profile',
        },
      ],
    },
  ];
}