import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { provideTranslocoScope } from '@jsverse/transloco';
import { SelectModule } from 'primeng/select';

import {
  IGmAvailabilityDay,
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
} from '../../../core/domain/gm-availability/mapping';
import { formatHourOffsetRangeLabel } from '../../../core/utils/hour-offset';
import { getUserDisplayName } from '../../../core/utils/user-display';
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

  protected readonly i18n = createGmAvailabilityOverviewI18n();
  protected readonly isLoading = signal(true);
  protected readonly selectedDate = signal<string | null>(null);
  protected readonly selectedGmControl = new FormControl<string | null>(null);
  private readonly selectedGmId = toSignal(
    this.selectedGmControl.valueChanges,
    { initialValue: this.selectedGmControl.value },
  );
  private readonly gmUsers = signal<readonly IUser[]>([]);
  private readonly availabilityRecords = signal<readonly IGmAvailabilitySlotRecord[]>([]);

  protected readonly minDate = getStartOfCurrentMonthIso();
  protected readonly maxDate = getEndOfNextMonthIso();
  private readonly rangeStartIso = toLocalDayStartIso(this.minDate);
  private readonly rangeEndExclusiveIso = toLocalDayStartIso(
    toIsoDate(addDays(parseIsoDate(this.maxDate)!, 1)),
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

  private readonly filteredRecords = computed(() =>
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
    this.selectedDate.set(date);
  }
}
