import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';

import { DEFAULT_TIMEZONE } from '../../../core/configs/time.config';
import {
  IGmAvailabilityDay,
  IGmAvailabilityOverviewRecord,
  IGmAvailabilityOverviewUser,
} from '../../../core/interfaces/i-gm-availability';
import { ISelectOption } from '../../../core/interfaces/i-select-option';
import { Auth } from '../../../core/services/auth/auth';
import { GmAvailability } from '../../../core/services/gm-availability/gm-availability';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import {
  addDays,
  formatDateLabel,
  getEndOfNextMonthIso,
  getStartOfCurrentMonthIso,
  parseIsoDate,
} from '../../../core/utils/date';
import {
  mapGmAvailabilityOverviewToCalendarDays,
  mapGmAvailabilityRecordsToCoveredDays,
} from '../../../core/domain/gm-availability/mapping';
import { formatHourOffsetRangeLabel } from '../../../core/utils/hour-offset';
import { getUserDisplayName } from '../../../core/utils/user-display';
import {
  timestampToTimeZoneDate,
  timeZoneDateToTimestamp,
} from '../../../core/utils/time-zone';
import { LoadingOverlay } from '../../../common/loading-overlay/loading-overlay';
import { UniversalCalendar } from '../../../common/universal-calendar/universal-calendar';
import {
  createGmAvailabilityOverviewI18n,
  GM_AVAILABILITY_OVERVIEW_SCOPE,
} from './gm-availability-overview.i18n';

@Component({
  selector: 'app-gm-availability-overview',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    SelectModule,
    UniversalCalendar,
    LoadingOverlay,
  ],
  templateUrl: './gm-availability-overview.html',
  providers: [
    provideTranslocoScope(GM_AVAILABILITY_OVERVIEW_SCOPE, 'common'),
  ],
})
export class GmAvailabilityOverview {
  private readonly auth = inject(Auth);
  private readonly gmAvailability = inject(GmAvailability);
  private readonly toast = inject(UiToast);
  private readonly reloadVersion = signal(0);

  protected readonly i18n = createGmAvailabilityOverviewI18n();
  protected readonly isLoading = signal(true);
  protected readonly loadFailed = signal(false);
  protected readonly selectedDate = signal<string | null>(null);
  protected readonly visibleDates = signal<readonly string[]>([]);
  protected readonly selectedGmControl = new FormControl<string | null>(null);
  private readonly selectedGmId = toSignal(
    this.selectedGmControl.valueChanges,
    { initialValue: this.selectedGmControl.value },
  );
  private readonly gmUsers = signal<readonly IGmAvailabilityOverviewUser[]>([]);
  private readonly availabilityRecords = signal<readonly IGmAvailabilityOverviewRecord[]>([]);

  private readonly currentDate = timestampToTimeZoneDate(
    new Date().toISOString(),
    DEFAULT_TIMEZONE,
  )!;
  protected readonly minDate = getStartOfCurrentMonthIso(this.currentDate);
  protected readonly maxDate = getEndOfNextMonthIso(this.currentDate);
  private readonly rangeStartIso = timeZoneDateToTimestamp(
    parseIsoDate(this.minDate),
    DEFAULT_TIMEZONE,
  )!;
  private readonly rangeEndExclusiveIso = timeZoneDateToTimestamp(
    addDays(parseIsoDate(this.maxDate)!, 1),
    DEFAULT_TIMEZONE,
  )!;
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

  private readonly filteredDaysByGmId = computed(() => {
    const selectedGmId = this.selectedGmId();

    return new Map(
      [...this.allDaysByGmId()].filter(
        ([gmProfileId]) => !selectedGmId || gmProfileId === selectedGmId,
      ),
    );
  });

  protected readonly calendarDays = computed(() =>
    mapGmAvailabilityOverviewToCalendarDays(
      this.filteredDaysByGmId(),
      this.visibleDates(),
    ),
  );

  protected readonly selectedDayEntries = computed(() => {
    const selectedDate = this.selectedDate();

    if (!selectedDate) {
      return [];
    }

    return [...this.filteredDaysByGmId().entries()]
      .map(([gmProfileId, days]) => {
        const day = days.find((entry) => entry.date === selectedDate);

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
    effect((onCleanup) => {
      if (!this.auth.isReady()) {
        return;
      }

      const userId = this.auth.userId();
      this.reloadVersion();
      this.loadFailed.set(false);
      this.gmUsers.set([]);
      this.availabilityRecords.set([]);
      this.selectedDate.set(null);
      this.selectedGmControl.setValue(null);

      if (!userId) {
        this.isLoading.set(false);
        return;
      }

      this.isLoading.set(true);
      const subscription = this.gmAvailability
        .getAvailabilityOverview(
          this.rangeStartIso,
          this.rangeEndExclusiveIso,
        )
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: ({ gmUsers, records }) => {
            this.gmUsers.set(gmUsers);
            this.availabilityRecords.set(records);
          },
          error: () => {
            this.loadFailed.set(true);
            this.toast.danger({
              summary: this.i18n.toast().loadFailedSummary,
              detail: this.i18n.toast().loadFailedDetail,
            });
          },
        });

      onCleanup(() => subscription.unsubscribe());
    });
  }

  protected retry(): void {
    this.reloadVersion.update((version) => version + 1);
  }

  protected onDateSelected(date: string | null): void {
    this.selectedDate.set(date);
  }
}
