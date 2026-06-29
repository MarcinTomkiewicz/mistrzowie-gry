import { BuildUserMenuArgs, IUserMenuSection } from '../types/user-menu';
import { EVENT_SIGNUP_SELECTION_ROUTE } from '../configs/event-signup.config';

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
          path: EVENT_SIGNUP_SELECTION_ROUTE,
        },
        {
          id: 'coworker-profile',
          label: args.coworkerProfileLabel,
          path: '/auth/gm/coworker-profile',
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
        {
          id: 'admin-users',
          label: args.adminUsersLabel,
          path: '/auth/admin/users',
        },
      ],
    });
  }

  return sections;
}
