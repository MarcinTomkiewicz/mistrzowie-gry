import { IUserMenuSection } from "../types/user-menu";

export interface BuildUserMenuArgs {
  accountTitle: string;
  administrationTitle: string;
  editProfileLabel: string;
  eventSignupLabel: string;
  gmAvailabilityOverviewLabel: string;
  canSeeAdministration: boolean;
}

export function buildUserMenu(args: BuildUserMenuArgs): IUserMenuSection[] {
  const sections: IUserMenuSection[] = [
    {
      id: 'account',
      title: args.accountTitle,
      items: [
        {
          id: 'edit-profile',
          label: args.editProfileLabel,
          path: '/auth/edit-profile',
        },
        {
          id: 'event-signup',
          label: args.eventSignupLabel,
          path: '/auth/event-signup'
        }
      ],
    },
  ];

  if (args.canSeeAdministration) {
    sections.push({
      id: 'administration',
      title: args.administrationTitle,
      items: [
        {
          id: 'gm-availability-overview',
          label: args.gmAvailabilityOverviewLabel,
          path: '/auth/admin/gm-availability',
        },
      ],
    });
  }

  return sections;
}
