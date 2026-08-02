import { Component, computed, inject, input, output } from '@angular/core';

import { ButtonModule } from 'primeng/button';

import {
  SIGNATURE_BADGE_CLASS,
  STATUS_BADGE_CLASS,
} from '../../../../../core/configs/badge-class.config';
import {
  ICoworkerDocumentDefinition,
  ICoworkerDocumentPortalSubmission,
  ICoworkerDocumentVersion,
} from '../../../../../core/interfaces/i-coworker-document';
import { UiConfirm } from '../../../../../core/services/ui-confirm/ui-confirm';
import { CoworkerDocumentRequirementStatus } from '../../../../../core/types/coworker-document';
import { EdgeFunctionError } from '../../../../../core/types/edge-function-error';
import { getCoworkerDocumentCapability } from '../../../../../core/utils/coworker-document-capability';
import { DocumentUpload } from '../document-upload/document-upload';
import { DocumentVersionSummary } from '../document-version-summary/document-version-summary';
import { createDocumentsI18n } from '../documents.i18n';

@Component({
  selector: 'app-submission-document',
  standalone: true,
  imports: [ButtonModule, DocumentUpload, DocumentVersionSummary],
  templateUrl: './submission-document.html',
})
export class SubmissionDocument {
  private readonly confirm = inject(UiConfirm);

  readonly document = input.required<ICoworkerDocumentPortalSubmission | null>();
  readonly definition = input.required<ICoworkerDocumentDefinition>();
  readonly requirementId = input.required<string>();
  readonly requirementStatus = input.required<CoworkerDocumentRequirementStatus>();
  readonly onboardingCaseId = input.required<string | null>();
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
  protected readonly SIGNATURE_BADGE_CLASS = SIGNATURE_BADGE_CLASS;
  protected readonly capability = computed(() => {
    const document = this.document();

    return getCoworkerDocumentCapability(
      this.definition(),
      document === null ? [] : [document],
      document,
      this.requirementStatus(),
    );
  });
  protected readonly title = computed(() =>
    this.document()?.title ??
      this.document()?.currentVersion?.originalFilename ??
      this.i18n.labels().documentFallback
  );

  protected confirmSubmit(event: Event): void {
    const document = this.document();
    if (document === null || document.currentVersion === null) return;

    this.confirm.decision(event, {
      message: this.i18n.confirmations().submit,
      acceptLabel: this.i18n.actions().submitDocument,
      rejectLabel: this.i18n.commonActions().cancel,
      accept: () => this.submitRequested.emit(document),
    });
  }

  protected confirmWithdraw(event: Event): void {
    const document = this.document();
    if (document === null) return;

    this.confirm.decision(event, {
      message: this.i18n.confirmations().withdraw,
      acceptLabel: this.i18n.actions().withdrawDocument,
      rejectLabel: this.i18n.commonActions().cancel,
      accept: () => this.withdrawRequested.emit(document.id),
    });
  }
}
