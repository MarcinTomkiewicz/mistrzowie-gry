import { afterNextRender, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { map, Subscription } from 'rxjs';

import type { AdminEventTimeline, AdminEventTimelineOccurrence } from '../../../../core/interfaces/i-admin-event-timeline';
import type { AdminGlobalCalendarResult } from '../../../../core/interfaces/i-admin-global-event';
import type { IEventCoreDetail } from '../../../../core/interfaces/i-event-admin';
import { EventAdmin } from '../../../../core/services/event-admin/event-admin';
import { formatDateLabel } from '../../../../core/utils/date';
import { assertEdgeContract } from '../../../../core/utils/edge-contract';
import { resolveEventEditionAdminErrorMessage } from '../event-admin-errors';
import { presentEventTimelineRows } from '../event-admin-timeline/event-admin-timeline-presenter';
import { createEventAdminTimelineI18n } from '../event-admin-timeline/event-admin-timeline.i18n';
import { EventGlobalDraftController } from './event-global-draft-controller';
import { EventManualRpgController } from './event-manual-rpg-controller';
import { EventManualRpgEditor } from './event-manual-rpg-editor';

@Component({
  selector: 'app-event-global-program',
  imports: [FormsModule, ButtonModule, FloatLabelModule, SelectModule, TableModule, EventManualRpgEditor],
  templateUrl: './event-global-program.html',
  host: { class: 'd-block w-100 min-w-0' },
})
export class EventGlobalProgram {
  readonly coreId = input.required<string>();
  readonly core = input.required<IEventCoreDetail>();
  readonly calendar = input.required<AdminGlobalCalendarResult>();
  readonly disabled = input(false);
  protected readonly global = inject(EventGlobalDraftController);
  protected readonly manual = inject(EventManualRpgController);
  protected readonly selectionLocked = computed(() => this.disabled() || this.manual.locked());
  protected readonly i18n = createEventAdminTimelineI18n();
  protected readonly formatDateLabel = formatDateLabel;
  private readonly admin = inject(EventAdmin);
  private readonly browserReady = signal(false);
  private readonly readAttempt = signal(0);
  private readonly readingTimeline = signal(false);
  private readonly readError = signal<unknown | null>(null);
  private readSubscription: Subscription | null = null;
  private readonly result = signal<{ timeline: AdminEventTimeline; occurrence: AdminEventTimelineOccurrence } | null>(null);
  protected readonly selectedOccurrenceId = signal<string | null>(null);
  protected readonly cityOptions = computed(() => this.calendar().coreId === this.coreId()
    ? this.calendar().cities.map(city => ({ value: city.editionId, label: city.city })) : []);
  private readonly edition = computed(() => {
    const edition = this.global.selectedEdition();
    return this.calendar().coreId === this.coreId() && this.calendar().calendarLifecycle === 'global' &&
      edition?.eventCoreId === this.coreId() && edition.id === this.global.selectedEditionId() &&
      this.calendar().cities.some(city => city.editionId === edition.id) ? edition : null;
  });
  protected readonly occurrenceOptions = computed(() => [...(this.edition()?.occurrences ?? [])]
    .sort((a, b) => a.date.localeCompare(b.date)).map(occurrence => ({ value: occurrence.id, label: formatDateLabel(occurrence.date) })));
  private readonly occurrence = computed(() => this.edition()?.occurrences.find(row => row.id === this.selectedOccurrenceId()) ?? null);
  protected readonly data = computed(() => {
    const result = this.result();
    const edition = this.edition();
    const occurrence = this.occurrence();
    return result && edition && occurrence && result.timeline.eventId === edition.id && result.timeline.eventCoreId === this.coreId() &&
      result.occurrence.occurrenceId === occurrence.id && result.occurrence.date === occurrence.date ? result : null;
  });
  private readonly timeline = computed(() => this.data()?.timeline ?? null);
  protected readonly rows = computed(() => presentEventTimelineRows(this.data()?.occurrence.rows ?? [], this.i18n));
  protected readonly loading = computed(() => this.readingTimeline() || this.global.isReadingEdition());
  protected readonly errorMessage = computed(() => {
    if (this.calendar().coreId !== this.coreId() || this.calendar().calendarLifecycle !== 'global' ||
      (this.global.selectedEdition() !== null && !this.edition())) return this.i18n.copy().invalidSelection;
    const error = this.readError() ?? this.global.editionReadError();
    return error === null ? null : resolveEventEditionAdminErrorMessage(error, this.i18n.rpcErrors(), this.i18n.errors().concurrentModification);
  });

  constructor() {
    // Admin programme data is fetched only after browser rendering, never during SSR.
    afterNextRender(() => this.browserReady.set(true));
    effect(() => this.manual.blocked.set(this.disabled()));
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
      const options = this.occurrenceOptions();
      untracked(() => {
        if (!options.some(option => option.value === this.selectedOccurrenceId())) this.selectedOccurrenceId.set(options[0]?.value ?? null);
      });
    });
    effect(onCleanup => {
      const ready = this.browserReady();
      const coreId = this.coreId();
      const edition = this.edition();
      const occurrence = this.occurrence();
      this.readAttempt();
      untracked(() => {
        this.clearRead();
        if (!ready || !edition || !occurrence) return;
        this.readingTimeline.set(true);
        const subscription = this.admin.getTimeline(edition.id).pipe(map(timeline => {
          assertEdgeContract(timeline.eventId === edition.id && timeline.eventCoreId === coreId,
            'globalProgram', 'the requested Edition timeline belonging to the current Core');
          const matches = timeline.occurrences.filter(row => row.occurrenceId === occurrence.id && row.date === occurrence.date);
          const selected = matches[0];
          assertEdgeContract(matches.length === 1 && selected !== undefined,
            'globalProgram.occurrence', 'the selected real occurrenceId and date');
          return { timeline, occurrence: selected };
        })).subscribe({
          next: result => { this.result.set(result); this.readingTimeline.set(false); },
          error: (error: unknown) => { this.readError.set(error); this.readingTimeline.set(false); },
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
    if (this.selectionLocked() || typeof value !== 'string' || !this.occurrenceOptions().some(option => option.value === value)) return;
    if (value === this.selectedOccurrenceId()) return;
    this.clearRead();
    this.selectedOccurrenceId.set(value);
  }

  protected refresh(): void {
    if (this.selectionLocked() || this.loading()) return;
    if (!this.edition()) this.selectCity(this.global.selectedEditionId());
    else this.readAttempt.update(value => value + 1);
  }

  protected acceptReadback(timeline: AdminEventTimeline): void {
    const occurrence = this.occurrence();
    if (timeline.eventId !== this.edition()?.id || timeline.eventCoreId !== this.coreId() || !occurrence) return;
    const selected = timeline.occurrences.find(row => row.occurrenceId === occurrence.id && row.date === occurrence.date);
    if (selected) this.result.set({ timeline, occurrence: selected });
  }

  private clearRead(): void {
    this.readSubscription?.unsubscribe();
    this.readSubscription = null;
    this.result.set(null);
    this.readError.set(null);
    this.readingTimeline.set(false);
  }
}
