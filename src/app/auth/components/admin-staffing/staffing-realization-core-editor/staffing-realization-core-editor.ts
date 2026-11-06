import { Location } from '@angular/common';
import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TextareaModule } from 'primeng/textarea';
import { finalize, map, Observable, of, Subscription } from 'rxjs';

import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import { STATUS_BADGE_CLASS } from '../../../../core/configs/badge-class.config';
import { DEFAULT_STAFFING_STATIONARY_CITY } from '../../../../core/configs/staffing-realization.config';
import {
  createStaffingRealizationCoreForm,
  mapStaffingRealizationCoreToDraft,
  mapStaffingRealizationCoreFormToCreatePayload,
  mapStaffingRealizationCoreFormToUpdatePayload,
  populateStaffingRealizationCoreForm,
} from '../../../../core/factories/staffing-realization-core-form.factory';
import {
  createStaffingRealizationInitialDaysForm,
  mapStaffingRealizationInitialDaysFormToInput,
} from '../../../../core/factories/staffing-realization-initial-days-form.factory';
import { StaffingRealizationEditorFacade } from '../../../../core/facades/staffing/staffing-realization-editor-facade';
import { AdminStaffingRealizationCore } from '../../../../core/interfaces/admin-staffing-realization';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { createStaffingSaveLabel, STAFFING_SCOPE } from '../../../../core/translations/staffing.i18n';
import { StaffingRealizationType } from '../../../../core/types/staffing-realization';
import { RpcError } from '../../../../core/types/rpc-error';
import { setControlEnabled, setControlValue } from '../../../../core/utils/form-controls';
import { normalizeText } from '../../../../core/utils/normalize-text';
import { getStaffingCoreFormError } from '../staffing-realization-form-errors';
import { createStaffingRealizationCoreEditorI18n } from './staffing-realization-core-editor.i18n';
import { StaffingRealizationDatesAndDemand } from './staffing-realization-dates-and-demand';
import { StaffingReadinessTarget } from '../staffing-readiness-target';

@Component({
  selector: 'app-staffing-realization-core-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    FloatLabelModule,
    InputTextModule,
    MessageModule,
    TextareaModule,
    LoadingOverlay,
    StaffingRealizationDatesAndDemand,
    StaffingReadinessTarget,
  ],
  templateUrl: './staffing-realization-core-editor.html',
  providers: [
    provideTranslocoScope('adminStaffing', STAFFING_SCOPE, 'common'),
  ],
})
export class StaffingRealizationCoreEditor {
  private readonly destroyRef = inject(DestroyRef);
  private readonly editor = inject(StaffingRealizationEditorFacade);
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(UiToast);

  private loadSubscription: Subscription | null = null;

  protected realizationId =
    this.route.parent?.snapshot.paramMap.get('realizationId') ?? '';
  protected readonly isNew = !this.realizationId;
  protected readonly i18n = createStaffingRealizationCoreEditorI18n();
  protected readonly form = createStaffingRealizationCoreForm();
  protected readonly initialDaysForm =
    createStaffingRealizationInitialDaysForm();
  protected readonly realization = this.editor.store.realization;
  protected readonly statusBadgeClass = STATUS_BADGE_CLASS;
  protected readonly saveLabel = createStaffingSaveLabel(
    () => this.isNew ? undefined : this.realization()?.status,
    () => this.isNew ? this.i18n.actions().createDraft : this.i18n.commonActions().save,
  );
  protected readonly days = computed(() => this.editor.store.scheduleDraft() ?? []);
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly isEventActionRunning = signal(false);
  protected readonly eventImport = computed(() => this.editor.eventImportState(this.realization()?.id ?? ''));
  protected readonly importPending = computed(() => this.eventImport() !== null);
  protected readonly readbackOnly = computed(() => this.eventImport()?.phase === 'uncertain' || this.eventImport()?.phase === 'readback');
  protected readonly eventImportMessage = computed(() => {
    const phase = this.eventImport()?.phase;
    return phase ? this.i18n.event()[phase === 'retry' ? 'unlinked' : phase === 'readback' ? 'readbackFailed' : phase] : null;
  });
  protected readonly eventActionUnavailable = computed(() => {
    const current = this.realization();
    return current && !current.eventId && (!this.importPending() || this.eventImport()?.phase === 'retry') && current.status !== 'open' && current.status !== 'closed'
      ? this.i18n.event().errors.EFS092_REALIZATION_NOT_CONVERTIBLE : null;
  });
  protected readonly eventActionError = signal<string | null>(null);
  protected readonly eventActionLabel = computed(() => {
    if (this.realization()?.eventId) return this.i18n.actions().openEvent;
    const phase = this.eventImport()?.phase;
    return phase === 'uncertain' || phase === 'readback' ? this.i18n.event().retryRead
      : phase === 'retry' ? this.i18n.event().retryImport : this.i18n.actions().createEvent;
  });
  protected readonly isBusy = computed(() =>
    this.isLoading() || this.isSaving() || this.isEventActionRunning() || this.editor.eventImportBusy(this.realization()?.id ?? ''),
  );
  protected readonly hasUnsavedChanges = this.editor.store.hasUnsavedChanges;
  protected readonly loadErrorMessage = signal<string | null>(null);

