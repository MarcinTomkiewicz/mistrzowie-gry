import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, DestroyRef, ElementRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { distinctUntilChanged, finalize, from, ignoreElements, map, Observable, of, Subscription, switchMap, tap } from 'rxjs';

import { Breadcrumbs } from '../../../../common/breadcrumbs/breadcrumbs';
import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import type { AdminGlobalEventPageFieldError } from '../../../../core/interfaces/i-admin-global-event-preview';
import { Platform } from '../../../../core/services/platform/platform';
import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { RpcError } from '../../../../core/types/rpc-error';
import type { BreadcrumbItem } from '../../../../core/types/breadcrumb';
import { scrollElementIntoViewWhenReady } from '../../../../core/utils/scroll';
import { resolveEventCoreAdminErrorMessage, resolveEventEditionAdminErrorMessage } from '../event-admin-errors';
import { createEventCoreEditorI18n } from './core-editor.i18n';
import { EventCoreEditions } from './event-core-editions';
import { EventGlobalDraftController } from './event-global-draft-controller';
import { EventGlobalDraftSummary } from './event-global-draft-summary';
import { EventDatedBlocksEditor } from './event-dated-blocks-editor';
import { EventGlobalDiagnostics } from './event-global-diagnostics';
import { EventDatedBlocksController } from './event-dated-blocks-controller';
import { EventGlobalSteps } from './event-global-steps';
import { EventCoreMetadataController, type EventMetadataTarget } from './event-core-metadata-controller';
import { EventGlobalCityFields } from './event-global-city-fields';

