import { afterNextRender, Component, computed, DestroyRef, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { EMPTY, switchMap } from 'rxjs';

import type { IEventCoreDetail } from '../../../../core/interfaces/i-event-admin';
import type { EventGlobalSavedSnapshot } from '../../../../core/interfaces/i-event-global-saved-summary';
import { Auth } from '../../../../core/services/auth/auth';
import { EventAdmin } from '../../../../core/services/event-admin/event-admin';
import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { RpcError } from '../../../../core/types/rpc-error';
import { formatDateLabel } from '../../../../core/utils/date';
import { resolveEventCoreAdminErrorMessage } from '../event-admin-errors';
import { createEventEditionEditorI18n } from '../edition-editor/edition-editor.i18n';
import { createEventCoreEditorI18n } from './core-editor.i18n';
import { EventGlobalDraftSummary } from './event-global-draft-summary';
import { EventGlobalPublicationController } from './event-global-publication-controller';
import { readEventGlobalSavedSummary } from './event-global-saved-summary-state';

@Component({
  selector: 'app-event-global-saved-summary',
  imports: [ButtonModule, MessageModule, TableModule, EventGlobalDraftSummary],
  templateUrl: './event-global-saved-summary.html',
  host: { class: 'flex-col-start-stretch gap-md w-100 min-w-0' },
})
export class EventGlobalSavedSummary {
  readonly coreId = input.required<string>();
  readonly disabled = input(false);
  readonly navigateToStep = output<number>();
  readonly published = output<IEventCoreDetail>();
  protected readonly i18n = createEventCoreEditorI18n();
  private readonly editionI18n = createEventEditionEditorI18n();
  protected readonly publicationLabels = this.editionI18n.publication;
  protected readonly publication = inject(EventGlobalPublicationController);
  protected readonly publicationCopy = this.i18n.globalPublication;
  private readonly auth = inject(Auth);
  private readonly confirm = inject(UiConfirm);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly isAdmin = computed(() => this.auth.hasRole('admin'));
  protected readonly formatDateLabel = formatDateLabel;
  protected readonly loading = signal(true);
  protected readonly snapshot = signal<EventGlobalSavedSnapshot | null>(null);
  private readonly error = signal<unknown | null>(null);
  private readonly admin = inject(EventAdmin);
  private readonly browserReady = signal(false);
  private readonly readAttempt = signal(0);
  protected readonly hasRelease = computed(() => this.snapshot()?.calendar.globalDates.some(day =>
    day.cityOccurrences.some(city => city.publishedAt !== null)) ?? false);
  protected readonly canPublish = computed(() => this.browserReady() && this.isAdmin() && !this.disabled() &&
    !this.hasRelease() && !this.publication.locked());
  protected readonly publicationError = computed(() => {
    const error = this.publication.error();
    if (error === null) return null;
    if (this.publication.needsReadback()) return this.publication.result()
      ? this.publicationCopy().readbackFailed : this.publicationCopy().uncertain;
    if (error instanceof RpcError && error.code === '40001') return this.i18n.commonErrors().concurrentModification;
    if (error instanceof RpcError && error.code === '23514') return this.publicationCopy().blocked;
    if (error instanceof RpcError && error.code === '42501') return this.publicationLabels().errors.forbidden;
    return resolveEventCoreAdminErrorMessage(error, this.i18n.rpcErrors(), this.i18n.commonErrors().concurrentModification);
  });
  protected readonly publicationBlockers = computed(() => this.publication.preview()?.blockers.map(blocker => ({
    ...blocker,
    message: this.publicationCopy().blockers[blocker.code],
    city: blocker.editionId ? this.snapshot()?.calendar.cities.find(city => city.editionId === blocker.editionId)?.city ?? blocker.editionId : null,
  })) ?? []);
  protected readonly errorMessage = computed(() => this.error() === null ? null : resolveEventCoreAdminErrorMessage(
    this.error(), this.i18n.rpcErrors(), this.i18n.commonErrors().concurrentModification,
  ));
  protected readonly cities = computed(() => {
    const copy = this.i18n.savedSummary();
    const statuses = this.editionI18n.occurrenceStatuses();
    return this.snapshot()?.cities.map(entry => ({
      city: entry.city,
      dates: entry.dates.map(date => ({
        ...date,
        participationLabel: copy.participation[date.participation],
        globalStatusLabel: date.globalStatus ? copy.calendarStatuses[date.globalStatus] : null,
        occurrenceStatusLabel: date.occurrenceStatus ? statuses[date.occurrenceStatus] : null,
      })),
    })) ?? [];
  });

  constructor() {
    // Privileged reads run in the browser, following EventGlobalProgram's boundary.
    afterNextRender(() => this.browserReady.set(true));
    effect(onCleanup => {
      const ready = this.browserReady();
      const coreId = this.coreId();
      this.readAttempt();
      untracked(() => {
        this.snapshot.set(null);
        this.error.set(null);
        this.loading.set(true);
        if (!ready) return;
        const subscription = readEventGlobalSavedSummary(this.admin, coreId).subscribe({
          next: snapshot => { this.snapshot.set(snapshot); this.loading.set(false); },
          error: (error: unknown) => { this.error.set(error); this.loading.set(false); },
        });
        onCleanup(() => subscription.unsubscribe());
      });
    });
  }

  protected refresh(): void {
    if (!this.loading() && !this.publication.locked()) this.readAttempt.update(value => value + 1);
  }

  protected confirmPublication(): void {
    if (!this.canPublish()) return;
    const coreId = this.coreId();
    this.publication.prepare(coreId).pipe(switchMap(preview => {
      if (!preview.valid) return EMPTY;
      const message = this.publicationCopy().confirm
        .replace('{{cities}}', String(preview.impact.affectedCityCount))
        .replace('{{occurrences}}', String(preview.impact.publishableOccurrenceCount))
        .replace('{{past}}', String(preview.impact.preservedPastDraftOccurrences));
      return this.confirm.modalDecision({
        header: this.publicationLabels().title,
        message: message + (preview.policyDraftRevision > 0 ? ' ' + this.publicationCopy().policyDraft : ''),
        acceptLabel: this.publicationLabels().publish, rejectLabel: this.i18n.commonActions().cancel,
      }).pipe(switchMap(accepted => {
        if (!accepted || coreId !== this.coreId() || !this.isAdmin()) {
          this.publication.cancelConfirmation();
          return EMPTY;
        }
        return this.publication.publish();
      }));
    }), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: core => { if (core) this.acceptPublication(core); },
      error: () => { /* The controller retains the refusal or readback state for the inline UI. */ },
    });
  }

  protected retryPublicationReadback(): void {
    this.publication.retryReadback().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: core => this.acceptPublication(core),
      error: () => { /* Readback remains available without repeating the writer. */ },
    });
  }

  private acceptPublication(core: IEventCoreDetail): void {
    this.published.emit(core);
    this.readAttempt.update(value => value + 1);
  }
}
