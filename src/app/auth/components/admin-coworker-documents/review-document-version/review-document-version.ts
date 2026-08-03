import { Component, computed, input, output } from '@angular/core';
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
  selector: 'app-admin-review-document-version',
  standalone: true,
  imports: [ButtonModule, ContextHelp],
  templateUrl: './review-document-version.html',
})
export class ReviewDocumentVersion {
  readonly version = input.required<ICoworkerDocumentVersion>();
  readonly role = input.required<'submitted' | 'current' | 'historical'>();
  readonly isCurrent = input(false);
  readonly disabled = input(false);
  readonly downloadingVersionId = input<string | null>(null);
  readonly downloadRequested = output<ICoworkerDocumentVersion>();

  protected readonly i18n = createAdminCoworkerDocumentsI18n();
  protected readonly STATUS_BADGE_CLASS = STATUS_BADGE_CLASS;
  protected readonly SIGNATURE_BADGE_CLASS = SIGNATURE_BADGE_CLASS;
  protected readonly formatTimestampLabel = formatTimestampLabel;
  protected readonly canDownload = canDownloadCoworkerDocumentVersion;
  protected readonly roleState = computed(() => {
    const statuses = this.i18n.review().statuses;
    switch (this.role()) {
      case 'submitted':
        return {
          label: statuses.submittedVersion,
          badgeClass: 'tag-badge--info',
        };
      case 'current':
        return {
          label: statuses.currentVersion,
          badgeClass: 'tag-badge--primary',
        };
      case 'historical':
        return {
          label: statuses.historicalVersion,
          badgeClass: 'tag-badge--muted',
        };
    }
  });
}
