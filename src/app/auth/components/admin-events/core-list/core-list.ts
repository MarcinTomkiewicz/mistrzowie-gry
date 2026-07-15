import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { finalize } from 'rxjs';

import { IEventCoreListItem } from '../../../../core/interfaces/i-event-admin';
import { EventAdmin } from '../../../../core/services/event-admin/event-admin';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { formatTimestampLabel } from '../../../../core/utils/date';
import { resolveEventCoreAdminErrorMessage } from '../event-admin-errors';
import { LoadingOverlay } from '../../../../public/common/loading-overlay/loading-overlay';
import { createEventCoreListI18n } from './core-list.i18n';

@Component({
  selector: 'app-event-core-list',
  standalone: true,
  imports: [RouterLink, ButtonModule, LoadingOverlay],
  templateUrl: './core-list.html',
  providers: [provideTranslocoScope('adminEvents', 'common')],
})
export class EventCoreList {
  private readonly eventAdmin = inject(EventAdmin);
  private readonly toast = inject(UiToast);

  protected readonly i18n = createEventCoreListI18n();
  protected readonly rows = signal<IEventCoreListItem[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly loadErrorMessage = signal<string | null>(null);
  protected readonly activeActionKey = signal<string | null>(null);

  protected readonly isBusy = computed(
    () => this.isLoading() || this.activeActionKey() !== null,
  );

  protected readonly rowVms = computed(() => {
    const table = this.i18n.table();
    const status = this.i18n.status();
    const commonActions = this.i18n.commonActions();

    return this.rows().map((core) => ({
      core,
      shortDescriptionLabel: core.shortDescription ?? table.notAvailable,
      activeLabel: core.isActive ? status.active : status.inactive,
      activeBadgeClass: core.isActive
        ? 'tag-badge tag-badge--success'
        : 'tag-badge tag-badge--muted',
      publicPageLabel: core.hasPublicPage
        ? commonActions.yes
        : commonActions.no,
      publicPageBadgeClass: core.hasPublicPage
        ? 'tag-badge tag-badge--success'
        : 'tag-badge tag-badge--muted',
      updatedAtLabel:
        formatTimestampLabel(core.updatedAt, 'pl-PL') ?? table.notAvailable,
    }));
  });

  constructor() {
    this.loadCores();
  }

  protected loadCores(): void {
    this.isLoading.set(true);
    this.loadErrorMessage.set(null);

    this.eventAdmin
      .getCoreList()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (rows) => this.rows.set(rows),
        error: (error) => {
          const detail = resolveEventCoreAdminErrorMessage(
            error,
            this.i18n.rpcErrors(),
          );

          this.rows.set([]);
          this.loadErrorMessage.set(detail);
          this.toast.danger({
            summary: this.i18n.toast().loadFailedSummary,
            detail,
          });
        },
      });
  }

  protected setCoreActive(
    core: IEventCoreListItem,
    isActive: boolean,
  ): void {
    const action = isActive ? 'activate' : 'deactivate';
    const toast = this.i18n.toast();

    this.activeActionKey.set(this.buildActionKey(core.id, action));

    this.eventAdmin
      .setCoreActive(core.id, isActive)
      .pipe(finalize(() => this.activeActionKey.set(null)))
      .subscribe({
        next: () => {
          this.toast.success(
            isActive
              ? {
                  summary: toast.activateSuccessSummary,
                  detail: toast.activateSuccessDetail,
                }
              : {
                  summary: toast.deactivateSuccessSummary,
                  detail: toast.deactivateSuccessDetail,
                },
          );
          this.loadCores();
        },
        error: (error) => {
          this.toast.danger({
            summary: toast.activationFailedSummary,
            detail: resolveEventCoreAdminErrorMessage(
              error,
              this.i18n.rpcErrors(),
            ),
          });
        },
      });
  }

  protected isActionLoading(
    coreId: string,
    action: 'activate' | 'deactivate',
  ): boolean {
    return this.activeActionKey() === this.buildActionKey(coreId, action);
  }

  private buildActionKey(
    coreId: string,
    action: 'activate' | 'deactivate',
  ): string {
    return `${coreId}:${action}`;
  }
}
