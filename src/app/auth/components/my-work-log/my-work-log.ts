import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormRecord, ReactiveFormsModule } from '@angular/forms';
import { finalize, map } from 'rxjs';

import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';

import {
  IUserWorkLogDay,
  IUserWorkLogRowVm,
} from '../../../core/interfaces/i-work-log';
import {
  createWorkLogRangeFormGroup,
  mapWorkLogFormToDays,
  placeWorkLogRangeFormGroupChronologically,
  replaceWorkLogFormDays,
  resetWorkLogDayForm,
} from '../../../core/factories/work-log-form.factory';
import { Auth } from '../../../core/services/auth/auth';
import { Platform } from '../../../core/services/platform/platform';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import { WorkLog } from '../../../core/services/work-log/work-log';
import { HourOffsetValue } from '../../../core/types/hour-offset';
import {
  WorkLogHourValue,
  WorkLogMonthOffset,
  WorkLogMutationError,
} from '../../../core/types/work-log';
import {
  WorkLogDayFormGroup,
  WorkLogFormRecord,
  WorkLogRangeFormGroup,
} from '../../../core/types/work-log-form';
import { UiDialogMessage } from '../../../core/types/ui';
import {
  clampEndHourOffset,
  createEndHourOffsetOptions,
  createHourOffsetOptions,
} from '../../../core/utils/hour-offset';
import {
  createWorkLogRows,
  formatWorkLogHours,
} from '../../../core/domain/work-log/display';
import {
  createDefaultWorkLogRange,
  getWorkLogMonthScope,
  getWorkLogMutationError,
  getWorkLogTotalHours,
} from '../../../core/domain/work-log/rules';
import { InfoDialog } from '../../../common/info-dialog/info-dialog';
import { LoadingOverlay } from '../../../common/loading-overlay/loading-overlay';
import { createMyWorkLogI18n, MY_WORK_LOG_SCOPE } from './my-work-log.i18n';

