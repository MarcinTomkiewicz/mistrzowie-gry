import { NgTemplateOutlet } from '@angular/common';
import { afterNextRender, Component, computed, contentChild, DestroyRef, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { EMPTY, finalize, switchMap } from 'rxjs';

import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import type { IEventCoreDetail } from '../../../../core/interfaces/i-event-admin';
import type { AdminGlobalEventPageFieldError } from '../../../../core/interfaces/i-admin-global-event-preview';
import type { EventGlobalSavedSnapshot } from '../../../../core/interfaces/i-event-global-saved-summary';
import { Auth } from '../../../../core/services/auth/auth';
import { EventAdmin } from '../../../../core/services/event-admin/event-admin';
import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { RpcError } from '../../../../core/types/rpc-error';
import { formatDateLabel } from '../../../../core/utils/date';
import { resolveEventCoreAdminErrorMessage } from '../event-admin-errors';
import { createEventEditionEditorI18n } from '../edition-editor/edition-editor.i18n';
import { createEventCoreEditorI18n } from './core-editor.i18n';
import { EventGlobalDraftSummary } from './event-global-draft-summary';
import { EventGlobalPublicationController } from './event-global-publication-controller';
import { readEventGlobalSavedSummary } from './event-global-saved-summary-read';
import { EventAdminTimeline } from '../event-admin-timeline/event-admin-timeline';
import { EventGlobalPagePreview } from './event-global-page-preview';
import { EventGlobalSaveController } from './event-global-save-controller';
import { readEventGlobalSummaryChanges } from './event-global-summary-changes';
import { EventGlobalDiagnostics } from './event-global-diagnostics';
import { EventGlobalSaveSummary } from './event-global-save-summary';

@Component({
  selector: 'app-event-global-saved-summary',
  imports: [NgTemplateOutlet, ButtonModule, MessageModule, TableModule, EventGlobalDraftSummary, EventAdminTimeline, EventGlobalPagePreview, LoadingOverlay],
  templateUrl: './event-global-saved-summary.html',
  host: { class: 'flex-col-start-stretch gap-md w-100 min-w-0' },
})
export class EventGlobalSavedSummary {
  readonly coreId = input.required<string>();
  readonly disabled = input(false);
  readonly readOnly = input(false);
  readonly navigateToStep = output<number>();
  readonly published = output<IEventCoreDetail>();
  readonly diagnosticsInvalidated = output<void>();
  readonly fieldErrors = input<readonly AdminGlobalEventPageFieldError[]>([]);
  protected readonly i18n = createEventCoreEditorI18n();
  private readonly editionI18n = createEventEditionEditorI18n();
  protected readonly publicationLabels = this.editionI18n.publication;
  protected readonly publication = inject(EventGlobalPublicationController);
  protected readonly publicationCopy = this.i18n.globalPublication;
  protected readonly save = inject(EventGlobalSaveController);
  protected readonly diagnostics = contentChild(EventGlobalDiagnostics);
  protected readonly saveSummary = contentChild(EventGlobalSaveSummary);
  protected readonly changes = computed(() => this.readOnly() ? null : readEventGlobalSummaryChanges(this.save));
  protected readonly editableSteps = computed(() => this.readOnly() ? [] : [
    ...(this.save.metadata.canEditCore() ? [1] : []),
    ...(this.save.metadata.canEditEdition() ? [2] : []),
    ...(this.save.schedule.canEdit() || this.save.base.canEdit() || this.save.dated.canEdit() ? [3] : []),
    ...(this.save.policy.canEdit() ? [4] : []),
  ]);
  private readonly auth = inject(Auth);
  private readonly confirm = inject(UiConfirm);
  private readonly toast = inject(UiToast);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly isAdmin = computed(() => this.auth.hasRole('admin'));
  protected readonly formatDateLabel = formatDateLabel;
  protected readonly loading = signal(true);
  protected readonly snapshot = signal<EventGlobalSavedSnapshot | null>(null);
  private readonly error = signal<unknown | null>(null);
  private readonly admin = inject(EventAdmin);
  private readonly browserReady = signal(false);
  private readonly readAttempt = signal(0);
  protected readonly selectedCityId = signal<string | null>(null);
  protected readonly selectedCity = computed<EventGlobalSavedSnapshot['cities'][number] | null>(() => {
    const cities = this.snapshot()?.cities ?? [];
    return cities.find(entry => entry.city.editionId === this.selectedCityId()) ?? cities.find(entry => entry.city.isMain) ?? null;
  });
  protected readonly hasRelease = computed(() => this.snapshot()?.core.everPublished === true ||
    (this.snapshot()?.calendar.globalDates.some(day => day.cityOccurrences.some(city => city.publishedAt !== null)) ?? false));
  protected readonly scoped = computed(() => this.snapshot()?.core.isActive === true && this.snapshot()?.core.hasPublicPage === true);
  protected readonly scopeEditionIds = signal<string[]>([]);
  protected readonly scopeDateIds = signal<string[]>([]);
  protected readonly scopeDecisionPending = signal(false);
  protected readonly scopeCalendar = computed(() => {
    const calendar = this.publication.scopeCalendar();
    return calendar?.coreId === this.coreId() ? calendar : this.snapshot()?.calendar ?? null;
  });
  protected readonly scopeDates = computed(() => this.scopeCalendar()?.globalDates.filter(day => day.status === 'scheduled') ?? []);
  protected readonly unsaved = computed(() => this.save.dirty() || this.save.busy() || this.save.pending());
  protected readonly canPreviewScope = computed(() => !this.readOnly() && this.snapshot()?.core.archived === false && this.browserReady() && this.isAdmin() && this.scoped() && !this.disabled() && !this.unsaved() &&
    !this.loading() && this.error() === null && !this.publication.locked() && this.scopeEditionIds().length > 0 && this.scopeDateIds().length > 0);
  protected readonly scopeSelection = computed(() => {
    const preview = this.publication.scopePreview();
    const calendar = this.scopeCalendar();
    return {
      cities: (preview?.editionIds ?? this.scopeEditionIds()).map(id => calendar?.cities.find(city => city.editionId === id)?.city ?? id).join(', '),
      dates: (preview?.globalDateIds ?? this.scopeDateIds()).map(id => {
        const day = calendar?.globalDates.find(day => day.globalOccurrenceId === id);
        return day ? formatDateLabel(day.date) : id;
      }).join(', '),
    };
  });
  protected readonly scopeActivationCities = computed(() => this.publication.scopePreview()?.impact.willActivateEditionIds
    .map(id => this.scopeCalendar()?.cities.find(city => city.editionId === id)?.city ?? id).join(', ') ?? '');
  protected readonly canPublish = computed(() => !this.readOnly() && this.snapshot()?.core.archived === false && this.browserReady() && this.isAdmin() && !this.disabled() && !this.unsaved() &&
    !this.loading() && this.error() === null && this.snapshot()?.core.id === this.coreId() &&
    !this.hasRelease() && !this.publication.locked());
  protected readonly publicationError = computed(() => {
    const error = this.publication.error();
    if (error === null) return null;
    if (this.publication.needsReadback()) return this.publication.result() || this.publication.scopeResult()
      ? this.publicationCopy().readbackFailed : this.publicationCopy().uncertain;
    if (error instanceof RpcError && error.code === '40001') return this.i18n.commonErrors().concurrentModification;
    if (error instanceof RpcError && error.code === '23514') return this.publicationCopy().blocked;
    if (error instanceof RpcError && error.code === '42501') return this.publicationLabels().errors.forbidden;
    return resolveEventCoreAdminErrorMessage(error, this.i18n.rpcErrors(), this.i18n.commonErrors().concurrentModification);
  });
  protected readonly publicationBlockers = computed(() => this.publication.preview()?.blockers.map(blocker => ({
    ...blocker,
    message: this.publicationCopy().blockers[blocker.code],
    city: blocker.editionId ? this.snapshot()?.calendar.cities.find(city => city.editionId === blocker.editionId)?.city ?? blocker.editionId : null,
  })) ?? []);
  protected readonly scopeBlockers = computed(() => this.publication.scopePreview()?.blockers.map(blocker => {
    const calendar = this.scopeCalendar();
    const day = 'globalDateId' in blocker ? calendar?.globalDates.find(day => day.globalOccurrenceId === blocker.globalDateId)
      : 'occurrenceId' in blocker ? calendar?.globalDates.find(day => day.cityOccurrences.some(city => city.occurrenceId === blocker.occurrenceId)) : undefined;
    const editionId = 'editionId' in blocker ? blocker.editionId
      : 'occurrenceId' in blocker ? day?.cityOccurrences.find(city => city.occurrenceId === blocker.occurrenceId)?.editionId : undefined;
    return { code: blocker.code, message: this.publicationCopy().scope.blockers[blocker.code],
      city: editionId ? calendar?.cities.find(city => city.editionId === editionId)?.city ?? editionId : null,
      date: day?.date, unresolvedId: day ? null : 'globalDateId' in blocker ? blocker.globalDateId : 'occurrenceId' in blocker ? blocker.occurrenceId : null,
      blockPosition: 'blockPosition' in blocker ? blocker.blockPosition : null };
  }) ?? []);
  protected readonly errorMessage = computed(() => this.error() === null ? null : resolveEventCoreAdminErrorMessage(
    this.error(), this.i18n.rpcErrors(), this.i18n.commonErrors().concurrentModification,
  ));
  protected readonly cities = computed(() => {
    const copy = this.i18n.savedSummary();
    const statuses = this.editionI18n.occurrenceStatuses();
    return this.snapshot()?.cities.map(entry => ({
      city: entry.city,
      dates: entry.dates.map(date => ({
        ...date,
        participationLabel: copy.participation[date.participation],
        globalStatusLabel: date.globalStatus ? copy.calendarStatuses[date.globalStatus] : null,
        occurrenceStatusLabel: date.occurrenceStatus ? statuses[date.occurrenceStatus] : null,
      })),
    })) ?? [];
  });

  constructor() {
    // Privileged reads run in the browser, following EventGlobalProgram's boundary.
    afterNextRender(() => this.browserReady.set(true));
    effect(() => {
      if (!this.save.busy() && (this.save.completed().length || this.save.pending())) {
        // Refresh the whole view after partial saves without resolving the retained writer operation.
        untracked(() => this.readAttempt.update(value => value + 1));
      }
    });
    effect(onCleanup => {
      const ready = this.browserReady();
      const coreId = this.coreId();
      this.readAttempt();
      untracked(() => {
        this.snapshot.set(null);
        this.error.set(null);
        this.loading.set(true);
        if (!this.publication.locked()) this.publication.scopeCalendar.set(null);
        if (!ready) return;
        this.diagnosticsInvalidated.emit();
        const subscription = readEventGlobalSavedSummary(this.admin, coreId).subscribe({
          next: snapshot => { this.snapshot.set(snapshot); this.loading.set(false); },
          error: (error: unknown) => {
            this.error.set(error);
            this.loading.set(false);
            this.toast.danger({ summary: this.i18n.savedSummary().readFailed, detail: this.errorMessage() ?? undefined });
          },
        });
        onCleanup(() => subscription.unsubscribe());
      });
    });
  }

  protected refresh(): void {
    if (!this.loading() && !this.publication.locked()) {
      this.clearScopeSelection();
      this.readAttempt.update(value => value + 1);
    }
  }

  protected toggleScope(kind: 'edition' | 'date', id: string): void {
    if (this.disabled() || this.publication.locked()) return;
    this.publication.invalidateScope();
    const selected = kind === 'edition' ? this.scopeEditionIds : this.scopeDateIds;
    selected.update(ids => ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]);
  }

  protected clearScopeSelection(): void {
    if (this.publication.locked()) return;
    this.publication.invalidateScope();
    this.scopeEditionIds.set([]);
    this.scopeDateIds.set([]);
  }

  protected previewScope(): void {
    if (!this.canPreviewScope()) return;
    this.publication.prepareScope(this.coreId(), this.scopeEditionIds(), this.scopeDateIds())
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: preview => {
          if (!preview.valid) this.toast.warn({ summary: this.i18n.diagnostics().statuses.blocked,
            detail: this.scopeBlockers().map(blocker => blocker.message).join(' ') });
        },
        error: () => this.toast.danger({ summary: this.publicationError() ?? this.i18n.commonErrors().generic }),
      });
  }

  protected confirmScopePublication(): void {
    const preview = this.publication.scopePreview();
    if (!this.publication.scopeConfirmable() || !preview?.valid || this.scopeDecisionPending()) return;
    this.scopeDecisionPending.set(true);
    const coreId = this.coreId();
    const impact = preview.impact;
    const selection = this.scopeSelection();
    const message = this.publicationCopy().scope.confirm.replace('{{cities}}', selection.cities).replace('{{dates}}', selection.dates)
      .replace('{{planned}}', String(impact.plannedOccurrenceCount)).replace('{{already}}', String(impact.alreadyPublishedOccurrenceCount))
      .replace('{{excluded}}', String(impact.excludedSelections)).replace('{{upgrades}}', String(impact.legacyCapacityUpgrades))
      .replace('{{activate}}', this.scopeActivationCities() || this.i18n.commonValues().notApplicable);
    this.confirm.modalDecision({ header: this.publicationCopy().scope.confirmQuestion, message,
      acceptLabel: this.publicationLabels().publish, rejectLabel: this.i18n.commonActions().cancel,
    }).pipe(switchMap(accepted => {
      if (!accepted || coreId !== this.coreId() || !this.isAdmin()) {
        this.publication.cancelConfirmation();
        return EMPTY;
      }
      return this.publication.publish();
    }), finalize(() => this.scopeDecisionPending.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: core => {
        if (core) this.acceptPublication(core);
        else this.toast.danger({ summary: this.publicationError() ?? this.publicationCopy().blocked });
      },
      error: () => this.toast.show(this.publication.needsReadback() ? 'warn' : 'danger', {
        summary: this.publicationError() ?? this.i18n.commonErrors().generic,
      }),
    });
  }

  protected confirmPublication(): void {
    if (!this.canPublish()) return;
    const coreId = this.coreId();
    this.publication.prepare(coreId).pipe(switchMap(preview => {
      if (!preview.valid) {
        this.toast.warn({ summary: this.i18n.diagnostics().statuses.blocked,
          detail: this.publicationBlockers().map(blocker => blocker.message).join(' ') });
        return EMPTY;
      }
      const message = this.publicationCopy().confirm
        .replace('{{cities}}', String(preview.impact.affectedCityCount))
        .replace('{{occurrences}}', String(preview.impact.publishableOccurrenceCount))
        .replace('{{past}}', String(preview.impact.preservedPastDraftOccurrences));
      return this.confirm.modalDecision({
        header: this.publicationCopy().confirmQuestion,
        message: message + (preview.policyDraftRevision > 0 ? ' ' + this.publicationCopy().policyDraft : ''),
        acceptLabel: this.publicationLabels().publish, rejectLabel: this.i18n.commonActions().cancel,
      }).pipe(switchMap(accepted => {
        if (!accepted || coreId !== this.coreId() || !this.isAdmin()) {
          this.publication.cancelConfirmation();
          return EMPTY;
        }
        return this.publication.publish();
      }));
    }), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: core => {
        if (core) this.acceptPublication(core);
        else this.toast.danger({ summary: this.publicationError() ?? this.publicationCopy().blocked });
      },
      error: () => this.toast.show(this.publication.needsReadback() ? 'warn' : 'danger', {
        summary: this.publicationError() ?? this.i18n.commonErrors().generic,
      }),
    });
  }

  protected retryPublicationReadback(): void {
    if (this.scopeDecisionPending()) return;
    this.publication.retryReadback().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: core => this.acceptPublication(core),
      error: () => this.toast.show(this.publication.needsReadback() ? 'warn' : 'danger', {
        summary: this.publicationError() ?? this.i18n.commonErrors().generic,
      }),
    });
  }

  protected endScopeReadback(): void {
    if (!this.publication.canAbandonScopeReadback() || this.scopeDecisionPending()) return;
    const coreId = this.coreId();
    this.scopeDecisionPending.set(true);
    this.confirm.modalDecision({
      header: this.publicationCopy().scope.endReadbackQuestion, message: this.publicationCopy().scope.endReadbackWarning,
      acceptLabel: this.publicationCopy().scope.endReadback,
      rejectLabel: this.i18n.commonActions().cancel,
    }).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.scopeDecisionPending.set(false))).subscribe(accepted => {
      if (accepted && coreId === this.coreId() && this.isAdmin() && this.publication.abandonScopeReadback()) {
        this.readAttempt.update(value => value + 1);
      }
    });
  }

  private acceptPublication(core: IEventCoreDetail): void {
    this.scopeEditionIds.set([]);
    this.scopeDateIds.set([]);
    this.published.emit(core);
    this.readAttempt.update(value => value + 1);
  }
}
