import { Component, computed, inject, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';

import type { AdminEventTimeline } from '../../../../core/interfaces/i-admin-event-timeline';
import type { IAdminEventDetail, IEventCoreDetail } from '../../../../core/interfaces/i-event-admin';
import { Storage } from '../../../../core/services/storage/storage';
import { formatDateLabel } from '../../../../core/utils/date';
import { formatMoney } from '../../../../core/utils/pricing';
import { resolvePublicStorageUrl } from '../../../../core/utils/storage-url';
import { formatTimeRangeLabel } from '../../../../core/utils/time-format';
import { createEventCoreEditorI18n } from '../core-editor/core-editor.i18n';
import { resolveEventEditionAdminErrorMessage } from '../event-admin-errors';
import { createEventAdminTimelineI18n } from '../event-admin-timeline/event-admin-timeline.i18n';
import { EventProgramSchedule } from '../event-program-schedule/event-program-schedule';
import { resolveParticipantSignupKindLabel } from '../participant-signup-kind-options';
import { createEventEditionEditorI18n, createEventScheduleEditorI18n } from './edition-editor.i18n';

@Component({
  selector: 'app-event-edition-summary',
  imports: [ButtonModule, MessageModule, EventProgramSchedule],
  templateUrl: './event-edition-summary.html',
  host: { class: 'flex-col-start-stretch gap-md w-100 min-w-0' },
})
export class EventEditionSummary {
  readonly core = input.required<IEventCoreDetail>();
  readonly edition = input.required<IAdminEventDetail>();
  readonly timeline = input<AdminEventTimeline | null>(null);
  readonly timelineLoading = input(false);
  readonly timelineError = input<unknown>(null);
  readonly dirtySteps = input<readonly number[]>([]);
  readonly disabled = input(false);
  readonly navigateToStep = output<number>();
  readonly reloadTimeline = output<void>();
  private readonly storage = inject(Storage);
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly editionI18n = createEventEditionEditorI18n();
  protected readonly scheduleI18n = createEventScheduleEditorI18n();
  protected readonly timelineI18n = createEventAdminTimelineI18n();
  protected readonly formatDateLabel = formatDateLabel;
  protected readonly formatTimeRangeLabel = formatTimeRangeLabel;
  protected readonly steps = computed(() => {
    const copy = this.i18n.creationSteps();
    return [copy.event, copy.location, copy.schedule, copy.policy, copy.program]
      .map((label, index) => ({ value: index + 1, label }));
  });
  protected readonly unsavedSteps = computed(() => this.steps().filter(step => this.dirtySteps().includes(step.value)));
  protected readonly coverUrl = computed(() => resolvePublicStorageUrl(this.storage,
    this.edition().coverImagePath ?? this.core().coverImagePath));
  protected readonly dates = computed(() => {
    const edition = this.edition();
    const occurrences = new Map(edition.occurrences.map(occurrence => [occurrence.date, occurrence.status]));
    const dates = edition.schedule.kind === 'exact_dates' ? edition.schedule.dates : edition.occurrences.map(occurrence => occurrence.date);
    return [...dates].sort().map(date => ({ date, status: occurrences.get(date) ?? null }));
  });
  protected readonly timelineErrorMessage = computed(() => this.timelineError() === null ? null
    : resolveEventEditionAdminErrorMessage(this.timelineError(), this.editionI18n.rpcErrors(),
      this.i18n.commonErrors().concurrentModification));
  protected readonly policyRows = computed(() => {
    const edition = this.edition();
    const labels = this.i18n.commonLabels();
    const values = this.i18n.commonValues();
    const price = this.i18n.commonPrice();
    return [
      { label: labels.price, value: edition.priceAmount === null ? values.notProvided
        : edition.priceAmount === 0 ? price.presentation.free : formatMoney(edition.priceAmount, edition.priceCurrency) },
      { label: price.editor.fields.description, value: edition.priceLabel ?? values.notProvided },
      { label: labels.forBeginners, value: edition.isForBeginners ? values.yes : values.no },
      { label: labels.participantSignupKind, value: resolveParticipantSignupKindLabel(edition.participantSignupKind, this.editionI18n.participantKinds()) },
      { label: labels.signupRequired, value: edition.signupRequired ? values.yes : values.no },
      { label: this.editionI18n.fields().defaultSlotCapacity, value: String(edition.defaultSlotCapacity) },
      { label: this.editionI18n.fields().defaultParticipantCapacity, value: String(edition.defaultParticipantCapacity ?? values.notProvided) },
      { label: this.editionI18n.fields().isDefaultPublic, value: edition.isDefaultPublic ? values.yes : values.no },
    ];
  });
}
