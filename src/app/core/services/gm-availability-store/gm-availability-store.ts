import { computed, Injectable, signal } from '@angular/core';

import {
  IGmAvailabilityDay,
  IGmAvailabilitySlotRecord,
} from '../../interfaces/i-gm-availability';
import {
  mapGmAvailabilityDaysToCalendarDays,
  mapGmAvailabilityDaysToRecords,
  mapGmAvailabilityRecordsToDays,
  upsertGmAvailabilityDay,
} from '../../utils/gm-availability/gm-availability.util';

@Injectable({ providedIn: 'root' })
export class GmAvailabilityStore {
  private readonly initialDays = signal<readonly IGmAvailabilityDay[]>([]);
  private readonly draftDays = signal<readonly IGmAvailabilityDay[]>([]);

  readonly selectedDate = signal<string | null>(null);

  readonly days = computed(() => this.draftDays());
  readonly calendarDays = computed(() =>
    mapGmAvailabilityDaysToCalendarDays(this.draftDays()),
  );
  readonly hasChanges = computed(
    () =>
      JSON.stringify(this.initialDays()) !== JSON.stringify(this.draftDays()),
  );

  hydrate(records: readonly IGmAvailabilitySlotRecord[]): void {
    const days = mapGmAvailabilityRecordsToDays(records);

    this.initialDays.set(days);
    this.draftDays.set(days);
    this.selectedDate.set(null);
  }

  setSelectedDate(date: string | null): void {
    this.selectedDate.set(date);
  }

  toRecords(gmProfileId: string): IGmAvailabilitySlotRecord[] {
    return mapGmAvailabilityDaysToRecords(this.draftDays(), gmProfileId);
  }

  getDay(date: string): IGmAvailabilityDay | null {
    return this.draftDays().find((day) => day.date === date) ?? null;
  }

  saveDay(day: IGmAvailabilityDay): void {
    this.draftDays.set(
      upsertGmAvailabilityDay(this.draftDays(), day.date, day.ranges),
    );
  }

  clearDay(date: string): void {
    this.draftDays.set(upsertGmAvailabilityDay(this.draftDays(), date, []));
  }
}
