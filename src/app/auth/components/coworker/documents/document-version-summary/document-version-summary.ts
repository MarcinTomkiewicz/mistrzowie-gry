import { Component, input, output } from '@angular/core';

import { ButtonModule } from 'primeng/button';

import { STATUS_BADGE_CLASS } from '../../../../../core/configs/badge-class.config';
import { ICoworkerDocumentVersion } from '../../../../../core/interfaces/i-coworker-document';
import { canDownloadCoworkerDocumentVersion } from '../../../../../core/utils/coworker-document-capability';
import { formatTimestampLabel } from '../../../../../core/utils/date';
import { createDocumentsI18n } from '../documents.i18n';

@Component({
  selector: 'app-document-version-summary',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './document-version-summary.html',
})
export class DocumentVersionSummary {
  readonly version = input.required<ICoworkerDocumentVersion | null>();
  readonly historyCount = input.required<number>();
  readonly downloadingVersionId = input<string | null>(null);
  readonly disabled = input(false);

  readonly downloadRequested = output<ICoworkerDocumentVersion>();

  protected readonly i18n = createDocumentsI18n();
  protected readonly formatTimestampLabel = formatTimestampLabel;
  protected readonly STATUS_BADGE_CLASS = STATUS_BADGE_CLASS;
  protected readonly canDownload = canDownloadCoworkerDocumentVersion;
}