@Component({
  selector: 'app-my-work-log',
  standalone: true,
  imports: [
    ReactiveFormsModule,
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
  providers: [provideTranslocoScope(MY_WORK_LOG_SCOPE, 'common')],
})
export class MyWorkLog {
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
  protected readonly infoDialogContent = signal<UiDialogMessage | null>(
    null,
  );

  private initialDays: readonly IUserWorkLogDay[] = [];
  private readonly adjacentDays = signal<readonly IUserWorkLogDay[]>([]);
  private readonly form: WorkLogFormRecord =
    new FormRecord<WorkLogDayFormGroup>({});
  private readonly draftDays = toSignal(
    this.form.valueChanges.pipe(
      map(() => mapWorkLogFormToDays(this.form)),
    ),
    { initialValue: mapWorkLogFormToDays(this.form) },
  );
  private readonly initialDraftValue = signal(
    JSON.stringify(this.draftDays()),
  );
  private readonly mutationError = computed(() =>
    getWorkLogMutationError([
      ...this.adjacentDays(),
      ...this.draftDays(),
    ]),
  );

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
      this.initialDraftValue() !== JSON.stringify(this.draftDays()),
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
    this.replaceFormDays([]);

    effect((onCleanup) => {
      if (!this.auth.isReady()) {
        return;
      }

      const userId = this.auth.userId();
      const monthOffset = this.monthOffset();
      this.initialDays = [];
      this.adjacentDays.set([]);
      this.replaceFormDays([]);

      if (!userId) {
        this.isLoading.set(false);
        return;
      }

      this.isLoading.set(true);
      const subscription = this.workLog
        .getMyMonth(monthOffset)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: ({ days, adjacentDays }) => {
            this.initialDays = days;
            this.adjacentDays.set(adjacentDays);
            this.replaceFormDays(days);
          },
          error: () => {
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

  protected switchMonth(monthOffset: WorkLogMonthOffset): void {
    if (this.isSaving() || this.monthOffset() === monthOffset) {
      return;
    }

    this.monthOffset.set(monthOffset);
  }

  protected getEndHourOptions(
    rangeGroup: WorkLogRangeFormGroup,
  ) {
    return createEndHourOffsetOptions(
      rangeGroup.controls.startOffset.getRawValue(),
      WorkLogHourValue.MinDurationHours,
      HourOffsetValue.DayTotalHours,
    );
  }

  protected addRange(date: string): void {
    if (this.isSaving() || !this.monthScope().isEditable) {
      return;
    }

    const dayForm = this.getDayForm(date);
    const range = createDefaultWorkLogRange(
      dayForm.controls.ranges.getRawValue(),
    );

    if (!range) {
      this.handleMutationError('no_space');
      return;
    }

    const rangeGroup = createWorkLogRangeFormGroup(range, false);
    placeWorkLogRangeFormGroupChronologically(
      dayForm,
      rangeGroup,
    );
    this.showCurrentMutationError();
  }

  protected removeRange(date: string, rangeIndex: number): void {
    if (this.isSaving()) return;

    const ranges = this.getDayForm(date).controls.ranges;
    ranges.removeAt(rangeIndex);
  }

  protected clearDay(date: string): void {
    if (this.isSaving()) return;

    resetWorkLogDayForm(this.getDayForm(date));
  }

  protected resetChanges(): void {
    if (this.isSaving()) return;

    this.replaceFormDays(this.initialDays);
  }

  protected save(): void {
    if (!this.monthScope().isEditable || this.isSaving()) {
      return;
    }

    const mutationError = this.mutationError();

    if (mutationError) {
      this.handleMutationError(mutationError);
      return;
    }

    const userId = this.auth.userId();
    const monthOffset = this.monthOffset();
    const days = this.draftDays();

    if (!userId) {
      return;
    }

    this.isSaving.set(true);
    this.workLog
      .replaceMyMonth(days, monthOffset)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (days) => {
          if (
            this.auth.userId() !== userId ||
            this.monthOffset() !== monthOffset
          ) {
            return;
          }

          this.initialDays = days;
          this.replaceFormDays(days);
          this.toast.success({
            summary: this.i18n.toast().saveSuccessSummary,
            detail: this.i18n.toast().saveSuccessDetail,
          });
        },
        error: () => {
          if (
            this.auth.userId() !== userId ||
            this.monthOffset() !== monthOffset
          ) {
            return;
          }

          this.toast.danger({
            summary: this.i18n.toast().saveFailedSummary,
            detail: this.i18n.toast().saveFailedDetail,
          });
        },
      });
  }

  protected onRangeStartChange(
    date: string,
    rangeGroup: WorkLogRangeFormGroup,
  ): void {
    if (this.isSaving()) return;

    const startOffset = rangeGroup.controls.startOffset.getRawValue();
    const endControl = rangeGroup.controls.endOffset;
    const endOffset = clampEndHourOffset(
      startOffset,
      endControl.getRawValue(),
      WorkLogHourValue.MinDurationHours,
    );

    if (endControl.getRawValue() !== endOffset) {
      endControl.setValue(endOffset);
    }

    placeWorkLogRangeFormGroupChronologically(
      this.getDayForm(date),
      rangeGroup,
    );
    this.showCurrentMutationError();
  }

  protected onRangeEndChange(): void {
    if (this.isSaving()) return;

    this.showCurrentMutationError();
  }

  protected getDayForm(date: string): WorkLogDayFormGroup {
    return this.form.controls[date];
  }

  private replaceFormDays(days: readonly IUserWorkLogDay[]): void {
    const monthScope = this.monthScope();
    replaceWorkLogFormDays(
      this.form,
      monthScope.days,
      days,
      monthScope.isEditable,
    );
    this.initialDraftValue.set(JSON.stringify(mapWorkLogFormToDays(this.form)));
  }

  private showCurrentMutationError(): void {
    const error = this.mutationError();

    if (error) {
      this.handleMutationError(error);
    }
  }

  private handleMutationError(error: WorkLogMutationError): void {
    const dialog = this.i18n.dialog();
    const content: Record<WorkLogMutationError, UiDialogMessage> = {
      invalid_duration: {
        title: dialog.invalidDurationTitle,
        body: dialog.invalidDurationBody,
      },
      overlap: {
        title: dialog.overlapTitle,
        body: dialog.overlapBody,
      },
      no_space: {
        title: dialog.noSpaceTitle,
        body: dialog.noSpaceBody,
      },
    };

    this.infoDialogContent.set(content[error]);

    this.infoDialogVisible.set(true);
  }
}
