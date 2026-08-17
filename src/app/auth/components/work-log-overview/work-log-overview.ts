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

import { WorkLogExport } from '../../common/work-log-export/work-log-export';
import {
  IUserWorkLogDay,
  IUserWorkLogExportRow,
  IUserWorkLogOverviewVm,
  IUserWorkLogRecord,
} from '../../../core/interfaces/i-work-log';
import { IPayrollIdentity } from '../../../core/interfaces/i-payroll-identity';
import { Auth } from '../../../core/services/auth/auth';
import { PayrollIdentity } from '../../../core/services/payroll-identity/payroll-identity';
import { Platform } from '../../../core/services/platform/platform';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import { WorkLog } from '../../../core/services/work-log/work-log';
import { WorkLogMonthOffset } from '../../../core/types/work-log';
import { formatWorkLogHours } from '../../../core/domain/work-log/display';
import { mapWorkLogRecordsToDays } from '../../../core/domain/work-log/mapping';
import {
  getWorkLogDayHours,
  getWorkLogMonthScope,
  getWorkLogTotalHours,
} from '../../../core/domain/work-log/rules';
import { formatDateLabel } from '../../../core/utils/date';
import { getUserDisplayName } from '../../../core/utils/user-display';
import { formatHourOffsetRangeLabel } from '../../../core/utils/hour-offset';
import { LoadingOverlay } from '../../../common/loading-overlay/loading-overlay';
import {
  createWorkLogOverviewI18n,
  WORK_LOG_OVERVIEW_SCOPE,
} from './work-log-overview.i18n';

@Component({
  selector: 'app-work-log-overview',
  standalone: true,
  imports: [
    AccordionModule,
    ButtonModule,
    TableModule,
    LoadingOverlay,
    WorkLogExport,
  ],
  templateUrl: './work-log-overview.html',
  providers: [provideTranslocoScope(WORK_LOG_OVERVIEW_SCOPE, 'common')],
})
export class WorkLogOverview {
  private readonly auth = inject(Auth);
  private readonly destroyRef = inject(DestroyRef);
  private readonly payrollIdentity = inject(PayrollIdentity);
  private readonly platform = inject(Platform);
  private readonly toast = inject(UiToast);
  private readonly workLog = inject(WorkLog);

  protected readonly i18n = createWorkLogOverviewI18n();
  protected readonly isLoading = signal(true);
  protected readonly loadFailed = signal(false);
  protected readonly isPayrollIdentityLoading = signal(true);
  protected readonly isCompactView = signal(false);
  protected readonly monthOffset = signal<WorkLogMonthOffset>(0);
  protected readonly isAdmin = computed(() => this.auth.hasRole('admin'));

  private readonly users = signal<readonly IUserWorkLogOverviewVm['user'][]>([]);
  private readonly payrollIdentities = signal<readonly IPayrollIdentity[]>([]);
  private readonly records = signal<readonly IUserWorkLogRecord[]>([]);
  private readonly payrollIdentityByUserId = computed(
    () =>
      new Map(
        this.payrollIdentities().map(
          (identity) => [identity.userId, identity] as const,
        ),
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
        getUserDisplayName(left.user).localeCompare(
          getUserDisplayName(right.user),
          'pl',
        ),
      ),
  );
  protected readonly payrollCandidates = computed(() =>
    this.overview().filter((item) => item.days.length > 0),
  );
  protected readonly exportRows = computed<IUserWorkLogExportRow[]>(() => {
    const rows: IUserWorkLogExportRow[] = [];

    for (const item of this.payrollCandidates()) {
      const identity = this.payrollIdentityByUserId().get(item.user.id);

      if (!identity) {
        continue;
      }

      rows.push({
        userId: item.user.id,
        firstName: identity.firstName,
        lastName: identity.lastName,
        totalHours: item.totalHours,
        chaoticThursdayDatesLabel: item.days
          .filter((day) => day.isChaoticThursday)
          .map((day) => formatDateLabel(day.date, 'pl-PL'))
          .join(', '),
      });
    }

    return rows;
  });
  protected readonly hasIncompletePayrollExport = computed(() =>
    this.payrollCandidates().some(
      (item) => !this.payrollIdentityByUserId().has(item.user.id),
    ),
  );
  protected readonly totalHours = computed(() =>
    formatWorkLogHours(
      this.overview().reduce((sum, item) => sum + item.totalHours, 0),
    ),
  );
  protected readonly formatHours = formatWorkLogHours;
  protected readonly formatRangeLabel = formatHourOffsetRangeLabel;
  protected readonly formatDateLabel = formatDateLabel;
  protected readonly getUserDisplayName = getUserDisplayName;

  constructor() {
    const syncViewport = () => {
      this.isCompactView.set(
        this.platform.matchMedia('(max-width: 767px)')?.matches ?? false,
      );
    };
    const disposeResize = this.platform.onWindow('resize', syncViewport);
    this.destroyRef.onDestroy(disposeResize);
    syncViewport();

    effect((onCleanup) => {
      if (!this.auth.isReady()) {
        this.users.set([]);
        this.records.set([]);
        this.isLoading.set(true);
        return;
      }

      const userId = this.auth.userId();
      const monthOffset = this.monthOffset();

      if (!userId) {
        this.users.set([]);
        this.records.set([]);
        this.isLoading.set(false);
        return;
      }

      this.isLoading.set(true);
      this.loadFailed.set(false);
      const subscription = this.workLog
        .getOverview(monthOffset)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: ({ users, records }) => {
            this.users.set(users);
            this.records.set(records);
          },
          error: () => {
            this.users.set([]);
            this.records.set([]);
            this.loadFailed.set(true);
            this.toast.danger({
              summary: this.i18n.toast().loadFailedSummary,
              detail: this.i18n.toast().loadFailedDetail,
            });
          },
        });

      onCleanup(() => subscription.unsubscribe());
    });

    effect((onCleanup) => {
      const candidates = this.payrollCandidates();

      this.payrollIdentities.set([]);

      if (!candidates.length || !this.isAdmin()) {
        this.isPayrollIdentityLoading.set(false);
        return;
      }

      this.isPayrollIdentityLoading.set(true);
      const subscription = this.payrollIdentity
        .getByUserIds(candidates.map((item) => item.user.id))
        .pipe(finalize(() => this.isPayrollIdentityLoading.set(false)))
        .subscribe((identities) => this.payrollIdentities.set(identities));

      onCleanup(() => subscription.unsubscribe());
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
}
