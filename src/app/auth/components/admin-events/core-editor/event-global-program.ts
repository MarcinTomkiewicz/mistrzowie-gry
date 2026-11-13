import { afterNextRender, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { Subscription, tap } from 'rxjs';

import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import type { AdminEventTimeline } from '../../../../core/interfaces/i-admin-event-timeline';
import type { AdminGlobalCalendarResult } from '../../../../core/interfaces/i-admin-global-event';
import type { IEventCoreDetail } from '../../../../core/interfaces/i-event-admin';
import { assertAdminEventTimelineScope } from '../../../../core/reads/events/admin-event-timeline.contract';
import { EventAdmin } from '../../../../core/services/event-admin/event-admin';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { assertEdgeContract } from '../../../../core/utils/edge-contract';
import { getTodayIso, selectUpcomingOrLatestDate } from '../../../../core/utils/date';
import { resolveEventEditionAdminErrorMessage } from '../event-admin-errors';
import { createEventAdminTimelineI18n } from '../event-admin-timeline/event-admin-timeline.i18n';
import { EventGlobalDraftController } from './event-global-draft-controller';
import { EventGlobalSaveController } from './event-global-save-controller';
import { EventManualProgramController } from './event-manual-program-controller';
import { EventManualProgramEditor } from './event-manual-program-editor';
import { EventAdminTimeline } from '../event-admin-timeline/event-admin-timeline';

@Component({
  selector: 'app-event-global-program',
  imports: [FormsModule, ButtonModule, SelectModule, EventManualProgramEditor, EventAdminTimeline, LoadingOverlay],
  templateUrl: './event-global-program.html',
  host: { class: 'd-block w-100 min-w-0' },
})
export class EventGlobalProgram {
  readonly coreId = input.required<string>();
  readonly core = input.required<IEventCoreDetail>();
  readonly calendar = input.required<AdminGlobalCalendarResult>();
  readonly disabled = input(false);
  readonly selectionDisabled = input(false);
  protected readonly global = inject(EventGlobalDraftController);
  protected readonly manual = inject(EventManualProgramController);
  private readonly save = inject(EventGlobalSaveController);
  protected readonly selectionLocked = computed(() => this.selectionDisabled() || this.manual.locked());
  protected readonly i18n = createEventAdminTimelineI18n();
  private readonly admin = inject(EventAdmin);
  private readonly toast = inject(UiToast);
  private readonly browserReady = signal(false);
  private readonly readAttempt = signal(0);
  private readonly readingTimeline = signal(false);
  private readonly readError = signal<unknown | null>(null);
  private readSubscription: Subscription | null = null;
  private readonly result = signal<AdminEventTimeline | null>(null);
  protected readonly selectedOccurrenceId = signal<string | null>(null);
  protected readonly cityOptions = computed(() => this.calendar().coreId === this.coreId()
    ? this.calendar().cities.map(city => ({ value: city.editionId, label: city.city })) : []);
  private readonly edition = computed(() => {
    const edition = this.global.selectedEdition();
    return this.calendar().coreId === this.coreId() && this.calendar().calendarLifecycle === 'global' &&
      edition?.eventCoreId === this.coreId() && edition.id === this.global.selectedEditionId() &&
      this.calendar().cities.some(city => city.editionId === edition.id) ? edition : null;
  });
  private readonly occurrences = computed(() => [...(this.edition()?.occurrences ?? [])].sort((a, b) => a.date.localeCompare(b.date)));
  private readonly occurrence = computed(() => this.edition()?.occurrences.find(row => row.id === this.selectedOccurrenceId()) ?? null);
  private readonly timeline = computed(() => {
    const timeline = this.result();
    const edition = this.edition();
    return timeline && edition && timeline.eventId === edition.id && timeline.eventCoreId === this.coreId() ? timeline : null;
  });
  protected readonly data = computed(() => {
    const timeline = this.timeline();
    const occurrence = this.occurrence();
    if (!timeline || !occurrence) return null;
    const selected = timeline.occurrences.find(row => row.occurrenceId === occurrence.id && row.date === occurrence.date);
    return selected ? { timeline, occurrence: selected } : null;
  });
  protected readonly loading = computed(() => this.readingTimeline() || this.global.isReadingEdition());
  protected readonly blockedMessage = computed(() => {
    const copy = this.i18n.copy().globalProgram;
    if (this.save.dirty() || this.save.pending()) return copy.saveFirst;
    if (this.calendar().pendingDraft) return copy.pendingCalendar;
    if (this.disabled()) return copy.otherOperation;
    return this.data() && !this.manual.canOpen() && !this.manual.locked() && !this.manual.needsRefresh() ? copy.unavailable : null;
  });
  protected readonly errorMessage = computed(() => {
    if (this.calendar().coreId !== this.coreId() || this.calendar().calendarLifecycle !== 'global' ||
      (this.global.selectedEdition() !== null && !this.edition())) return this.i18n.copy().invalidSelection;
    const error = this.readError() ?? this.global.editionReadError();
    return error === null ? null : resolveEventEditionAdminErrorMessage(error, this.i18n.rpcErrors(), this.i18n.errors().concurrentModification);
  });

  constructor() {
    // Admin programme data is fetched only after browser rendering, never during SSR.
    afterNextRender(() => this.browserReady.set(true));
    effect(() => this.manual.blocked.set(this.disabled() || this.save.dirty() || this.save.pending()));
    effect(() => {
      const data = this.data();
      const edition = this.edition();
      const occurrence = this.occurrence();
      const core = this.core();
      const calendar = this.calendar();
      untracked(() => {
        if (!this.manual.locked()) this.manual.context.set(data && edition && occurrence && core.id === this.coreId()
          ? { core, edition, occurrence, calendar, timeline: this.timeline } : null);
      });
    });
    effect(() => {
      const options = this.occurrences();
      untracked(() => {
        if (!options.some(option => option.id === this.selectedOccurrenceId())) {
          const date = selectUpcomingOrLatestDate(options.map(option => option.date), getTodayIso(new Date(), this.edition()?.timezone));
          this.selectedOccurrenceId.set(options.find(option => option.date === date)?.id ?? null);
        }
      });
    });
    effect(onCleanup => {
      const ready = this.browserReady();
      const coreId = this.coreId();
      const edition = this.edition();
      this.readAttempt();
      untracked(() => {
        this.clearRead();
        if (!ready || !edition) return;
        this.readingTimeline.set(true);
        const subscription = this.admin.getTimeline(edition.id).pipe(
          tap(timeline => assertAdminEventTimelineScope(timeline, edition, coreId)),
        ).subscribe({
          next: result => { this.result.set(result); this.readingTimeline.set(false); },
          error: (error: unknown) => {
            this.readError.set(error);
            this.readingTimeline.set(false);
            this.toast.danger({ summary: this.i18n.copy().loadFailed, detail: this.errorMessage() ?? undefined });
          },
        });
        this.readSubscription = subscription;
        onCleanup(() => subscription.unsubscribe());
      });
    });
  }

  protected selectCity(value: unknown): void {
    if (this.selectionLocked() || typeof value !== 'string' || !this.cityOptions().some(option => option.value === value)) return;
    this.clearRead();
    this.selectedOccurrenceId.set(null);
    this.global.selectEdition(value);
  }

  protected selectOccurrence(value: unknown): void {
    if (this.selectionLocked() || typeof value !== 'string' || !this.occurrences().some(option => option.id === value)) return;
    if (value === this.selectedOccurrenceId()) return;
    this.selectedOccurrenceId.set(value);
  }

  protected refresh(): void {
    if (this.selectionLocked() || this.loading()) return;
    if (!this.edition()) this.selectCity(this.global.selectedEditionId());
    else this.readAttempt.update(value => value + 1);
  }

  protected acceptReadback(timeline: AdminEventTimeline): void {
    try {
      const edition = this.edition();
      assertEdgeContract(edition !== null && this.occurrence() !== null,
        'globalProgram.selection', 'the current canonical Edition and selected Occurrence');
      assertAdminEventTimelineScope(timeline, edition, this.coreId());
      this.result.set(timeline);
      this.readError.set(null);
    } catch (error: unknown) {
      this.result.set(null);
      this.readError.set(error);
      this.toast.danger({ summary: this.i18n.copy().loadFailed, detail: this.errorMessage() ?? undefined });
    }
  }

  private clearRead(): void {
    this.readSubscription?.unsubscribe();
    this.readSubscription = null;
    this.result.set(null);
    this.readError.set(null);
    this.readingTimeline.set(false);
  }
}
