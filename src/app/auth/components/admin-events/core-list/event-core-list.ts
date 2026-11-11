import { afterNextRender, Component, computed, DestroyRef, effect, inject, signal, type TemplateRef, viewChild } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ChipModule } from 'primeng/chip';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { asapScheduler, EMPTY, finalize, map, type Observable, observeOn, Subscription, switchMap, tap } from 'rxjs';

import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import type { AdminEventCoreDispositionPreview, IEventCoreListItem } from '../../../../core/interfaces/i-event-admin';
import { readAdminEventCoreRows } from '../../../../core/reads/events/admin-event-core-disposition-read';
import { Auth } from '../../../../core/services/auth/auth';
import { EventAdmin } from '../../../../core/services/event-admin/event-admin';
import { Platform } from '../../../../core/services/platform/platform';
import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { RpcError } from '../../../../core/types/rpc-error';
import { formatDateLabel } from '../../../../core/utils/date';
import { assertEdgeContract } from '../../../../core/utils/edge-contract';
import type { EventCoreListRow } from '../../../../core/utils/event-admin-list';
import { setControlEnabled } from '../../../../core/utils/form-controls';
import { isDefiniteEventAdminRpcRejection, resolveEventCoreAdminErrorMessage } from '../event-admin-errors';
import { createEventCoreListI18n } from './core-list.i18n';
import { EventCoreDispositionController } from './event-core-disposition-controller';

type CoreActivationContext = {
  coreId: string;
  isActive: boolean;
  actorId: string;
  phase: 'readback' | 'refresh';
};

