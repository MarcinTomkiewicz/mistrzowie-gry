import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import {
  catchError,
  distinctUntilChanged,
  EMPTY,
  filter,
  finalize,
  map,
  Observable,
  startWith,
  Subject,
  switchMap,
} from 'rxjs';

import { LoadingOverlay } from '../../../common/loading-overlay/loading-overlay';
import { STATUS_BADGE_CLASS } from '../../../core/configs/badge-class.config';
import { GM_STAFFING_HUB_ROUTE } from '../../../core/configs/staffing-realization.config';
import type { MyStaffingRealizationDetail } from '../../../core/interfaces/my-staffing-realization';
import { MyStaffingRealizationRead } from '../../../core/reads/staffing/my-staffing-realization-read';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import { GM_STAFFING_SCOPE, STAFFING_SCOPE } from '../../../core/translations/staffing.i18n';
import { RpcError } from '../../../core/types/rpc-error';
import { formatDateLabel, formatTimestampLabel } from '../../../core/utils/date';
import { formatTimeRangeLabel } from '../../../core/utils/time-format';
import { createGmStaffingRealizationDetailI18n } from './gm-staffing-realization-detail.i18n';
import { GmStaffingTravelTerms } from './gm-staffing-travel-terms';

@Component({
  selector: 'app-gm-staffing-realization-detail',
  imports: [RouterLink, ButtonModule, LoadingOverlay, GmStaffingTravelTerms],
  templateUrl: './gm-staffing-realization-detail.html',
  providers: [provideTranslocoScope(GM_STAFFING_SCOPE, STAFFING_SCOPE, 'adminStaffing', 'common')],
})
export class GmStaffingRealizationDetail {
  private readonly read = inject(MyStaffingRealizationRead);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(UiToast);
  private readonly reload = new Subject<void>();

  protected readonly i18n = createGmStaffingRealizationDetailI18n();
  protected readonly detail = signal<MyStaffingRealizationDetail | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal<unknown | null>(null);
  protected readonly isNotFound = computed(() => {
    const error = this.loadError();
    return error instanceof RpcError && error.code === 'P0002';
  });
  protected readonly hubRoute = GM_STAFFING_HUB_ROUTE;
  protected readonly statusBadgeClass = STATUS_BADGE_CLASS;
  protected readonly formatDateLabel = formatDateLabel;
  protected readonly formatTimeRangeLabel = formatTimeRangeLabel;
  protected readonly formatTimestampLabel = formatTimestampLabel;
  protected readonly candidateTimestampFields = [
    'submittedAt', 'withdrawnAt', 'gmDecidedAt', 'adminDecidedAt',
  ] as const;
  protected readonly dates = computed(() => {
    const days = this.detail()?.days;
    if (!days?.length) return null;
    const dates = days.map((day) => day.date).sort();
    const start = dates[0];
    const end = dates[dates.length - 1];
    return start === end
      ? formatDateLabel(start)
      : `${formatDateLabel(start)} - ${formatDateLabel(end)}`;
  });
  protected readonly candidateDays = computed(() => {
    const detail = this.detail();
    const scope = detail?.candidate?.scope;
    return detail && scope?.mode === 'selected_days'
      ? detail.days.filter((day) => scope.dayIds.includes(day.id))
      : [];
  });

  constructor() {
    this.route.paramMap.pipe(
      map((params) => params.get('realizationId')),
      filter((id): id is string => id !== null),
      distinctUntilChanged(),
      switchMap((id) => this.reload.pipe(
        startWith(undefined),
        switchMap(() => this.loadDetail(id)),
      )),
      takeUntilDestroyed(),
    ).subscribe((detail) => this.detail.set(detail));
  }

  protected retry(): void {
    this.reload.next();
  }

  private loadDetail(realizationId: string): Observable<MyStaffingRealizationDetail> {
    this.detail.set(null);
    this.isLoading.set(true);
    this.loadError.set(null);
    return this.read.getDetail(realizationId).pipe(
      catchError((error: unknown) => {
        this.loadError.set(error);
        if (!this.isNotFound()) {
          this.toast.danger({
            summary: this.i18n.copy().errors.loadFailed,
            detail: this.i18n.commonErrors().generic,
          });
        }
        return EMPTY;
      }),
      finalize(() => this.isLoading.set(false)),
    );
  }
}
