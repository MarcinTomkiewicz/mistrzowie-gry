import { Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

import {
  EventOccurrenceStatus,
  ParticipantSignupKind,
} from '../../../../../core/enums/event';
import {
  IAdminEventDetail,
  IAdminOccurrenceListItem,
} from '../../../../../core/interfaces/i-event-admin';
import {
  formatDateLabel,
  formatTimestampLabel,
} from '../../../../../core/utils/date';
import { formatTimeRangeLabel } from '../../../../../core/utils/time-format';
import { resolveParticipantSignupKindLabel } from '../../participant-signup-kind-options';
import { createEventEditionEditorI18n } from '../edition-editor.i18n';

@Component({
  selector: 'app-event-edition-occurrences',
  standalone: true,
  imports: [ButtonModule],
  host: { class: 'd-block w-100' },
  templateUrl: './event-edition-occurrences.html',
})
export class EventEditionOccurrences {
  readonly edition = input.required<IAdminEventDetail>();
  readonly i18n =
    input.required<ReturnType<typeof createEventEditionEditorI18n>>();
  readonly disabled = input(false);
  readonly edit = output<IAdminOccurrenceListItem>();

  protected readonly formatDateLabel = formatDateLabel;
  protected readonly formatTimestampLabel = formatTimestampLabel;
  protected readonly formatTimeRangeLabel = formatTimeRangeLabel;

  protected participantSignupKindLabel(
    kind: ParticipantSignupKind,
  ): string {
    return resolveParticipantSignupKindLabel(
      kind,
      this.i18n().participantKinds(),
    );
  }

  protected occurrenceStatusLabel(status: EventOccurrenceStatus): string {
    if (status === EventOccurrenceStatus.Published) {
      return this.i18n().commonValues().published;
    }

    if (status === EventOccurrenceStatus.Archived) {
      return this.i18n().commonValues().archived;
    }

    return this.i18n().occurrenceStatuses()[status];
  }
}
