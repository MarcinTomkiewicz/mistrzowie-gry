import type { IUserMenuSection } from '../interfaces/i-user-menu';
import type { BuildUserMenuArgs } from '../types/user-menu';
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
        {
          id: 'session-reservation',
          label: args.sessionReservationLabel,
          path: '/rezerwacja-sesji',
        },
      ],
    },
  ];

  if (args.canSeeCoworker) {
    sections.push({
      id: 'coworker',
      title: args.coworkerTitle,
      items: [
        {
          id: 'coworker-records',
          label: args.coworkerRecordsLabel,
          path: '/auth/coworker',
        },
      ],
    });
  }

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
          id: 'my-work-log',
          label: args.myWorkLogLabel,
          path: '/auth/gm/work-log',
        },
      ],
    });
  }

  const administrationItems: IUserMenuSection['items'] = [];

  if (args.canSeeAdministration) {
    administrationItems.push(
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
    );
  }

  if (args.canSeeAdminOnlyItems) {
    administrationItems.push(
      {
        id: 'admin-content',
        label: args.adminContentLabel,
        path: '/admin/content',
      },
      {
        id: 'admin-events',
        label: args.adminEventsLabel,
        path: '/admin/events',
      },
      {
        id: 'admin-coworker-records',
        label: args.adminCoworkerRecordsLabel,
        path: '/admin/coworkers',
      },
    );
  }

  if (args.canSeeAdministration) {
    administrationItems.push({
      id: 'admin-users',
      label: args.adminUsersLabel,
      path: '/auth/admin/users',
    });
  }

  if (administrationItems.length) {
    sections.push({
      id: 'administration',
      title: args.administrationTitle,
      items: administrationItems,
    });
  }

  return sections;
}
