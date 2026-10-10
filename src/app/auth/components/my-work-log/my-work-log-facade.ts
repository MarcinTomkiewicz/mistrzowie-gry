import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormRecord } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, map } from 'rxjs';

import {
  getWorkLogMonthOffset,
  getWorkLogMonthScope,
  getWorkLogMutationError,
  getWorkLogTotalHours,
  isChaoticThursdayDate,
} from '../../../core/domain/work-log/rules';
import {
  mapWorkLogFormToDays,
  replaceWorkLogFormDays,
} from '../../../core/factories/work-log-form.factory';
import type { IUserWorkLogDay } from '../../../core/interfaces/i-work-log';
import { Auth } from '../../../core/services/auth/auth';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import { WorkLog } from '../../../core/services/work-log/work-log';
import type { WorkLogMonthOffset, WorkLogMutationError } from '../../../core/types/work-log';
import type { WorkLogDayFormGroup, WorkLogFormRecord } from '../../../core/types/work-log-form';
import { setControlEnabled } from '../../../core/utils/form-controls';
import { createMyWorkLogI18n } from './my-work-log.i18n';

@Injectable()
export class MyWorkLogFacade {
  private readonly auth = inject(Auth);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly data = inject(WorkLog);
  private readonly toast = inject(UiToast);
  private readonly i18n = createMyWorkLogI18n();
  private readonly targetMonth = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('month'))),
    { requireSync: true },
  );
  private readonly requestedMonthOffset = computed(
    () => getWorkLogMonthOffset(this.targetMonth()),
  );
  private initialDays: readonly IUserWorkLogDay[] = [];
  private readonly adjacentDays = signal<readonly IUserWorkLogDay[]>([]);
  private readonly loadedScope = signal<{ userId: string; monthStart: string } | null>(null);

  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly monthOffset = signal<WorkLogMonthOffset>(
    this.requestedMonthOffset() ?? 0,
  );
  readonly monthScope = computed(() => getWorkLogMonthScope(this.monthOffset()));
  readonly canEdit = computed(() => {
    const loadedScope = this.loadedScope();
    const monthScope = this.monthScope();
    return this.auth.isReady() && loadedScope !== null &&
      loadedScope.userId === this.auth.userId() && loadedScope.monthStart === monthScope.startDate &&
      monthScope.isEditable && !this.isLoading() && !this.isSaving();
  });
  readonly hasInvalidTargetMonth = computed(
    () => this.targetMonth() !== null && this.requestedMonthOffset() === null,
  );
  readonly form: WorkLogFormRecord = new FormRecord<WorkLogDayFormGroup>({});
  readonly draftDays = toSignal(
    this.form.valueChanges.pipe(map(() => mapWorkLogFormToDays(this.form))),
    { initialValue: mapWorkLogFormToDays(this.form) },
  );
  private readonly initialDraftValue = signal(JSON.stringify(this.draftDays()));
  readonly hasChanges = computed(
    () => this.initialDraftValue() !== JSON.stringify(this.draftDays()),
  );
  readonly totalHours = computed(() => getWorkLogTotalHours(this.draftDays()));
  readonly mutationError = computed(() =>
    getWorkLogMutationError([...this.adjacentDays(), ...this.draftDays()]),
  );

  constructor() {
    this.replaceFormDays([]);
    effect(() => this.syncFormEditable(this.canEdit()));
    effect(() => {
      const monthOffset = this.requestedMonthOffset();
      if (this.isSaving() || monthOffset === null) return;
      untracked(() => this.monthOffset.set(monthOffset));
    });

    effect((onCleanup) => {
      this.loadedScope.set(null);
      if (!this.auth.isReady()) return;
      const userId = this.auth.userId();
      const monthOffset = this.monthOffset();
      const monthStart = this.monthScope().startDate;
      this.initialDays = [];
      this.adjacentDays.set([]);
      untracked(() => this.replaceFormDays([]));
      if (!userId) {
        this.isLoading.set(false);
        return;
      }

      this.isLoading.set(true);
      const subscription = this.data.getMyMonth(monthOffset)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: ({ days, adjacentDays }) => {
            if (!this.auth.isReady() || this.auth.userId() !== userId ||
              this.monthScope().startDate !== monthStart) return;
            this.initialDays = days;
            this.adjacentDays.set(adjacentDays);
            this.replaceFormDays(days);
            this.loadedScope.set({ userId, monthStart });
          },
          error: () => {
            this.loadedScope.set(null);
            this.initialDays = [];
            this.adjacentDays.set([]);
            this.replaceFormDays([]);
            this.toast.danger({
              summary: this.i18n.toast().loadFailedSummary,
              detail: this.i18n.toast().loadFailedDetail,
            });
          },
        });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  switchMonth(monthOffset: WorkLogMonthOffset): void {
    if (this.isSaving()) return;
    this.monthOffset.set(monthOffset);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { month: this.monthScope().startDate.slice(0, 7) },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  resetChanges(): void {
    if (this.canEdit()) this.replaceFormDays(this.initialDays);
  }

  save(): WorkLogMutationError | null {
    if (!this.canEdit()) return null;
    const mutationError = this.mutationError();
    if (mutationError) return mutationError;
    const userId = this.auth.userId();
    if (!userId) return null;

    const monthOffset = this.monthOffset();
    const days = this.draftDays();
    this.isSaving.set(true);
    this.data.replaceMyMonth(days, monthOffset)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (days) => {
          if (this.auth.userId() !== userId || this.monthOffset() !== monthOffset) return;
          this.initialDays = days;
          this.replaceFormDays(days);
          this.toast.success({
            summary: this.i18n.toast().saveSuccessSummary,
            detail: this.i18n.toast().saveSuccessDetail,
          });
        },
        error: () => {
          if (this.auth.userId() !== userId || this.monthOffset() !== monthOffset) return;
          this.toast.danger({
            summary: this.i18n.toast().saveFailedSummary,
            detail: this.i18n.toast().saveFailedDetail,
          });
        },
      });
    return null;
  }

  private replaceFormDays(days: readonly IUserWorkLogDay[]): void {
    const monthScope = this.monthScope();
    const editable = this.canEdit();
    replaceWorkLogFormDays(this.form, monthScope.days, days, editable);
    this.syncFormEditable(editable);
    this.initialDraftValue.set(JSON.stringify(mapWorkLogFormToDays(this.form)));
  }

  private syncFormEditable(editable: boolean): void {
    setControlEnabled(this.form, editable);
    if (!editable) return;
    for (const [date, dayForm] of Object.entries(this.form.controls)) {
      setControlEnabled(dayForm.controls.isChaoticThursday, isChaoticThursdayDate(date));
    }
  }
}
