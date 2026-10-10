import {
  Component,
  ElementRef,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormArray, ReactiveFormsModule } from '@angular/forms';

import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';

import { IGmAvailabilityRange } from '../../../core/interfaces/i-gm-availability';
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
  parseIsoDate,
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
import {
  createDefaultGmAvailabilityRange,
  getGmAvailabilityMutationError,
} from '../../../core/domain/gm-availability/rules';
import { scrollElementIntoViewWhenReady } from '../../../core/utils/scroll';
import { setControlEnabled } from '../../../core/utils/form-controls';
import { InfoDialog } from '../../../common/info-dialog/info-dialog';
import { LoadingOverlay } from '../../../common/loading-overlay/loading-overlay';
import { UniversalCalendar } from '../../../common/universal-calendar/universal-calendar';
import { createGmAvailabilityI18n, GM_AVAILABILITY_SCOPE } from './gm-availability.i18n';
import { GmAvailabilityFacade } from './gm-availability-facade';

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
  providers: [GmAvailabilityFacade, provideTranslocoScope(GM_AVAILABILITY_SCOPE, 'common')],
})
export class GmAvailability {
  private readonly facade = inject(GmAvailabilityFacade);
  private readonly store = inject(GmAvailabilityStore);

  protected readonly i18n = createGmAvailabilityI18n();
  private readonly editorPanel =
    viewChild<ElementRef<HTMLElement>>('editorPanel');

  protected readonly isLoading = this.facade.isLoading;
  protected readonly isSaving = this.facade.isSaving;
  protected readonly canEdit = this.facade.canEdit;
  protected readonly infoDialogVisible = signal(false);
  protected readonly infoDialogContent =
    signal<UiDialogMessage | null>(null);

  protected readonly minDate = this.facade.minDate;
  protected readonly maxDate = this.facade.maxDate;
  protected readonly visibleMonth = this.facade.visibleMonth;
  protected readonly hasInvalidTargetMonth = this.facade.hasInvalidTargetMonth;
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
    effect(() => {
      if (!this.selectedDate()) this.resetEditor();
    });
    effect(() => setControlEnabled(this.ranges, this.canEdit()));
  }

  protected onDateSelected(date: string | null): void {
    if (!this.changeSelectedDate(date)) return;

    if (date) {
      this.scheduleEditorScroll();
    }
  }

  protected onMonthChanged(month: string): void {
    this.facade.setVisibleMonth(month);
  }

  protected addRange(): void {
    if (!this.canEdit() || !this.selectedDate()) return;

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
    if (!this.canEdit() || index < 0 || index >= this.ranges.length) {
      return;
    }

    this.ranges.removeAt(index);
    this.ranges.markAsDirty();
  }

  protected clearSelectedDate(): void {
    const selectedDate = this.selectedDate();

    if (!this.canEdit() || !selectedDate) return;

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
    if (!this.canEdit()) return;

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
    if (!this.canEdit()) return;

    this.handleMutationError(this.commitEditor(true));
  }

  protected saveAvailability(): void {
    if (!this.canEdit()) return;

    const confirmError = this.commitEditor(true);

    if (confirmError) {
      this.handleMutationError(confirmError);
      return;
    }

    this.facade.save();
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
    if (!this.canEdit()) return;

    const targetDate = this.resolveTargetDate(direction);

    if (targetDate && this.changeSelectedDate(targetDate)) {
      this.scheduleEditorScroll();
    }
  }

  protected canMoveSelectedDate(direction: -1 | 1): boolean {
    return this.resolveTargetDate(direction) !== null;
  }

  private changeSelectedDate(date: string | null): boolean {
    if (!this.canEdit()) return false;

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
    this.facade.setVisibleMonth(date.slice(0, 7));

    return true;
  }

  private commitEditor(
    force: boolean = false,
  ): GmAvailabilityMutationError | null {
    const selectedDate = this.selectedDate();

    if (!this.canEdit() || !selectedDate || (!force && !this.ranges.dirty)) {
      return null;
    }

    const ranges = mapGmAvailabilityRangeFormGroupsToRanges(
      this.ranges.controls,
    );
    const error = getGmAvailabilityMutationError(
      [...this.facade.adjacentDays(), ...this.store.days()],
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
