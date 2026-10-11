import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { finalize } from 'rxjs';

import {
  IEventCoreDetail,
  IEventCoreSavePayload,
} from '../../../../core/interfaces/i-event-admin';
import { EventAdmin } from '../../../../core/services/event-admin/event-admin';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import type { BreadcrumbItem } from '../../../../core/types/breadcrumb';
import { resolveEventCoreAdminErrorMessage } from '../event-admin-errors';
import { normalizeText, stringToSlug } from '../../../../core/utils/normalize-text';
import { slugSourceValidator } from '../../../../core/validators/form-value.validator';
import {
  requiredTrimmedValidator,
} from '../../../../core/validators/required-trimmed.validator';
import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import { Breadcrumbs } from '../../../../common/breadcrumbs/breadcrumbs';
import { createEventCoreEditorI18n } from './core-editor.i18n';

@Component({
  selector: 'app-event-core-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    IftaLabelModule,
    InputTextModule,
    TextareaModule,
    ToggleSwitchModule,
    RouterLink,
    LoadingOverlay,
    Breadcrumbs,
  ],
  templateUrl: './core-editor.html',
  providers: [provideTranslocoScope('adminEvents', 'common')],
})
export class EventCoreEditor {
  private readonly eventAdmin = inject(EventAdmin);
  private readonly router = inject(Router);
  private readonly toast = inject(UiToast);
  private readonly nameSlugSourceValidator = slugSourceValidator();

  protected readonly coreId =
    inject(ActivatedRoute).snapshot.paramMap.get('coreId') ?? '';
  protected readonly isNew = !this.coreId;
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly core = signal<IEventCoreDetail | null>(null);
  protected readonly isLoading = signal(!this.isNew);
  protected readonly isSaving = signal(false);
  protected readonly loadErrorMessage = signal<string | null>(null);
  protected readonly isNotFound = signal(false);
  protected readonly breadcrumbs = computed<BreadcrumbItem[]>(() => [
    {
      label: this.i18n.commonNav().eventsManagement,
      path: '/admin/content/events',
    },
    {
      label: this.isNew
        ? this.i18n.page().createTitle
        : this.core()?.name ?? this.i18n.page().editTitle,
    },
  ]);

  protected readonly form = new FormGroup({
    key: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        requiredTrimmedValidator(),
        Validators.pattern(/^[a-z0-9-]+$/),
      ],
    }),
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        requiredTrimmedValidator(),
        ...(this.isNew ? [this.nameSlugSourceValidator] : []),
      ],
    }),
    shortDescription: new FormControl('', { nonNullable: true }),
    longDescription: new FormControl('', { nonNullable: true }),
    isActive: new FormControl(false, { nonNullable: true }),
    hasPublicPage: new FormControl(false, { nonNullable: true }),
  });

  constructor() {
    this.form.controls.name.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((name) => this.syncGeneratedKey(name));

    if (!this.isNew) {
      this.loadCore();
    }
  }

  protected loadCore(): void {
    this.isLoading.set(true);
    this.loadErrorMessage.set(null);
    this.isNotFound.set(false);

    this.eventAdmin
      .getCoreDetail(this.coreId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (core) => {
          if (!core) {
            this.core.set(null);
            this.isNotFound.set(true);
            return;
          }

          this.core.set(core);
          this.populateForm(core);
        },
        error: (error) => {
          const detail = resolveEventCoreAdminErrorMessage(
            error,
            this.i18n.rpcErrors(),
            this.i18n.commonErrors().concurrentModification,
          );

          this.core.set(null);
          this.loadErrorMessage.set(detail);
          this.toast.danger({
            summary: this.i18n.page().loadErrorTitle,
            detail,
          });
        },
      });
  }

  protected saveCore(): void {
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

    const value = this.form.getRawValue();
    const payload: IEventCoreSavePayload = {
      id: this.core()?.id ?? null,
      key: this.core()?.key ?? value.key,
      name: value.name.trim(),
      shortDescription: normalizeText(value.shortDescription),
      longDescription: normalizeText(value.longDescription),
      isActive: value.isActive,
      hasPublicPage: value.hasPublicPage,
      displayOrder: this.core()?.displayOrder ?? 0,
    };

    this.isSaving.set(true);

    this.eventAdmin
      .saveCore(payload)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (savedCore) => {
          this.core.set(savedCore);
          this.populateForm(savedCore);
          this.toast.success({
            summary: this.i18n.toast().saveSuccessSummary,
            detail: this.i18n.toast().saveSuccessDetail,
          });

          if (this.isNew) {
            void this.router.navigate([
              '/admin/content/events',
              savedCore.id,
              'edit',
            ]);
          }
        },
        error: (error) => {
          this.toast.danger({
            summary: this.i18n.toast().saveFailedSummary,
            detail: resolveEventCoreAdminErrorMessage(
              error,
              this.i18n.rpcErrors(),
              this.i18n.commonErrors().concurrentModification,
            ),
          });
        },
      });
  }

  protected goBack(): void {
    void this.router.navigate(['/admin/content/events']);
  }

  private populateForm(core: IEventCoreDetail): void {
    this.form.controls.name.removeValidators(this.nameSlugSourceValidator);
    this.form.reset({
      key: core.key,
      name: core.name,
      shortDescription: core.shortDescription ?? '',
      longDescription: core.longDescription ?? '',
      isActive: core.isActive,
      hasPublicPage: core.hasPublicPage,
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  private syncGeneratedKey(name: string): void {
    if (this.isNew && !this.core()) {
      this.form.controls.key.setValue(stringToSlug(name), {
        emitEvent: false,
      });
    }
  }
}