  constructor() {
    effect(() => {
      setControlEnabled(this.form, !this.isBusy() && !this.importPending());
      this.form.controls.eventId.disable({ emitEvent: false });
    });
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      if (!this.isNew && this.editor.store.coreDraft() !== null) {
        this.editor.store.setCoreDraft(this.form.getRawValue());
      }
    });
    this.route.parent?.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.realizationId = params.get('realizationId') ?? '';
      this.loadEditor();
    });
  }

  protected loadEditor(): void {
    this.loadSubscription?.unsubscribe();
    this.isLoading.set(true);
    this.loadErrorMessage.set(null);
    this.eventActionError.set(null);

    this.loadSubscription = (this.isNew ? of(void 0) : this.editor.load(this.realizationId))
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: () => {
          const draft = this.editor.store.coreDraft();
          if (!this.isNew && draft) {
            populateStaffingRealizationCoreForm(this.form, draft);
            if (this.editor.store.hasCoreChanges()) {
              this.form.markAsDirty();
            }
          }
        },
        error: () => {
          const copy = this.i18n.page();

          this.loadErrorMessage.set(copy.loadErrorDescription);
          this.toast.danger({
            summary: copy.loadErrorTitle,
            detail: copy.loadErrorDescription,
          });
        },
      });
  }

  protected selectType(type: StaffingRealizationType): void {
    if (this.isBusy() || this.importPending()) return;
    const { city, type: typeControl } = this.form.controls;

    if (
      this.isNew && typeControl.getRawValue() === 'stationary' && type === 'travel' &&
      city.pristine && city.getRawValue() === DEFAULT_STAFFING_STATIONARY_CITY
    ) {
      city.setValue('');
    }
    if (type === 'stationary' && !normalizeText(city.getRawValue())) {
      city.setValue(DEFAULT_STAFFING_STATIONARY_CITY);
    }
    setControlValue(typeControl, type);
  }

  protected currentStatusLabel(): string {
    return this.i18n.realizationStatuses()[
      this.realization()?.status ?? 'draft'
    ];
  }

  protected save(): void {
    if (this.isBusy() || this.importPending()) return;

    const initialDaysInvalid = this.isNew && this.initialDaysForm.invalid;

    if (this.form.invalid || initialDaysInvalid) {
      this.form.markAllAsTouched();
      if (this.isNew) {
        this.initialDaysForm.markAllAsTouched();
      }

      const detail = getStaffingCoreFormError(
        this.form,
        this.isNew ? this.initialDaysForm : null,
        this.i18n.validation(),
        this.i18n.staffingLabels().requiredGmCount,
        this.i18n.commonForm(),
      );
      if (detail) {
        this.toast.danger({
          summary: this.i18n.commonForm().invalidSummary,
          detail,
        });
      }

      return;
    }

    const current = this.isNew ? null : this.realization();
    if (!this.isNew && !current) {
      return;
    }

    const saveRequest: Observable<{
      realization: AdminStaffingRealizationCore;
      created: boolean;
    }> = current
      ? this.editor.update(
          current.id,
          mapStaffingRealizationCoreFormToUpdatePayload(this.form, current),
        ).pipe(map((realization) => ({ realization, created: false })))
      : this.editor.create(
          mapStaffingRealizationCoreFormToCreatePayload(
            this.form,
            mapStaffingRealizationInitialDaysFormToInput(this.initialDaysForm),
          ),
        ).pipe(
          map((result) => ({
            realization: result.realization,
            created: true,
          })),
        );

    this.isSaving.set(true);
    saveRequest
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (result) => {
          const savedRealization = result.realization;
          if (!result.created && this.realizationId !== savedRealization.id) {
            return;
          }
          populateStaffingRealizationCoreForm(
            this.form,
            mapStaffingRealizationCoreToDraft(savedRealization),
          );
          this.toast.success({
            summary: this.i18n.toast().saveSuccessSummary,
            detail: this.i18n.commonStatus().changesSaved,
          });

          if (result.created) {
            void this.router.navigate([
              '/admin/staffing',
              result.realization.id,
              'edit',
            ]);
          }
        },
        error: () => {
          this.toast.danger({
            summary: this.i18n.toast().saveFailedSummary,
            detail: this.i18n.commonErrors().changesNotSaved,
          });
        },
      });
  }

  protected openEvent(): void {
    const current = this.realization();
    if (this.isNew || !current || this.isBusy() || this.eventActionUnavailable() || (!this.readbackOnly() && this.hasUnsavedChanges())) return;

    this.isEventActionRunning.set(true);
    this.eventActionError.set(null);
    this.editor.getOrCreateEvent(current).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.isEventActionRunning.set(false);
      }),
    ).subscribe({
      next: ({ eventCoreId }) => {
        if (this.realizationId !== current.id) return;
        const draft = this.editor.store.coreDraft();
        if (draft) populateStaffingRealizationCoreForm(this.form, draft);
        if (this.hasUnsavedChanges()) return;
        void this.router.navigate(['/admin/content/events', eventCoreId, 'edit']);
      },
      error: (error: unknown) => {
        const copy = this.i18n.event();
        const state = this.editor.eventImportState(current.id);
        if (state?.phase === 'retry') return;
        const rpcMessage = error instanceof RpcError ? copy.errors[error.message] ?? copy.errors[error.code] : undefined;
        const detail = rpcMessage ?? (state ? copy.readbackFailed : this.i18n.commonErrors().generic);
        this.eventActionError.set(detail);
        this.toast.danger({ summary: this.i18n.toast().eventActionFailedSummary, detail });
      },
    });
  }

  protected cancel(): void {
    if (this.isBusy()) return;
    this.editor.store.reset();
    this.location.back();
  }
}
