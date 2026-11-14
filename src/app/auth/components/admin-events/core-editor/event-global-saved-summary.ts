import { NgTemplateOutlet } from '@angular/common';
import { afterNextRender, Component, computed, contentChild, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { EMPTY, finalize, Observable, switchMap } from 'rxjs';

import type { IEventCoreDetail } from '../../../../core/interfaces/i-event-admin';
import type { AdminGlobalEventPageFieldError } from '../../../../core/interfaces/i-admin-global-event-preview';
import type { EventGlobalSavedSnapshot } from '../../../../core/interfaces/i-event-global-saved-summary';
import type { GlobalPublicationStep, GlobalPublicationStepProgress } from '../../../../core/interfaces/i-admin-global-event-publication';
import { EventGlobalProgramReadbackError, EventGlobalSignupAvailabilityError } from '../../../../core/reads/events/admin-global-publication.contract';
import { Auth } from '../../../../core/services/auth/auth';
import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { RpcError } from '../../../../core/types/rpc-error';
import { EventProgramItemStatus } from '../../../../core/enums/event';
import { formatDateLabel } from '../../../../core/utils/date';
import { presentEventGlobalPreviewError, resolveEventCoreAdminErrorMessage, resolveEventEditionAdminErrorMessage, resolveEventProgramPublicationError } from '../event-admin-errors';
import { createEventEditionEditorI18n } from '../edition-editor/edition-editor.i18n';
import { createEventCoreEditorI18n } from './core-editor.i18n';
import { EventGlobalDraftSummary } from './event-global-draft-summary';
import { EventGlobalPublicationController } from './event-global-publication-controller';
import { EventAdminTimeline } from '../event-admin-timeline/event-admin-timeline';
import { EventGlobalPagePreview } from './event-global-page-preview';
import { EventGlobalSaveController } from './event-global-save-controller';
import { readEventGlobalSummaryChanges } from './event-global-summary-changes';
import { EventGlobalDiagnostics } from './event-global-diagnostics';
import { EventGlobalSaveSummary } from './event-global-save-summary';

@Component({
  selector: 'app-event-global-saved-summary',
  imports: [NgTemplateOutlet, ButtonModule, MessageModule, TableModule, EventGlobalDraftSummary, EventAdminTimeline, EventGlobalPagePreview],
  templateUrl: './event-global-saved-summary.html',
  host: { class: 'flex-col-start-stretch gap-md w-100 min-w-0' },
})
export class EventGlobalSavedSummary {
  readonly coreId = input.required<string>();
  readonly disabled = input(false);
  readonly selectionDisabled = input(false);
  readonly readOnly = input(false);
  readonly navigateToStep = output<number>();
  readonly published = output<IEventCoreDetail>();
  readonly readback = output<EventGlobalSavedSnapshot>();
  readonly refreshRequested = output<void>();
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
  protected readonly snapshot = this.publication.snapshot.asReadonly();
  private readonly browserReady = signal(false);
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
  protected readonly scopeCalendar = this.publication.scopeCalendar.asReadonly();
  protected readonly scopeDates = computed(() => this.scopeCalendar()?.globalDates.filter(day => day.status === 'scheduled') ?? []);
  protected readonly unsaved = computed(() => this.save.dirty() || this.save.busy() || this.save.pending());
  private readonly canPrepare = computed(() => !this.readOnly() && this.snapshot()?.core.archived === false && this.browserReady() &&
    this.isAdmin() && !this.disabled() && !this.unsaved() && !this.publication.locked());
  protected readonly canPreviewScope = computed(() => this.canPrepare() && this.scoped() &&
    this.scopeEditionIds().length > 0 && this.scopeDateIds().length > 0);
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
  protected readonly canPublish = computed(() => this.canPrepare() && !this.hasRelease());
  protected readonly publicationError = computed(() => {
    const error = this.publication.error();
    if (error === null) return null;
    if (this.publication.publicationConfirmed()) return this.publicationCopy().signupRelease.partial;
    if (this.publication.needsReadback()) return this.publication.result() || this.publication.scopeResult()
      ? this.publicationCopy().readbackFailed : this.publicationCopy().uncertain;
    if (error instanceof RpcError && error.code === '40001') return this.i18n.commonErrors().concurrentModification;
    if (error instanceof RpcError && error.code === '23514') return this.publicationCopy().blocked;
    if (error instanceof RpcError && error.code === '42501') return this.publicationLabels().errors.forbidden;
    return resolveEventCoreAdminErrorMessage(error, this.i18n.rpcErrors(), this.i18n.commonErrors().concurrentModification);
  });
  protected readonly publicationErrorFields = computed(() => this.publication.occurrenceProgress().some(row =>
    (['publication', 'program', 'signup'] as const).some(step => row[step].error === this.publication.error()))
    ? [] : this.technicalFields(this.publication.error()));
  protected readonly occurrenceProgress = computed(() => this.publication.occurrenceProgress().map(row => ({
    ...row,
    city: this.scopeCalendar()?.cities.find(city => city.editionId === row.editionId)?.city ?? row.editionId,
    remaining: row.program.state !== 'confirmed' || !['confirmed', 'not_required'].includes(row.signup.state),
    steps: (['publication', 'program', 'signup'] as const).map(step => this.presentStep(step, row[step])),
  })));
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
  }

  protected refresh(): void {
    if (!this.selectionDisabled() && !this.publication.isBusy()) {
      this.clearScopeSelection();
      this.refreshRequested.emit();
    }
  }

  private technicalFields(error: unknown) {
    return presentEventGlobalPreviewError(error).map(field => ({ label: this.i18n.diagnostics().errorFields[field.key], value: field.value }));
  }

  private presentStep(step: GlobalPublicationStep, progress: GlobalPublicationStepProgress) {
    const copy = this.publicationCopy().signupRelease;
    const error = progress.error;
    const availabilityMessage = progress.availability ? copy.availability[progress.availability.outcome] : null;
    const showAvailability = error === null ? progress.state !== 'uncertain' : progress.availability?.outcome !== 'available';
    const fallbackMessage = showAvailability && availabilityMessage !== null ? availabilityMessage : error === null ? null : copy.unconfirmed;
    const message = error instanceof EventGlobalSignupAvailabilityError ? copy.availability[error.availability.outcome]
      : error instanceof EventGlobalProgramReadbackError
      ? copy[error.context.programStatus === EventProgramItemStatus.Approved ? 'programUnpublished' : 'programMissing']
      : error instanceof RpcError ? resolveEventProgramPublicationError(error, copy.errors) ??
        resolveEventEditionAdminErrorMessage(error, this.i18n.editionRpcErrors(), this.i18n.commonErrors().concurrentModification)
        : fallbackMessage;
    return { step, name: copy.steps[step], label: copy.states[progress.state],
      message, uncertainDetail: progress.state === 'uncertain' ? copy.uncertain : null,
      errorFields: [...this.technicalFields(error), ...(progress.availability && (error !== null || progress.state === 'uncertain') ? [{
        label: this.i18n.diagnostics().errorFields.details, value: JSON.stringify(progress.availability, null, 2),
      }] : [])] };
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
    const impact = preview.impact;
    const selection = this.scopeSelection();
    const message = this.publicationCopy().scope.confirm.replace('{{cities}}', selection.cities).replace('{{dates}}', selection.dates)
      .replace('{{planned}}', String(impact.plannedOccurrenceCount)).replace('{{already}}', String(impact.alreadyPublishedOccurrenceCount))
      .replace('{{excluded}}', String(impact.excludedSelections)).replace('{{upgrades}}', String(impact.legacyCapacityUpgrades))
      .replace('{{activate}}', this.scopeActivationCities() || this.i18n.commonValues().notApplicable);
    this.observePublication(this.confirmRelease(message, true));
  }

  protected confirmPublication(): void {
    if (!this.canPublish()) return;
    const coreId = this.coreId();
    this.observePublication(this.publication.prepare(coreId).pipe(switchMap(preview => {
      if (!preview.valid) {
        this.toast.warn({ summary: this.i18n.diagnostics().statuses.blocked,
          detail: this.publicationBlockers().map(blocker => blocker.message).join(' ') });
        return EMPTY;
      }
      const message = this.publicationCopy().confirm
        .replace('{{cities}}', String(preview.impact.affectedCityCount))
        .replace('{{occurrences}}', String(preview.impact.publishableOccurrenceCount))
        .replace('{{past}}', String(preview.impact.preservedPastDraftOccurrences));
      return this.confirmRelease(message + (preview.policyDraftRevision > 0 ? ' ' + this.publicationCopy().policyDraft : ''), false);
    })));
  }

  private confirmRelease(message: string, scoped: boolean): Observable<IEventCoreDetail | null> {
    const coreId = this.coreId();
    this.scopeDecisionPending.set(true);
    return this.confirm.modalDecision({
      header: scoped ? this.publicationCopy().scope.confirmQuestion : this.publicationCopy().confirmQuestion,
      message, acceptLabel: this.publicationLabels().publish, rejectLabel: this.i18n.commonActions().cancel,
    }).pipe(switchMap(accepted => {
      if (accepted && coreId === this.coreId() && this.isAdmin()) return this.publication.publish();
      this.publication.cancelConfirmation();
      return EMPTY;
    }), finalize(() => this.scopeDecisionPending.set(false)));
  }

  private observePublication(request: Observable<IEventCoreDetail | null>): void {
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: core => {
        if (core) this.acceptPublication(core);
        else this.toast.danger({ summary: this.publicationError() ?? this.publicationCopy().blocked });
      },
      error: () => {
        const snapshot = this.snapshot();
        if (snapshot) this.readback.emit(snapshot);
        this.toast.show(this.publication.resultUncertain() ? 'warn' : 'danger', {
          summary: this.publicationError() ?? this.i18n.commonErrors().generic,
        });
      },
    });
  }

  protected retryPublicationReadback(occurrenceId?: string): void {
    if (this.scopeDecisionPending()) return;
    this.observePublication(this.publication.retryReadback(occurrenceId));
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
        this.refreshRequested.emit();
      }
    });
  }

  private acceptPublication(core: IEventCoreDetail): void {
    if (!this.publication.verified()) {
      const snapshot = this.snapshot();
      if (snapshot) this.readback.emit(snapshot);
      return;
    }
    this.toast.success({ summary: this.publicationCopy().signupRelease.verified });
    this.scopeEditionIds.set([]);
    this.scopeDateIds.set([]);
    this.published.emit(core);
  }
}
