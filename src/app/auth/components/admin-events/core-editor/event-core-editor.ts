import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, DestroyRef, effect, ElementRef, inject, linkedSignal, signal, untracked, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router, type RouterStateSnapshot } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TextareaModule } from 'primeng/textarea';
import { catchError, distinctUntilChanged, EMPTY, filter, finalize, from, map, Observable, of, Subscription, switchMap, tap } from 'rxjs';

import { Breadcrumbs } from '../../../../common/breadcrumbs/breadcrumbs';
import { CharacterCounter } from '../../../../common/character-counter/character-counter';
import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import { findEventGlobalDraftStepError } from '../../../../core/factories/event-global-draft-form.factory';
import type { AdminGlobalEventPageFieldError, AdminGlobalEventPagePreview } from '../../../../core/interfaces/i-admin-global-event-preview';
import type { IEventCoreDetail } from '../../../../core/interfaces/i-event-admin';
import type { EventGlobalSavedSnapshot } from '../../../../core/interfaces/i-event-global-saved-summary';
import { Platform } from '../../../../core/services/platform/platform';
import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { createScopedObjectI18n } from '../../../../core/translations/scoped.i18n';
import type { CoreCoverCopy } from '../../../../core/types/i18n/admin-events';
import type { EventAdminTimelineCopy } from '../../../../core/types/i18n/event-admin-timeline';
import { RpcError } from '../../../../core/types/rpc-error';
import type { BreadcrumbItem } from '../../../../core/types/breadcrumb';
import { scrollElementIntoViewWhenReady } from '../../../../core/utils/scroll';
import { resolveEventCoreAdminErrorMessage, resolveEventEditionAdminErrorMessage } from '../event-admin-errors';
import { createEventCoreEditorI18n } from './core-editor.i18n';
import { EventCoreEditions } from './event-core-editions';
import { EventGlobalDraftController } from './event-global-draft-controller';
import { EventGlobalDraftFields } from './event-global-draft-fields';
import { EventGlobalDraftReview } from './event-global-draft-review';
import { EventGlobalDraftSummary } from './event-global-draft-summary';
import { EventGlobalSavedSummary } from './event-global-saved-summary';
import { EventGlobalSaveController } from './event-global-save-controller';
import { EventGlobalSaveSummary } from './event-global-save-summary';
import { EventGlobalPublicationController } from './event-global-publication-controller';
import { EventDatedBlocksEditor } from './event-dated-blocks-editor';
import { EventGlobalDiagnostics } from './event-global-diagnostics';
import { EventGlobalDiagnosticMessages, selectEventGlobalDiagnosticIssues } from './event-global-diagnostic-messages';
import { EventDatedBlocksController } from './event-dated-blocks-controller';
import { EventGlobalSteps } from './event-global-steps';
import { EventCoreMetadataController, type EventMetadataTarget } from './event-core-metadata-controller';
import { EventGlobalCityFields } from './event-global-city-fields';
import { EventCoreCover } from './event-core-cover';
import { EventCoreCoverController } from './event-core-cover-controller';
import { EventGlobalScheduleController } from './event-global-schedule-controller';
import { EventGlobalScheduleEditor } from './event-global-schedule-editor';
import { EventGlobalBaseTimeBlocksController } from './event-global-base-time-blocks-controller';
import { EventGlobalBaseTimeBlocksEditor } from './event-global-base-time-blocks-editor';
import { EventGlobalPolicyFacade } from './policy/event-global-policy-facade';
import { EventGlobalPolicyEditor } from './policy/event-global-policy-editor';
import { EventGlobalProgram } from './event-global-program';
import { EventManualProgramController } from './event-manual-program-controller';

