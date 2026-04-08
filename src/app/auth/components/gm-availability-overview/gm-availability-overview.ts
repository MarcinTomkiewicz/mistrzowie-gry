import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { provideTranslocoScope } from '@jsverse/transloco';
import { SelectModule } from 'primeng/select';

import {
  IGmAvailabilityDay,
  IGmAvailabilityRange,
  IGmAvailabilitySlotRecord,
} from '../../../core/interfaces/i-gm-availability';
import { ISelectOption } from '../../../core/interfaces/i-select-option';
import { IUser } from '../../../core/interfaces/i-user';
import { Auth } from '../../../core/services/auth/auth';
import { GmAvailability } from '../../../core/services/gm-availability/gm-availability';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import {
  addDays,
  formatDateLabel,
  getEndOfNextMonthIso,
  getStartOfCurrentMonthIso,
  parseIsoDate,
  toIsoDate,
  toLocalDayStartIso,
} from '../../../core/utils/date';
import {
  mapGmAvailabilityDaysToCalendarDays,
  mapGmAvailabilityRecordsToCoveredDays,
} from '../../../core/utils/gm-availability/gm-availability.util';
import { formatHourOffsetRangeLabel } from '../../../core/utils/time';
import { getUserDisplayName } from '../../../core/utils/user-display';
import { LoadingOverlay } from '../../../public/common/loading-overlay/loading-overlay';
import { UniversalCalendar } from '../../../public/common/universal-calendar/universal-calendar';
import { createGmAvailabilityOverviewI18n } from './gm-availability-overview.i18n';

@Component({
  selector: 'app-gm-availability-overview',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SelectModule,
    UniversalCalendar,
    LoadingOverlay,
  ],
  templateUrl: './gm-availability-overview.html',
  providers: [provideTranslocoScope('auth', 'common')],
})
export class GmAvailabilityOverviewComponent {
  private readonly auth = inject(Auth);
  private readonly gmAvailability = inject(GmAvailability);
  private readonly toast = inject(UiToast);

  protected readonly i18n = createGmAvailabilityOverviewI18n();
  protected readonly isLoading = signal(true);
  protected readonly selectedDate = signal<string | null>(null);
  protected readonly selectedGmId = signal<string | null>(null);
  protected readonly gmUsers = signal<readonly IUser[]>([]);
  private readonly availabilityRecords = signal<readonly IGmAvailabilitySlotRecord[]>([]);
  private readonly loadedUserId = signal<string | null>(null);

  protected readonly minDate = getStartOfCurrentMonthIso();
  protected readonly maxDate = getEndOfNextMonthIso();
  private readonly rangeStartIso = toLocalDayStartIso(this.minDate);
  private readonly rangeEndExclusiveIso = toLocalDayStartIso(
    toIsoDate(addDays(parseIsoDate(this.maxDate) ?? new Date(), 1)),
  );
  protected readonly gmDisplayNameById = computed(
    () =>
      new Map(
        this.gmUsers().map((user) => [user.id, getUserDisplayName(user)] as const),
      ),
  );

  protected readonly gmOptions = computed<ISelectOption<string>[]>(() =>
    [...this.gmUsers()]
      .sort((left, right) =>
        getUserDisplayName(left).localeCompare(getUserDisplayName(right), 'pl'),
      )
      .map((user) => ({
        value: user.id,
        label: getUserDisplayName(user),
      })),
  );

  protected readonly filteredRecords = computed(() =>
    this.selectedGmId()
      ? this.availabilityRecords().filter(
          (record) => record.gmProfileId === this.selectedGmId(),
        )
      : this.availabilityRecords(),
  );

  private readonly allDaysByGmId = computed(() => {
    const daysByGmId = new Map<string, readonly IGmAvailabilityDay[]>();
    const gmProfileIds = [
      ...new Set(this.availabilityRecords().map((record) => record.gmProfileId)),
    ];

    for (const gmProfileId of gmProfileIds) {
      daysByGmId.set(
        gmProfileId,
        mapGmAvailabilityRecordsToCoveredDays(
          this.availabilityRecords().filter(
            (record) => record.gmProfileId === gmProfileId,
          ),
        ),
      );
    }

    return daysByGmId;
  });

  protected readonly calendarDays = computed(() =>
    mapGmAvailabilityDaysToCalendarDays(
      mapGmAvailabilityRecordsToCoveredDays(this.filteredRecords()),
    ),
  );

  protected readonly selectedDayEntries = computed(() => {
    const selectedDate = this.selectedDate();
    const selectedGmId = this.selectedGmId();

    if (!selectedDate) {
      return [];
    }

    return [...this.allDaysByGmId().entries()]
      .filter(([gmProfileId]) => !selectedGmId || gmProfileId === selectedGmId)
      .map(([gmProfileId, days]) => {
        const day = days
          ?.find((entry) => entry.date === selectedDate);

        return day
          ? ([gmProfileId, day] as const)
          : null;
      })
      .filter(
        (entry): entry is readonly [string, IGmAvailabilityDay] => !!entry,
      )
      .sort((left, right) =>
        (this.gmDisplayNameById().get(left[0]) || left[0]).localeCompare(
          this.gmDisplayNameById().get(right[0]) || right[0],
          'pl',
        ),
      );
  });

  protected readonly selectedUser = computed(
    () => this.gmUsers().find((user) => user.id === this.selectedGmId()) ?? null,
  );
  protected readonly selectedUserLabel = computed(() =>
    getUserDisplayName(this.selectedUser()),
  );

  protected readonly formatDateLabel = formatDateLabel;
  protected readonly formatHourOffsetRangeLabel = formatHourOffsetRangeLabel;

  constructor() {
    effect(() => {
      if (!this.auth.isReady()) {
        return;
      }

      const user = this.auth.user();
      const userId = user?.id ?? null;

      if (!userId) {
        this.loadedUserId.set(null);
        this.gmUsers.set([]);
        this.availabilityRecords.set([]);
        this.selectedDate.set(null);
        this.selectedGmId.set(null);
        this.isLoading.set(false);
        return;
      }

      if (this.loadedUserId() === userId) {
        return;
      }

      this.loadedUserId.set(userId);
      this.loadOverview();
    });
  }

  protected onDateSelected(date: string | null): void {
    this.selectedDate.set(date);
  }

  protected onGmSelected(gmProfileId: string | null | undefined): void {
    this.selectedGmId.set(gmProfileId || null);
  }

  private loadOverview(): void {
    this.isLoading.set(true);
    this.gmAvailability
      .getAvailabilityOverview(this.rangeStartIso, this.rangeEndExclusiveIso)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ gmUsers, records }) => {
          this.gmUsers.set(gmUsers);
          this.availabilityRecords.set(records);

          if (
            this.selectedGmId() &&
            !gmUsers.some((user) => user.id === this.selectedGmId())
          ) {
            this.selectedGmId.set(null);
          }
        },
        error: () => {
          this.toast.danger({
            summary: this.i18n.toast().loadFailedSummary,
            detail: this.i18n.toast().loadFailedDetail,
          });
        },
      });
  }
}