@Component({
  selector: 'app-event-core-editor',
  imports: [NgTemplateOutlet, ReactiveFormsModule, ButtonModule, IftaLabelModule, InputTextModule, TextareaModule, MessageModule,
    ToggleSwitchModule, EventCoreEditions, EventGlobalDraftSummary, EventDatedBlocksEditor, EventGlobalDiagnostics,
    LoadingOverlay, Breadcrumbs, EventGlobalSteps, EventGlobalCityFields],
  templateUrl: './core-editor.html',
  providers: [provideTranslocoScope('adminEvents', 'common'), EventDatedBlocksController, EventCoreMetadataController],
})
export class EventCoreEditor {
  protected readonly datedBlocks = inject(EventDatedBlocksController);
  private readonly platform = inject(Platform);
  private readonly confirm = inject(UiConfirm);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly metadata = inject(EventCoreMetadataController);
  private readonly router = inject(Router);
  private readonly toast = inject(UiToast);
  private readonly route = inject(ActivatedRoute);
  private readonly coreId = signal('');
  private loadSubscription: Subscription | null = null;
  private saveSubscription: Subscription | null = null;
  protected readonly globalDraft = inject(EventGlobalDraftController);
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly core = this.metadata.core;
  protected readonly isLoading = signal(true);
  protected readonly isSaving = this.metadata.isBusy;
  protected readonly loadErrorMessage = signal<string | null>(null);
  protected readonly isNotFound = signal(false);
  protected readonly navigationLocked = computed(() => this.metadata.locked() || this.globalDraft.isChecking() || this.globalDraft.cityBusy() ||
    this.globalDraft.cityState() !== 'idle' || this.datedBlocks.isBusy() || this.datedBlocks.readbackPending());
  protected readonly breadcrumbs = computed<BreadcrumbItem[]>(() => [
    { label: this.i18n.commonNav().eventsManagement, path: '/admin/content/events' },
    { label: this.core()?.name ?? this.i18n.page().editTitle },
  ]);
  protected readonly form = this.metadata.coreForm;
  protected readonly selectedMainEdition = computed(() => {
    const edition = this.globalDraft.selectedEdition();
    return edition !== null && edition.id === this.globalDraft.calendar()?.mainEditionId;
  });
  protected readonly metadataTarget = computed<EventMetadataTarget | null>(() => !this.metadata.isGlobal() || this.globalDraft.activeStep() === 1
    ? 'core' : this.globalDraft.activeStep() === 2 && this.selectedMainEdition() ? 'edition' : null);
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
    this.route.paramMap.pipe(
      map(params => params.get('coreId') ?? ''),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(coreId => {
      this.loadSubscription?.unsubscribe();
      this.saveSubscription?.unsubscribe();
      this.coreId.set(coreId);
      if (this.globalDraft.result()?.coreId !== coreId) this.globalDraft.reset();
      this.datedBlocks.reset();
      this.metadata.reset();
      this.restoreStep(this.route.snapshot.queryParamMap.get('step'));
      this.loadCore();
    });
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.restoreStep(params.get('step'));
    });
    this.destroyRef.onDestroy(this.platform.onWindow('beforeunload', event => {
      if (!this.hasUnsavedChanges() && !this.navigationLocked()) return;
      event.preventDefault();
      event.returnValue = '';
    }));
  }

  protected loadCore(): void {
    this.loadSubscription?.unsubscribe();
    this.isLoading.set(true);
    this.core.set(null);
    this.loadErrorMessage.set(null);
    this.isNotFound.set(false);
    this.loadSubscription = this.globalDraft.readCore(this.coreId())
      .pipe(
        switchMap((core) => {
          const editionId = this.globalDraft.staffingEditionId();
          const editCore = this.route.snapshot.queryParamMap.get('editCore') === '1';
          if (core === null || editionId === null || editCore) return of(core);
          return from(this.router.navigate(
            ['/admin/content/events', core.id, 'editions', editionId, 'edit'],
            { replaceUrl: true },
          )).pipe(
            tap((navigated) => {
              if (!navigated) throw new Error('[EVENT_CORE_EDITOR] Staffing Edition navigation failed.');
            }),
            ignoreElements(),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (core) => {
          this.metadata.load(core);
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
    if (this.metadata.locked() || this.metadata.blocked()) return;
    const coreId = this.core()?.id;
    const form = target === 'core' ? this.form : this.metadata.editionForm;
    const decision = form.dirty ? this.confirm.modalDecision({
      header: this.i18n.page().editTitle, message: this.i18n.metadata().reloadConfirm,
      acceptLabel: this.i18n.commonActions().refresh, rejectLabel: this.i18n.commonActions().cancel,
    }) : of(true);
    decision.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(accepted => {
      if (!accepted || this.core()?.id !== coreId || this.metadata.locked()) return;
      this.saveSubscription = this.metadata.refresh(target).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        error: () => this.toast.danger({ summary: this.i18n.toast().saveFailedSummary, detail: this.metadataError() ?? this.i18n.metadata().readbackFailed }),
      });
    });
  }

  protected goBack(): void {
    void this.router.navigate(['/admin/content/events']);
  }

  private restoreStep(value: string | null): void {
    const step = Number(value);
    if (Number.isInteger(step) && step >= 1 && step <= 6 && !this.navigationLocked()) this.globalDraft.activeStep.set(step);
  }

  protected goToStep(step: number): void {
    if (!Number.isInteger(step) || step < 1 || step > 6 || this.navigationLocked()) return;
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
      selectedDate: '#global-event-schedule',
      calendarDraft: '#global-event-schedule',
      policy: '#global-event-policy',
      cityOverrides: '#global-event-policy',
    };
    scrollElementIntoViewWhenReady(() => {
      const target = this.host.nativeElement.querySelector<HTMLElement>(sections[field]);
      target?.focus({ preventScroll: true });
      return target;
    }, { behavior: 'smooth', block: 'center' });
  }

  canDeactivate(): boolean | Observable<boolean> {
    if (this.metadata.locked() || this.globalDraft.isChecking() || this.globalDraft.cityBusy() ||
      this.globalDraft.cityState() === 'uncertain' || this.datedBlocks.isBusy()) return false;
    if (!this.hasUnsavedChanges()) return true;
    const city = this.globalDraft.cityEditing();
    return this.confirm.modalDecision({
      header: city ? this.i18n.city().action : this.form.dirty || this.metadata.editionForm.dirty ? this.i18n.page().editTitle : this.i18n.datedBlocks().editTitle,
      message: city ? this.i18n.city().leaveConfirmation : this.i18n.creation().leaveConfirmation,
      acceptLabel: city ? this.i18n.city().discard : this.i18n.creation().discardDraft,
      rejectLabel: this.i18n.commonActions().cancel,
    }).pipe(map(accepted => accepted && !this.destroyRef.destroyed && !this.isSaving() && !this.navigationLocked()));
  }

  private hasUnsavedChanges(): boolean {
    return this.form.dirty || this.metadata.editionForm.dirty ||
      (this.globalDraft.cityEditing() && this.globalDraft.cityState() !== 'created' && this.globalDraft.cityForm.dirty) ||
      (this.datedBlocks.isDirty() && !this.datedBlocks.readbackPending());
  }
}
