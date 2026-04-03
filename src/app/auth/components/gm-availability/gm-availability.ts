import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';

import {
  GmAvailabilityRangeFormGroup,
  GmAvailabilityEditorFormGroup,
  IGmAvailabilityEditorError,
  IGmAvailabilityHourOption,
  IGmAvailabilityRange,
} from '../../../core/interfaces/i-gm-availability';
import { Auth } from '../../../core/services/auth/auth';
import { GmAvailability } from '../../../core/services/gm-availability/gm-availability';
import { GmAvailabilityStore } from '../../../core/services/gm-availability-store/gm-availability-store';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import { GmAvailabilityMutationError } from '../../../core/types/gm-availability';
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
  createGmAvailabilityEditorRanges,
  createGmAvailabilityEndHourOptions,
  createGmAvailabilityHourOptions,
  createGmAvailabilityRangeFormGroup,
  createDefaultGmAvailabilityRange,
  getGmAvailabilityMutationError,
  mapGmAvailabilityRangeFormGroupsToRanges,
  normalizeGmAvailabilityEndOffset,
  replaceGmAvailabilityRangeFormGroups,
} from '../../../core/utils/gm-availability/gm-availability.util';
import { scrollElementIntoViewWhenReady } from '../../../core/utils/scroll';
import { InfoDialog } from '../../../public/common/info-dialog/info-dialog';
import { LoadingOverlay } from '../../../public/common/loading-overlay/loading-overlay';
import { UniversalCalendar } from '../../../public/common/universal-calendar/universal-calendar';
import { createGmAvailabilityI18n } from './gm-availability.i18n';

@Component({
  selector: 'app-gm-availability',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    SelectModule,
    ReactiveFormsModule,
    UniversalCalendar,
    LoadingOverlay,
    InfoDialog,
  ],
  templateUrl: './gm-availability.html',
  providers: [provideTranslocoScope('auth', 'common')],
})
export class GmAvailabilityComponent {
  private readonly auth = inject(Auth);
  private readonly gmAvailability = inject(GmAvailability);
  protected readonly store = inject(GmAvailabilityStore);
  private readonly toast = inject(UiToast);

  protected readonly i18n = createGmAvailabilityI18n();
  protected readonly editorPanel =
    viewChild<ElementRef<HTMLElement>>('editorPanel');

  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly infoDialogVisible = signal(false);
  protected readonly infoDialogContent =
    signal<IGmAvailabilityEditorError | null>(null);

  protected readonly minDate = getStartOfCurrentMonthIso();
  protected readonly maxDate = getEndOfNextMonthIso();
  private readonly rangeStartIso = toLocalDayStartIso(this.minDate);
  private readonly rangeEndExclusiveIso = toLocalDayStartIso(
    toIsoDate(addDays(parseIsoDate(this.maxDate) ?? new Date(), 1)),
  );
  protected readonly editorForm: GmAvailabilityEditorFormGroup = new FormGroup({
    ranges: new FormArray<GmAvailabilityRangeFormGroup>([]),
  });
  protected readonly ranges = this.editorForm.controls.ranges;

  protected readonly startHourOptions = createGmAvailabilityHourOptions(0, 24);
  protected readonly formatDateLabel = formatDateLabel;
  protected readonly selectedDate = this.store.selectedDate;
  protected readonly calendarDays = this.store.calendarDays;
  protected readonly hasChanges = this.store.hasChanges;
  protected readonly rangeGroups = signal<
    readonly GmAvailabilityRangeFormGroup[]
  >([]);
  private readonly loadedUserId = signal<string | null>(null);

  constructor() {
    effect(() => {
      if (!this.auth.isReady()) {
        return;
      }

      const userId = this.auth.userId();

      if (!userId) {
        this.loadedUserId.set(null);
        this.store.hydrate([]);
        this.isLoading.set(false);
        return;
      }

      if (this.loadedUserId() === userId) {
        return;
      }

      this.loadedUserId.set(userId);
      this.loadAvailability();
    });
  }

  protected onDateSelected(date: string | null): void {
    if (!this.changeSelectedDate(date)) {
      return;
    }

    if (date) {
      this.scheduleEditorScroll();
    }
  }

  protected addRange(): void {
    if (!this.selectedDate()) {
      return;
    }

    const range = createDefaultGmAvailabilityRange(
      mapGmAvailabilityRangeFormGroupsToRanges(this.rangeGroups()),
    );

    if (!range) {
      this.handleMutationError('no_space');
      return;
    }

    this.ranges.push(createGmAvailabilityRangeFormGroup(range));
    this.editorForm.markAsDirty();
    this.refreshEditorUi();
  }

  protected removeRange(index: number): void {
    if (index < 0 || index >= this.ranges.length) {
      return;
    }

    this.ranges.removeAt(index);
    this.editorForm.markAsDirty();
    this.refreshEditorUi();
  }

  protected clearSelectedDate(): void {
    const selectedDate = this.selectedDate();

    if (!selectedDate) {
      return;
    }

    this.openEditor(selectedDate, createGmAvailabilityEditorRanges([]));
  }

