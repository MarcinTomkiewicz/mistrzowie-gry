import { Component, computed, input, output } from '@angular/core';

import { STATUS_BADGE_CLASS } from '../../../../../core/configs/badge-class.config';
import {
  ICoworkerDocumentPortalSubmission,
  ICoworkerDocumentRequirement,
  ICoworkerDocumentVersion,
} from '../../../../../core/interfaces/i-coworker-document';
import {
  ICoworkerDocumentDeletionCapabilities,
} from '../../../../../core/interfaces/i-coworker-document-deletion';
import {
  CoworkerDocumentMutationTarget,
} from '../../../../../core/types/coworker-document';
import { EdgeFunctionError } from '../../../../../core/types/edge-function-error';
import {
  canCoworkerUploadDocumentDefinition,
} from '../../../../../core/utils/coworker-document-capability';
import { formatDateLabel } from '../../../../../core/utils/date';
import { formatFileSizeMiB } from '../../../../../core/utils/file-size';
import { createDocumentsI18n } from '../documents.i18n';
import { SourceDocument } from '../source-document/source-document';
import { SubmissionDocument } from '../submission-document/submission-document';

@Component({
  selector: 'app-document-requirement-card',
  standalone: true,
  imports: [SourceDocument, SubmissionDocument],
  templateUrl: './document-requirement-card.html',
})
export class DocumentRequirementCard {
  readonly requirement = input.required<ICoworkerDocumentRequirement>();
  readonly deletionCapabilities =
    input.required<ICoworkerDocumentDeletionCapabilities | null>();
  readonly mutationsBlocked = input(false);
  readonly activeMutationTarget =
    input<CoworkerDocumentMutationTarget | null>(null);
  readonly downloadingVersionId = input<string | null>(null);

  readonly downloadRequested = output<ICoworkerDocumentVersion>();
  readonly submitRequested = output<ICoworkerDocumentPortalSubmission>();
  readonly withdrawRequested = output<string>();
  readonly deleteVersionRequested = output<ICoworkerDocumentVersion>();
  readonly deleteDocumentRequested = output<string>();
  readonly uploadCompleted = output<void>();
  readonly uploadBusyChange = output<boolean>();
  readonly blockingError = output<EdgeFunctionError>();
  readonly reloadRequired = output<void>();

  protected readonly i18n = createDocumentsI18n();
  protected readonly STATUS_BADGE_CLASS = STATUS_BADGE_CLASS;
  protected readonly uploadAllowed = computed(() =>
    canCoworkerUploadDocumentDefinition(
      this.requirement().documentDefinition,
    )
  );
  protected readonly formats = computed(() => {
    const definition = this.requirement().documentDefinition;

    return [
      ...definition.allowedExtensions,
      ...definition.allowedMimeTypes,
    ].join(', ');
  });
  protected readonly maxFileSize = computed(() =>
    formatFileSizeMiB(this.requirement().documentDefinition.maxSizeBytes)
  );

  protected deadlineLabel(dueAt: string): string {
    return formatDateLabel(dueAt.slice(0, 10), 'pl-PL', true);
  }

  protected isLate(dueAt: string): boolean {
    return this.requirement().status === 'pending' &&
      new Date(dueAt).getTime() < Date.now();
  }
}
