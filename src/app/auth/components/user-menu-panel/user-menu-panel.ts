import { Component, computed, inject, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { provideTranslocoScope } from '@jsverse/transloco';

import { ButtonModule } from 'primeng/button';

import { Auth } from '../../../core/services/auth/auth';
import type { IUserMenuItem } from '../../../core/interfaces/i-user-menu';
import { createUserMenuPanelI18n } from './user-menu-panel.i18n';
import { buildUserMenu } from '../../../core/factories/user-menu.factory';
import { DividerModule } from 'primeng/divider';
import { hasMinimumRole } from '../../../core/utils/roles';

@Component({
  selector: 'app-user-menu-panel',
  standalone: true,
  imports: [RouterLink, ButtonModule, DividerModule],
  templateUrl: './user-menu-panel.html',
  styleUrl: './user-menu-panel.scss',
  providers: [provideTranslocoScope('auth', 'common')],
})
export class UserMenuPanel {
  private readonly auth = inject(Auth);

  readonly closed = output<void>();

  readonly i18n = createUserMenuPanelI18n();

  readonly usernameDisplay = computed(() => this.auth.displayName());
  readonly hasUsername = computed(() => !!this.usernameDisplay().trim());

  readonly menuSections = computed(() =>
    buildUserMenu({
      accountTitle: this.i18n.userMenu().accountSectionTitle,
      gmZoneTitle: this.i18n.userMenu().gmZoneSectionTitle,
      administrationTitle: this.i18n.userMenu().administrationSectionTitle,
      editProfileLabel: this.i18n.userMenu().editProfileLabel,
      sessionReservationLabel: this.i18n.commonCta().bookSession,
      eventSignupLabel: this.i18n.userMenu().eventSignupLabel,
      myWorkLogLabel: this.i18n.userMenu().myWorkLogLabel,
      gmAvailabilityOverviewLabel:
        this.i18n.userMenu().gmAvailabilityOverviewLabel,
      workLogOverviewLabel: this.i18n.userMenu().workLogOverviewLabel,
      adminContentLabel: this.i18n.userMenu().adminContentLabel,
      adminEventsLabel: this.i18n.userMenu().adminEventsLabel,
      adminCoworkerPrivateDocumentsLabel:
        this.i18n.userMenu().adminCoworkerPrivateDocumentsLabel,
      adminCoworkerOperationalDocumentsLabel:
        this.i18n.userMenu().adminCoworkerOperationalDocumentsLabel,
      adminUsersLabel: this.i18n.userMenu().adminUsersLabel,
      canSeeGmZone: hasMinimumRole(this.auth.user(), 'gm'),
      canSeeAdministration: hasMinimumRole(
        this.auth.user(),
        'customer_manager',
      ),
      canSeeAdminOnlyItems: hasMinimumRole(this.auth.user(), 'admin'),
    }),
  );

  readonly logoutLabel = computed(() => this.i18n.commonActions().logout);

  onNavigate(): void {
    this.closed.emit();
  }

  logout(): void {
    this.auth.logout('/').subscribe({
      next: () => {
        this.closed.emit();
      },
      error: () => {
        this.closed.emit();
      },
    });
  }

  isActionItem(item: IUserMenuItem): boolean {
    return !!item.action;
  }
}
