import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, DestroyRef, effect, ElementRef, inject, signal, untracked, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router, type RouterStateSnapshot } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TextareaModule } from 'primeng/textarea';
import { distinctUntilChanged, EMPTY, filter, finalize, from, map, Observable, of, Subscription, switchMap, tap } from 'rxjs';

import { Breadcrumbs } from '../../../../common/breadcrumbs/breadcrumbs';
import { CharacterCounter } from '../../../../common/character-counter/character-counter';
import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import { findEventGlobalDraftStepError } from '../../../../core/factories/event-global-draft-form.factory';
import type { AdminGlobalEventPageFieldError } from '../../../../core/interfaces/i-admin-global-event-preview';
import type { IEventCoreDetail } from '../../../../core/interfaces/i-event-admin';
import { Platform } from '../../../../core/services/platform/platform';
import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { createScopedObjectI18n } from '../../../../core/translations/scoped.i18n';
import type { CoreCoverCopy } from '../../../../core/types/i18n/admin-events';
import type { EventAdminTimelineCopy } from '../../../../core/types/i18n/event-admin-timeline';
import type { EventGlobalScheduleCopy } from '../../../../core/types/i18n/event-global-draft';
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
import { EventGlobalPublicationController } from './event-global-publication-controller';
import { EventDatedBlocksEditor } from './event-dated-blocks-editor';
import { EventGlobalDiagnostics } from './event-global-diagnostics';
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
import { EventEditionHistory } from '../edition-editor/event-edition-history';
import { EventEditionSummary } from '../edition-editor/event-edition-summary';

@Component({
  selector: 'app-event-core-editor',
  imports: [NgTemplateOutlet, ReactiveFormsModule, ButtonModule, InputTextModule, TextareaModule, MessageModule, CharacterCounter,
    EventEditionSummary, EventCoreEditions, EventGlobalDraftSummary, EventGlobalSavedSummary, EventDatedBlocksEditor, EventGlobalDiagnostics, EventGlobalProgram,
    LoadingOverlay, Breadcrumbs, EventGlobalSteps, EventGlobalDraftFields, EventGlobalDraftReview, EventGlobalCityFields,
    EventCoreCover, EventGlobalScheduleEditor, EventGlobalBaseTimeBlocksEditor, EventGlobalPolicyEditor],
  templateUrl: './core-editor.html',
  providers: [provideTranslocoScope('adminEvents', 'common'), EventDatedBlocksController, EventCoreMetadataController,
    EventCoreCoverController, EventGlobalScheduleController, EventGlobalBaseTimeBlocksController, EventGlobalPolicyFacade, EventManualProgramController,
    EventGlobalPublicationController, EventEditionHistory],
})
export class EventCoreEditor {
  protected readonly history = inject(EventEditionHistory);
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
  protected readonly scheduleCopy = createScopedObjectI18n<EventGlobalScheduleCopy>('adminEvents', 'editor.schedule');
  protected readonly core = this.metadata.core;
  protected readonly isLoading = signal(true);
  private readonly creating = signal(false);
  protected readonly isSaving = computed(() => this.creating() || this.metadata.isBusy());
  protected readonly scheduleValidationAttempted = signal(false);
  protected readonly createLabel = computed(() => this.globalDraft.state() === 'created' ? this.i18n.creation().retryRead
    : this.globalDraft.state() === 'uncertain' ? this.i18n.creation().retryCreation : this.i18n.commonActions().saveDraft);
  protected readonly loadErrorMessage = signal<string | null>(null);
  protected readonly isNotFound = signal(false);
  protected readonly canCancel = computed(() => this.isNew() ? !this.creating() && this.globalDraft.state() !== 'uncertain'
    : !this.publication.locked() && !this.program.isBusy() && (!this.program.readbackPending() || this.program.canAbandon()) && !this.metadata.locked() && !this.globalDraft.isChecking() && !this.globalDraft.cityBusy() &&
    this.globalDraft.cityState() !== 'uncertain' && !this.policy.isBusy() && !this.datedBlocks.isBusy() && !this.schedule.isBusy() && !this.baseBlocks.isBusy() &&
    (!this.cover.locked() || this.cover.canAbandon()));
  private readonly otherOperationsLocked = computed(() => this.publication.locked() || this.cover.locked() || this.metadata.locked() || this.globalDraft.isChecking() || this.globalDraft.cityBusy() ||
    this.cover.needsReconciliation() || this.policy.locked() || this.schedule.locked() || this.baseBlocks.locked() ||
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
    if (this.isNew() || this.core()?.archived || !this.metadata.isGlobal()) return null;
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
      const core = this.core();
      const global = this.metadata.isGlobal();
      if (core && (core.archived || !global)) untracked(() => this.history.open(core));
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
      this.datedBlocks.reset();
      this.schedule.reset();
      this.baseBlocks.reset();
      this.policy.reset();
      this.program.reset();
      this.publication.reset();
      this.cover.reset();
      this.metadata.reset();
      this.history.reset();
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

  protected loadCore(): void {
    this.loadSubscription?.unsubscribe();
    const coreId = this.coreId();
    if (!coreId) { this.isLoading.set(false); return; }
    this.isLoading.set(true);
    this.core.set(null);
    this.loadErrorMessage.set(null);
    this.isNotFound.set(false);
    this.loadSubscription = this.globalDraft.readCore(coreId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (core) => {
          this.metadata.load(core);
          if (core && !core.archived && this.metadata.isGlobal()) this.cover.reconcile(core);
          this.isNotFound.set(core === null);
        },
        error: (error: unknown) => {
          const detail = resolveEventCoreAdminErrorMessage(error, this.i18n.rpcErrors(), this.i18n.commonErrors().concurrentModification);
          this.core.set(null);
          this.loadErrorMessage.set(detail);
          this.toast.danger({ summary: this.i18n.page().loadErrorTitle, detail });
        },
      });
  }

