import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, input, linkedSignal, output, type TemplateRef } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

import type { AdminEventTimeline, AdminEventTimelineOccurrence } from '../../../../core/interfaces/i-admin-event-timeline';
import { formatDateLabel } from '../../../../core/utils/date';
import { createEventAdminTimelineI18n } from '../event-admin-timeline/event-admin-timeline.i18n';
import { presentEventTimelineRows } from './event-program-schedule-presenter';
import { eventProgramScheduleWindow, layoutEventProgramSchedule } from './event-program-schedule-layout';

@Component({
  selector: 'app-event-program-schedule',
  imports: [NgTemplateOutlet, ButtonModule, DialogModule],
  templateUrl: './event-program-schedule.html',
  styleUrl: './event-program-schedule.scss',
  host: { class: 'd-block w-100 min-w-0' },
})
export class EventProgramSchedule {
  readonly timeline = input.required<AdminEventTimeline>();
  readonly occurrenceId = input<string | null>(null);
  readonly occurrenceIdChange = output<string>();
  readonly disabled = input(false);
  readonly detailsBusy = input(false);
  readonly participantActions = input<TemplateRef<{ $implicit: string; activeBookings: number }> | null>(null);
  private readonly editionId = computed(() => this.timeline().eventId);
  private readonly localOccurrenceId = linkedSignal<string | null>(() => { this.editionId(); return null; });
  protected readonly i18n = createEventAdminTimelineI18n();
  protected readonly formatDateLabel = formatDateLabel;
  protected readonly days = computed(() => [...this.timeline().occurrences].sort((a, b) => a.date.localeCompare(b.date)));
  protected readonly day = computed<AdminEventTimelineOccurrence | null>(() =>
    this.days().find(day => day.occurrenceId === (this.occurrenceId() ?? this.localOccurrenceId())) ?? this.days()[0] ?? null);
  private readonly selectedDayId = computed(() => this.day()?.occurrenceId ?? null);
  private readonly selectedKey = linkedSignal<string | null>(() => { this.editionId(); this.selectedDayId(); return null; });
  protected readonly entries = computed(() => presentEventTimelineRows(this.day()?.rows ?? [], this.i18n));
  protected readonly window = computed(() => eventProgramScheduleWindow(this.timeline()));
  protected readonly layout = computed(() => layoutEventProgramSchedule(this.entries(), this.timeline().spaces, this.i18n.copy().dayOffset, this.window()));
  protected readonly selected = computed(() => this.entries().find(entry => this.entryKey(entry.key) === this.selectedKey()) ?? null);

  protected trackLabel(index: number): string {
    return this.i18n.copy().schedule.track.replace('{{number}}', String(index + 1));
  }

  protected entryKey(key: string): string {
    return `${this.timeline().eventId}:${this.day()?.occurrenceId}:${key}`;
  }

  protected selectDay(occurrenceId: string): void {
    if (this.disabled() || !this.days().some(day => day.occurrenceId === occurrenceId)) return;
    if (this.occurrenceId() === null) this.localOccurrenceId.set(occurrenceId);
    this.occurrenceIdChange.emit(occurrenceId);
  }

  protected selectEntry(key: string): void {
    if (!this.disabled()) this.selectedKey.set(this.entryKey(key));
  }

  protected closeDetails(): void {
    if (!this.detailsBusy()) this.selectedKey.set(null);
  }
}
