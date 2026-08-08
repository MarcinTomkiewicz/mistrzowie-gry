import { Component, computed, input } from '@angular/core';

import type {
  CommercialCapacity,
  CommercialSchedule,
} from '../../../core/types/commercial-page';
import { createCommercialPageI18n } from './commercial-page.i18n';

type CommercialItemDetail = {
  label: string;
  value: string;
};

@Component({
  selector: 'app-commercial-item-details',
  templateUrl: './commercial-item-details.html',
})
export class CommercialItemDetails {
  readonly capacity = input<CommercialCapacity | null>(null);
  readonly schedule = input<CommercialSchedule | null>(null);

  private readonly i18n = createCommercialPageI18n();

  protected readonly details = computed<CommercialItemDetail[]>(() => {
    const labels = this.i18n.itemDetails();
    const capacity = this.capacity();
    const schedule = this.schedule();
    const details: CommercialItemDetail[] = [];

    this.addRange(
      details,
      labels.participants,
      capacity?.participantsMin,
      capacity?.participantsMax,
      labels.from,
      labels.to,
    );
    this.addValue(
      details,
      labels.participantsPerFacilitator,
      capacity?.participantsPerFacilitatorMax,
    );
    this.addValue(details, labels.facilitators, capacity?.facilitatorCount);
    this.addValue(details, labels.tables, capacity?.tableCount);
    this.addValue(details, labels.durationMinutes, schedule?.durationMinutes);
    this.addValue(details, labels.sessions, schedule?.sessionCount);
    this.addValue(
      details,
      labels.sessionsPerMonth,
      schedule?.sessionsPerMonth,
    );
    this.addRange(
      details,
      labels.meetings,
      schedule?.meetingCountMin,
      schedule?.meetingCountMax,
      labels.from,
      labels.to,
    );

    return details;
  });

  private addValue(
    details: CommercialItemDetail[],
    label: string,
    value: number | null | undefined,
  ): void {
    if (value !== null && value !== undefined) {
      details.push({ label, value: String(value) });
    }
  }

  private addRange(
    details: CommercialItemDetail[],
    label: string,
    min: number | null | undefined,
    max: number | null | undefined,
    from: string,
    to: string,
  ): void {
    if (min === null || min === undefined) {
      if (max !== null && max !== undefined) {
        details.push({ label, value: `${to} ${max}` });
      }
      return;
    }

    details.push({
      label,
      value:
        max === null || max === undefined
          ? `${from} ${min}`
          : max === min
            ? String(min)
            : `${min}–${max}`,
    });
  }
}