const DIAGNOSTIC_SECTIONS: Record<AdminGlobalEventPageFieldError['field'], { step: number; selector: string }> = {
  coreDraft: { step: 1, selector: '#global-event-core' },
  editionDrafts: { step: 2, selector: '#event-core-editions' },
  selectedDate: { step: 3, selector: '#global-event-schedule-diagnostics' },
  calendarDraft: { step: 3, selector: '#global-event-schedule-diagnostics' },
  policy: { step: 4, selector: '#global-event-policy' },
  cityOverrides: { step: 4, selector: '#global-event-policy' },
};

@Component({
  selector: 'app-event-core-editor',
  imports: [NgTemplateOutlet, ReactiveFormsModule, ButtonModule, InputTextModule, TextareaModule, MessageModule, CharacterCounter,
    EventCoreEditions, EventGlobalDraftSummary, EventGlobalSavedSummary, EventGlobalSaveSummary, EventDatedBlocksEditor, EventGlobalDiagnostics, EventGlobalDiagnosticMessages, EventGlobalProgram,
    LoadingOverlay, Breadcrumbs, EventGlobalSteps, EventGlobalDraftFields, EventGlobalDraftReview, EventGlobalCityFields,
    EventCoreCover, EventGlobalScheduleEditor, EventGlobalBaseTimeBlocksEditor, EventGlobalPolicyEditor],
  templateUrl: './core-editor.html',
  providers: [provideTranslocoScope('adminEvents', 'common'), EventDatedBlocksController, EventCoreMetadataController,
    EventCoreCoverController, EventGlobalScheduleController, EventGlobalBaseTimeBlocksController, EventGlobalPolicyFacade, EventManualProgramController,
    EventGlobalPublicationController, EventGlobalSaveController],
})
export class EventCoreEditor {
  protected readonly saveChanges = inject(EventGlobalSaveController);
  private readonly draftFields = viewChild(EventGlobalDraftFields);
  protected readonly datedBlocks = inject(EventDatedBlocksController);
  protected readonly schedule = inject(EventGlobalScheduleController);
  protected readonly baseBlocks = inject(EventGlobalBaseTimeBlocksController);
  protected readonly policy = inject(EventGlobalPolicyFacade);
  protected readonly program = inject(EventManualProgramController);
  protected readonly publication = inject(EventGlobalPublicationController);
  private readonly platform = inject(Platform);
  private readonly confirm = inject(UiConfirm);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly metadata = inject(EventCoreMetadataController);
  protected readonly cover = inject(EventCoreCoverController);
  private readonly router = inject(Router);
  private readonly toast = inject(UiToast);
  private readonly route = inject(ActivatedRoute);
  private readonly coreId = signal<string | null>(null);
  protected readonly isNew = computed(() => this.coreId() === '');
  private coreUrl = this.router.url;
  private loadSubscription: Subscription | null = null;
  private saveSubscription: Subscription | null = null;
  protected readonly globalDraft = inject(EventGlobalDraftController);
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly coverCopy = createScopedObjectI18n<CoreCoverCopy>('adminEvents', 'editor.cover');
  private readonly programCopy = createScopedObjectI18n<EventAdminTimelineCopy['manualProgram']>('adminEvents', 'timeline.manualProgram');
  protected readonly core = this.metadata.core;
  private readonly diagnosticRead = computed(() => {
    // Diagnostics cover the whole Core; navigation selections do not change their data context.
    return [this.coreId(), this.core(), this.globalDraft.calendar(), this.globalDraft.policy(), this.globalDraft.mainEdition(),
      this.schedule.calendar(), this.baseBlocks.calendar(), this.datedBlocks.calendar(), this.policy.draft(),
      this.saveChanges.dirty(), this.cover.dirty()] as const;
  });
  private diagnosticRequestRead: ReturnType<typeof this.diagnosticRead> | null = null;
  protected readonly diagnosticResult = linkedSignal<AdminGlobalEventPagePreview | null>(() => {
    this.diagnosticRead();
    return null;
  });
  protected readonly diagnosticSteps = computed(() => [...new Set(this.diagnosticResult()?.fieldErrors
    .map(issue => DIAGNOSTIC_SECTIONS[issue.field].step) ?? [])]);
  protected readonly isLoading = signal(true);
  private readonly creating = signal(false);
  protected readonly isSaving = computed(() => this.creating() || this.saveChanges.busy());
  protected readonly scheduleValidationAttempted = signal(false);
  protected readonly createLabel = computed(() => this.globalDraft.state() === 'created' ? this.i18n.creation().retryRead
    : this.globalDraft.state() === 'uncertain' ? this.i18n.creation().retryCreation : this.i18n.commonActions().saveDraft);
  protected readonly loadErrorMessage = signal<string | null>(null);
  protected readonly isNotFound = signal(false);
  protected readonly canCancel = computed(() => this.isNew() ? !this.creating() && this.globalDraft.state() !== 'uncertain'
    : !this.saveChanges.busy() && !this.saveChanges.pending() && !this.publication.isBusy() && !this.program.isBusy() && (!this.program.readbackPending() || this.program.canAbandon()) && !this.metadata.locked() && !this.globalDraft.isChecking() && !this.globalDraft.cityBusy() &&
    this.globalDraft.cityState() !== 'uncertain' && !this.policy.isBusy() && !this.datedBlocks.isBusy() && !this.schedule.isBusy() && !this.baseBlocks.isBusy() &&
    (!this.cover.locked() || this.cover.canAbandon()));
  private readonly otherOperationsLocked = computed(() => this.isLoading() && this.core() !== null || this.saveChanges.busy() || this.saveChanges.pending() || this.publication.isBusy() || this.cover.locked() || this.metadata.locked() || this.globalDraft.isChecking() || this.globalDraft.cityBusy() ||
    this.cover.needsReconciliation() || this.policy.isBusy() || this.schedule.isBusy() || this.baseBlocks.isBusy() ||
    this.globalDraft.cityState() !== 'idle' || this.datedBlocks.isBusy() || this.datedBlocks.readbackPending());
  protected readonly navigationLocked = computed(() => this.isNew() ? this.creating() || this.globalDraft.state() !== 'idle'
    : this.otherOperationsLocked() || this.program.locked());
  protected readonly breadcrumbs = computed<BreadcrumbItem[]>(() => [
    { label: this.i18n.commonNav().eventsManagement, path: '/admin/content/events' },
    { label: this.isNew() ? this.i18n.page().createTitle : this.core()?.name ?? this.i18n.page().editTitle },
  ]);
  protected readonly form = this.metadata.coreForm;
  protected readonly selectedMainEdition = computed(() => {
    const edition = this.globalDraft.selectedEdition();
    return edition !== null && edition.id === this.globalDraft.calendar()?.mainEditionId;
  });
  protected readonly metadataTarget = computed<EventMetadataTarget | null>(() => {
    if (this.isNew() || this.core()?.archived) return null;
    return this.globalDraft.activeStep() === 1
      ? 'core' : this.globalDraft.activeStep() === 2 && this.selectedMainEdition() ? 'edition' : null;
  });
  protected readonly metadataError = computed(() => {
    const target = this.metadataTarget();
    const error = target ? this.metadata.errors()[target] : undefined;
    if (!target || error === undefined) return null;
    if (this.metadata.pendingTarget() === target) {
      if (this.metadata.state() === 'saved') return this.i18n.metadata().readbackFailed;
      if (this.metadata.state() === 'uncertain') return this.i18n.metadata().uncertain;
    }
    if (this.metadata.issues()[target] === 'conflict') return this.i18n.metadata().conflict;
    if (error instanceof RpcError && error.code === '23514') return this.i18n.metadata().protected;
    return target === 'core' ? resolveEventCoreAdminErrorMessage(error, this.i18n.rpcErrors(), this.i18n.commonErrors().concurrentModification)
      : resolveEventEditionAdminErrorMessage(error, this.i18n.editionRpcErrors(), this.i18n.commonErrors().concurrentModification);
  });

