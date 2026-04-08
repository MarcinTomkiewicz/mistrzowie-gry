import { IUserMenuSection } from "../types/user-menu";

export interface BuildUserMenuArgs {
  accountTitle: string;
  gmZoneTitle: string;
  administrationTitle: string;
  editProfileLabel: string;
  eventSignupLabel: string;
  myWorkLogLabel: string;
  gmAvailabilityOverviewLabel: string;
  workLogOverviewLabel: string;
  canSeeGmZone: boolean;
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
        }
      ],
    },
  ];

  if (args.canSeeGmZone) {
    sections.push({
      id: 'gm-zone',
      title: args.gmZoneTitle,
      items: [
        {
          id: 'event-signup',
          label: args.eventSignupLabel,
          path: '/auth/event-signup',
        },
        {
          id: 'my-work-log',
          label: args.myWorkLogLabel,
          path: '/auth/gm/work-log',
        },
      ],
    });
  }

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
        {
          id: 'work-log-overview',
          label: args.workLogOverviewLabel,
          path: '/auth/admin/work-log',
        },
      ],
    });
  }

  return sections;
}
