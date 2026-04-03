import { Component, signal } from '@angular/core';

import { UniversalCalendar } from '../../common/universal-calendar/universal-calendar';
import { IUniversalCalendarDay } from '../../../core/interfaces/i-universal-calendar';

function createAvailabilityDays(): IUniversalCalendarDay[] {
  return [
    {
      date: '2026-04-06',
      hours: [true, true, false, false, true, false],
    },
    {
      date: '2026-04-07',
      hours: [false, false, false, false, false, false],
    },
    {
      date: '2026-04-08',
      hours: [true, true, true, true, false, false],
    },
    {
      date: '2026-04-09',
      hours: [false, true, false, true, false, true],
    },
    {
      date: '2026-04-10',
      hours: [true, false, true, false, true, false],
    },
    {
      date: '2026-04-11',
      hours: [true, true, true, false, false, false],
    },
  ];
}

function createReservationDays(): IUniversalCalendarDay[] {
  return [
    {
      date: '2026-04-13',
      hours: [true, true, false, false, false, false],
    },
    {
      date: '2026-04-14',
      hours: [true, true, true, true, true, true],
    },
    {
      date: '2026-04-15',
      hours: [false, false, false, false, false, false],
    },
    {
      date: '2026-04-16',
      isBlocked: true,
      hours: [true, true, true, true, true, true],
    },
    {
      date: '2026-04-17',
      hours: [false, true, true, false, false, true],
    },
  ];
}

@Component({
  selector: 'app-universal-calendar-preview',
  standalone: true,
  imports: [UniversalCalendar],
  templateUrl: './universal-calendar-preview.html',
})
export class UniversalCalendarPreview {
  readonly availabilitySelectedDate = signal<string | null>('2026-04-08');
  readonly reservationSelectedDate = signal<string | null>('2026-04-15');

  readonly availabilityDays = createAvailabilityDays();
  readonly reservationDays = createReservationDays();

  onAvailabilityDateSelected(date: string | null): void {
    this.availabilitySelectedDate.set(date);
  }

  onReservationDateSelected(date: string | null): void {
    this.reservationSelectedDate.set(date);
  }
}