  constructor() {
    effect(() => {
      if (!this.saveChanges.busy() && this.saveChanges.failed() && (this.saveChanges.completed().length || this.saveChanges.pending())) {
        untracked(() => this.loadCore(undefined, false));
      }
    });
    effect(() => {
      const error = this.globalDraft.editionReadError();
      if (error !== null) untracked(() => this.toast.danger({
        summary: resolveEventEditionAdminErrorMessage(error, this.i18n.editionRpcErrors(), this.i18n.commonErrors().concurrentModification),
      }));
    });
    this.route.paramMap.pipe(
      map(params => params.get('coreId') ?? ''),
      distinctUntilChanged(),
      switchMap(coreId => {
        if (coreId === this.coreId()) return EMPTY;
        const decision = this.coreId() !== null ? this.canDeactivate() : true;
        return (typeof decision === 'boolean' ? of(decision) : decision).pipe(map(accepted => ({ coreId, accepted })));
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(({ coreId, accepted }) => {
      if (!accepted) {
        void this.router.navigateByUrl(this.coreUrl, { replaceUrl: true });
        return;
      }
      this.loadSubscription?.unsubscribe();
      this.saveSubscription?.unsubscribe();
      this.coreId.set(coreId);
      this.coreUrl = this.router.url;
      if (this.globalDraft.result()?.coreId !== coreId) this.globalDraft.reset();
      this.saveChanges.reset();
      this.program.reset();
      this.publication.reset();
      this.cover.reset();
      this.scheduleValidationAttempted.set(false);
      this.restoreStep(this.route.snapshot.queryParamMap.get('step'));
      this.loadCore();
    });
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      if ((this.route.snapshot.paramMap.get('coreId') ?? '') === this.coreId()) this.restoreStep(params.get('step'));
    });
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(event => {
      if ((this.route.snapshot.paramMap.get('coreId') ?? '') === this.coreId()) this.coreUrl = event.urlAfterRedirects;
    });
    this.destroyRef.onDestroy(this.platform.onWindow('beforeunload', event => {
      if (this.isNew() && this.globalDraft.state() === 'created') return;
      if (!this.hasUnsavedChanges() && this.canCancel() && !this.cover.locked()) return;
      event.preventDefault();
      event.returnValue = '';
    }));
  }

  protected loadCore(saved?: EventGlobalSavedSnapshot, hydrateForms = true): void {
    this.invalidateDiagnostics();
    this.loadSubscription?.unsubscribe();
    const coreId = this.coreId();
    if (!coreId) { this.isLoading.set(false); return; }
    this.isLoading.set(true);
    if (hydrateForms) this.core.set(null);
    this.loadErrorMessage.set(null);
    this.isNotFound.set(false);
    const recovering = !saved && hydrateForms && (!this.publication.needsReadback() || this.publication.needsRecovery());
    this.loadSubscription = (saved ? of(saved) : recovering ? this.publication.recover(coreId) : this.publication.readSnapshot(coreId))
      .pipe(
        catchError((error: unknown) => {
          const snapshot = this.publication.snapshot();
          if (!recovering || !snapshot) throw error;
          this.toast.warn({ summary: this.i18n.globalPublication().readbackFailed });
          return of(snapshot);
        }),
        switchMap(snapshot => {
          if (snapshot) this.acceptSavedReadback(snapshot);
          if (hydrateForms) this.metadata.load(snapshot?.core ?? null);
          if (!snapshot) return of(null);
          return snapshot.core.archived || !hydrateForms ? of(snapshot.core)
            : this.saveChanges.load(snapshot.core, snapshot.policyDraft).pipe(map(() => snapshot.core));
        }),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (core) => {
          if (core === null) this.core.set(null);
          if (core && !core.archived) this.cover.reconcile(core);
          this.isNotFound.set(core === null);
        },
        error: (error: unknown) => {
          const detail = resolveEventCoreAdminErrorMessage(error, this.i18n.rpcErrors(), this.i18n.commonErrors().concurrentModification);
          if (hydrateForms) this.core.set(null);
          this.loadErrorMessage.set(detail);
          this.toast.danger({ summary: this.i18n.page().loadErrorTitle, detail });
        },
      });
  }

