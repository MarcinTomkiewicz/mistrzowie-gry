import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { provideTranslocoScope } from '@jsverse/transloco';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';

import { IGmAvailabilityRange } from '../../../core/interfaces/i-gm-availability';
import {
  IUserWorkLogDay,
  IUserWorkLogRowVm,
  WorkLogMonthOffset,
} from '../../../core/interfaces/i-work-log';
import { Auth } from '../../../core/services/auth/auth';
import { Platform } from '../../../core/services/platform/platform';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import { WorkLog } from '../../../core/services/work-log/work-log';
import { HourOffsetValue } from '../../../core/types/hour-offset';
import { WorkLogHourValue } from '../../../core/types/work-log';
import {
  createEndHourOffsetOptions,
  createHourOffsetOptions,
  normalizeEndHourOffset,
} from '../../../core/utils/time';
import {
  createDefaultWorkLogRange,
  createWorkLogRows,
  formatWorkLogHours,
  getWorkLogMonthScope,
  getWorkLogMutationError,
  getWorkLogTotalHours,
  upsertWorkLogDay,
} from '../../../core/utils/work-log/work-log.util';
import { InfoDialog } from '../../../public/common/info-dialog/info-dialog';
import { LoadingOverlay } from '../../../public/common/loading-overlay/loading-overlay';
import { createMyWorkLogI18n } from './my-work-log.i18n';

@Component({
  selector: 'app-my-work-log',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AccordionModule,
    ButtonModule,
    CheckboxModule,
    SelectModule,
    TableModule,
    TextareaModule,
    TooltipModule,
    LoadingOverlay,
    InfoDialog,
  ],
  templateUrl: './my-work-log.html',
  providers: [provideTranslocoScope('auth', 'common')],
})
export class MyWorkLogComponent {
  private readonly auth = inject(Auth);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platform = inject(Platform);
  private readonly toast = inject(UiToast);
  private readonly workLog = inject(WorkLog);

  protected readonly i18n = createMyWorkLogI18n();
  protected readonly isLoading = signal(true);
  protected readonly isCompactView = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly monthOffset = signal<WorkLogMonthOffset>(0);
  protected readonly infoDialogVisible = signal(false);
  protected readonly infoDialogContent = signal<{
    title: string;
    body: string;
  } | null>(null);

  private readonly initialDays = signal<readonly IUserWorkLogDay[]>([]);
  private readonly draftDays = signal<readonly IUserWorkLogDay[]>([]);
  private readonly loadedKey = signal<string | null>(null);

  protected readonly startHourOptions = createHourOffsetOptions(
    0,
    HourOffsetValue.DayTotalHours,
  );
  protected readonly monthScope = computed(() =>
    getWorkLogMonthScope(this.monthOffset()),
  );
  protected readonly rows = computed<IUserWorkLogRowVm[]>(() =>
    createWorkLogRows(this.monthScope(), this.draftDays()),
  );
  protected readonly totalHours = computed(() =>
    getWorkLogTotalHours(this.draftDays()),
  );
  protected readonly hasChanges = computed(
    () =>
      JSON.stringify(this.initialDays()) !== JSON.stringify(this.draftDays()),
  );
  protected readonly formatHours = formatWorkLogHours;

  constructor() {
    const syncViewport = () => {
      this.isCompactView.set(
        this.platform.matchMedia('(max-width: 767px)')?.matches ?? false,
      );
    };
    const disposeResize = this.platform.onWindow('resize', syncViewport);
    this.destroyRef.onDestroy(disposeResize);
    syncViewport();

    effect(() => {
      if (!this.auth.isReady()) {
        return;
      }

      const userId = this.auth.userId();
      const monthOffset = this.monthOffset();
      const loadKey = userId ? `${userId}-${monthOffset}` : null;

      if (!loadKey) {
        this.loadedKey.set(null);
        this.initialDays.set([]);
        this.draftDays.set([]);
        this.isLoading.set(false);
        return;
      }

      if (this.loadedKey() === loadKey) {
        return;
      }

      this.loadedKey.set(loadKey);
      this.loadMonth();
    });
  }

  protected switchMonth(monthOffset: WorkLogMonthOffset): void {
    if (this.monthOffset() === monthOffset) {
      return;
    }

    this.monthOffset.set(monthOffset);
  }

  protected getEndHourOptions(
    range: Pick<IGmAvailabilityRange, 'startOffset'>,
  ) {
    return createEndHourOffsetOptions(
      range.startOffset,
      WorkLogHourValue.MinDurationHours,
      HourOffsetValue.DayTotalHours,
    );
  }

