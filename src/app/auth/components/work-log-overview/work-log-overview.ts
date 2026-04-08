import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { finalize, map, switchMap } from 'rxjs';

import { provideTranslocoScope } from '@jsverse/transloco';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

import { WorkLogExportComponent } from '../../common/work-log-export/work-log-export';
import {
  IUserWorkLogDay,
  IUserWorkLogExportRow,
  IUserWorkLogOverviewVm,
  IUserWorkLogRecord,
  WorkLogMonthOffset,
} from '../../../core/interfaces/i-work-log';
import { ICoworkerProfile } from '../../../core/interfaces/i-coworker-profile';
import { Auth } from '../../../core/services/auth/auth';
import { CoworkerProfile } from '../../../core/services/coworker-profile/coworker-profile';
import { Platform } from '../../../core/services/platform/platform';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import { WorkLog } from '../../../core/services/work-log/work-log';
import { formatDateLabel } from '../../../core/utils/date';
import { getUserDisplayName } from '../../../core/utils/user-display';
import {
  formatWorkLogHours,
  getWorkLogDayHours,
  getWorkLogMonthScope,
  getWorkLogTotalHours,
  mapWorkLogRecordsToDays,
} from '../../../core/utils/work-log/work-log.util';
import { formatHourOffsetRangeLabel } from '../../../core/utils/time';
import { LoadingOverlay } from '../../../public/common/loading-overlay/loading-overlay';
import { createWorkLogOverviewI18n } from './work-log-overview.i18n';

@Component({
  selector: 'app-work-log-overview',
  standalone: true,
  imports: [
    CommonModule,
    AccordionModule,
    ButtonModule,
    TableModule,
    LoadingOverlay,
    WorkLogExportComponent,
  ],
  templateUrl: './work-log-overview.html',
  providers: [provideTranslocoScope('auth', 'common')],
})
export class WorkLogOverviewComponent {
  private readonly auth = inject(Auth);
  private readonly coworkerProfile = inject(CoworkerProfile);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platform = inject(Platform);
  private readonly toast = inject(UiToast);
  private readonly workLog = inject(WorkLog);

  protected readonly i18n = createWorkLogOverviewI18n();
  protected readonly isLoading = signal(true);
  protected readonly isCompactView = signal(false);
  protected readonly monthOffset = signal<WorkLogMonthOffset>(0);

  private readonly users = signal<readonly IUserWorkLogOverviewVm['user'][]>([]);
  private readonly coworkerProfiles = signal<readonly ICoworkerProfile[]>([]);
  private readonly records = signal<readonly IUserWorkLogRecord[]>([]);
  private readonly loadedKey = signal<string | null>(null);
  private readonly coworkerProfileByUserId = computed(
    () =>
      new Map(
        this.coworkerProfiles().map((profile) => [profile.userId, profile] as const),
      ),
  );

  protected readonly monthScope = computed(() =>
    getWorkLogMonthScope(this.monthOffset()),
  );
  protected readonly overview = computed<IUserWorkLogOverviewVm[]>(() =>
    [...this.users()]
      .map((user) => {
        const days = mapWorkLogRecordsToDays(
          this.records().filter((record) => record.userId === user.id),
        );

        return {
          user,
          days,
          totalHours: getWorkLogTotalHours(days),
        };
      })
      .sort((left, right) =>
        this.getOverviewUserLabel(left.user).localeCompare(
          this.getOverviewUserLabel(right.user),
          'pl',
        ),
      ),
  );
  protected readonly exportRows = computed<IUserWorkLogExportRow[]>(() =>
    this.overview().map((item) => ({
      userId: item.user.id,
      firstName: this.getExportFirstName(item.user.id, item.user.firstName),
      lastName: this.getExportLastName(item.user.id),
      totalHours: item.totalHours,
      chaoticThursdayDatesLabel: item.days
        .filter((day) => day.isChaoticThursday)
        .map((day) => formatDateLabel(day.date, 'pl-PL'))
        .join(', '),
    })),
  );
  protected readonly totalHours = computed(() =>
    formatWorkLogHours(
      this.overview().reduce((sum, item) => sum + item.totalHours, 0),
    ),
  );
  protected readonly formatHours = formatWorkLogHours;
  protected readonly formatRangeLabel = formatHourOffsetRangeLabel;
  protected readonly formatDateLabel = formatDateLabel;

  constructor() {
    const syncViewport = () => {
      this.isCompactView.set(
        this.platform.matchMedia('(max-width: 767px)')?.matches ?? false,
      );
    };
    const disposeResize = this.platform.onWindow('resize', syncViewport);
    this.destroyRef.onDestroy(disposeResize);
    syncViewport();

    effect(() => {
      if (!this.auth.isReady()) {
        return;
      }

      const userId = this.auth.userId();
      const monthOffset = this.monthOffset();
      const loadKey = userId ? `${userId}-${monthOffset}` : null;

      if (!loadKey) {
        this.loadedKey.set(null);
        this.users.set([]);
        this.records.set([]);
        this.isLoading.set(false);
        return;
      }

      if (this.loadedKey() === loadKey) {
        return;
      }

      this.loadedKey.set(loadKey);
      this.loadOverview();
    });
  }

  protected switchMonth(monthOffset: WorkLogMonthOffset): void {
    if (this.monthOffset() === monthOffset) {
      return;
    }

    this.monthOffset.set(monthOffset);
  }

  protected createExportFileBaseName(): string {
    return `ewidencja-godzin-${this.monthScope().startDate}`;
  }

  protected getDayHours(day: Pick<IUserWorkLogDay, 'ranges'>): string {
    return formatWorkLogHours(getWorkLogDayHours(day));
  }

  private loadOverview(): void {
    this.isLoading.set(true);
    this.workLog
      .getOverview(this.monthOffset())
      .pipe(
        switchMap(({ users, records }) =>
          this.coworkerProfile
            .getProfilesByUserIds(users.map((user) => user.id))
            .pipe(
              map((coworkerProfiles) => ({
                users,
                records,
                coworkerProfiles,
              })),
            ),
        ),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: ({ users, records, coworkerProfiles }) => {
          this.users.set(users);
          this.records.set(records);
          this.coworkerProfiles.set(coworkerProfiles);
        },
        error: () => {
          this.users.set([]);
          this.records.set([]);
          this.coworkerProfiles.set([]);
          this.toast.danger({
            summary: this.i18n.toast().loadFailedSummary,
            detail: this.i18n.toast().loadFailedDetail,
          });
        },
      });
  }

  protected getOverviewUserLabel(user: IUserWorkLogOverviewVm['user']): string {
    const profile = this.coworkerProfileByUserId().get(user.id);
    const officialName = [profile?.firstName?.trim(), profile?.lastName?.trim()]
      .filter(Boolean)
      .join(' ');

    return officialName || getUserDisplayName(user);
  }

  private getExportFirstName(userId: string, fallbackFirstName: string | null): string {
    return (
      this.coworkerProfileByUserId().get(userId)?.firstName?.trim() ||
      fallbackFirstName?.trim() ||
      ''
    );
  }

  private getExportLastName(userId: string): string {
    return this.coworkerProfileByUserId().get(userId)?.lastName?.trim() || '';
  }
}
