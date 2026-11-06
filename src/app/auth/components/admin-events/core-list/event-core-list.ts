import { afterNextRender, Component, computed, DestroyRef, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ChipModule } from 'primeng/chip';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { EMPTY, finalize, Subscription, switchMap } from 'rxjs';

import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import type { IEventCoreListItem } from '../../../../core/interfaces/i-event-admin';
import { readAdminEventCoreRows } from '../../../../core/reads/events/admin-event-core-disposition-read';
import { Auth } from '../../../../core/services/auth/auth';
import { EventAdmin } from '../../../../core/services/event-admin/event-admin';
import { Platform } from '../../../../core/services/platform/platform';
import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { RpcError } from '../../../../core/types/rpc-error';
import { formatDateLabel } from '../../../../core/utils/date';
import type { EventCoreListRow } from '../../../../core/utils/event-admin-list';
import { setControlEnabled } from '../../../../core/utils/form-controls';
import { scrollElementIntoViewWhenReady } from '../../../../core/utils/scroll';
import { resolveEventCoreAdminErrorMessage } from '../event-admin-errors';
import { createEventCoreListI18n } from './core-list.i18n';
import { EventCoreDispositionController } from './event-core-disposition-controller';

@Component({
  selector: 'app-event-core-list',
  imports: [RouterLink, FormsModule, ReactiveFormsModule, ButtonModule, CheckboxModule, ChipModule,
    MessageModule, TableModule, ToggleSwitchModule, TooltipModule, LoadingOverlay],
  templateUrl: './core-list.html',
  providers: [provideTranslocoScope('adminEvents', 'common'), EventCoreDispositionController],
})
export class EventCoreList {
  private readonly eventAdmin = inject(EventAdmin);
  private readonly auth = inject(Auth);
  private readonly platform = inject(Platform);
  private readonly toast = inject(UiToast);
  private readonly confirm = inject(UiConfirm);
  private readonly destroyRef = inject(DestroyRef);
  private loadSubscription: Subscription | null = null;
  private readonly previewElement = viewChild<ElementRef<HTMLElement>>('dispositionPreview');
  protected readonly disposition = inject(EventCoreDispositionController);
  protected readonly i18n = createEventCoreListI18n();
  protected readonly showArchived = new FormControl(false, { nonNullable: true });
  protected readonly rows = signal<EventCoreListRow[]>([]);
  protected readonly selectedIds = signal<readonly string[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly confirming = signal(false);
  protected readonly loadErrorMessage = signal<string | null>(null);
  protected readonly activeActionKey = signal<string | null>(null);
  protected readonly isAdmin = computed(() => this.auth.hasRole('admin'));
  protected readonly isBusy = computed(() => this.isLoading() || this.activeActionKey() !== null ||
    this.disposition.busy() || this.confirming());
  protected readonly locked = computed(() => !this.isAdmin() || this.isBusy() || this.disposition.needsReadback());
  protected readonly allSelected = computed(() => this.rows().length > 0 && this.rows().every(row => this.selectedIds().includes(row.core.id)));
  protected readonly someSelected = computed(() => this.selectedIds().length > 0 && !this.allSelected());
  protected readonly selectionValid = computed(() => this.selectedIds().length > 0 && this.selectedIds().length <= 100);
  protected readonly dispositionError = computed(() => {
    const error = this.disposition.error();
    if (error === null) return null;
    const copy = this.i18n.disposition();
    if (this.disposition.needsReadback()) {
      const message = this.disposition.result() ? copy.readbackFailed : copy.uncertain;
      return error instanceof RpcError ? message + ' (' + error.code + ': ' + error.message + ')' : message;
    }
    if (!(error instanceof RpcError)) return copy.errors.failed;
    const message = error.code === '42501' ? copy.errors.forbidden : error.code === '22023' ? copy.errors.invalid
      : error.code === '23505' ? copy.errors.reused : error.code === '40001' ? copy.errors.stale
      : error.code === '23514' ? copy.errors.protected : copy.errors.failed;
    return message + ' (' + error.code + ': ' + error.message + ')';
  });
  protected readonly rowVms = computed(() => {
    const status = this.i18n.commonEntityStatuses();
    const values = this.i18n.commonValues();
    const table = this.i18n.table();
    const copy = this.i18n.disposition();
    return this.rows().map(({ core, nextEdition, visibleCities, remainingCityCount }) => ({
      core, visibleCities,
      nextOccurrenceLabel: nextEdition ? formatDateLabel(nextEdition.nextOccurrenceDate) : table.noUpcomingOccurrences,
      moreLocationsLabel: remainingCityCount > 0 ? this.i18n.moreLocations(remainingCityCount) : null,
      activeLabel: core.archived ? values.archived : core.isActive ? status.active.neuter : status.inactive.neuter,
      activeBadgeClass: core.isActive ? 'tag-badge tag-badge--success' : 'tag-badge tag-badge--muted',
      publicPageLabel: core.hasPublicPage ? values.yes : values.no,
      publicPageBadgeClass: core.hasPublicPage ? 'tag-badge tag-badge--success' : 'tag-badge tag-badge--muted',
      selectionLabel: copy.selectEvent.replace('{{name}}', core.name),
      dispositionLabel: this.i18n.dispositionActions()[core.dispositionAction],
      dispositionReason: copy.reasons[core.dispositionReason],
    }));
  });
  protected readonly dispositionItems = computed(() => {
    const preview = this.disposition.preview();
    const copy = this.i18n.disposition();
    const result = this.disposition.result();
    return this.disposition.verified() && result ? result.items.map(item => ({
      id: item.coreId, key: preview?.items.find(row => row.coreId === item.coreId)?.coreKey ?? item.coreId,
      action: copy.outcomes[item.outcome], reason: copy.reasons[item.reason],
    })) : preview?.items.map(item => ({
      id: item.coreId, key: item.coreKey ?? item.coreId, action: this.i18n.dispositionActions()[item.action], reason: copy.reasons[item.reason],
    })) ?? [];
  });

  constructor() {
    effect(() => setControlEnabled(this.showArchived, !this.locked()));
    this.showArchived.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.loadCores());
    afterNextRender(() => this.loadCores());
    this.destroyRef.onDestroy(this.platform.onWindow('beforeunload', event => {
      if (this.canDeactivate()) return;
      event.preventDefault();
      event.returnValue = '';
    }));
  }

