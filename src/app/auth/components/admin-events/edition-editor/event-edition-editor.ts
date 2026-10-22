import { Component, DestroyRef, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { distinctUntilChanged, finalize, Subscription } from 'rxjs';

import {
  createEventEditionForm, mapEventEditionFormToPayload, populateEventEditionForm,
} from '../../../../core/factories/event-edition-form.factory';
import type { IAdminEventDetail, IAdminOccurrenceListItem } from '../../../../core/interfaces/i-event-admin';
import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import type { BreadcrumbItem } from '../../../../core/types/breadcrumb';
import type { FileUploadImageChange } from '../../../../core/types/file-upload';
import { formatTimestampLabel } from '../../../../core/utils/date';
import { stringToSlug } from '../../../../core/utils/normalize-text';
import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import { Breadcrumbs } from '../../../../common/breadcrumbs/breadcrumbs';
import {
  resolveEventEditionAdminErrorMessage, resolveEventPublicationErrorMessage,
} from '../event-admin-errors';
import { EventAdminTimeline } from '../event-admin-timeline/event-admin-timeline';
import { createEventEditionEditorI18n } from './edition-editor.i18n';
import { EventEditionDetailsEditor } from './event-edition-details-editor';
import { EventEditionOccurrences } from './event-edition-occurrences/event-edition-occurrences';
import { EventEditionSettingsEditor } from './event-edition-settings-editor';
import { EventScheduleEditor } from './event-schedule-editor';
import { OccurrenceEditor } from './occurrence-editor';
import { EventEditionEditorFacade } from './event-edition-editor-facade';

@Component({
  selector: 'app-event-edition-editor',
  imports: [
    ReactiveFormsModule, ButtonModule, MessageModule, RouterLink, LoadingOverlay, Breadcrumbs,
    EventEditionDetailsEditor, EventEditionOccurrences, EventEditionSettingsEditor,
    EventScheduleEditor, OccurrenceEditor, EventAdminTimeline,
  ],
  templateUrl: './event-edition-editor.html',
  providers: [EventEditionEditorFacade, provideTranslocoScope('adminEvents', 'common')],
})
export class EventEditionEditor {
  private readonly facade = inject(EventEditionEditorFacade);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(UiToast);
  private readonly confirm = inject(UiConfirm);
  private readonly detailsEditor = viewChild(EventEditionDetailsEditor);
  private readonly coverFile = signal<File | null>(null);
  private loadSubscription: Subscription | null = null;
  private operationSubscription: Subscription | null = null;

  protected readonly coreId = signal('');
  protected readonly eventId = signal('');
  protected readonly isNew = computed(() => !this.eventId());
  protected readonly i18n = createEventEditionEditorI18n();
  protected readonly core = this.facade.core;
  protected readonly edition = this.facade.edition;
  protected readonly isLoading = this.facade.isLoading;
  protected readonly isSaving = this.facade.isSaving;
  protected readonly isPublishing = this.facade.isPublishing;
  protected readonly isBusy = this.facade.isBusy;
  protected readonly isNotFound = this.facade.isNotFound;
  protected readonly privateDraftBlocked = this.facade.privateDraftBlocked;
  protected readonly publicPath = this.facade.publicPath;
  protected readonly publicationResult = this.facade.publicationResult;
  protected readonly timeline = this.facade.timeline;
  protected readonly timelineError = this.facade.timelineError;
  protected readonly isTimelineLoading = this.facade.isTimelineLoading;
  protected readonly loadErrorMessage = signal<string | null>(null);
  protected readonly selectedOccurrence = signal<IAdminOccurrenceListItem | null>(null);
  protected readonly form = createEventEditionForm(this.coreId());
  protected readonly formatTimestampLabel = formatTimestampLabel;
  protected readonly breadcrumbs = computed<BreadcrumbItem[]>(() => [
    { label: this.i18n.commonNav().eventsManagement, path: '/admin/content/events' },
    { label: this.core()?.name ?? this.i18n.commonLabels().event },
    { label: this.isNew() ? this.i18n.page().createTitle
      : this.edition()?.city ?? this.i18n.page().editTitle },
  ]);

  constructor() {
    this.form.controls.city.valueChanges.pipe(takeUntilDestroyed())
      .subscribe((city) => this.syncGeneratedSlug(city));
    this.route.paramMap.pipe(
      distinctUntilChanged((previous, current) =>
        previous.get('coreId') === current.get('coreId') &&
        previous.get('eventId') === current.get('eventId')),
      takeUntilDestroyed(),
    ).subscribe((params) => {
      this.loadSubscription?.unsubscribe();
      this.operationSubscription?.unsubscribe();
      this.coreId.set(params.get('coreId') ?? '');
      this.eventId.set(params.get('eventId') ?? '');
      this.facade.reset();
      this.selectedOccurrence.set(null);
      this.coverFile.set(null);
      this.detailsEditor()?.resetCoverSelection();
      populateEventEditionForm(this.form, this.coreId(), null);
      this.loadScreenData();
    });
  }

  protected loadScreenData(): void {
    if (this.isSaving() || this.isPublishing()) return;
    this.loadSubscription?.unsubscribe();
    this.loadErrorMessage.set(null);
    this.loadSubscription = this.facade.load(this.coreId(), this.eventId()).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => this.populateForm(),
      error: (error: unknown) => {
        const detail = resolveEventEditionAdminErrorMessage(
          error, this.i18n.rpcErrors(), this.i18n.commonErrors().concurrentModification,
        );
        this.loadErrorMessage.set(detail);
        this.toast.danger({ summary: this.i18n.page().loadErrorTitle, detail });
      },
    });
  }

  protected editOccurrence(occurrence: IAdminOccurrenceListItem): void {
    if (!this.isBusy()) this.selectedOccurrence.set(occurrence);
  }

  protected closeOccurrenceEditor(): void {
    this.selectedOccurrence.set(null);
  }

  protected reloadTimeline(): void {
    this.facade.reloadTimeline();
  }

  protected onOccurrenceSaved(detail: IAdminEventDetail): void {
    if (detail.id !== this.eventId() || detail.eventCoreId !== this.coreId()) return;
    this.facade.updateEdition(detail);
    this.closeOccurrenceEditor();
  }

  protected saveEdition(): void {
    if (this.isBusy()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.danger({ summary: this.i18n.commonForm().invalidSummary,
        detail: this.i18n.commonForm().invalid });
      return;
    }
    this.form.disable({ emitEvent: false });
    this.operationSubscription = this.facade.save(
      mapEventEditionFormToPayload(this.form, this.edition()), this.coverFile(),
    ).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.form.enable({ emitEvent: false })),
    ).subscribe((result) => {
      if (result.coverCleanupFailed) {
        this.toast.warn({ summary: this.i18n.cover().cleanupFailedSummary,
          detail: this.i18n.cover().cleanupFailedDetail });
      }
      if (result.status === 'failed') {
        this.toast.danger({
          summary: result.phase === 'upload' ? this.i18n.cover().uploadFailedSummary
            : this.i18n.toast().saveFailedSummary,
          detail: result.phase === 'upload' ? this.i18n.cover().uploadFailedDetail
            : resolveEventEditionAdminErrorMessage(result.error, this.i18n.rpcErrors(),
              this.i18n.commonErrors().concurrentModification),
        });
        return;
      }
      this.populateForm();
      this.toast.success({ summary: this.i18n.toast().saveSuccessSummary,
        detail: this.i18n.toast().saveSuccessDetail });
      if (this.isNew()) {
        void this.router.navigate(['/admin/content/events', result.edition.eventCoreId,
          'editions', result.edition.id, 'edit']);
      }
    });
  }

  protected hasUnsavedChanges(): boolean {
    return this.form.dirty || this.coverFile() !== null;
  }

  protected canPublish(): boolean {
    return !this.destroyRef.destroyed && this.matchesLoadedRoute() &&
      !!this.edition()?.isStaffingConverted && !this.isBusy() &&
      !this.hasUnsavedChanges() && !this.selectedOccurrence() && !this.privateDraftBlocked();
  }

  protected confirmPublication(event: Event): void {
    if (!this.canPublish()) return;
    const coreId = this.coreId();
    const eventId = this.eventId();
    const copy = this.i18n.publication();
    this.confirm.decision(event, {
      message: this.edition()?.isStaffingReleased ? copy.repeatConfirm : copy.confirm,
      acceptLabel: copy.publish,
      rejectLabel: this.i18n.commonActions().cancel,
      accept: () => {
        if (coreId === this.coreId() && eventId === this.eventId() && this.canPublish()) {
          this.publish();
        }
      },
    });
  }

  private publish(): void {
    if (!this.canPublish()) return;
    this.form.disable({ emitEvent: false });
    this.operationSubscription = this.facade.publish(this.coreId(), this.eventId()).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.form.enable({ emitEvent: false })),
    ).subscribe({
      next: (result) => {
        this.populateForm();
        const copy = this.i18n.publication();
        this.toast.success({ summary: result.published ? copy.success : copy.alreadyPublished,
          detail: result.alreadyPublished && !result.currentlyPublic ? copy.stillPrivate : undefined });
      },
      error: (error: unknown) => {
        const copy = this.i18n.publication();
        if (this.publicationResult()) {
          this.loadErrorMessage.set(copy.reloadFailed);
          this.toast.warn({ summary: copy.reloadFailed });
        } else {
          this.toast.danger({ summary: copy.failed,
            detail: resolveEventPublicationErrorMessage(error, copy.errors) });
        }
      },
    });
  }

  protected onCoverChanged(change: FileUploadImageChange): void {
    const edition = this.edition();
    if (!edition || this.isBusy()) return;
    this.coverFile.set(change.kind === 'select' ? change.file : null);
    const control = this.form.controls.coverImagePath;
    control.setValue(change.kind === 'remove' ? edition.coverImagePath ?? '' : '');
    if (change.kind === 'remove') control.markAsPristine();
    else control.markAsDirty();
  }

  protected goBack(): void {
    if (!this.isBusy()) {
      void this.router.navigate(['/admin/content/events']);
    }
  }

  private matchesLoadedRoute(): boolean {
    const params = this.route.snapshot.paramMap;
    const coreId = params.get('coreId') ?? '';
    const eventId = params.get('eventId') ?? '';
    const edition = this.edition();
    return !!eventId && coreId === this.coreId() && eventId === this.eventId() &&
      this.core()?.id === coreId && edition?.id === eventId && edition.eventCoreId === coreId;
  }

  private populateForm(): void {
    const core = this.core();
    if (!core) return;
    populateEventEditionForm(this.form, core.id, this.edition());
    this.syncGeneratedSlug(this.form.controls.city.value);
    this.coverFile.set(null);
    this.detailsEditor()?.resetCoverSelection();
  }

  private syncGeneratedSlug(city: string): void {
    const core = this.core();
    if (this.isNew() && !this.edition() && core) {
      this.form.controls.slug.setValue(stringToSlug(`${core.name} ${city}`), { emitEvent: false });
    }
  }
}
