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
import type {
  IAdminCoworkerOnboardingCandidate,
  IAdminCoworkerOnboardingRow,
} from '../../../../core/interfaces/i-admin-coworker-onboarding';
import { AdminCoworkerOnboarding } from '../../../../core/services/admin-coworker-onboarding/admin-coworker-onboarding';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import {
  COWORKER_ONBOARDING_SCOPE,
  createCoworkerOnboardingI18n,
} from '../../../../core/translations/coworker-onboarding.i18n';
import type { CoworkerOnboardingLifecycleStatus } from '../../../../core/types/coworker-onboarding';
import { formatTimestampLabel } from '../../../../core/utils/date';
import { getUserDisplayName } from '../../../../core/utils/user-display';
import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';

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
  private readonly router = inject(Router);
  private readonly toast = inject(UiToast);

  protected readonly i18n = createCoworkerOnboardingI18n();
  protected readonly STATUS_BADGE_CLASS = STATUS_BADGE_CLASS;
  protected readonly formatTimestampLabel = formatTimestampLabel;
  protected readonly getUserDisplayName = getUserDisplayName;
  protected readonly onboardings = signal<IAdminCoworkerOnboardingRow[]>([]);
  protected readonly candidates =
    signal<readonly IAdminCoworkerOnboardingCandidate[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly loadFailed = signal(false);
  protected readonly coworkerControl = new FormControl<string | null>(null);

  protected readonly candidateOptions = computed(() =>
    this.candidates().map((candidate) => ({
      value: candidate.user_id,
      label:
        getUserDisplayName({
          firstName: candidate.first_name,
          nickname: candidate.nickname,
          useNickname: candidate.use_nickname,
        }) || candidate.email,
    })),
  );

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.loadFailed.set(false);

    forkJoin({
      onboardings: this.api.getOnboardings(),
      candidates: this.api.getOnboardingCandidates(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ onboardings, candidates }) => {
          this.onboardings.set([...onboardings]);
          this.candidates.set(candidates);
        },
        error: () => {
          this.candidates.set([]);
          this.coworkerControl.reset();
          this.loadFailed.set(true);
        },
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

  protected asOnboardingStatus(
    status: CoworkerOnboardingLifecycleStatus,
  ): CoworkerOnboardingLifecycleStatus {
    return status;
  }

  private showSuccess(): void {
    this.toast.success({
      summary: this.i18n.toast().mutationSuccessSummary,
      detail: this.i18n.commonStatus().changesSaved,
    });
  }

  private showMutationError(): void {
    this.toast.danger({
      summary: this.i18n.toast().mutationFailedSummary,
      detail: this.i18n.toast().mutationFailedDetail,
    });
  }
}
