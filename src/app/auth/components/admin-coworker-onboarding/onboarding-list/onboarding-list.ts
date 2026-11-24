import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
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
import { finalize, forkJoin, map, type Observable, tap } from 'rxjs';

import { STATUS_BADGE_CLASS } from '../../../../core/configs/badge-class.config';
import type {
  IAdminCoworkerOnboardingCandidate,
  IAdminCoworkerOnboardingRow,
} from '../../../../core/interfaces/i-admin-coworker-onboarding';
import { AdminCoworkerOnboarding } from '../../../../core/services/admin-coworker-onboarding/admin-coworker-onboarding';
import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import {
  COWORKER_ONBOARDING_SCOPE,
  createCoworkerOnboardingI18n,
} from '../../../../core/translations/coworker-onboarding.i18n';
import type { CoworkerOnboardingLifecycleStatus } from '../../../../core/types/coworker-onboarding';
import { formatTimestampLabel } from '../../../../core/utils/date';
import { setControlValue } from '../../../../core/utils/form-controls';
import { normalizeText } from '../../../../core/utils/normalize-text';
import { getUserDisplayName } from '../../../../core/utils/user-display';
import { ContextHelp } from '../../../../common/context-help/context-help';
import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import { getOnboardingErrorMessage, getOnboardingMutationErrorToast } from '../../../common/onboarding-error';
import { countAdminOnboardingPendingActions } from '../onboarding-progress';

type VisibleOnboardingRow = IAdminCoworkerOnboardingRow & {
  readonly status: Exclude<CoworkerOnboardingLifecycleStatus, 'cancelled'>;
};

type OnboardingListRow = {
  readonly id: string;
  readonly person: VisibleOnboardingRow | IAdminCoworkerOnboardingCandidate;
  readonly onboarding: VisibleOnboardingRow | null;
  readonly displayName: string;
  readonly status: VisibleOnboardingRow['status'] | 'not_started';
  readonly statusLabel: string | null;
  readonly statusBadgeClass: string;
  readonly statusDateLabel: string | null;
  readonly questionnaireLabel: string;
  readonly questionnaireBadgeClass: string;
  readonly privateAcceptedCount: number | null;
  readonly sharedAcknowledgedCount: number | null;
  readonly pendingActions: number;
};

const ONBOARDING_STATUS_ORDER = {
  not_started: 0,
  in_progress: 1,
  completed: 2,
} as const satisfies Record<OnboardingListRow['status'], number>;

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
    ContextHelp,
    LoadingOverlay,
  ],
  templateUrl: './onboarding-list.html',
  providers: [provideTranslocoScope(COWORKER_ONBOARDING_SCOPE, 'common')],
})
export class OnboardingList {
  private readonly api = inject(AdminCoworkerOnboarding);
  private readonly confirm = inject(UiConfirm);
  private readonly router = inject(Router);
  private readonly toast = inject(UiToast);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly i18n = createCoworkerOnboardingI18n();
  protected readonly onboardings = signal<IAdminCoworkerOnboardingRow[]>([]);
  protected readonly candidates =
    signal<readonly IAdminCoworkerOnboardingCandidate[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly loadFailed = signal(false);
  protected readonly first = signal(0);
  protected readonly pageSize = signal(10);
  protected readonly rowsPerPageOptions = [10, 25, 50];
  protected readonly sortField = signal<'displayName' | 'status' | 'pendingActions'>('displayName');
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
    this.filterForm.valueChanges.pipe(
      map(() => this.filterForm.getRawValue()),
      tap(() => this.first.set(0)),
    ),
    { initialValue: this.filterForm.getRawValue() },
  );

  protected readonly statusOptions = computed(() => [
    { value: 'all', label: this.i18n.adminList().filters.allStatuses },
    { value: 'not_started', label: this.i18n.adminList().notStarted },
    ...(['in_progress', 'completed'] as const).map((value) => ({
      value,
      label: this.i18n.onboardingStatusLabel(value),
    })),
  ]);

  protected readonly rows = computed(() => {
    const onboardings = this.onboardings();
    const onboardingUsers = new Set(onboardings.map((row) => row.user_id));

    return [
      ...onboardings
        .filter((row): row is VisibleOnboardingRow => row.status !== 'cancelled')
        .map((row) => this.createRowVm(row, row)),
      ...this.candidates()
        .filter((candidate) => !onboardingUsers.has(candidate.user_id))
        .map((candidate) => this.createRowVm(candidate, null)),
    ];
  });

