import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { finalize } from 'rxjs';

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
import { Auth } from '../../../core/services/auth/auth';
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
  private readonly destroyRef = inject(DestroyRef);
  private readonly platform = inject(Platform);
  private readonly toast = inject(UiToast);
  private readonly workLog = inject(WorkLog);

  protected readonly i18n = createWorkLogOverviewI18n();
  protected readonly isLoading = signal(true);
  protected readonly isCompactView = signal(false);
  protected readonly monthOffset = signal<WorkLogMonthOffset>(0);

  private readonly users = signal<readonly IUserWorkLogOverviewVm['user'][]>([]);
  private readonly records = signal<readonly IUserWorkLogRecord[]>([]);
  private readonly loadedKey = signal<string | null>(null);

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
        getUserDisplayName(left.user).localeCompare(
          getUserDisplayName(right.user),
          'pl',
        ),
      ),
  );
  protected readonly exportRows = computed<IUserWorkLogExportRow[]>(() =>
    this.overview().map((item) => ({
      userId: item.user.id,
      firstName: item.user.firstName?.trim() || '',
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
  protected readonly displayName = getUserDisplayName;

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
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ users, records }) => {
          this.users.set(users);
          this.records.set(records);
        },
        error: () => {
          this.users.set([]);
          this.records.set([]);
          this.toast.danger({
            summary: this.i18n.toast().loadFailedSummary,
            detail: this.i18n.toast().loadFailedDetail,
          });
        },
      });
  }
}
