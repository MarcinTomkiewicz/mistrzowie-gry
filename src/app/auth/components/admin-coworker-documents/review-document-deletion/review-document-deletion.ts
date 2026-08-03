import { Component, inject, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

import { ICoworkerDocumentDeletionCapabilities } from '../../../../core/interfaces/i-coworker-document-deletion';
import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { createAdminCoworkerDocumentsI18n } from '../private-documents/private-documents.i18n';

@Component({
  selector: 'app-admin-review-document-deletion',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './review-document-deletion.html',
})
export class ReviewDocumentDeletion {
  private readonly confirm = inject(UiConfirm);

  readonly capabilities =
    input.required<ICoworkerDocumentDeletionCapabilities>();
  readonly disabled = input(false);
  readonly busy = input(false);
  readonly deleteRequested = output<string>();

  protected readonly i18n = createAdminCoworkerDocumentsI18n();

  protected confirmDelete(event: Event): void {
    const capabilities = this.capabilities();
    if (
      this.disabled() ||
      capabilities.deletionRequested ||
      !capabilities.canDeleteDocument
    ) return;
    const documentId = capabilities.documentId;

    this.confirm.dangerDecision(event, {
      message: this.i18n.review().messages.deleteDocumentConfirmation,
      acceptLabel: this.i18n.review().actions.deleteDocument,
      rejectLabel: this.i18n.commonActions().cancel,
      accept: () => this.deleteRequested.emit(documentId),
    });
  }
}
