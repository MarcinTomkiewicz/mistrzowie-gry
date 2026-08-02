import { Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

import {
  SIGNATURE_BADGE_CLASS,
  STATUS_BADGE_CLASS,
} from '../../../../core/configs/badge-class.config';
import { ICoworkerDocumentVersion } from '../../../../core/interfaces/i-coworker-document';
import { canDownloadCoworkerDocumentVersion } from '../../../../core/utils/coworker-document-capability';
import { formatTimestampLabel } from '../../../../core/utils/date';
import { ContextHelp } from '../../../../public/common/context-help/context-help';
import { createAdminCoworkerDocumentsI18n } from '../private-documents/private-documents.i18n';

@Component({
  selector: 'app-admin-review-document-versions',
  standalone: true,
  imports: [ButtonModule, ContextHelp],
  templateUrl: './review-document-versions.html',
})
export class ReviewDocumentVersions {
  readonly versions = input.required<readonly ICoworkerDocumentVersion[]>();
  readonly currentVersionId = input<string | null>(null);
  readonly submittedVersion = input<ICoworkerDocumentVersion | null>(null);
  readonly disabled = input(false);
  readonly downloadingVersionId = input<string | null>(null);
  readonly downloadRequested = output<void>();

  protected readonly i18n = createAdminCoworkerDocumentsI18n();
  protected readonly STATUS_BADGE_CLASS = STATUS_BADGE_CLASS;
  protected readonly SIGNATURE_BADGE_CLASS = SIGNATURE_BADGE_CLASS;
  protected readonly formatTimestampLabel = formatTimestampLabel;
  protected readonly canDownload = canDownloadCoworkerDocumentVersion;
}
