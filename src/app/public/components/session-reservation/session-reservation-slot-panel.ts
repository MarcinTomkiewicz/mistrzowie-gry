import { Component, computed, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';

import { SESSION_RESERVATION_CONFIG } from '../../../core/configs/session-reservation.config';
import { ISessionReservationAvailableSlot } from '../../../core/interfaces/i-session-reservation-availability';
import { ISessionReservationFlowState } from '../../../core/interfaces/i-session-reservation-flow';
import { ISessionReservationViewModel } from '../../../core/interfaces/i-session-reservation-view-model';
import { ISelectOption } from '../../../core/interfaces/i-select-option';
import { IUniversalCalendarDay } from '../../../core/interfaces/i-universal-calendar';
import { getEndOfNextMonthIso, getStartOfCurrentMonthIso, toLocalDateTime } from '../../../core/utils/date';
import { createHourOffsetOptions, createLocalDateTimeRangeIso, formatHourOffsetLabel, getHourOffsetDuration, getHourOffsetFromDateTime } from '../../../core/utils/time';
import { UniversalCalendar } from '../../common/universal-calendar/universal-calendar';

@Component({
  selector: 'app-session-reservation-slot-panel',
  standalone: true,
  imports: [
    ButtonModule,
    MessageModule,
    ReactiveFormsModule,
    SelectModule,
    UniversalCalendar,
  ],
  templateUrl: './session-reservation-slot-panel.html',
})
export class SessionReservationSlotPanel {
  readonly data = input.required<ISessionReservationViewModel>();
  readonly state = input.required<ISessionReservationFlowState>();

  readonly slotsRefresh = output<void>();
  readonly slotSelected = output<ISessionReservationAvailableSlot>();
  readonly dateSelected = output<string | null>();

  readonly selectedDate = signal<string | null>(null);
  readonly startOffsetControl = new FormControl<number | null>(null);
  readonly endOffsetControl = new FormControl<number | null>(null);

  readonly calendarMinDate = getStartOfCurrentMonthIso();
  readonly calendarMaxDate = getEndOfNextMonthIso();

  readonly slotOptions = computed(() =>
    this.data().availableSlots.flatMap((slot) => {
      const startOffset = getHourOffsetFromDateTime(
        toLocalDateTime(slot.date, 0).getTime(),
        slot.startsAt,
      );

      return Number.isInteger(startOffset) && startOffset >= 0 && startOffset < 24
        ? [{ slot, startOffset }]
        : [];
    }),
  );

  readonly calendarDays = computed<IUniversalCalendarDay[]>(() =>
    [...this.slotOptions().reduce((hoursByDate, { slot, startOffset }) => {
      const hours = hoursByDate.get(slot.date) ?? Array(24).fill(false);

      for (
        let hour = startOffset;
        hour < startOffset + slot.durationHours && hour < 24;
        hour += 1
      ) {
        hours[hour] = true;
      }

      return hoursByDate.set(slot.date, hours);
    }, new Map<string, boolean[]>())]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, hours]) => ({ date, hours })),
  );

  readonly startHourOptions = computed<ISelectOption<number>[]>(() => {
    const selectedDate = this.selectedDate();

    return this.slotOptions()
      .filter(({ slot }) => slot.date === selectedDate)
      .sort((left, right) =>
        left.slot.startsAt.localeCompare(right.slot.startsAt),
      )
      .map(({ slot, startOffset }) => ({
        value: startOffset,
        label: formatHourOffsetLabel(startOffset),
      }));
  });

  endOffsetOptions(): ISelectOption<number>[] {
    const startOffset = this.startOffsetControl.value;
    const activeHours = this.calendarDays().find(
      ({ date }) => date === this.selectedDate(),
    )?.hours;

    if (startOffset === null || !activeHours?.[startOffset]) {
      return [];
    }

    const firstInactiveOffset = activeHours.findIndex(
      (isActive, index) => index > startOffset && !isActive,
    );
    const maxEndOffset =
      firstInactiveOffset === -1 ? activeHours.length : firstInactiveOffset;

    return createHourOffsetOptions(
      startOffset + SESSION_RESERVATION_CONFIG.defaultDurationHours,
      maxEndOffset + 1,
    );
  }

  isLongerThanBaseDuration(): boolean {
    const startOffset = this.startOffsetControl.value;
    const endOffset = this.endOffsetControl.value;

    return (
      startOffset !== null &&
      endOffset !== null &&
      getHourOffsetDuration(startOffset, endOffset) >
        SESSION_RESERVATION_CONFIG.defaultDurationHours
    );
  }

  onDateSelected(date: string | null): void {
    if (date !== this.selectedDate()) {
      this.startOffsetControl.setValue(null);
      this.endOffsetControl.setValue(null);
      this.dateSelected.emit(date);
    }

    this.selectedDate.set(date);
  }

  onStartOffsetChange(startOffset: number | null): void {
    this.startOffsetControl.setValue(startOffset);
    const endOffsetOptions = this.endOffsetOptions().map(({ value }) => value);
    const defaultEndOffset =
      startOffset === null
        ? null
        : startOffset + SESSION_RESERVATION_CONFIG.defaultDurationHours;

    this.endOffsetControl.setValue(
      defaultEndOffset !== null && endOffsetOptions.includes(defaultEndOffset)
        ? defaultEndOffset
        : (endOffsetOptions[0] ?? null),
    );
    this.emitSelectedSlotIfValid();
  }

  emitSelectedSlotIfValid(): void {
    const selectedDate = this.selectedDate();
    const startOffset = this.startOffsetControl.value;
    const endOffset = this.endOffsetControl.value;
    const slot = this.slotOptions().find(
      (option) =>
        option.slot.date === selectedDate && option.startOffset === startOffset,
    )?.slot;

    if (
      !selectedDate ||
      startOffset === null ||
      endOffset === null ||
      !slot ||
      !this.endOffsetOptions().some(({ value }) => value === endOffset)
    ) {
      return;
    }

    const durationHours = getHourOffsetDuration(startOffset, endOffset);

    this.slotSelected.emit({
      ...slot,
      ...createLocalDateTimeRangeIso(selectedDate, slot.startTime, durationHours),
      durationHours,
    });
  }
}
