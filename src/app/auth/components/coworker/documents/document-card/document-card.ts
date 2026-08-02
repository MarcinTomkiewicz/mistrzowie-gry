import { Component, computed, inject, input, output } from '@angular/core';

import { ButtonModule } from 'primeng/button';

import { STATUS_BADGE_CLASS } from '../../../../../core/configs/badge-class.config';
import {
  ICoworkerDocumentDefinition,
  ICoworkerDocumentPortalSource,
  ICoworkerDocumentPortalSubmission,
  ICoworkerDocumentVersion,
} from '../../../../../core/interfaces/i-coworker-document';
import { UiConfirm } from '../../../../../core/services/ui-confirm/ui-confirm';
import { CoworkerDocumentRequirementStatus } from '../../../../../core/types/coworker-document';
import { EdgeFunctionError } from '../../../../../core/types/edge-function-error';
import { getCoworkerDocumentCapability } from '../../../../../core/utils/coworker-document-capability';
import { DocumentUpload } from '../document-upload/document-upload';
import { DocumentVersionList } from '../document-version-list/document-version-list';
import { createDocumentsI18n } from '../documents.i18n';

type CoworkerPortalDocument =
  | ICoworkerDocumentPortalSource
  | ICoworkerDocumentPortalSubmission;

@Component({
  selector: 'app-document-card',
  standalone: true,
  imports: [ButtonModule, DocumentUpload, DocumentVersionList],
  templateUrl: './document-card.html',
})
export class DocumentCard {
  private readonly confirm = inject(UiConfirm);

  readonly document = input.required<CoworkerPortalDocument>();
  readonly definition = input<ICoworkerDocumentDefinition | null>(null);
  readonly requirementStatus = input<CoworkerDocumentRequirementStatus | null>(null);
  readonly mutationsBlocked = input(false);
  readonly activeMutationId = input<string | null>(null);
  readonly downloadingVersionId = input<string | null>(null);

  readonly downloadRequested = output<ICoworkerDocumentVersion>();
  readonly submitRequested = output<ICoworkerDocumentPortalSubmission>();
  readonly withdrawRequested = output<string>();
  readonly uploadCompleted = output<void>();
  readonly uploadBusyChange = output<boolean>();
  readonly blockingError = output<EdgeFunctionError>();
  readonly reloadRequired = output<void>();

  protected readonly i18n = createDocumentsI18n();
  protected readonly STATUS_BADGE_CLASS = STATUS_BADGE_CLASS;
  protected readonly submissionDocument = computed(() => {
    const document = this.document();
    return document.origin === 'coworker_upload' ? document : null;
  });
  protected readonly versions = computed<readonly ICoworkerDocumentVersion[]>(
    () => {
      const version = this.document().currentVersion;
      return version === null ? [] : [version];
    },
  );
  protected readonly capability = computed(() => getCoworkerDocumentCapability(
    this.definition(),
    [this.document()],
    this.document(),
    this.requirementStatus(),
  ));
  protected readonly title = computed(() =>
    this.document().title ??
      this.document().currentVersion?.originalFilename ??
      this.definition()?.title ??
      this.i18n.labels().documentFallback
  );

  protected confirmSubmit(event: Event): void {
    const document = this.submissionDocument();
    if (document === null || document.currentVersion === null) return;

    this.confirm.decision(event, {
      message: this.i18n.confirmations().submit,
      acceptLabel: this.i18n.actions().submitDocument,
      rejectLabel: this.i18n.commonActions().cancel,
      accept: () => this.submitRequested.emit(document),
    });
  }

  protected confirmWithdraw(event: Event): void {
    const document = this.submissionDocument();
    if (document === null) return;

    this.confirm.decision(event, {
      message: this.i18n.confirmations().withdraw,
      acceptLabel: this.i18n.actions().withdrawDocument,
      rejectLabel: this.i18n.commonActions().cancel,
      accept: () => this.withdrawRequested.emit(document.id),
    });
  }
}