  protected saveMetadata(target: EventMetadataTarget): void {
    if (!this.metadata.canSave(target) || this.isLoading()) return;
    const form = target === 'core' ? this.form : this.metadata.editionForm;
    if (form.invalid && this.metadata.state() === 'idle') {
      form.markAllAsTouched();
      this.toast.danger({ summary: this.i18n.commonForm().invalidSummary, detail: this.i18n.commonForm().invalid });
      return;
    }
    this.saveSubscription = this.metadata.save(target).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.toast.success({ summary: this.i18n.toast().saveSuccessSummary, detail: this.i18n.toast().saveSuccessDetail }),
      error: (error: unknown) => this.toast.danger({
        summary: this.i18n.toast().saveFailedSummary,
        detail: this.metadataError() ?? resolveEventCoreAdminErrorMessage(error, this.i18n.rpcErrors(), this.i18n.commonErrors().concurrentModification),
      }),
    });
  }

  protected refreshMetadata(target: EventMetadataTarget): void {
    if (this.metadata.locked() || this.metadata.blocked() || this.cover.locked()) return;
    const coreId = this.core()?.id;
    const form = target === 'core' ? this.form : this.metadata.editionForm;
    const decision = form.dirty ? this.confirm.modalDecision({
      header: this.i18n.page().editTitle, message: this.i18n.metadata().reloadConfirm,
      acceptLabel: this.i18n.commonActions().refresh, rejectLabel: this.i18n.commonActions().cancel,
    }) : of(true);
    decision.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(accepted => {
      if (!accepted || this.core()?.id !== coreId || this.metadata.locked() || this.cover.locked()) return;
      this.saveSubscription = this.metadata.refresh(target).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        error: () => this.toast.danger({ summary: this.i18n.toast().saveFailedSummary, detail: this.metadataError() ?? this.i18n.metadata().readbackFailed }),
      });
    });
  }

  protected goBack(): void {
    if (!this.canCancel()) return;
    void this.router.navigate(['/admin/content/events']);
  }

  protected acceptPublication(core: IEventCoreDetail): void {
    this.metadata.load(core);
    this.cover.reconcile(core);
  }

  protected selectHistoryEdition(editionId: string): void {
    const core = this.core();
    if (core && (core.archived || !this.metadata.isGlobal()) && !this.history.loading()) this.history.open(core, editionId);
  }

  protected programBlocked(): boolean {
    return this.otherOperationsLocked() || this.form.dirty || this.metadata.editionForm.dirty ||
      this.cover.dirty() || this.datedBlocks.isDirty() || this.globalDraft.cityEditing();
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

  protected goToDiagnosticSection(field: AdminGlobalEventPageFieldError['field']): void {
    const steps: Record<AdminGlobalEventPageFieldError['field'], number> = {
      coreDraft: 1, editionDrafts: 2, selectedDate: 3, calendarDraft: 3, policy: 4, cityOverrides: 4,
    };
    this.goToStep(steps[field]);
    const sections: Record<AdminGlobalEventPageFieldError['field'], string> = {
      coreDraft: '#global-event-core',
      editionDrafts: '#event-core-editions',
      selectedDate: '#global-event-schedule-editor',
      calendarDraft: '#global-event-schedule-editor',
      policy: '#global-event-policy',
      cityOverrides: '#global-event-policy',
    };
    scrollElementIntoViewWhenReady(() => {
      const target = this.host.nativeElement.querySelector<HTMLElement>(sections[field]);
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
        header: this.i18n.page().createTitle, icon: 'pi pi-interdiction',
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
      header: this.i18n.creationSteps().program, message: this.programCopy().abandonConfirm,
      acceptLabel: this.programCopy().abandon, rejectLabel: this.i18n.commonActions().cancel,
    }) : endingCover ? this.confirm.modalDecision({
      header: this.i18n.commonLabels().cover,
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
        header: this.program.locked() ? this.i18n.creationSteps().program : this.policy.locked() ? this.i18n.policyEditor().title : this.baseBlocks.locked() ? this.i18n.baseTimeBlocks().title
          : this.schedule.locked() ? this.i18n.commonLabels().schedule : city ? this.i18n.city().action
          : this.cover.dirty() || this.form.dirty || this.metadata.editionForm.dirty ? this.i18n.page().editTitle : this.i18n.datedBlocks().editTitle,
        message: this.program.locked() ? this.programCopy().discardConfirm : this.policy.locked() ? this.i18n.policyEditor().leave : this.baseBlocks.locked() ? this.i18n.baseTimeBlocks().leave : this.schedule.locked() ? this.scheduleCopy().leave
          : city ? this.i18n.city().leaveConfirmation : this.i18n.creation().leaveConfirmation,
        acceptLabel: this.program.locked() || this.policy.locked() || this.baseBlocks.locked() || this.schedule.locked() ? this.i18n.commonActions().close : city ? this.i18n.city().discard : this.i18n.creation().discardDraft,
        rejectLabel: this.i18n.commonActions().cancel,
      }).pipe(map(leave => leave && !this.destroyRef.destroyed && this.coreId() === coreId && this.canCancel() && !this.cover.locked()));
    }));
  }

  private hasUnsavedChanges(): boolean {
    if (this.isNew()) return this.globalDraft.form.dirty || this.globalDraft.state() === 'uncertain';
    return this.program.locked() || this.policy.locked() || this.baseBlocks.locked() || this.schedule.locked() || this.cover.dirty() || this.form.dirty || this.metadata.editionForm.dirty ||
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
