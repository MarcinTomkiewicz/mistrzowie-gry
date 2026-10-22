import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { finalize, from, ignoreElements, of, switchMap, tap } from 'rxjs';

import { Breadcrumbs } from '../../../../common/breadcrumbs/breadcrumbs';
import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import type { IEventCoreDetail } from '../../../../core/interfaces/i-event-admin';
import { EventAdmin } from '../../../../core/services/event-admin/event-admin';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import type { BreadcrumbItem } from '../../../../core/types/breadcrumb';
import { setControlEnabled } from '../../../../core/utils/form-controls';
import { normalizeText } from '../../../../core/utils/normalize-text';
import { requiredTrimmedValidator } from '../../../../core/validators/required-trimmed.validator';
import { resolveEventCoreAdminErrorMessage } from '../event-admin-errors';
import { createEventCoreEditorI18n } from './core-editor.i18n';
import { EventCoreEditions } from './event-core-editions';
import { EventGlobalDraftController } from './event-global-draft-controller';
import { EventGlobalDraftSummary } from './event-global-draft-summary';

@Component({
  selector: 'app-event-core-editor',
  imports: [ReactiveFormsModule, ButtonModule, IftaLabelModule, InputTextModule, TextareaModule,
    ToggleSwitchModule, EventCoreEditions, EventGlobalDraftSummary, LoadingOverlay, Breadcrumbs],
  templateUrl: './core-editor.html',
  providers: [provideTranslocoScope('adminEvents', 'common'), EventGlobalDraftController],
})
export class EventCoreEditor {
  private readonly destroyRef = inject(DestroyRef);
  private readonly eventAdmin = inject(EventAdmin);
  private readonly router = inject(Router);
  private readonly toast = inject(UiToast);
  private readonly route = inject(ActivatedRoute);
  private readonly coreId = this.route.snapshot.paramMap.get('coreId') ?? '';
  protected readonly globalDraft = inject(EventGlobalDraftController);
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly core = signal<IEventCoreDetail | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly loadErrorMessage = signal<string | null>(null);
  protected readonly isNotFound = signal(false);
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
    this.loadCore();
  }

  protected loadCore(): void {
    this.isLoading.set(true);
    this.core.set(null);
    this.loadErrorMessage.set(null);
    this.isNotFound.set(false);
    this.globalDraft.readCore(this.coreId)
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
    this.eventAdmin.saveCore({
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
