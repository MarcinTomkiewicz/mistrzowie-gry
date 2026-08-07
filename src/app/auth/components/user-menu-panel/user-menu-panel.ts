import { Component, computed, inject, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { provideTranslocoScope } from '@jsverse/transloco';

import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';

import { buildUserMenu } from '../../../core/factories/user-menu.factory';
import { Auth } from '../../../core/services/auth/auth';
import { hasMinimumRole } from '../../../core/utils/roles';
import { createUserMenuPanelI18n } from './user-menu-panel.i18n';

@Component({
  selector: 'app-user-menu-panel',
  standalone: true,
  imports: [RouterLink, ButtonModule, DividerModule, SkeletonModule],
  templateUrl: './user-menu-panel.html',
  providers: [provideTranslocoScope('auth', 'common')],
})
export class UserMenuPanel {
  private readonly auth = inject(Auth);

  readonly closed = output<void>();

  readonly i18n = createUserMenuPanelI18n();

  readonly usernameDisplay = computed(() => this.auth.displayName());
  readonly isAuthLoading = computed(() => !this.auth.isReady());

  readonly menuSections = computed(() =>
    buildUserMenu({
      accountTitle: this.i18n.userMenu().accountSectionTitle,
      coworkerTitle: this.i18n.userMenu().coworkerSectionTitle,
      gmZoneTitle: this.i18n.userMenu().gmZoneSectionTitle,
      administrationTitle: this.i18n.userMenu().administrationSectionTitle,
      editProfileLabel: this.i18n.userMenu().editProfileLabel,
      sessionReservationLabel: this.i18n.commonCta().bookSession,
      coworkerRecordsLabel: this.i18n.userMenu().coworkerRecordsLabel,
      eventSignupLabel: this.i18n.userMenu().eventSignupLabel,
      myWorkLogLabel: this.i18n.userMenu().myWorkLogLabel,
      gmAvailabilityOverviewLabel:
        this.i18n.userMenu().gmAvailabilityOverviewLabel,
      workLogOverviewLabel: this.i18n.userMenu().workLogOverviewLabel,
      adminContentLabel: this.i18n.userMenu().adminContentLabel,
      adminEventsLabel: this.i18n.userMenu().adminEventsLabel,
      adminCoworkerRecordsLabel:
        this.i18n.userMenu().adminCoworkerRecordsLabel,
      adminUsersLabel: this.i18n.userMenu().adminUsersLabel,
      canSeeCoworker: hasMinimumRole(this.auth.user(), 'gm'),
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
}
