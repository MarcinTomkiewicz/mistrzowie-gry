import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { finalize, forkJoin, of } from 'rxjs';

import {
  createEventEditionForm,
  mapEventEditionFormToPayload,
  populateEventEditionForm,
} from '../../../../core/factories/event-edition-form.factory';
import {
  IAdminEventDetail,
  IAdminOccurrenceListItem,
  IEventCoreDetail,
} from '../../../../core/interfaces/i-event-admin';
import { EventAdmin } from '../../../../core/services/event-admin/event-admin';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import type { BreadcrumbItem } from '../../../../core/types/breadcrumb';
import { FileUploadImageChange } from '../../../../core/types/file-upload';
import {
  resolveEventEditionAdminErrorMessage,
} from '../event-admin-errors';
import { stringToSlug } from '../../../../core/utils/normalize-text';
import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import { Breadcrumbs } from '../../../../common/breadcrumbs/breadcrumbs';
import { createEventEditionEditorI18n } from './edition-editor.i18n';
import { EventEditionDetailsEditor } from './event-edition-details-editor';
import { EventEditionOccurrences } from './event-edition-occurrences/event-edition-occurrences';
import { EventEditionSettingsEditor } from './event-edition-settings-editor';
import { EventScheduleEditor } from './event-schedule-editor';
import { OccurrenceEditor } from './occurrence-editor';

@Component({
  selector: 'app-event-edition-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    LoadingOverlay,
    Breadcrumbs,
    EventEditionDetailsEditor,
    EventEditionOccurrences,
    EventEditionSettingsEditor,
    EventScheduleEditor,
    OccurrenceEditor,
  ],
  templateUrl: './event-edition-editor.html',
  providers: [provideTranslocoScope('adminEvents', 'common')],
})
export class EventEditionEditor {
  private readonly eventAdmin = inject(EventAdmin);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(UiToast);
  private readonly detailsEditor = viewChild(EventEditionDetailsEditor);
  private readonly coverFile = signal<File | null>(null);
  private readonly navigationState =
    this.router.getCurrentNavigation()?.extras.state;
  private readonly navigationCore = this.navigationState?.[
    'eventCore'
  ] as IEventCoreDetail | undefined;
  private readonly navigationEdition = this.navigationState?.[
    'eventEdition'
  ] as IAdminEventDetail | undefined;

  protected readonly coreId =
    this.route.snapshot.paramMap.get('coreId') ?? '';
  protected readonly eventId =
    this.route.snapshot.paramMap.get('eventId') ?? '';
  protected readonly isNew = !this.eventId;
  protected readonly i18n = createEventEditionEditorI18n();
  protected readonly core = signal<IEventCoreDetail | null>(null);
  protected readonly edition = signal<IAdminEventDetail | null>(null);
  protected readonly selectedOccurrence =
    signal<IAdminOccurrenceListItem | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly loadErrorMessage = signal<string | null>(null);
  protected readonly isNotFound = signal(false);
  protected readonly breadcrumbs = computed<BreadcrumbItem[]>(() => [
    {
      label: this.i18n.commonNav().eventsManagement,
      path: '/admin/content/events',
    },
    {
      label: this.core()?.name ?? this.i18n.commonLabels().event,
      path: `/admin/content/events/${this.coreId}/edit`,
    },
    {
      label: this.isNew
        ? this.i18n.page().createTitle
        : this.edition()?.city ?? this.i18n.page().editTitle,
    },
  ]);
  protected readonly form = createEventEditionForm(this.coreId);

  constructor() {
    this.form.controls.city.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((city) => this.syncGeneratedSlug(city));

    this.loadScreenData();
  }

