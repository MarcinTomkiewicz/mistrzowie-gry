import { Component, computed, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

import { STATUS_BADGE_CLASS } from '../../../../../core/configs/badge-class.config';
import type { ICoworkerSharedDocument } from '../../../../../core/interfaces/i-coworker-onboarding';
import { createCoworkerOnboardingI18n } from '../../../../../core/translations/coworker-onboarding.i18n';
import { formatTimestampLabel } from '../../../../../core/utils/date';
import { stablePartition } from '../../../../../core/utils/stable-partition';
import { DocumentOperations } from '../../../../common/document-operations/document-operations';
import {
  createDocumentMenu,
  getPendingDocumentAction,
  type DocumentFileRequest,
} from '../onboarding-document-view';

@Component({
  selector: 'app-coworker-shared-documents',
  imports: [ButtonModule, TableModule, DocumentOperations],
  templateUrl: './coworker-shared-documents.html',
  host: { class: 'flex-col-start-stretch gap-sm w-100 min-w-0' },
})
export class CoworkerSharedDocuments {
  readonly documents = input.required<readonly ICoworkerSharedDocument[]>();
  readonly onboardingCompleted = input.required<boolean>();
  readonly busy = input.required<boolean>();
  readonly fileRequested = output<DocumentFileRequest>();
  readonly acknowledgementRequested = output<string>();

  protected readonly i18n = createCoworkerOnboardingI18n();
  protected readonly formatTimestampLabel = formatTimestampLabel;
  protected readonly rows = computed(() => {
    const labels = this.i18n.actions();
    const downloadLabel = this.i18n.commonActions().download;
    const assignment = this.i18n.assignmentStatuses();
    const { requiredAction, pendingAcknowledgement } = this.i18n.statuses();
    const rows = this.documents().map((document) => {
      const requiresAcknowledgement = getPendingDocumentAction(document) === 'acknowledge';
      return {
        document,
        requiresAcknowledgement,
        statusLabel: requiresAcknowledgement ? pendingAcknowledgement : assignment && assignment[document.assignment_status],
        statusClass: STATUS_BADGE_CLASS[document.assignment_status],
        actionLabel: requiredAction?.[document.required_action],
        menu: createDocumentMenu(
          document,
          labels,
          downloadLabel,
          (event) => this.fileRequested.emit(event),
          requiresAcknowledgement ? (id) => this.acknowledgementRequested.emit(id) : undefined,
        ),
      };
    });
    return stablePartition(rows, (row) => row.requiresAcknowledgement);
  });
}
