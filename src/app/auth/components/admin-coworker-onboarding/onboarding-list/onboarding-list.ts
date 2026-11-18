import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import type { SortEvent } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { finalize, forkJoin, map } from 'rxjs';

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

type OnboardingListRow = {
  readonly id: string;
  readonly person: IAdminCoworkerOnboardingRow | IAdminCoworkerOnboardingCandidate;
  readonly onboarding: IAdminCoworkerOnboardingRow | null;
  readonly displayName: string;
  readonly status: CoworkerOnboardingLifecycleStatus | 'not_started';
  readonly statusLabel: string;
  readonly statusBadgeClass: string;
  readonly startedAtLabel: string | null;
  readonly completedAtLabel: string | null;
  readonly documentCount: number;
  readonly pendingActions: number;
};

@Component({
  selector: 'app-coworker-onboarding-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    FloatLabelModule,
    InputTextModule,
    SelectModule,
    TableModule,
    ToggleSwitchModule,
    LoadingOverlay,
  ],
  templateUrl: './onboarding-list.html',
  providers: [provideTranslocoScope(COWORKER_ONBOARDING_SCOPE, 'common')],
})
export class OnboardingList {
  private readonly api = inject(AdminCoworkerOnboarding);
  private readonly router = inject(Router);
  private readonly toast = inject(UiToast);

  protected readonly i18n = createCoworkerOnboardingI18n();
  protected readonly onboardings = signal<IAdminCoworkerOnboardingRow[]>([]);
  protected readonly candidates =
    signal<readonly IAdminCoworkerOnboardingCandidate[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly loadFailed = signal(false);
  protected readonly sortField = signal<'displayName' | 'pendingActions'>('displayName');
  protected readonly sortOrder = signal<1 | -1>(1);
  protected readonly filterForm = new FormGroup({
    searchText: new FormControl('', { nonNullable: true }),
    status: new FormControl<OnboardingListRow['status'] | 'all'>('all', {
      nonNullable: true,
    }),
    pendingOnly: new FormControl(false, { nonNullable: true }),
    showCompleted: new FormControl(true, { nonNullable: true }),
  });
  private readonly filterValue = toSignal(
    this.filterForm.valueChanges.pipe(map(() => this.filterForm.getRawValue())),
    { initialValue: this.filterForm.getRawValue() },
  );

  protected readonly statusOptions = computed(() => [
    { value: 'all', label: this.i18n.adminList().filters.allStatuses },
    { value: 'not_started', label: this.i18n.adminList().notStarted },
    ...(['in_progress', 'completed', 'cancelled'] as const).map((value) => ({
      value,
      label: this.i18n.statuses().onboarding[value],
    })),
  ]);

  protected readonly rows = computed(() => {
    const onboardings = this.onboardings();
    const onboardingUsers = new Set(onboardings.map((row) => row.user_id));

    return [
      ...onboardings.map((row) => this.createRowVm(row, row)),
      ...this.candidates()
        .filter((candidate) => !onboardingUsers.has(candidate.user_id))
        .map((candidate) => this.createRowVm(candidate, null)),
    ];
  });

  protected readonly filteredRows = computed(() => {
    const filters = this.filterValue();
    const query = filters.searchText.trim().toLowerCase();
    const field = this.sortField();
    const direction = this.sortOrder();

    return this.rows()
      .filter(
        (row) =>
          (!query ||
            [row.person.first_name, row.person.nickname, row.person.email].some((value) =>
              value?.toLowerCase().includes(query),
            )) &&
          (filters.status === 'all' || row.status === filters.status) &&
          (!filters.pendingOnly || row.pendingActions > 0) &&
          (filters.showCompleted || row.status !== 'completed'),
      )
      .sort((left, right) => {
        const byName = left.displayName.localeCompare(right.displayName, 'pl');
        const primary =
          field === 'pendingActions'
            ? left.pendingActions - right.pendingActions
            : byName;

        return (
          primary * direction ||
          byName ||
          left.id.localeCompare(right.id, 'en')
        );
      });
  });

  constructor() {
    this.load();
  }

  protected onSort(event: SortEvent): void {
    if (
      (event.field === 'displayName' || event.field === 'pendingActions') &&
      (event.order === 1 || event.order === -1)
    ) {
      this.sortField.set(event.field);
      this.sortOrder.set(event.order);
    }
  }

  protected onStatusChange(): void {
    const { status, showCompleted } = this.filterForm.controls;

    if (status.value === 'completed' && !showCompleted.value) {
      showCompleted.setValue(true);
    }
  }

  protected onShowCompletedChange(): void {
    const { status, showCompleted } = this.filterForm.controls;

    if (!showCompleted.value && status.value === 'completed') {
      status.setValue('all');
    }
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
          this.loadFailed.set(true);
        },
      });
  }

  protected start(userId: string): void {
    if (this.loading() || this.saving()) {
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

  private createRowVm(
    person: OnboardingListRow['person'],
    onboarding: IAdminCoworkerOnboardingRow | null,
  ): OnboardingListRow {
    return {
      id: onboarding?.onboarding_id ?? `candidate:${person.user_id}`,
      person,
      onboarding,
      displayName: getUserDisplayName({
        firstName: person.first_name,
        nickname: person.nickname,
        useNickname: person.use_nickname,
      }) || person.email || '',
      status: onboarding?.status ?? 'not_started',
      statusLabel: onboarding
        ? this.i18n.statuses().onboarding[onboarding.status]
        : this.i18n.adminList().notStarted,
      statusBadgeClass: `tag-badge ${
        onboarding ? STATUS_BADGE_CLASS[onboarding.status] : 'tag-badge--muted'
      }`,
      startedAtLabel: formatTimestampLabel(onboarding?.started_at),
      completedAtLabel: formatTimestampLabel(onboarding?.completed_at),
      documentCount: onboarding?.private_document_count ?? 0,
      pendingActions: onboarding?.pending_private_action_count ?? 0,
    };
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