  protected readonly filteredRows = computed(() => {
    const filters = this.filterValue();
    const query = normalizeText(filters.searchText)?.toLocaleLowerCase('pl');
    const field = this.sortField();
    const direction = this.sortOrder();

    return this.rows()
      .filter(
        (row) =>
          (!query ||
            [row.person.first_name, row.person.nickname, row.person.email].some((value) =>
              value?.toLocaleLowerCase('pl').includes(query),
            )) &&
          (filters.status === 'all' || row.status === filters.status) &&
          (!filters.pendingOnly || row.pendingActions > 0) &&
          (filters.showCompleted || row.status !== 'completed'),
      )
      .sort((left, right) => {
        const byName = left.displayName.localeCompare(right.displayName, 'pl');
        const primary =
          field === 'status'
            ? ONBOARDING_STATUS_ORDER[left.status] - ONBOARDING_STATUS_ORDER[right.status]
            : field === 'pendingActions'
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
      (event.field === 'displayName' || event.field === 'status' || event.field === 'pendingActions') &&
      (event.order === 1 || event.order === -1) &&
      (event.field !== this.sortField() || event.order !== this.sortOrder())
    ) {
      this.sortField.set(event.field);
      this.sortOrder.set(event.order);
      this.first.set(0);
    }
  }

  protected onStatusChange(): void {
    const { status, showCompleted } = this.filterForm.controls;

    if (status.value === 'completed' && !showCompleted.value) {
      setControlValue(showCompleted, true);
    }
  }

  protected onShowCompletedChange(): void {
    const { status, showCompleted } = this.filterForm.controls;

    if (!showCompleted.value && status.value === 'completed') {
      setControlValue(status, 'all');
    }
  }

  protected load(): void {
    this.loading.set(true);
    this.loadFailed.set(false);

    forkJoin({
      onboardings: this.api.getOnboardings(),
      candidates: this.api.getOnboardingCandidates(),
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: ({ onboardings, candidates }) => {
          this.onboardings.set([...onboardings]);
          this.candidates.set(candidates);
          if (this.first() > 0) {
            const pageSize = this.pageSize();
            const lastIndex = Math.max(0, this.filteredRows().length - 1);
            const lastPageStart = Math.floor(lastIndex / pageSize) * pageSize;
            this.first.update((first) => Math.min(first, lastPageStart));
          }
        },
        error: (error: unknown) => {
          this.candidates.set([]);
          this.loadFailed.set(true);
          const fallback = this.i18n.commonErrors().generic;
          this.toast.danger({
            summary: this.i18n.loadErrors().adminOnboardings ?? fallback,
            detail: getOnboardingErrorMessage(error, this.i18n, fallback),
          });
        },
      });
  }

  protected start(userId: string): void {
    if (this.loading() || this.saving()) {
      return;
    }

    this.runMutation(this.api.startOnboarding(userId), ({ onboarding_id }) => this.open(onboarding_id));
  }

  protected open(onboardingId: string): void {
    void this.router.navigate(['/admin/coworkers/onboarding', onboardingId]);
  }

  protected confirmCancel(event: Event, onboardingId: string): void {
    if (!this.canCancel(onboardingId)) return;

    this.confirm.dangerDecision(event, {
      message: this.i18n.dialogs().cancelOnboardingMessage,
      acceptLabel: this.i18n.actions().cancelOnboarding,
      acceptIcon: 'pi pi-interdiction',
      rejectLabel: this.i18n.commonActions().close,
      accept: () => {
        if (!this.canCancel(onboardingId)) return;

        const refresh = () => this.load();
        this.runMutation(this.api.cancelOnboarding(onboardingId), refresh, refresh);
      },
    });
  }

  private canCancel(onboardingId: string): boolean {
    return !this.loading() && !this.saving() && !this.loadFailed() &&
      this.onboardings().some((row) => row.onboarding_id === onboardingId && row.status === 'in_progress');
  }

  private runMutation<TResult>(
    request: Observable<TResult>,
    onSuccess: (result: TResult) => void,
    onError?: () => void,
  ): void {
    this.saving.set(true);
    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (result) => {
          this.toast.success({
            summary: this.i18n.toast().mutationSuccessSummary,
            detail: this.i18n.commonStatus().changesSaved,
          });
          onSuccess(result);
        },
        error: (error: unknown) => {
          this.toast.danger(getOnboardingMutationErrorToast(error, this.i18n));
          onError?.();
        },
      });
  }

  private createRowVm(
    person: OnboardingListRow['person'],
    onboarding: OnboardingListRow['onboarding'],
  ): OnboardingListRow {
    const fields = this.i18n.fields();
    const statusDate = onboarding ? {
      in_progress: onboarding.started_at,
      completed: onboarding.completed_at,
    }[onboarding.status] : null;
    const questionnaireStage = !onboarding
      ? { label: this.i18n.commonValues().notApplicable, badgeClass: STATUS_BADGE_CLASS.closed }
      : !onboarding.questionnaire_exists
        ? { label: this.i18n.commonValues().notAvailable, badgeClass: STATUS_BADGE_CLASS.closed }
        : !onboarding.questionnaire_complete
          ? { label: fields.questionnaireExists, badgeClass: STATUS_BADGE_CLASS.in_progress }
          : onboarding.questionnaire_validated
            ? { label: fields.questionnaireValidated, badgeClass: STATUS_BADGE_CLASS.completed }
            : { label: fields.questionnaireComplete, badgeClass: STATUS_BADGE_CLASS.pending };

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
        ? this.i18n.onboardingStatusLabel(onboarding.status)
        : this.i18n.adminList().notStarted,
      statusBadgeClass: `tag-badge ${
        onboarding ? STATUS_BADGE_CLASS[onboarding.status] : 'tag-badge--muted'
      }`,
      statusDateLabel: formatTimestampLabel(statusDate),
      questionnaireLabel: questionnaireStage.label,
      questionnaireBadgeClass: `tag-badge ${questionnaireStage.badgeClass}`,
      privateAcceptedCount: onboarding?.private_accepted_count ?? null,
      sharedAcknowledgedCount: onboarding?.status === 'completed'
        ? onboarding.shared_acknowledged_count : null,
      pendingActions: onboarding ? countAdminOnboardingPendingActions(onboarding) : 0,
    };
  }
}
