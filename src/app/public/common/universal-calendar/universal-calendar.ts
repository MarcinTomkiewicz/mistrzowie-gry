import { CommonModule } from '@angular/common';
import { Component, computed, effect, input, output, signal, viewChild } from '@angular/core';

import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { Popover, PopoverModule } from 'primeng/popover';
import { TooltipModule } from 'primeng/tooltip';

import {
  IUniversalCalendarDay,
  IUniversalCalendarDayVm,
  IUniversalCalendarHourVm,
} from '../../../core/interfaces/i-universal-calendar';
import { createCommonActionsI18n } from '../../../core/translations/common.i18n';
import { UniversalCalendarMode } from '../../../core/types/universal-calendar';
import {
  addMonths,
  buildMonthDays,
  clampDate,
  compareDatesByDay,
  formatDateLabel,
  formatMonthLabel,
  getEndOfNextMonthIso,
  getStartOfCurrentMonthIso,
  getTodayIso,
  getWeekdayLabels,
  isSameMonth,
  parseIsoDate,
  startOfMonth,
  toIsoDate,
  toIsoDates,
} from '../../../core/utils/date';

const DEFAULT_LOCALE = 'pl-PL';
const DEFAULT_WEEK_STARTS_ON = 1;
const DEFAULT_SLOT_COUNT = 24;
const DEFAULT_SLOT_START_HOUR = 0;
const EMPTY_HOURS: readonly boolean[] = [];

@Component({
  selector: 'app-universal-calendar',
  standalone: true,
  imports: [CommonModule, ButtonModule, PopoverModule, TooltipModule],
  templateUrl: './universal-calendar.html',
  styleUrl: './universal-calendar.scss',
  providers: [provideTranslocoScope('common')],
})
export class UniversalCalendar {
  readonly days = input<readonly IUniversalCalendarDay[]>([]);
  readonly selectedDate = input<string | null>(null);
  readonly mode = input<UniversalCalendarMode>('readonly');
  readonly disabled = input<boolean>(false);
  readonly minDate = input<string>(getStartOfCurrentMonthIso());
  readonly maxDate = input<string>(getEndOfNextMonthIso());

  readonly dateSelected = output<string | null>();
  readonly visibleDatesChange = output<string[]>();

  readonly commonActions = createCommonActionsI18n();
  readonly dayDetailsPopover = viewChild<Popover>('dayDetailsPopover');

  readonly currentMonth = signal(startOfMonth(new Date()));
  readonly activeDayDetails = signal<IUniversalCalendarDayVm | null>(null);
  private pendingDayDetails:
    | { day: IUniversalCalendarDayVm; target: HTMLElement }
    | null = null;

  readonly dayMap = computed(() => {
    const map = new Map<string, IUniversalCalendarDay>();

    for (const day of this.days()) {
      map.set(day.date, day);
    }

    return map;
  });

  readonly minDay = computed(
    () => parseIsoDate(this.minDate()) ?? startOfMonth(new Date()),
  );

  readonly maxDay = computed(() => {
    const fallback = parseIsoDate(getEndOfNextMonthIso()) ?? new Date();
    const parsed = parseIsoDate(this.maxDate()) ?? fallback;

    return compareDatesByDay(parsed, this.minDay()) < 0 ? this.minDay() : parsed;
  });

  readonly minMonth = computed(() => startOfMonth(this.minDay()));
  readonly maxMonth = computed(() => startOfMonth(this.maxDay()));

  readonly monthLabel = computed(() =>
    formatMonthLabel(this.currentMonth(), DEFAULT_LOCALE),
  );

  readonly weekdayLabels = computed(() =>
    getWeekdayLabels(DEFAULT_LOCALE, DEFAULT_WEEK_STARTS_ON),
  );

  readonly visibleDates = computed(() =>
    buildMonthDays(this.currentMonth(), DEFAULT_WEEK_STARTS_ON),
  );

  readonly canGoPrev = computed(
    () =>
      compareDatesByDay(addMonths(this.currentMonth(), -1), this.minMonth()) >= 0,
  );

  readonly canGoNext = computed(
    () =>
      compareDatesByDay(addMonths(this.currentMonth(), 1), this.maxMonth()) <= 0,
  );

  readonly calendarDays = computed(() =>
    this.visibleDates().map((date) => this.createCalendarDay(date)),
  );

