import {
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';

import { IUserWorkLogRowVm } from '../../../core/interfaces/i-work-log';
import {
  createWorkLogRangeFormGroup,
  placeWorkLogRangeFormGroupChronologically,
  resetWorkLogDayForm,
} from '../../../core/factories/work-log-form.factory';
import { Platform } from '../../../core/services/platform/platform';
import { HourOffsetValue } from '../../../core/types/hour-offset';
import {
  WorkLogHourValue,
  WorkLogMonthOffset,
  WorkLogMutationError,
} from '../../../core/types/work-log';
import {
  WorkLogDayFormGroup,
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
import { createDefaultWorkLogRange } from '../../../core/domain/work-log/rules';
import { InfoDialog } from '../../../common/info-dialog/info-dialog';
import { LoadingOverlay } from '../../../common/loading-overlay/loading-overlay';
import { createMyWorkLogI18n, MY_WORK_LOG_SCOPE } from './my-work-log.i18n';
import { MyWorkLogFacade } from './my-work-log-facade';

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
  providers: [MyWorkLogFacade, provideTranslocoScope(MY_WORK_LOG_SCOPE, 'common')],
})
export class MyWorkLog {
  private readonly facade = inject(MyWorkLogFacade);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platform = inject(Platform);

  protected readonly i18n = createMyWorkLogI18n();
  protected readonly isLoading = this.facade.isLoading;
  protected readonly isCompactView = signal(false);
  protected readonly isSaving = this.facade.isSaving;
  protected readonly canEdit = this.facade.canEdit;
  protected readonly monthOffset = this.facade.monthOffset;
  protected readonly hasInvalidTargetMonth = this.facade.hasInvalidTargetMonth;
  protected readonly infoDialogVisible = signal(false);
  protected readonly infoDialogContent = signal<UiDialogMessage | null>(
    null,
  );

  protected readonly startHourOptions = createHourOffsetOptions(
    0,
    HourOffsetValue.DayTotalHours,
  );
  protected readonly monthScope = this.facade.monthScope;
  protected readonly rows = computed<IUserWorkLogRowVm[]>(() =>
    createWorkLogRows(this.monthScope(), this.facade.draftDays()),
  );
  protected readonly trackRowByDate = (
    _index: number,
    row: IUserWorkLogRowVm,
  ): string => row.date;
  protected readonly totalHours = this.facade.totalHours;
  protected readonly hasChanges = this.facade.hasChanges;
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
  }

  protected switchMonth(monthOffset: WorkLogMonthOffset): void {
    this.facade.switchMonth(monthOffset);
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
    if (!this.canEdit()) {
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
    if (!this.canEdit()) return;

    const ranges = this.getDayForm(date).controls.ranges;
    ranges.removeAt(rangeIndex);
  }

  protected clearDay(date: string): void {
    if (!this.canEdit()) return;

    resetWorkLogDayForm(this.getDayForm(date));
  }

  protected resetChanges(): void {
    this.facade.resetChanges();
  }

  protected save(): void {
    const error = this.facade.save();
    if (error) this.handleMutationError(error);
  }

  protected onRangeStartChange(
    date: string,
    rangeGroup: WorkLogRangeFormGroup,
  ): void {
    if (!this.canEdit()) return;

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
    if (!this.canEdit()) return;

    this.showCurrentMutationError();
  }

  protected getDayForm(date: string): WorkLogDayFormGroup {
    return this.facade.form.controls[date];
  }

  private showCurrentMutationError(): void {
    const error = this.facade.mutationError();

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
