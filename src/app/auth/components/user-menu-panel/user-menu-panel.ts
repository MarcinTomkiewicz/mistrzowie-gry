import {
  Component,
  computed,
  effect,
  inject,
  output,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { provideTranslocoScope } from '@jsverse/transloco';

import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';

import { buildUserMenu } from '../../../core/factories/user-menu.factory';
import type { ICoworkerAccessContext } from '../../../core/interfaces/i-coworker-access-context';
import type { IUserMenuItem } from '../../../core/interfaces/i-user-menu';
import { Auth } from '../../../core/services/auth/auth';
import { CoworkerAccess } from '../../../core/services/coworker-access/coworker-access';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import { hasMinimumRole } from '../../../core/utils/roles';
import { createUserMenuPanelI18n } from './user-menu-panel.i18n';

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
  private readonly coworkerAccess = inject(CoworkerAccess);
  private readonly toast = inject(UiToast);

  readonly closed = output<void>();

  readonly i18n = createUserMenuPanelI18n();

  readonly usernameDisplay = computed(() => this.auth.displayName());
  readonly hasUsername = computed(() => !!this.usernameDisplay().trim());

  private readonly accessContext =
    signal<ICoworkerAccessContext | null>(null);

  readonly menuSections = computed(() =>
    buildUserMenu({
      accountTitle: this.i18n.userMenu().accountSectionTitle,
      coworkerTitle: this.i18n.userMenu().coworkerSectionTitle,
      gmZoneTitle: this.i18n.userMenu().gmZoneSectionTitle,
      administrationTitle: this.i18n.userMenu().administrationSectionTitle,
      editProfileLabel: this.i18n.userMenu().editProfileLabel,
      sessionReservationLabel: this.i18n.commonCta().bookSession,
      coworkerQuestionnaireLabel:
        this.i18n.userMenu().coworkerQuestionnaireLabel,
      coworkerPrivateDocumentsLabel:
        this.i18n.userMenu().coworkerPrivateDocumentsLabel,
      coworkerOperationalDocumentsLabel:
        this.i18n.userMenu().coworkerOperationalDocumentsLabel,
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
      canSeeCoworker: this.accessContext()?.enabled === true,
      canSeeGmZone: hasMinimumRole(this.auth.user(), 'gm'),
      canSeeAdministration: hasMinimumRole(
        this.auth.user(),
        'customer_manager',
      ),
      canSeeAdminOnlyItems: hasMinimumRole(this.auth.user(), 'admin'),
    }),
  );

  readonly logoutLabel = computed(() => this.i18n.commonActions().logout);

  constructor() {
    effect((onCleanup) => {
      this.accessContext.set(null);

      if (!this.auth.isReady() || this.auth.userId() === null) {
        return;
      }

      const subscription = this.coworkerAccess.getContext().subscribe({
        next: (access) => this.accessContext.set(access),
        error: () => {
          this.toast.danger({
            summary: this.i18n.userMenu().coworkerAccessLoadFailedSummary,
            detail: this.i18n.userMenu().coworkerAccessLoadFailedDetail,
          });
        },
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }

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