  canDeactivate(): boolean {
    return !this.isAdmin() || (!this.disposition.locked() && !this.confirming() && this.activeActionKey() === null);
  }

  protected loadCores(): void {
    if (!this.isAdmin() || this.disposition.locked() || this.confirming()) return;
    this.loadSubscription?.unsubscribe();
    this.selectedIds.set([]);
    this.disposition.invalidate();
    this.isLoading.set(true);
    this.loadErrorMessage.set(null);
    this.rows.set([]);
    this.loadSubscription = readAdminEventCoreRows(this.eventAdmin, this.showArchived.value).pipe(
      takeUntilDestroyed(this.destroyRef), finalize(() => this.isLoading.set(false)),
    ).subscribe({
      next: rows => this.rows.set(rows),
      error: (error: unknown) => {
        const detail = resolveEventCoreAdminErrorMessage(error, this.i18n.rpcErrors(), this.i18n.commonErrors().concurrentModification);
        this.loadErrorMessage.set(detail);
        this.toast.danger({ summary: this.i18n.commonErrors().eventsLoadFailed, detail });
      },
    });
  }

  protected toggleCore(coreId: string): void {
    if (this.locked() || !this.rows().some(row => row.core.id === coreId)) return;
    this.disposition.invalidate();
    this.selectedIds.update(ids => ids.includes(coreId) ? ids.filter(id => id !== coreId) : [...ids, coreId]);
  }

  protected toggleVisible(): void {
    if (this.locked()) return;
    this.disposition.invalidate();
    this.selectedIds.set(this.allSelected() ? [] : this.rows().map(row => row.core.id));
  }

  protected previewDisposition(coreIds: readonly string[] = this.selectedIds()): void {
    if (this.locked() || coreIds.length < 1 || coreIds.length > 100 ||
      !coreIds.every(id => this.rows().some(row => row.core.id === id))) return;
    this.disposition.prepare(coreIds).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => scrollElementIntoViewWhenReady(() => {
        const element = this.previewElement()?.nativeElement;
        element?.focus({ preventScroll: true });
        return element ?? null;
      }, { block: 'start' }),
      error: () => { /* The controller owns the inline preview error. */ },
    });
  }

  protected confirmDisposition(): void {
    const preview = this.disposition.preview();
    if (!preview || !this.disposition.canApply() || this.locked()) return;
    const copy = this.i18n.disposition();
    const impact = preview.impact;
    this.confirming.set(true);
    this.confirm.modalDecision({ header: copy.previewTitle,
      message: copy.confirmation.replace('{{delete}}', String(impact.deleteCount))
        .replace('{{archive}}', String(impact.archiveCount)).replace('{{blocked}}', String(impact.blockedCount)),
      icon: 'pi pi-exclamation-triangle', acceptLabel: copy.confirm, rejectLabel: this.i18n.commonActions().cancel,
    }).pipe(switchMap(accepted => accepted && this.isAdmin() && this.disposition.preview() === preview
      ? this.disposition.apply(this.showArchived.value) : EMPTY),
      finalize(() => this.confirming.set(false)), takeUntilDestroyed(this.destroyRef),
    ).subscribe({ next: rows => this.acceptDisposition(rows), error: () => { /* Inline error retains the command when uncertain. */ } });
  }

  protected retryDisposition(): void {
    if (!this.disposition.needsReadback() || this.isBusy()) return;
    this.disposition.retry(this.showArchived.value).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: rows => this.acceptDisposition(rows), error: () => { /* Same command replay or receipt-only readback. */ },
    });
  }

  private acceptDisposition(rows: EventCoreListRow[]): void {
    this.rows.set(rows);
    this.selectedIds.set([]);
    this.toast.success({ summary: this.i18n.commonStatus().success, detail: this.i18n.disposition().success });
  }

  protected setCoreActive(core: IEventCoreListItem, isActive: boolean): void {
    if (this.locked() || core.archived || !this.isAdmin()) return;
    const action = isActive ? 'activate' : 'deactivate';
    const toast = this.i18n.toast();
    this.disposition.invalidate();
    this.activeActionKey.set(core.id + ':' + action);
    this.eventAdmin.setCoreActive(core.id, isActive).pipe(
      switchMap(() => readAdminEventCoreRows(this.eventAdmin, this.showArchived.value)),
      takeUntilDestroyed(this.destroyRef), finalize(() => this.activeActionKey.set(null)),
    ).subscribe({
      next: rows => {
        this.rows.set(rows);
        this.selectedIds.set([]);
        this.toast.success(isActive
          ? { summary: toast.activateSuccessSummary, detail: toast.activateSuccessDetail }
          : { summary: toast.deactivateSuccessSummary, detail: toast.deactivateSuccessDetail });
      },
      error: (error: unknown) => this.toast.danger({ summary: toast.activationFailedSummary,
        detail: resolveEventCoreAdminErrorMessage(error, this.i18n.rpcErrors(), this.i18n.commonErrors().concurrentModification) }),
    });
  }

  protected isActionLoading(coreId: string, action: 'activate' | 'deactivate'): boolean {
    return this.activeActionKey() === coreId + ':' + action;
  }
}
