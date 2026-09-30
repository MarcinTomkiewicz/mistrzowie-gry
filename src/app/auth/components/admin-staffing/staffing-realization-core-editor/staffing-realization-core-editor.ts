import { Location } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { finalize, forkJoin, of } from 'rxjs';

import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import {
  createStaffingRealizationCoreForm,
  mapStaffingRealizationCoreFormToCreatePayload,
  mapStaffingRealizationCoreFormToUpdatePayload,
  populateStaffingRealizationCoreForm,
} from '../../../../core/factories/staffing-realization-core-form.factory';
import { AdminStaffingRealizationCore } from '../../../../core/interfaces/admin-staffing-realization';
import { IAdminEventListItem } from '../../../../core/interfaces/i-event-admin';
import { ISelectOption } from '../../../../core/interfaces/i-select-option';
import { AdminStaffingRealizationRead } from '../../../../core/reads/staffing/admin-staffing-realization-read';
import { EventAdmin } from '../../../../core/services/event-admin/event-admin';
import { AdminStaffingRealization } from '../../../../core/services/staffing/admin-staffing-realization';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { STAFFING_SCOPE } from '../../../../core/translations/staffing.i18n';
import { StaffingRealizationType } from '../../../../core/types/staffing-realization';
import { setControlValue } from '../../../../core/utils/form-controls';
import { joinTextParts } from '../../../../core/utils/normalize-text';
import { createStaffingRealizationCoreEditorI18n } from './staffing-realization-core-editor.i18n';

@Component({
  selector: 'app-staffing-realization-core-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    IftaLabelModule,
    InputTextModule,
    SelectModule,
    TextareaModule,
    LoadingOverlay,
  ],
  templateUrl: './staffing-realization-core-editor.html',
  providers: [
    provideTranslocoScope('adminStaffing', STAFFING_SCOPE, 'common'),
  ],
})
export class StaffingRealizationCoreEditor {
  private readonly eventAdmin = inject(EventAdmin);
  private readonly location = inject(Location);
  private readonly realizationRead = inject(AdminStaffingRealizationRead);
  private readonly realizationWrite = inject(AdminStaffingRealization);
  private readonly router = inject(Router);
  private readonly toast = inject(UiToast);

  protected readonly realizationId =
    inject(ActivatedRoute).snapshot.paramMap.get('realizationId') ?? '';
  protected readonly isNew = !this.realizationId;
  protected readonly i18n = createStaffingRealizationCoreEditorI18n();
  protected readonly form = createStaffingRealizationCoreForm();
  protected readonly realization = signal<AdminStaffingRealizationCore | null>(
    null,
  );
  protected readonly events = signal<readonly IAdminEventListItem[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly loadErrorMessage = signal<string | null>(null);

  protected readonly eventOptions = computed<ISelectOption[]>(() =>
    this.events().map((event) => ({
      value: event.id,
      label: joinTextParts([event.eventCoreName, event.city], ' — '),
    })),
  );

  constructor() {
    this.loadEditor();
  }

  protected loadEditor(): void {
    this.isLoading.set(true);
    this.loadErrorMessage.set(null);

    forkJoin({
      realization: this.isNew
        ? of<AdminStaffingRealizationCore | null>(null)
        : this.realizationRead.getDetail(this.realizationId),
      events: this.eventAdmin.getEditionList(),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ realization, events }) => {
          this.realization.set(realization);
          this.events.set(events);

          if (realization) {
            populateStaffingRealizationCoreForm(this.form, realization);
          }
        },
        error: () => {
          const copy = this.i18n.editor().page;

          this.loadErrorMessage.set(copy.loadErrorDescription);
          this.toast.danger({
            summary: copy.loadErrorTitle,
            detail: copy.loadErrorDescription,
          });
        },
      });
  }

  protected selectType(type: StaffingRealizationType): void {
    setControlValue(this.form.controls.type, type);
  }

  protected currentStatusLabel(): string {
    return this.i18n.realizationStatuses()[
      this.realization()?.status ?? 'draft'
    ];
  }

  protected save(): void {
    if (this.form.invalid || this.isSaving()) {
      this.form.markAllAsTouched();

      if (this.form.invalid) {
        this.toast.danger({
          summary: this.i18n.commonForm().invalidSummary,
          detail: this.i18n.commonForm().invalid,
        });
      }

      return;
    }

    const current = this.realization();
    if (!this.isNew && !current) {
      return;
    }

    const saveRequest = current
      ? this.realizationWrite.update(
          current.id,
          mapStaffingRealizationCoreFormToUpdatePayload(this.form, current),
        )
      : this.realizationWrite.create(
          mapStaffingRealizationCoreFormToCreatePayload(this.form),
        );

    this.isSaving.set(true);
    saveRequest
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (savedRealization) => {
          this.realization.set(savedRealization);
          populateStaffingRealizationCoreForm(this.form, savedRealization);
          this.toast.success({
            summary: this.i18n.editor().toast.saveSuccessSummary,
            detail: this.i18n.commonStatus().changesSaved,
          });

          if (this.isNew) {
            void this.router.navigate([
              '/admin/staffing',
              savedRealization.id,
              'edit',
            ]);
          }
        },
        error: () => {
          this.toast.danger({
            summary: this.i18n.editor().toast.saveFailedSummary,
            detail: this.i18n.commonErrors().changesNotSaved,
          });
        },
      });
  }

  protected cancel(): void {
    this.location.back();
  }
}
