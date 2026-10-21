import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { finalize, forkJoin } from 'rxjs';

import type { IEventCoreListItem } from '../../../../core/interfaces/i-event-admin';
import { EventAdmin } from '../../../../core/services/event-admin/event-admin';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { formatDateLabel } from '../../../../core/utils/date';
import {
  buildEventCoreListRows,
  type EventCoreListRow,
} from '../../../../core/utils/event-admin-list';
import { resolveEventCoreAdminErrorMessage } from '../event-admin-errors';
import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import { createEventCoreListI18n } from './core-list.i18n';

@Component({
  selector: 'app-event-core-list',
  standalone: true,
  imports: [RouterLink, ButtonModule, ChipModule, TableModule, TooltipModule, LoadingOverlay],
  templateUrl: './core-list.html',
  providers: [provideTranslocoScope('adminEvents', 'common')],
})
export class EventCoreList {
  private readonly eventAdmin = inject(EventAdmin);
  private readonly toast = inject(UiToast);

  protected readonly i18n = createEventCoreListI18n();
  protected readonly rows = signal<EventCoreListRow[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly loadErrorMessage = signal<string | null>(null);
  protected readonly activeActionKey = signal<string | null>(null);

  protected readonly isBusy = computed(
    () => this.isLoading() || this.activeActionKey() !== null,
  );

  protected readonly rowVms = computed(() => {
    const status = this.i18n.commonEntityStatuses();
    const commonValues = this.i18n.commonValues();
    const table = this.i18n.table();

    return this.rows().map(({ core, nextEdition, visibleCities, remainingCityCount }) => ({
      core,
      visibleCities,
      nextOccurrenceLabel: nextEdition
        ? formatDateLabel(nextEdition.nextOccurrenceDate)
        : table.noUpcomingOccurrences,
      moreLocationsLabel: remainingCityCount > 0
        ? this.i18n.moreLocations(remainingCityCount)
        : null,
      activeLabel: core.isActive ? status.active.neuter : status.inactive.neuter,
      activeBadgeClass: core.isActive
        ? 'tag-badge tag-badge--success'
        : 'tag-badge tag-badge--muted',
      publicPageLabel: core.hasPublicPage
        ? commonValues.yes
        : commonValues.no,
      publicPageBadgeClass: core.hasPublicPage
        ? 'tag-badge tag-badge--success'
        : 'tag-badge tag-badge--muted',
    }));
  });

  constructor() {
    this.loadCores();
  }

  protected loadCores(): void {
    this.isLoading.set(true);
    this.loadErrorMessage.set(null);

    forkJoin({
      cores: this.eventAdmin.getCoreList(),
      editions: this.eventAdmin.getEditionList(),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ cores, editions }) => {
          this.rows.set(buildEventCoreListRows(cores, editions));
        },
        error: (error) => {
          const detail = resolveEventCoreAdminErrorMessage(
            error,
            this.i18n.rpcErrors(),
            this.i18n.commonErrors().concurrentModification,
          );

          this.rows.set([]);
          this.loadErrorMessage.set(detail);
          this.toast.danger({
            summary: this.i18n.commonErrors().eventsLoadFailed,
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
              this.i18n.commonErrors().concurrentModification,
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
