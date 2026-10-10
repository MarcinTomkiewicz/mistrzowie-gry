import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, map } from 'rxjs';

import { mapGmAvailabilityRecordsToDays } from '../../../core/domain/gm-availability/mapping';
import type { IGmAvailabilityDay } from '../../../core/interfaces/i-gm-availability';
import { Auth } from '../../../core/services/auth/auth';
import { GmAvailability } from '../../../core/services/gm-availability/gm-availability';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import { GmAvailabilityStore } from '../../../core/stores/gm-availability/gm-availability.store';
import {
  addDays,
  getEndOfNextMonthIso,
  getStartOfCurrentMonthIso,
  parseIsoDate,
  parseIsoMonth,
  toIsoDate,
  toLocalDayStartIso,
} from '../../../core/utils/date';
import { createGmAvailabilityI18n } from './gm-availability.i18n';

@Injectable()
export class GmAvailabilityFacade {
  private readonly auth = inject(Auth);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly data = inject(GmAvailability);
  private readonly store = inject(GmAvailabilityStore);
  private readonly toast = inject(UiToast);
  private readonly i18n = createGmAvailabilityI18n();
  private readonly targetMonth = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('month'))),
    { requireSync: true },
  );
  private readonly loadedUserId = signal<string | null>(null);

  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly canEdit = computed(() => {
    const userId = this.auth.userId();
    return this.auth.isReady() && userId !== null && this.loadedUserId() === userId &&
      !this.isLoading() && !this.isSaving();
  });
  readonly adjacentDays = signal<readonly IGmAvailabilityDay[]>([]);
  readonly minDate = getStartOfCurrentMonthIso();
  readonly maxDate = getEndOfNextMonthIso();
  private readonly rangeStartIso = toLocalDayStartIso(this.minDate);
  private readonly rangeEndExclusiveIso = toLocalDayStartIso(
    toIsoDate(addDays(parseIsoDate(this.maxDate)!, 1)),
  );
  readonly visibleMonth = computed(() => this.resolveTargetMonth(this.targetMonth()));
  readonly hasInvalidTargetMonth = computed(
    () => this.targetMonth() !== null && this.visibleMonth() === null,
  );

  constructor() {
    effect((onCleanup) => {
      this.loadedUserId.set(null);
      if (!this.auth.isReady()) return;

      const userId = this.auth.userId();
      this.store.hydrate([]);
      this.adjacentDays.set([]);
      if (!userId) {
        this.isLoading.set(false);
        return;
      }

      this.isLoading.set(true);
      const subscription = this.data
        .getMyAvailability(this.rangeStartIso, this.rangeEndExclusiveIso)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: ({ editableRecords, adjacentRecords }) => {
            if (!this.auth.isReady() || this.auth.userId() !== userId) return;
            this.store.hydrate(editableRecords);
            this.adjacentDays.set(mapGmAvailabilityRecordsToDays(adjacentRecords));
            this.loadedUserId.set(userId);
          },
          error: () => {
            this.loadedUserId.set(null);
            this.toast.danger({
              summary: this.i18n.toast().loadFailedSummary,
              detail: this.i18n.toast().loadFailedDetail,
            });
          },
        });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  setVisibleMonth(month: string): void {
    if (this.targetMonth() === month || this.resolveTargetMonth(month) === null) return;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { month },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  save(): void {
    const userId = this.auth.userId();
    if (!this.canEdit() || !userId) return;

    const records = this.store.toRecords(userId);
    this.isSaving.set(true);
    this.data.replaceMyAvailability(records, this.rangeStartIso, this.rangeEndExclusiveIso)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (records) => {
          if (this.auth.userId() !== userId) return;
          this.store.hydrate(records);
          this.toast.success({
            summary: this.i18n.toast().saveSuccessSummary,
            detail: this.i18n.toast().saveSuccessDetail,
          });
        },
        error: () => {
          if (this.auth.userId() !== userId) return;
          this.toast.danger({
            summary: this.i18n.toast().saveFailedSummary,
            detail: this.i18n.toast().saveFailedDetail,
          });
        },
      });
  }

  private resolveTargetMonth(targetMonth: string | null): string | null {
    const month = parseIsoMonth(targetMonth);
    if (!month) return null;
    const monthStart = toIsoDate(month);
    return monthStart >= this.minDate && monthStart <= this.maxDate ? targetMonth : null;
  }
}