@Component({
  selector: 'app-event-core-list',
  imports: [RouterLink, ReactiveFormsModule, ButtonModule, CheckboxModule, ChipModule,
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
  private readonly dispositionMessage = viewChild.required<TemplateRef<unknown>>('dispositionMessage');
  private loadSubscription: Subscription | null = null;
  protected readonly pendingActivation = signal<CoreActivationContext | null>(null);
  protected readonly disposition = inject(EventCoreDispositionController);
  protected readonly i18n = createEventCoreListI18n();
  protected readonly showArchived = new FormControl(false, { nonNullable: true });
  protected readonly selectedIds = new FormControl<string[]>([], { nonNullable: true });
  protected readonly selectAll = new FormControl<boolean>(false, { nonNullable: true });
  protected readonly selectedCount = toSignal(this.selectedIds.valueChanges.pipe(map(ids => ids.length)), { initialValue: 0 });
  protected readonly rows = signal<EventCoreListRow[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly confirming = signal(false);
  protected readonly loadErrorMessage = signal<string | null>(null);
  protected readonly activeActionKey = signal<string | null>(null);
  protected readonly isAdmin = computed(() => this.auth.hasRole('admin'));
  protected readonly isBusy = computed(() => this.isLoading() || this.activeActionKey() !== null ||
    this.disposition.busy() || this.confirming());
  protected readonly locked = computed(() => !this.isAdmin() || this.isBusy() ||
    this.disposition.needsReadback() || this.pendingActivation() !== null);
  protected readonly canEndActivationReadback = computed(() => {
    const pending = this.pendingActivation();
    return pending?.phase === 'readback' && !this.isBusy() && this.isAdmin() && pending.actorId === this.auth.userId();
  });
  protected readonly someSelected = computed(() => this.selectedCount() > 0 && this.selectedCount() < this.rows().length);
  protected readonly selectionValid = computed(() => this.selectedCount() > 0 && this.selectedCount() <= 100);
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
    const preview = this.disposition.verified() ? null : this.disposition.preview();
    const decisions = new Map(preview?.items.map(item => [item.coreId, item]));
    return this.rows().map(({ core, nextEdition, visibleCities, remainingCityCount }) => {
      const decision = decisions.get(core.id);
      const dispositionAction = decision?.action ?? core.dispositionAction;
      return {
        core, visibleCities,
        nextOccurrenceLabel: nextEdition ? formatDateLabel(nextEdition.nextOccurrenceDate) : table.noUpcomingOccurrences,
        moreLocationsLabel: remainingCityCount > 0 ? this.i18n.moreLocations(remainingCityCount) : null,
        activeLabel: core.archived ? values.archived : core.isActive ? status.active.neuter : status.inactive.neuter,
        activeBadgeClass: core.isActive ? 'tag-badge tag-badge--success' : 'tag-badge tag-badge--muted',
        publicPageLabel: core.hasPublicPage ? values.yes : values.no,
        publicPageBadgeClass: core.hasPublicPage ? 'tag-badge tag-badge--success' : 'tag-badge tag-badge--muted',
        selectionLabel: copy.selectEvent.replace('{{name}}', core.name),
        dispositionAction,
        dispositionLabel: this.i18n.dispositionActions()[dispositionAction],
        dispositionReason: copy.reasons[decision?.reason ?? core.dispositionReason],
      };
    });
  });
  protected readonly dispositionBlockers = computed(() => {
    const copy = this.i18n.disposition();
    return [...new Set(this.disposition.preview()?.items.filter(item => item.action === 'blocked')
      .map(item => copy.reasons[item.reason]) ?? [])].join(' ');
  });
  protected readonly dispositionItems = computed(() => {
    const names = new Map(this.rows().map(({ core }) => [core.id, core.name]));
    const copy = this.i18n.disposition();
    return this.disposition.preview()?.items.map(item => ({
      id: item.coreId, label: names.get(item.coreId) ?? item.coreId,
      action: item.action === 'blocked' ? copy.blockedCount : this.i18n.dispositionActions()[item.action],
      badgeClass: item.action === 'delete' ? 'tag-badge--danger'
        : item.action === 'archive' ? 'tag-badge--arcane' : 'tag-badge--warn',
      reason: copy.reasons[item.reason],
    })) ?? [];
  });

  constructor() {
    effect(() => {
      const enabled = !this.locked();
      setControlEnabled(this.showArchived, enabled);
      setControlEnabled(this.selectedIds, enabled);
      setControlEnabled(this.selectAll, enabled);
    });
    effect(() => this.selectAll.setValue(this.rows().length > 0 && this.selectedCount() === this.rows().length,
      { emitEvent: false }));
    this.showArchived.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.loadCores());
    afterNextRender(() => this.loadCores());
    this.destroyRef.onDestroy(this.platform.onWindow('beforeunload', event => {
      if (this.canDeactivate()) return;
      event.preventDefault();
      event.returnValue = '';
    }));
  }

  canDeactivate(): boolean {
    return !this.isAdmin() || (!this.disposition.locked() && !this.confirming() &&
      this.activeActionKey() === null && this.pendingActivation() === null);
  }

  protected loadCores(): void {
    if (!this.isAdmin() || this.disposition.locked() || this.confirming() || this.activeActionKey() !== null) return;
    this.loadSubscription?.unsubscribe();
    if (!this.pendingActivation()) {
      this.selectedIds.reset();
      this.disposition.invalidate();
      this.rows.set([]);
    }
    this.isLoading.set(true);
    this.loadErrorMessage.set(null);
    this.loadSubscription = this.readCores().pipe(
      takeUntilDestroyed(this.destroyRef), finalize(() => this.isLoading.set(false)),
    ).subscribe({
      next: rows => this.rows.set(rows),
      error: (error: unknown) => {
        const detail = this.pendingActivation() ? this.i18n.toast().activationUnconfirmedDetail
          : resolveEventCoreAdminErrorMessage(error, this.i18n.rpcErrors(), this.i18n.commonErrors().concurrentModification);
        this.loadErrorMessage.set(detail);
        this.toast.danger({ summary: this.i18n.commonErrors().eventsLoadFailed, detail });
      },
    });
  }

  private readCores(): Observable<EventCoreListRow[]> {
    const pending = this.pendingActivation();
    return readAdminEventCoreRows(this.eventAdmin, this.showArchived.value).pipe(tap(rows => {
      if (!pending) return;
      assertEdgeContract(this.pendingActivation() === pending && this.isAdmin() && this.auth.userId() === pending.actorId,
        'eventCore.activation.actor', 'the retained operation and the same authorized administrator');
      if (pending.phase === 'refresh') {
        this.selectedIds.setValue(this.selectedIds.value.filter(id => rows.some(row => row.core.id === id)));
        this.pendingActivation.set(null);
        return;
      }
      const current = rows.find(row => row.core.id === pending.coreId)?.core;
      assertEdgeContract(current !== undefined && !current.archived && current.isActive === pending.isActive,
        'eventCore.activation.readback', 'the same non-archived Core with the requested active state');
      this.pendingActivation.set(null);
      this.selectedIds.reset();
      const toast = this.i18n.toast();
      this.toast.success(pending.isActive
        ? { summary: toast.activateSuccessSummary, detail: toast.activateSuccessDetail }
        : { summary: toast.deactivateSuccessSummary, detail: toast.deactivateSuccessDetail });
    }));
  }

  protected endActivationReadback(): void {
    const pending = this.pendingActivation();
    if (!pending || !this.canEndActivationReadback()) return;
    const copy = this.i18n.activationReadback();
    this.confirming.set(true);
    this.confirm.modalDecision({
      header: copy.endQuestion,
      message: copy.endWarning.replace('{{name}}', this.rows().find(row => row.core.id === pending.coreId)?.core.name ?? pending.coreId),
      acceptLabel: copy.end, rejectLabel: this.i18n.commonActions().cancel, acceptSeverity: 'warn',
    }).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.confirming.set(false))).subscribe(accepted => {
      if (!accepted || this.pendingActivation() !== pending || !this.isAdmin() || this.auth.userId() !== pending.actorId) return;
      this.pendingActivation.set({ ...pending, phase: 'refresh' });
      this.confirming.set(false);
      this.toast.warn({ summary: this.i18n.toast().activationUnconfirmedSummary, detail: copy.ended });
      this.loadCores();
    });
  }

  protected selectionChanged(coreId: string): void {
    if (this.locked() || !this.rows().some(row => row.core.id === coreId)) return;
    this.disposition.invalidate();
  }

  protected toggleVisible(): void {
    if (this.locked()) return;
    this.disposition.invalidate();
    this.selectedIds.setValue(this.selectAll.value ? this.rows().map(row => row.core.id) : []);
  }

  protected previewDisposition(coreIds: readonly string[] = this.selectedIds.value): void {
    if (this.locked() || coreIds.length < 1 || coreIds.length > 100 ||
      !coreIds.every(id => this.rows().some(row => row.core.id === id))) return;
    this.confirming.set(true);
    this.disposition.prepare(coreIds).pipe(
      // The controller releases its preview phase in finalize before the dialog checks canApply.
      observeOn(asapScheduler), switchMap(preview => this.confirmDisposition(preview)),
      finalize(() => this.confirming.set(false)), takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: rows => this.acceptDisposition(rows),
      error: () => { /* The controller retains inline errors and any uncertain command. */ },
    });
  }

  private confirmDisposition(preview: AdminEventCoreDispositionPreview): Observable<EventCoreListRow[]> {
    if (!this.disposition.canApply() || this.disposition.preview() !== preview || !this.isAdmin()) return EMPTY;
    const copy = this.i18n.disposition();
    const text = preview.impact.deleteCount > 0
      ? preview.impact.archiveCount > 0
        ? { header: copy.confirmMixed, message: copy.previewHeading }
        : { header: copy.confirmDelete, message: copy.previewDeleteHeading }
      : { header: copy.confirmArchive, message: copy.previewArchiveHeading };
    return this.confirm.modalDecision({ ...text,
      acceptSeverity: 'danger', messageTemplate: this.dispositionMessage(),
      acceptLabel: this.i18n.commonActions().confirm,
      rejectLabel: this.i18n.commonActions().cancel,
    }).pipe(switchMap(accepted => {
      if (!accepted || !this.isAdmin() || this.disposition.preview() !== preview) {
        this.disposition.invalidate();
        return EMPTY;
      }
      return this.disposition.apply(this.showArchived.value);
    }));
  }

  protected retryDisposition(): void {
    if (!this.disposition.needsReadback() || this.isBusy()) return;
    this.disposition.retry(this.showArchived.value).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: rows => this.acceptDisposition(rows), error: () => { /* Same command replay or receipt-only readback. */ },
    });
  }

  private acceptDisposition(rows: EventCoreListRow[]): void {
    this.rows.set(rows);
    this.selectedIds.reset();
    this.toast.success({ summary: this.i18n.commonStatus().success, detail: this.i18n.disposition().success });
  }

  protected setCoreActive(core: IEventCoreListItem, isActive: boolean): void {
    const actorId = this.auth.userId();
    if (this.locked() || core.archived || !actorId) return;
    const action = isActive ? 'activate' : 'deactivate';
    const toast = this.i18n.toast();
    let rejected = false;
    this.disposition.invalidate();
    this.pendingActivation.set({ coreId: core.id, isActive, actorId, phase: 'readback' });
    this.activeActionKey.set(core.id + ':' + action);
    this.eventAdmin.setCoreActive(core.id, isActive).pipe(
      tap({
        next: result => {
          assertEdgeContract(result?.id === core.id, 'eventCore.activation.id', 'the requested Core UUID');
          assertEdgeContract(result.isActive === isActive, 'eventCore.activation.isActive', 'the requested active state');
        },
        error: (error: unknown) => {
          rejected = isDefiniteEventAdminRpcRejection(error);
          if (rejected) this.pendingActivation.set(null);
        },
      }),
      switchMap(() => this.readCores()),
      takeUntilDestroyed(this.destroyRef), finalize(() => this.activeActionKey.set(null)),
    ).subscribe({
      next: rows => this.rows.set(rows),
      error: (error: unknown) => {
        if (rejected) {
          this.toast.danger({ summary: toast.activationFailedSummary,
            detail: resolveEventCoreAdminErrorMessage(error, this.i18n.rpcErrors(), this.i18n.commonErrors().concurrentModification) });
        } else {
          this.toast.warn({ summary: toast.activationUnconfirmedSummary, detail: toast.activationUnconfirmedDetail });
        }
      },
    });
  }

  protected isActionLoading(coreId: string, action: 'activate' | 'deactivate'): boolean {
    return this.activeActionKey() === coreId + ':' + action;
  }
}