  protected addRange(date: string): void {
    if (!this.monthScope().isEditable) {
      return;
    }

    const day = this.getDay(date);
    const range = createDefaultWorkLogRange(day.ranges);

    if (!range) {
      this.handleMutationError('no_space');
      return;
    }

    this.saveDraftDay({
      ...day,
      ranges: [...day.ranges, range],
    });
  }

  protected removeRange(date: string, rangeId: string): void {
    const day = this.getDay(date);

    this.saveDraftDay({
      ...day,
      ranges: day.ranges.filter((range) => range.id !== rangeId),
    });
  }

  protected updateRangeStart(
    date: string,
    rangeId: string,
    startOffset: number,
  ): void {
    const day = this.getDay(date);

    this.saveDraftDay({
      ...day,
      ranges: day.ranges.map((range) =>
        range.id !== rangeId
          ? range
          : {
              ...range,
              startOffset,
              endOffset:
                range.endOffset <
                normalizeEndHourOffset(
                  startOffset,
                  WorkLogHourValue.MinDurationHours,
                )
                  ? normalizeEndHourOffset(
                      startOffset,
                      WorkLogHourValue.MinDurationHours,
                    )
                  : range.endOffset,
            },
      ),
    });
  }

  protected updateRangeEnd(
    date: string,
    rangeId: string,
    endOffset: number,
  ): void {
    const day = this.getDay(date);

    this.saveDraftDay({
      ...day,
      ranges: day.ranges.map((range) =>
        range.id !== rangeId ? range : { ...range, endOffset },
      ),
    });
  }

  protected updateChaoticThursday(date: string, checked: boolean): void {
    const day = this.getDay(date);

    this.saveDraftDay({
      ...day,
      isChaoticThursday: checked,
    });
  }

  protected updateComment(date: string, comment: string): void {
    const day = this.getDay(date);

    this.saveDraftDay({
      ...day,
      comment,
    });
  }

  protected clearDay(date: string): void {
    const day = this.getDay(date);

    this.saveDraftDay({
      ...day,
      ranges: [],
      isChaoticThursday: false,
      comment: null,
    });
  }

  protected resetChanges(): void {
    this.draftDays.set(this.initialDays());
  }

  protected save(): void {
    if (!this.monthScope().isEditable) {
      return;
    }

    this.isSaving.set(true);
    this.workLog
      .replaceMyMonth(this.draftDays(), this.monthOffset())
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (days) => {
          this.initialDays.set(days);
          this.draftDays.set(days);
          this.toast.success({
            summary: this.i18n.toast().saveSuccessSummary,
            detail: this.i18n.toast().saveSuccessDetail,
          });
        },
        error: () => {
          this.toast.danger({
            summary: this.i18n.toast().saveFailedSummary,
            detail: this.i18n.toast().saveFailedDetail,
          });
        },
      });
  }

  protected isPreviousMonth(): boolean {
    return this.monthOffset() === -1;
  }

  private loadMonth(): void {
    this.isLoading.set(true);
    this.workLog
      .getMyMonth(this.monthOffset())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (days) => {
          this.initialDays.set(days);
          this.draftDays.set(days);
        },
        error: () => {
          this.initialDays.set([]);
          this.draftDays.set([]);
          this.toast.danger({
            summary: this.i18n.toast().loadFailedSummary,
            detail: this.i18n.toast().loadFailedDetail,
          });
        },
      });
  }

  private getDay(date: string): IUserWorkLogDay {
    return (
      this.draftDays().find((day) => day.date === date) ?? {
        date,
        ranges: [],
        isChaoticThursday: false,
        comment: null,
      }
    );
  }

  private saveDraftDay(day: IUserWorkLogDay): void {
    const error = getWorkLogMutationError(day.ranges);

    if (error) {
      this.handleMutationError(error);
      return;
    }

    this.draftDays.set(upsertWorkLogDay(this.draftDays(), day));
  }

  private handleMutationError(
    error: 'invalid_duration' | 'overlap' | 'no_space',
  ): void {
    const dialog = this.i18n.dialog();

    switch (error) {
      case 'invalid_duration':
        this.infoDialogContent.set({
          title: dialog.invalidDurationTitle,
          body: dialog.invalidDurationBody,
        });
        break;
      case 'overlap':
        this.infoDialogContent.set({
          title: dialog.overlapTitle,
          body: dialog.overlapBody,
        });
        break;
      case 'no_space':
        this.infoDialogContent.set({
          title: dialog.noSpaceTitle,
          body: dialog.noSpaceBody,
        });
        break;
    }

    this.infoDialogVisible.set(true);
  }
}