  constructor() {
    effect(() => {
      const selectedDate = parseIsoDate(this.selectedDate());

      if (!selectedDate) {
        return;
      }

      this.currentMonth.set(
        clampDate(startOfMonth(selectedDate), this.minMonth(), this.maxMonth()),
      );
    });

    effect(() => {
      this.visibleDatesChange.emit(toIsoDates(this.visibleDates()));
    });
  }

  previousMonth(): void {
    if (!this.canGoPrev()) {
      return;
    }

    this.currentMonth.set(addMonths(this.currentMonth(), -1));
  }

  nextMonth(): void {
    if (!this.canGoNext()) {
      return;
    }

    this.currentMonth.set(addMonths(this.currentMonth(), 1));
  }

  handleDayClick(event: Event, day: IUniversalCalendarDayVm): void {
    if (!day.canInspect) {
      return;
    }

    if (day.canSelect) {
      this.dateSelected.emit(this.selectedDate() === day.iso ? null : day.iso);
    }

    if (this.isCompactDayDetailsViewport()) {
      const popover = this.dayDetailsPopover();
      const target = event.currentTarget;

      if (!(target instanceof HTMLElement) || !popover) {
        return;
      }

      if (popover.overlayVisible) {
        if (popover.target === target) {
          this.pendingDayDetails = null;
          popover.hide();

          return;
        }

        this.pendingDayDetails = { day, target };
        popover.hide();

        return;
      }

      this.showDayDetails(day, target);
    }
  }

  handleDayDetailsHide(): void {
    const pendingDayDetails = this.pendingDayDetails;
    this.pendingDayDetails = null;

    if (pendingDayDetails) {
      this.showDayDetails(pendingDayDetails.day, pendingDayDetails.target);

      return;
    }

    this.activeDayDetails.set(null);
  }

  onDayKeydown(event: KeyboardEvent, day: IUniversalCalendarDayVm): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    this.handleDayClick(event, day);
  }

  private createCalendarDay(date: Date): IUniversalCalendarDayVm {
    const iso = toIsoDate(date);
    const sourceDay = this.dayMap().get(iso);
    const isCurrentMonth = isSameMonth(date, this.currentMonth());
    const isBaseDisabled =
      this.disabled() ||
      !isCurrentMonth ||
      this.isPastDay(date) ||
      this.isOutOfRange(date);
    const hours = this.createHours(sourceDay?.hours ?? EMPTY_HOURS);
    const isUnavailable =
      !!sourceDay?.isBlocked || !hours.some((hour) => hour.isActive);
    const isDisabled =
      isBaseDisabled || (this.mode() === 'reservation' && isUnavailable);
    const canInspect = isCurrentMonth;
    const showDetailsHint = canInspect && !this.isOutOfRange(date) && !this.isPastDay(date);
    const canSelect = !isDisabled;

    return {
      iso,
      label: formatDateLabel(iso, DEFAULT_LOCALE, true),
      dayNumber: date.getDate(),
      hours,
      isCurrentMonth,
      isDisabled,
      isSelected: this.selectedDate() === iso,
      canInspect,
      showDetailsHint,
      canSelect,
    };
  }

  private createHours(
    sourceHours: readonly boolean[] | null | undefined,
  ): readonly IUniversalCalendarHourVm[] {
    const totalSlots = Math.max(DEFAULT_SLOT_COUNT, sourceHours?.length ?? 0);

    return Array.from({ length: totalSlots }, (_, index) => {
      const isActive = !!sourceHours?.[index];
      const hour = DEFAULT_SLOT_START_HOUR + index;

      return {
        index,
        isActive,
        label: `${this.formatHour(hour)} - ${this.formatHour(hour + 1)}`,
      };
    });
  }

  private formatHour(hour: number): string {
    return `${String(hour).padStart(2, '0')}:00`;
  }

  private showDayDetails(day: IUniversalCalendarDayVm, target: HTMLElement): void {
    this.activeDayDetails.set(day);
    queueMicrotask(() => this.dayDetailsPopover()?.show(null, target));
  }

  private isCompactDayDetailsViewport(): boolean {
    return (
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 767px)').matches
    );
  }

  private isPastDay(date: Date): boolean {
    const today = parseIsoDate(getTodayIso()) ?? new Date();

    return compareDatesByDay(date, today) < 0;
  }

  private isOutOfRange(date: Date): boolean {
    return (
      compareDatesByDay(date, this.minDay()) < 0 ||
      compareDatesByDay(date, this.maxDay()) > 0
    );
  }
}
