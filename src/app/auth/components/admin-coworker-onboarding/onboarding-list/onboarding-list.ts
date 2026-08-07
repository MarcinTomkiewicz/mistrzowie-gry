import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { finalize, forkJoin } from 'rxjs';

import { STATUS_BADGE_CLASS } from '../../../../core/configs/badge-class.config';
import type { IAdminUserRow } from '../../../../core/interfaces/i-admin-users';
import type { IAdminCoworkerOnboardingRow } from '../../../../core/interfaces/i-admin-coworker-onboarding';
import { AdminCoworkerOnboarding } from '../../../../core/services/admin-coworker-onboarding/admin-coworker-onboarding';
import { AdminUsers } from '../../../../core/services/admin-users/admin-users';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import {
  COWORKER_ONBOARDING_SCOPE,
  createCoworkerOnboardingI18n,
} from '../../../../core/translations/coworker-onboarding.i18n';
import type { CoworkerOnboardingLifecycleStatus } from '../../../../core/types/coworker-onboarding';
import { formatTimestampLabel } from '../../../../core/utils/date';
import { getUserDisplayName } from '../../../../core/utils/user-display';
import { LoadingOverlay } from '../../../../public/common/loading-overlay/loading-overlay';

@Component({
  selector: 'app-coworker-onboarding-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    IftaLabelModule,
    SelectModule,
    TableModule,
    LoadingOverlay,
  ],
  templateUrl: './onboarding-list.html',
  providers: [provideTranslocoScope(COWORKER_ONBOARDING_SCOPE, 'common')],
})
export class CoworkerOnboardingList {
  private readonly api = inject(AdminCoworkerOnboarding);
  private readonly adminUsers = inject(AdminUsers);
  private readonly router = inject(Router);
  private readonly toast = inject(UiToast);

  protected readonly i18n = createCoworkerOnboardingI18n();
  protected readonly STATUS_BADGE_CLASS = STATUS_BADGE_CLASS;
  protected readonly formatTimestampLabel = formatTimestampLabel;
  protected readonly onboardings = signal<IAdminCoworkerOnboardingRow[]>([]);
  protected readonly users = signal<readonly IAdminUserRow[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly loadFailed = signal(false);
  protected readonly coworkerControl = new FormControl<string | null>(null);

  protected readonly candidateOptions = computed(() => {
    const activeUserIds = new Set(
      this.onboardings()
        .filter(({ status }) => status === 'in_progress')
        .map(({ user_id }) => user_id),
    );

    return this.users()
      .filter(({ user }) => user.appRole === 'gm' && !activeUserIds.has(user.id))
      .map(({ user }) => ({
        value: user.id,
        label: getUserDisplayName(user) || user.email,
      }));
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.loadFailed.set(false);

    forkJoin({
      onboardings: this.api.getOnboardings(),
      users: this.adminUsers.getUsers(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ onboardings, users }) => {
          this.onboardings.set([...onboardings]);
          this.users.set(users);
        },
        error: () => this.loadFailed.set(true),
      });
  }

  protected start(): void {
    const userId = this.coworkerControl.value;

    if (!userId) {
      return;
    }

    this.saving.set(true);
    this.api
      .startOnboarding(userId)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: ({ onboarding_id }) => {
          this.showSuccess();
          void this.router.navigate(['/admin/coworkers/onboarding', onboarding_id]);
        },
        error: () => this.showMutationError(),
      });
  }

  protected open(onboardingId: string): void {
    void this.router.navigate(['/admin/coworkers/onboarding', onboardingId]);
  }

  protected statusClass(status: CoworkerOnboardingLifecycleStatus): string {
    return STATUS_BADGE_CLASS[status];
  }

  protected statusLabel(status: CoworkerOnboardingLifecycleStatus): string {
    return this.i18n.statuses().onboarding[status];
  }

  private showSuccess(): void {
    this.toast.success({
      summary: this.i18n.toast().mutationSuccessSummary,
      detail: this.i18n.toast().mutationSuccessDetail,
    });
  }

  private showMutationError(): void {
    this.toast.danger({
      summary: this.i18n.toast().mutationFailedSummary,
      detail: this.i18n.toast().mutationFailedDetail,
    });
  }
}