  protected getEndHourOptions(
    rangeGroup: GmAvailabilityRangeFormGroup,
  ): IGmAvailabilityHourOption[] {
    return createGmAvailabilityEndHourOptions(
      Number(rangeGroup.controls.startOffset.getRawValue()),
    );
  }

  protected syncRangeEndOffset(rangeGroup: GmAvailabilityRangeFormGroup): void {
    const minEndOffset = normalizeGmAvailabilityEndOffset(
      Number(rangeGroup.controls.startOffset.getRawValue()),
    );

    if (Number(rangeGroup.controls.endOffset.getRawValue()) < minEndOffset) {
      rangeGroup.controls.endOffset.setValue(minEndOffset);
    }
  }

  protected confirmSelectedDate(): void {
    this.handleMutationError(this.commitEditor(true));
  }

  protected saveAvailability(): void {
    const userId = this.auth.userId();

    if (!userId) {
      return;
    }

    const confirmError = this.commitEditor(true);

    if (confirmError) {
      this.handleMutationError(confirmError);
      return;
    }

    this.isSaving.set(true);
    this.gmAvailability
      .replaceMyAvailability(
        this.store.toRecords(userId),
        this.rangeStartIso,
        this.rangeEndExclusiveIso,
      )
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (records) => {
          this.store.hydrate(records);
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

  private loadAvailability(): void {
    this.isLoading.set(true);
    this.gmAvailability
      .getMyAvailability(this.rangeStartIso, this.rangeEndExclusiveIso)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (records) => this.store.hydrate(records),
        error: () => {
          this.toast.danger({
            summary: this.i18n.toast().loadFailedSummary,
            detail: this.i18n.toast().loadFailedDetail,
          });
        },
      });
  }

  private handleMutationError(error: GmAvailabilityMutationError | null): void {
    if (!error) {
      return;
    }

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

  protected moveSelectedDate(direction: -1 | 1): void {
    const selectedDate = this.selectedDate();
    const baseDate = parseIsoDate(selectedDate);

    if (!baseDate) {
      return;
    }

    const nextDate = addDays(baseDate, direction);
    const minDate = parseIsoDate(this.minDate);
    const maxDate = parseIsoDate(this.maxDate);

    if (
      (minDate && compareDatesByDay(nextDate, minDate) < 0) ||
      (maxDate && compareDatesByDay(nextDate, maxDate) > 0)
    ) {
      return;
    }

    if (this.changeSelectedDate(toIsoDate(nextDate))) {
      this.scheduleEditorScroll();
    }
  }

  protected canMoveSelectedDate(direction: -1 | 1): boolean {
    const selectedDate = this.selectedDate();
    const baseDate = parseIsoDate(selectedDate);
    const minDate = parseIsoDate(this.minDate);
    const maxDate = parseIsoDate(this.maxDate);

    if (!baseDate || !minDate || !maxDate) {
      return false;
    }

    const nextDate = addDays(baseDate, direction);

    return (
      compareDatesByDay(nextDate, minDate) >= 0 &&
      compareDatesByDay(nextDate, maxDate) <= 0
    );
  }

  protected trackRange(
    index: number,
    rangeGroup: GmAvailabilityRangeFormGroup,
  ): string {
    return rangeGroup.controls.id.getRawValue() || String(index);
  }

  private changeSelectedDate(date: string | null): boolean {
    const currentDate = this.selectedDate();

    if (currentDate && date && currentDate !== date && this.editorForm.dirty) {
      const error = this.commitEditor();

      if (error) {
        this.handleMutationError(error);
        return false;
      }
    }

    this.store.setSelectedDate(date);

    if (!date) {
      this.resetEditor();
      return true;
    }

    this.openEditor(
      date,
      createGmAvailabilityEditorRanges(this.store.getDay(date)?.ranges ?? []),
    );

    return true;
  }

  private commitEditor(force: boolean = false): GmAvailabilityMutationError | null {
    const selectedDate = this.selectedDate();

    if (!selectedDate || (!force && !this.editorForm.dirty)) {
      return null;
    }

    const ranges = mapGmAvailabilityRangeFormGroupsToRanges(this.rangeGroups());
    const error = getGmAvailabilityMutationError(
      this.store.days(),
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
    this.rangeGroups.set(
      replaceGmAvailabilityRangeFormGroups(this.ranges, ranges),
    );
    this.editorForm.markAsPristine();
    this.editorForm.markAsUntouched();
    this.store.setSelectedDate(date);
  }

  private resetEditor(): void {
    this.rangeGroups.set(replaceGmAvailabilityRangeFormGroups(this.ranges, []));
    this.editorForm.markAsPristine();
    this.editorForm.markAsUntouched();
  }

  private refreshEditorUi(): void {
    this.rangeGroups.set([...this.ranges.controls]);
  }

  private scheduleEditorScroll(): void {
    scrollElementIntoViewWhenReady(() => this.editorPanel()?.nativeElement);
  }
}
