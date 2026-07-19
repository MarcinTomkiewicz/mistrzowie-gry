import { Component, input, output } from '@angular/core';

import { ButtonModule } from 'primeng/button';

import {
  SIGNATURE_BADGE_CLASS,
  STATUS_BADGE_CLASS,
} from '../../../../../core/configs/badge-class.config';
import { ICoworkerDocumentVersion } from '../../../../../core/interfaces/i-coworker-document';
import { formatTimestampLabel } from '../../../../../core/utils/date';
import { createDocumentsI18n } from '../documents.i18n';

@Component({
  selector: 'app-document-version-list',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './document-version-list.html',
})
export class DocumentVersionList {
  readonly versions = input.required<readonly ICoworkerDocumentVersion[]>();
  readonly currentVersionId = input<string | null>(null);
  readonly downloadingVersionId = input<string | null>(null);
  readonly downloadRequested = output<ICoworkerDocumentVersion>();

  protected readonly i18n = createDocumentsI18n();
  protected readonly formatTimestampLabel = formatTimestampLabel;
  protected readonly STATUS_BADGE_CLASS = STATUS_BADGE_CLASS;
  protected readonly SIGNATURE_BADGE_CLASS = SIGNATURE_BADGE_CLASS;

  protected canDownload(version: ICoworkerDocumentVersion): boolean {
    return version.status === 'ready';
  }
}