  protected discardEditChanges(): void {
    if (!this.canCancel() || this.saveChanges.pending()) return;
    const coreId = this.coreId();
    this.confirm.modalDecision({
      header: this.i18n.saveChanges().discardConfirmQuestion, message: this.i18n.saveChanges().discardConfirm,
      acceptLabel: this.i18n.creation().discardDraft, rejectLabel: this.i18n.commonActions().cancel,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(accepted => {
      if (!accepted || coreId !== this.coreId() || !this.canCancel() || this.saveChanges.pending()) return;
      this.saveChanges.reset();
      this.loadCore();
    });
  }

  protected goBack(): void {
    if (!this.canCancel()) return;
    void this.router.navigate(['/admin/content/events']);
  }

  protected acceptPublication(core: IEventCoreDetail): void {
    const snapshot = this.publication.snapshot();
    if (!snapshot || snapshot.core.id !== core.id) return;
    if (this.saveChanges.dirty()) {
      this.acceptSavedReadback(snapshot);
      this.cover.reconcile(core);
    }
    else this.loadCore(snapshot);
  }

  protected acceptSavedReadback(snapshot: EventGlobalSavedSnapshot): void {
    if (snapshot.core.id !== this.coreId()) return;
    this.core.set(snapshot.core);
    this.globalDraft.calendar.set(snapshot.calendar);
    this.globalDraft.policy.set(snapshot.policy);
    this.globalDraft.mainEdition.set(snapshot.edition);
    const selectedId = this.globalDraft.selectedEditionId();
    if (!snapshot.calendar.cities.some(city => city.editionId === selectedId)) this.globalDraft.syncEditionSelection(snapshot.calendar, snapshot.edition);
    else if (selectedId === snapshot.edition.id) this.globalDraft.selectedEdition.set(snapshot.edition);
    this.invalidateDiagnostics();
  }

  protected programBlocked(): boolean {
    return this.otherOperationsLocked() || this.loadErrorMessage() !== null || this.publication.needsReadback() || this.saveChanges.dirty() ||
      this.cover.dirty() || this.globalDraft.cityEditing();
  }

  private restoreStep(value: string | null): void {
    const step = Number(value);
    if (this.isNew() && step > this.globalDraft.reachedStep()) return;
    if (Number.isInteger(step) && step >= 1 && step <= 6 && !this.navigationLocked() && !this.cover.dirty()) this.globalDraft.activeStep.set(step);
  }

  protected goToStep(step: number): void {
    if (!Number.isInteger(step) || step < 1 || step > 6 || this.navigationLocked() || this.cover.dirty()) return;
    if (this.isNew()) {
      if (step > this.globalDraft.reachedStep()) {
        for (let current = 1; current < step; current++) {
          if (!this.validateDraftStep(current)) return;
        }
      }
      this.globalDraft.reachedStep.update(reached => Math.max(reached, step));
    }
    this.showStep(step);
  }

  private showStep(step: number): void {
    this.globalDraft.activeStep.set(step);
    void this.router.navigate([], {
      relativeTo: this.route, queryParams: { step }, queryParamsHandling: 'merge', replaceUrl: true,
    });
  }

  protected acceptDiagnostics(result: AdminGlobalEventPagePreview | null): void {
    if (result === null) {
      this.diagnosticResult.set(null);
      this.diagnosticRequestRead = this.diagnosticRead();
    } else if (result.coreId === this.core()?.id && this.diagnosticRequestRead === this.diagnosticRead()) {
      this.diagnosticResult.set(result);
    }
  }

  protected invalidateDiagnostics(): void {
    this.diagnosticRequestRead = null;
    this.diagnosticResult.set(null);
  }

  protected diagnosticIssues(fields: readonly AdminGlobalEventPageFieldError['field'][], editionId?: string) {
    return selectEventGlobalDiagnosticIssues(this.diagnosticResult()?.fieldErrors ?? [], fields, editionId);
  }

  protected goToDiagnosticSection(issue: AdminGlobalEventPageFieldError): void {
    if (this.navigationLocked() || !this.diagnosticResult()?.fieldErrors.some(value => value === issue)) return;
    if ('editionId' in issue) {
      if (!this.globalDraft.calendar()?.cities.some(city => city.editionId === issue.editionId)) return;
      if (this.globalDraft.selectedEditionId() !== issue.editionId) this.globalDraft.selectEdition(issue.editionId);
    }
    const section = DIAGNOSTIC_SECTIONS[issue.field];
    this.goToStep(section.step);
    scrollElementIntoViewWhenReady(() => {
      if (this.destroyRef.destroyed || this.globalDraft.activeStep() !== section.step) return null;
      const selector = issue.field === 'cityOverrides' ? '#policy-city-' + issue.editionId : section.selector;
      const target = this.host.nativeElement.querySelector<HTMLElement>(selector);
      target?.focus({ preventScroll: true });
      return target;
    }, { behavior: 'smooth', block: 'center' });
  }

  canDeactivate(nextState?: RouterStateSnapshot): boolean | Observable<boolean> {
    if (this.isNew()) {
      if (this.globalDraft.state() === 'created') return true;
      if (this.creating() || this.globalDraft.state() === 'uncertain') return false;
      if (this.globalDraft.form.pristine) return true;
      return this.confirm.modalDecision({
        header: this.i18n.creation().leaveConfirmationQuestion,
        message: this.i18n.creation().leaveConfirmation,
        acceptLabel: this.i18n.creation().discardDraft, acceptIcon: 'pi pi-vacuum-cleaner',
        rejectLabel: this.i18n.commonActions().cancel,
      }).pipe(map(accepted => accepted && !this.destroyRef.destroyed && !this.creating() && this.globalDraft.state() === 'idle'));
    }
    let nextRoute = nextState?.root ?? null;
    while (nextRoute?.firstChild) nextRoute = nextRoute.firstChild;
    // A reused editor resolves the Core transition before resetting its controllers.
    if (nextRoute?.routeConfig === this.route.routeConfig) return true;
    if (!this.canCancel()) return false;
    const coreId = this.coreId();
    const endingProgram = this.program.canAbandon();
    const endingCover = this.cover.canAbandon();
    const decision = endingProgram ? this.confirm.modalDecision({
      header: this.programCopy().abandonConfirmQuestion, message: this.programCopy().abandonConfirm,
      acceptLabel: this.programCopy().abandon, rejectLabel: this.i18n.commonActions().cancel,
    }) : endingCover ? this.confirm.modalDecision({
      header: this.cover.state() === 'cleanup' ? this.coverCopy().abandonCleanupConfirmQuestion : this.coverCopy().abandonConfirmQuestion,
      message: this.cover.state() === 'cleanup' ? this.coverCopy().abandonCleanupConfirm : this.coverCopy().abandonConfirm,
      acceptLabel: this.coverCopy().abandonAction,
      rejectLabel: this.i18n.commonActions().cancel,
    }) : of(true);
    return decision.pipe(switchMap(accepted => {
      if (!accepted || this.destroyRef.destroyed || this.coreId() !== coreId || !this.canCancel()) return of(false);
      if (endingProgram && !this.program.abandon()) return of(false);
      if (endingCover && !this.cover.abandon()) return of(false);
      if (!this.hasUnsavedChanges()) return of(!this.cover.locked());
      const city = this.globalDraft.cityEditing();
      return this.confirm.modalDecision({
        header: this.program.locked() ? this.programCopy().discardConfirmQuestion : this.policy.locked() ? this.i18n.policyEditor().leaveQuestion : this.baseBlocks.locked() ? this.i18n.baseTimeBlocks().leaveQuestion
          : this.schedule.locked() ? this.i18n.schedule().leaveQuestion : city ? this.i18n.city().leaveConfirmationQuestion : this.i18n.creation().leaveConfirmationQuestion,
        message: this.program.locked() ? this.programCopy().discardConfirm : this.policy.locked() ? this.i18n.policyEditor().leave : this.baseBlocks.locked() ? this.i18n.baseTimeBlocks().leave : this.schedule.locked() ? this.i18n.schedule().leave
          : city ? this.i18n.city().leaveConfirmation : this.i18n.creation().leaveConfirmation,
        acceptLabel: this.program.locked() || this.policy.locked() || this.baseBlocks.locked() || this.schedule.locked() ? this.i18n.commonActions().close : city ? this.i18n.city().discard : this.i18n.creation().discardDraft,
        rejectLabel: this.i18n.commonActions().cancel,
      }).pipe(map(leave => leave && !this.destroyRef.destroyed && this.coreId() === coreId && this.canCancel() && !this.cover.locked()));
    }));
  }

  private hasUnsavedChanges(): boolean {
    if (this.isNew()) return this.globalDraft.form.dirty || this.globalDraft.state() === 'uncertain';
    return this.program.locked() || this.saveChanges.dirty() || this.saveChanges.pending() || this.cover.dirty() ||
      (this.globalDraft.cityEditing() && this.globalDraft.cityState() !== 'created' && this.globalDraft.cityForm.dirty) ||
      (this.datedBlocks.isDirty() && !this.datedBlocks.readbackPending());
  }

  protected submitDraft(): void {
    if (!this.isNew() || this.globalDraft.activeStep() !== 6 || this.creating()) return;
    if (this.globalDraft.state() === 'idle') {
      for (let step = 1; step <= 4; step++) {
        if (!this.validateDraftStep(step)) return;
      }
    }
    this.creating.set(true);
    this.saveSubscription = this.globalDraft.create().pipe(
      tap(() => this.toast.success({ summary: this.i18n.toast().saveSuccessSummary, detail: this.i18n.toast().saveSuccessDetail })),
      switchMap(core => from(this.router.navigate(['/admin/content/events', core.id, 'edit'], {
        replaceUrl: true, queryParams: { step: this.globalDraft.activeStep() },
      }))),
      tap(navigated => {
        if (!navigated) throw new Error('[EVENT_GLOBAL_DRAFT] Saved Core navigation failed.');
      }),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.creating.set(false)),
    ).subscribe({
      error: (error: unknown) => {
        const state = this.globalDraft.state();
        if (state === 'uncertain') this.toast.warn({ summary: this.i18n.creation().uncertain });
        else this.toast.danger({ summary: this.i18n.toast().saveFailedSummary,
          detail: state === 'created' ? this.i18n.creation().readbackFailed : resolveEventCoreAdminErrorMessage(
            error, this.i18n.rpcErrors(), this.i18n.commonErrors().concurrentModification),
        });
      },
    });
  }

  private validateDraftStep(step: number): boolean {
    if (step === 3) this.scheduleValidationAttempted.set(true);
    const field = findEventGlobalDraftStepError(this.globalDraft.form, step);
    if (!field) return true;
    this.showStep(step);
    this.toast.danger({ summary: this.i18n.commonForm().invalidSummary, detail: this.i18n.commonForm().invalid });
    scrollElementIntoViewWhenReady(() => {
      if (this.destroyRef.destroyed || this.globalDraft.activeStep() !== step) return null;
      const target = this.draftFields()?.fieldElement(field);
      target?.focus({ preventScroll: true });
      return target;
    }, { block: 'center' });
    return false;
  }
}
