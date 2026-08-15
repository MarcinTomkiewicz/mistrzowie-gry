import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { finalize, forkJoin, of } from 'rxjs';

import {
  EventOccurrenceStatus,
  ParticipantSignupKind,
} from '../../../../core/enums/event';
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
import {
  formatDateLabel,
  formatTimestampLabel,
} from '../../../../core/utils/date';
import { formatTimeRangeLabel } from '../../../../core/utils/time-format';
import {
  resolveEventEditionAdminErrorMessage,
} from '../event-admin-errors';
import {
  resolveParticipantSignupKindLabel,
} from '../participant-signup-kind-options';
import { stringToSlug } from '../../../../core/utils/normalize-text';
import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import { createEventEditionEditorI18n } from './edition-editor.i18n';
import { EventEditionDetailsEditor } from './event-edition-details-editor';
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
    EventEditionDetailsEditor,
    EventEditionSettingsEditor,
    EventScheduleEditor,
    OccurrenceEditor,
  ],
  templateUrl: './edition-editor.html',
  providers: [provideTranslocoScope('adminEvents', 'common')],
})
export class EventEditionEditor {
  private readonly eventAdmin = inject(EventAdmin);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(UiToast);
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
  protected readonly form = createEventEditionForm(this.coreId);
  protected readonly formatDateLabel = formatDateLabel;
  protected readonly formatTimestampLabel = formatTimestampLabel;
  protected readonly formatTimeRangeLabel = formatTimeRangeLabel;

  private readonly slugEdited = signal(false);

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
          this.slugEdited.set(!this.isNew);
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

  protected onSlugInput(): void {
    this.slugEdited.set(true);
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

  protected participantSignupKindLabel(
    kind: ParticipantSignupKind,
  ): string {
    return resolveParticipantSignupKindLabel(
      kind,
      this.i18n.participantKinds(),
    );
  }

  protected occurrenceStatusLabel(status: EventOccurrenceStatus): string {
    if (status === EventOccurrenceStatus.Published) {
      return this.i18n.commonValues().published;
    }

    if (status === EventOccurrenceStatus.Archived) {
      return this.i18n.commonValues().archived;
    }

    return this.i18n.occurrenceStatuses()[status];
  }

  protected saveEdition(): void {
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

    this.isSaving.set(true);

    this.eventAdmin
      .saveEdition(
        mapEventEditionFormToPayload(
          this.form,
          this.edition()?.id ?? null,
        ),
      )
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (savedEdition) => {
          this.edition.set(savedEdition);
          this.slugEdited.set(true);
          populateEventEditionForm(
            this.form,
            savedEdition.eventCoreId,
            savedEdition,
          );
          this.toast.success({
            summary: this.i18n.toast().saveSuccessSummary,
            detail: this.i18n.toast().saveSuccessDetail,
          });

          if (this.isNew) {
            void this.router.navigate(
              [
                '/admin/events',
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
        error: (error) => {
          this.toast.danger({
            summary: this.i18n.toast().saveFailedSummary,
            detail: resolveEventEditionAdminErrorMessage(
              error,
              this.i18n.rpcErrors(),
              this.i18n.commonErrors().concurrentModification,
            ),
          });
        },
      });
  }

  protected goBack(): void {
    void this.router.navigate(['/admin/events', this.coreId, 'edit']);
  }

  private syncGeneratedSlug(city: string): void {
    const core = this.core();

    if (!this.isNew || this.slugEdited() || !core) {
      return;
    }

    this.form.controls.slug.setValue(
      stringToSlug(`${core.name} ${city}`),
      { emitEvent: false },
    );
  }
}
