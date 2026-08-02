import { Component, computed, input, output } from '@angular/core';

import { STATUS_BADGE_CLASS } from '../../../../../core/configs/badge-class.config';
import {
  ICoworkerDocumentPortalSource,
  ICoworkerDocumentVersion,
} from '../../../../../core/interfaces/i-coworker-document';
import { DocumentVersionSummary } from '../document-version-summary/document-version-summary';
import { createDocumentsI18n } from '../documents.i18n';

@Component({
  selector: 'app-source-document',
  standalone: true,
  imports: [DocumentVersionSummary],
  templateUrl: './source-document.html',
})
export class SourceDocument {
  readonly document = input.required<ICoworkerDocumentPortalSource>();
  readonly downloadingVersionId = input<string | null>(null);
  readonly disabled = input(false);

  readonly downloadRequested = output<ICoworkerDocumentVersion>();

  protected readonly i18n = createDocumentsI18n();
  protected readonly STATUS_BADGE_CLASS = STATUS_BADGE_CLASS;
  protected readonly title = computed(() =>
    this.document().title ??
      this.document().currentVersion?.originalFilename ??
      this.i18n.labels().documentFallback
  );
}