  protected loadScreenData(): void {
    this.isLoading.set(true);
    this.loadErrorMessage.set(null);
    this.isNotFound.set(false);

    const initialCore =
      this.navigationCore?.id === this.coreId
        ? this.navigationCore
        : null;
    const initialEdition =
      this.navigationEdition?.id === this.eventId &&
      this.navigationEdition.eventCoreId === this.coreId
        ? this.navigationEdition
        : null;

    forkJoin({
      core: initialCore
        ? of(initialCore)
        : this.eventAdmin.getCoreDetail(this.coreId),
      edition: this.isNew
        ? of<IAdminEventDetail | null>(null)
        : initialEdition
          ? of(initialEdition)
          : this.eventAdmin.getEditionDetail(this.eventId),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ core, edition }) => {
          if (
            !core ||
            (!this.isNew &&
              (!edition || edition.eventCoreId !== core.id))
          ) {
            this.core.set(null);
            this.edition.set(null);
            this.isNotFound.set(true);
            return;
          }

          this.core.set(core);
          this.edition.set(edition);
          populateEventEditionForm(this.form, core.id, edition);

          if (this.isNew) {
            this.syncGeneratedSlug(this.form.controls.city.value);
          }
        },
        error: (error) => {
          const detail = resolveEventEditionAdminErrorMessage(
            error,
            this.i18n.rpcErrors(),
            this.i18n.commonErrors().concurrentModification,
          );

          this.core.set(null);
          this.edition.set(null);
          this.loadErrorMessage.set(detail);
          this.toast.danger({
            summary: this.i18n.page().loadErrorTitle,
            detail,
          });
        },
      });
  }

  protected editOccurrence(occurrence: IAdminOccurrenceListItem): void {
    this.selectedOccurrence.set(occurrence);
  }

  protected closeOccurrenceEditor(): void {
    this.selectedOccurrence.set(null);
  }

  protected onOccurrenceSaved(detail: IAdminEventDetail): void {
    this.edition.set(detail);
    this.selectedOccurrence.set(null);
  }

  protected saveEdition(): void {
    if (this.isSaving() || this.isLoading()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.danger({
        summary: this.i18n.commonForm().invalidSummary,
        detail: this.i18n.commonForm().invalid,
      });

      return;
    }

    this.isSaving.set(true);
    this.form.disable({ emitEvent: false });

    this.eventAdmin
      .saveEditionWithCover(
        mapEventEditionFormToPayload(
          this.form,
          this.edition(),
        ),
        this.coverFile(),
        this.edition()?.coverImagePath ?? null,
      )
      .pipe(finalize(() => {
        this.form.enable({ emitEvent: false });
        this.isSaving.set(false);
      }))
      .subscribe({
        next: (result) => {
          if (result.coverCleanupFailed) {
            this.toast.warn({
              summary: this.i18n.cover().cleanupFailedSummary,
              detail: this.i18n.cover().cleanupFailedDetail,
            });
          }

          if (result.status === 'failed') {
            this.toast.danger({
              summary: result.phase === 'upload'
                ? this.i18n.cover().uploadFailedSummary
                : this.i18n.toast().saveFailedSummary,
              detail: result.phase === 'upload'
                ? this.i18n.cover().uploadFailedDetail
                : resolveEventEditionAdminErrorMessage(
                    result.error,
                    this.i18n.rpcErrors(),
                    this.i18n.commonErrors().concurrentModification,
                  ),
            });
            return;
          }

          const savedEdition = result.edition;
          this.edition.set(savedEdition);
          populateEventEditionForm(
            this.form,
            savedEdition.eventCoreId,
            savedEdition,
          );
          this.coverFile.set(null);
          this.detailsEditor()?.resetCoverSelection();
          this.toast.success({
            summary: this.i18n.toast().saveSuccessSummary,
            detail: this.i18n.toast().saveSuccessDetail,
          });

          if (this.isNew) {
            void this.router.navigate(
              [
                '/admin/content/events',
                savedEdition.eventCoreId,
                'editions',
                savedEdition.id,
                'edit',
              ],
              {
                state: {
                  eventCore: this.core(),
                  eventEdition: savedEdition,
                },
              },
            );
          }
        },
      });
  }

  protected onCoverChanged(change: FileUploadImageChange): void {
    const edition = this.edition();
    if (!edition || this.isSaving()) {
      return;
    }

    this.coverFile.set(change.kind === 'select' ? change.file : null);
    const control = this.form.controls.coverImagePath;
    control.setValue(change.kind === 'remove' ? edition.coverImagePath ?? '' : '');

    if (change.kind === 'remove') {
      control.markAsPristine();
    } else {
      control.markAsDirty();
    }
  }

  protected goBack(): void {
    if (this.isSaving()) {
      return;
    }
    void this.router.navigate(['/admin/content/events', this.coreId, 'edit']);
  }

  private syncGeneratedSlug(city: string): void {
    const core = this.core();

    if (!this.isNew || this.edition() || !core) {
      return;
    }

    this.form.controls.slug.setValue(
      stringToSlug(`${core.name} ${city}`),
      { emitEvent: false },
    );
  }
}
