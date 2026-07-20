import { Component, computed, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

import { STATUS_BADGE_CLASS } from '../../../../../core/configs/badge-class.config';
import { getAvailableCoworkerOperationalActions } from '../../../../../core/domain/coworker-operational-documents/assignments';
import { ICoworkerOperationalAssignment } from '../../../../../core/interfaces/i-coworker-operational-document';
import { CoworkerOperationalAction } from '../../../../../core/types/coworker-operational-document';
import { formatTimestampLabel } from '../../../../../core/utils/date';
import { ContextHelp } from '../../../../../public/common/context-help/context-help';
import { createOperationalDocumentsI18n } from '../operational-documents.i18n';

@Component({
  selector: 'app-operational-assignment-card',
  standalone: true,
  imports: [ButtonModule, ContextHelp],
  templateUrl: './operational-assignment-card.html',
})
export class OperationalAssignmentCard {
  readonly assignment = input.required<ICoworkerOperationalAssignment>();
  readonly disabled = input(false);
  readonly downloadingVersionId = input<string | null>(null);

  readonly downloadRequested = output<ICoworkerOperationalAssignment>();
  readonly actionRequested = output<CoworkerOperationalAction>();

  protected readonly i18n = createOperationalDocumentsI18n();
  protected readonly STATUS_BADGE_CLASS = STATUS_BADGE_CLASS;
  protected readonly formatTimestampLabel = formatTimestampLabel;
  protected readonly availableActions = computed(() =>
    getAvailableCoworkerOperationalActions(this.assignment()),
  );
}
