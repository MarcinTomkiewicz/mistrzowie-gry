import {
  Component,
  ElementRef,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormArray, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';

import {
  IGmAvailabilityDay,
  IGmAvailabilityRange,
} from '../../../core/interfaces/i-gm-availability';
import { Auth } from '../../../core/services/auth/auth';
import { GmAvailability as CoreGmAvailability } from '../../../core/services/gm-availability/gm-availability';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import { GmAvailabilityStore } from '../../../core/stores/gm-availability/gm-availability.store';
import { GmAvailabilityRangeFormGroup } from '../../../core/types/gm-availability-form';
import {
  GmAvailabilityHourValue,
  GmAvailabilityMutationError,
} from '../../../core/types/gm-availability';
import { UiDialogMessage } from '../../../core/types/ui';
import { HourOffsetValue } from '../../../core/types/hour-offset';
import {
  addDays,
  compareDatesByDay,
  formatDateLabel,
  getEndOfNextMonthIso,
  getStartOfCurrentMonthIso,
  parseIsoDate,
  toLocalDayStartIso,
  toIsoDate,
} from '../../../core/utils/date';
import {
  clampEndHourOffset,
  createEndHourOffsetOptions,
  createHourOffsetOptions,
} from '../../../core/utils/hour-offset';
import {
  createGmAvailabilityRangeFormGroup,
  mapGmAvailabilityRangeFormGroupsToRanges,
  replaceGmAvailabilityRangeFormGroups,
} from '../../../core/factories/gm-availability-form.factory';
import { mapGmAvailabilityRecordsToDays } from '../../../core/domain/gm-availability/mapping';
import {
  createDefaultGmAvailabilityRange,
  getGmAvailabilityMutationError,
} from '../../../core/domain/gm-availability/rules';
import { scrollElementIntoViewWhenReady } from '../../../core/utils/scroll';
import { InfoDialog } from '../../../common/info-dialog/info-dialog';
import { LoadingOverlay } from '../../../common/loading-overlay/loading-overlay';
import { UniversalCalendar } from '../../../common/universal-calendar/universal-calendar';
import { createGmAvailabilityI18n, GM_AVAILABILITY_SCOPE } from './gm-availability.i18n';

@Component({
  selector: 'app-gm-availability',
  standalone: true,
  imports: [
    ButtonModule,
    SelectModule,
    ReactiveFormsModule,
    UniversalCalendar,
    LoadingOverlay,
    InfoDialog,
  ],
  templateUrl: './gm-availability.html',
  providers: [provideTranslocoScope(GM_AVAILABILITY_SCOPE, 'common')],
})
export class GmAvailability {
  private readonly auth = inject(Auth);
  private readonly gmAvailability = inject(CoreGmAvailability);
  private readonly store = inject(GmAvailabilityStore);
  private readonly toast = inject(UiToast);

  protected readonly i18n = createGmAvailabilityI18n();
  private readonly editorPanel =
    viewChild<ElementRef<HTMLElement>>('editorPanel');

  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  private adjacentDays: readonly IGmAvailabilityDay[] = [];
  protected readonly infoDialogVisible = signal(false);
  protected readonly infoDialogContent =
    signal<UiDialogMessage | null>(null);

  protected readonly minDate = getStartOfCurrentMonthIso();
  protected readonly maxDate = getEndOfNextMonthIso();
  private readonly rangeStartIso = toLocalDayStartIso(this.minDate);
  private readonly rangeEndExclusiveIso = toLocalDayStartIso(
    toIsoDate(addDays(parseIsoDate(this.maxDate)!, 1)),
  );
  protected readonly ranges = new FormArray<GmAvailabilityRangeFormGroup>([]);

  protected readonly startHourOptions = createHourOffsetOptions(
    0,
    HourOffsetValue.DayTotalHours,
  );
  protected readonly formatDateLabel = formatDateLabel;
  protected readonly selectedDate = this.store.selectedDate;
  protected readonly calendarDays = this.store.calendarDays;
  protected readonly hasChanges = this.store.hasChanges;

  constructor() {
    effect((onCleanup) => {
      if (!this.auth.isReady()) {
        return;
      }

      const userId = this.auth.userId();
      this.store.hydrate([]);
      this.adjacentDays = [];
      this.resetEditor();

      if (!userId) {
        this.isLoading.set(false);
        return;
      }

      this.isLoading.set(true);
      const subscription = this.gmAvailability
        .getMyAvailability(this.rangeStartIso, this.rangeEndExclusiveIso)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: ({ editableRecords, adjacentRecords }) => {
            this.store.hydrate(editableRecords);
            this.adjacentDays =
              mapGmAvailabilityRecordsToDays(adjacentRecords);
          },
          error: () => {
            this.toast.danger({
              summary: this.i18n.toast().loadFailedSummary,
              detail: this.i18n.toast().loadFailedDetail,
            });
          },
        });

      onCleanup(() => subscription.unsubscribe());
    });
  }

  protected onDateSelected(date: string | null): void {
    if (!this.changeSelectedDate(date)) return;

    if (date) {
      this.scheduleEditorScroll();
    }
  }

  protected addRange(): void {
    if (this.isSaving() || !this.selectedDate()) return;

    const range = createDefaultGmAvailabilityRange(
      mapGmAvailabilityRangeFormGroupsToRanges(this.ranges.controls),
    );

    if (!range) {
      this.handleMutationError('no_space');
      return;
    }

    this.ranges.push(createGmAvailabilityRangeFormGroup(range));
    this.ranges.markAsDirty();
  }

  protected removeRange(index: number): void {
    if (this.isSaving() || index < 0 || index >= this.ranges.length) {
      return;
    }

    this.ranges.removeAt(index);
    this.ranges.markAsDirty();
  }

  protected clearSelectedDate(): void {
    const selectedDate = this.selectedDate();

    if (this.isSaving() || !selectedDate) return;

    this.store.clearDay(selectedDate);
    this.openEditor(selectedDate, []);
  }

  protected getEndHourOptions(rangeGroup: GmAvailabilityRangeFormGroup) {
    return createEndHourOffsetOptions(
      rangeGroup.controls.startOffset.getRawValue(),
      GmAvailabilityHourValue.MinDurationHours,
      HourOffsetValue.DayTotalHours,
    );
  }

  protected syncRangeEndOffset(rangeGroup: GmAvailabilityRangeFormGroup): void {
    if (this.isSaving()) return;

    const startOffset = rangeGroup.controls.startOffset.getRawValue();
    const endControl = rangeGroup.controls.endOffset;
    const endOffset = clampEndHourOffset(
      startOffset,
      endControl.getRawValue(),
      GmAvailabilityHourValue.MinDurationHours,
    );

    if (endControl.getRawValue() !== endOffset) {
      endControl.setValue(endOffset);
    }
  }

  protected confirmSelectedDate(): void {
    if (this.isSaving()) return;

    this.handleMutationError(this.commitEditor(true));
  }

  protected saveAvailability(): void {
    if (this.isSaving()) return;

    const userId = this.auth.userId();

    if (!userId) return;

    const confirmError = this.commitEditor(true);

    if (confirmError) {
      this.handleMutationError(confirmError);
      return;
    }

    const records = this.store.toRecords(userId);
    this.isSaving.set(true);
    this.ranges.disable({ emitEvent: false });
    this.gmAvailability
      .replaceMyAvailability(
        records,
        this.rangeStartIso,
        this.rangeEndExclusiveIso,
      )
      .pipe(
        finalize(() => {
          this.ranges.enable({ emitEvent: false });
          this.isSaving.set(false);
        }),
      )
      .subscribe({
        next: (records) => {
          if (this.auth.userId() !== userId) {
            return;
          }

          this.store.hydrate(records);
          this.toast.success({
            summary: this.i18n.toast().saveSuccessSummary,
            detail: this.i18n.toast().saveSuccessDetail,
          });
        },
        error: () => {
          if (this.auth.userId() !== userId) {
            return;
          }

          this.toast.danger({
            summary: this.i18n.toast().saveFailedSummary,
            detail: this.i18n.toast().saveFailedDetail,
          });
        },
      });
  }

  private handleMutationError(error: GmAvailabilityMutationError | null): void {
    if (!error) return;

    const dialog = this.i18n.dialog();
    const content: Record<GmAvailabilityMutationError, UiDialogMessage> = {
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

  protected moveSelectedDate(direction: -1 | 1): void {
    if (this.isSaving()) return;

    const targetDate = this.resolveTargetDate(direction);

    if (targetDate && this.changeSelectedDate(targetDate)) {
      this.scheduleEditorScroll();
    }
  }

  protected canMoveSelectedDate(direction: -1 | 1): boolean {
    return this.resolveTargetDate(direction) !== null;
  }

  private changeSelectedDate(date: string | null): boolean {
    if (this.isSaving()) return false;

    const currentDate = this.selectedDate();

    if (currentDate && currentDate !== date && this.ranges.dirty) {
      const error = this.commitEditor();

      if (error) {
        this.handleMutationError(error);
        return false;
      }
    }

    if (!date) {
      this.store.setSelectedDate(null);
      this.resetEditor();
      return true;
    }

    this.openEditor(date, this.store.getDay(date)?.ranges ?? []);

    return true;
  }

  private commitEditor(
    force: boolean = false,
  ): GmAvailabilityMutationError | null {
    const selectedDate = this.selectedDate();

    if (!selectedDate || (!force && !this.ranges.dirty)) {
      return null;
    }

    const ranges = mapGmAvailabilityRangeFormGroupsToRanges(
      this.ranges.controls,
    );
    const error = getGmAvailabilityMutationError(
      [...this.adjacentDays, ...this.store.days()],
      selectedDate,
      ranges,
    );

    if (error) {
      return error;
    }

    this.store.saveDay({
      date: selectedDate,
      ranges,
    });
    this.openEditor(selectedDate, ranges);

    return null;
  }

  private openEditor(
    date: string,
    ranges: readonly IGmAvailabilityRange[],
  ): void {
    replaceGmAvailabilityRangeFormGroups(this.ranges, ranges);
    this.ranges.markAsPristine();
    this.ranges.markAsUntouched();
    this.store.setSelectedDate(date);
  }

  private resetEditor(): void {
    replaceGmAvailabilityRangeFormGroups(this.ranges, []);
    this.ranges.markAsPristine();
    this.ranges.markAsUntouched();
  }

  private resolveTargetDate(direction: -1 | 1): string | null {
    const selectedDate = parseIsoDate(this.selectedDate());
    const minDate = parseIsoDate(this.minDate);
    const maxDate = parseIsoDate(this.maxDate);

    if (!selectedDate || !minDate || !maxDate) return null;

    const targetDate = addDays(selectedDate, direction);

    return compareDatesByDay(targetDate, minDate) >= 0 &&
      compareDatesByDay(targetDate, maxDate) <= 0
      ? toIsoDate(targetDate)
      : null;
  }

  private scheduleEditorScroll(): void {
    scrollElementIntoViewWhenReady(() => this.editorPanel()?.nativeElement);
  }
}
