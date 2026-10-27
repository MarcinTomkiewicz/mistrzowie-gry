import { Component, computed, DestroyRef, ElementRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { distinctUntilChanged, finalize, from, ignoreElements, map, Observable, of, Subscription, switchMap, tap } from 'rxjs';

import { Breadcrumbs } from '../../../../common/breadcrumbs/breadcrumbs';
import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import type { IEventCoreDetail } from '../../../../core/interfaces/i-event-admin';
import type { AdminGlobalEventPageFieldError } from '../../../../core/interfaces/i-admin-global-event-preview';
import { EventAdmin } from '../../../../core/services/event-admin/event-admin';
import { Platform } from '../../../../core/services/platform/platform';
import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import type { BreadcrumbItem } from '../../../../core/types/breadcrumb';
import { setControlEnabled } from '../../../../core/utils/form-controls';
import { normalizeText } from '../../../../core/utils/normalize-text';
import { scrollElementIntoViewWhenReady } from '../../../../core/utils/scroll';
import { requiredTrimmedValidator } from '../../../../core/validators/required-trimmed.validator';
import { resolveEventCoreAdminErrorMessage } from '../event-admin-errors';
import { createEventCoreEditorI18n } from './core-editor.i18n';
import { EventCoreEditions } from './event-core-editions';
import { EventGlobalDraftController } from './event-global-draft-controller';
import { EventGlobalDraftSummary } from './event-global-draft-summary';
import { EventDatedBlocksEditor } from './event-dated-blocks-editor';
import { EventGlobalDiagnostics } from './event-global-diagnostics';
import { EventDatedBlocksController } from './event-dated-blocks-controller';
import { EventGlobalSteps } from './event-global-steps';

@Component({
  selector: 'app-event-core-editor',
  imports: [ReactiveFormsModule, ButtonModule, IftaLabelModule, InputTextModule, TextareaModule,
    ToggleSwitchModule, EventCoreEditions, EventGlobalDraftSummary, EventDatedBlocksEditor, EventGlobalDiagnostics,
    LoadingOverlay, Breadcrumbs, EventGlobalSteps],
  templateUrl: './core-editor.html',
  providers: [provideTranslocoScope('adminEvents', 'common'), EventDatedBlocksController],
})
export class EventCoreEditor {
  protected readonly datedBlocks = inject(EventDatedBlocksController);
  private readonly platform = inject(Platform);
  private readonly confirm = inject(UiConfirm);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly eventAdmin = inject(EventAdmin);
  private readonly router = inject(Router);
  private readonly toast = inject(UiToast);
  private readonly route = inject(ActivatedRoute);
  private readonly coreId = signal('');
  private loadSubscription: Subscription | null = null;
  private saveSubscription: Subscription | null = null;
  protected readonly globalDraft = inject(EventGlobalDraftController);
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly core = signal<IEventCoreDetail | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly loadErrorMessage = signal<string | null>(null);
  protected readonly isNotFound = signal(false);
  protected readonly navigationLocked = computed(() => this.globalDraft.isChecking() || this.globalDraft.cityBusy() ||
    this.globalDraft.cityState() !== 'idle' || this.datedBlocks.isBusy() || this.datedBlocks.readbackPending());
  protected readonly breadcrumbs = computed<BreadcrumbItem[]>(() => [
    { label: this.i18n.commonNav().eventsManagement, path: '/admin/content/events' },
    { label: this.core()?.name ?? this.i18n.page().editTitle },
  ]);
  protected readonly form = new FormGroup({
    key: new FormControl('', { nonNullable: true,
      validators: [Validators.required, requiredTrimmedValidator(), Validators.pattern(/^[a-z0-9-]+$/)] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, requiredTrimmedValidator()] }),
    shortDescription: new FormControl('', { nonNullable: true }),
    longDescription: new FormControl('', { nonNullable: true }),
    isActive: new FormControl(false, { nonNullable: true }),
    hasPublicPage: new FormControl(false, { nonNullable: true }),
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
      this.form.reset();
      this.form.enable({ emitEvent: false });
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
          this.core.set(core);
          this.isNotFound.set(core === null);
          if (core && !this.globalDraft.calendar()) this.populateForm(core);
        },
        error: (error: unknown) => {
          const detail = resolveEventCoreAdminErrorMessage(error, this.i18n.rpcErrors(), this.i18n.commonErrors().concurrentModification);
          this.core.set(null);
          this.loadErrorMessage.set(detail);
          this.toast.danger({ summary: this.i18n.page().loadErrorTitle, detail });
        },
      });
  }

  protected saveCore(): void {
    const current = this.core();
    if (!current || this.globalDraft.calendar() || this.isSaving() || this.isLoading()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.danger({ summary: this.i18n.commonForm().invalidSummary, detail: this.i18n.commonForm().invalid });
      return;
    }
    const value = this.form.getRawValue();
    this.isSaving.set(true);
    this.saveSubscription = this.eventAdmin.saveCore({
      id: current.id, key: current.key, name: value.name.trim(),
      shortDescription: normalizeText(value.shortDescription), longDescription: normalizeText(value.longDescription),
      isActive: value.isActive,
      hasPublicPage: this.globalDraft.isUnreleasedStaffing() ? current.hasPublicPage : value.hasPublicPage,
      displayOrder: current.displayOrder,
    }).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.isSaving.set(false))).subscribe({
      next: (core) => {
        this.core.set(core);
        this.populateForm(core);
        this.toast.success({ summary: this.i18n.toast().saveSuccessSummary, detail: this.i18n.toast().saveSuccessDetail });
      },
      error: (error: unknown) => this.toast.danger({
        summary: this.i18n.toast().saveFailedSummary,
        detail: resolveEventCoreAdminErrorMessage(error, this.i18n.rpcErrors(), this.i18n.commonErrors().concurrentModification),
      }),
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
    if (this.isSaving() || this.globalDraft.isChecking() || this.globalDraft.cityBusy() ||
      this.globalDraft.cityState() === 'uncertain' || this.datedBlocks.isBusy()) return false;
    if (!this.hasUnsavedChanges()) return true;
    const city = this.globalDraft.cityEditing();
    return this.confirm.modalDecision({
      header: city ? this.i18n.city().action : this.form.dirty ? this.i18n.page().editTitle : this.i18n.datedBlocks().editTitle,
      message: city ? this.i18n.city().leaveConfirmation : this.i18n.creation().leaveConfirmation,
      acceptLabel: city ? this.i18n.city().discard : this.i18n.creation().discardDraft,
      rejectLabel: this.i18n.commonActions().cancel,
    }).pipe(map(accepted => accepted && !this.destroyRef.destroyed && !this.isSaving() && !this.navigationLocked()));
  }

  private hasUnsavedChanges(): boolean {
    return this.form.dirty ||
      (this.globalDraft.cityEditing() && this.globalDraft.cityState() !== 'created' && this.globalDraft.cityForm.dirty) ||
      (this.datedBlocks.isDirty() && !this.datedBlocks.readbackPending());
  }

  private populateForm(core: IEventCoreDetail): void {
    this.form.reset({
      key: core.key, name: core.name, shortDescription: core.shortDescription ?? '',
      longDescription: core.longDescription ?? '', isActive: core.isActive, hasPublicPage: core.hasPublicPage,
    });
    setControlEnabled(this.form.controls.hasPublicPage, !this.globalDraft.isUnreleasedStaffing());
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }
}
