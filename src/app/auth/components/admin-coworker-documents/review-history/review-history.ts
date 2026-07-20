import { Component, input } from '@angular/core';

import { STATUS_BADGE_CLASS } from '../../../../core/configs/badge-class.config';
import { IAdminCoworkerDocumentReviewDetail } from '../../../../core/interfaces/i-admin-coworker-document';
import { formatTimestampLabel } from '../../../../core/utils/date';
import { ContextHelp } from '../../../../public/common/context-help/context-help';
import { createAdminCoworkerDocumentsI18n } from '../private-documents/private-documents.i18n';

@Component({
  selector: 'app-admin-coworker-review-history',
  standalone: true,
  imports: [ContextHelp],
  templateUrl: './review-history.html',
})
export class ReviewHistory {
  readonly detail = input.required<IAdminCoworkerDocumentReviewDetail>();

  protected readonly i18n = createAdminCoworkerDocumentsI18n();
  protected readonly STATUS_BADGE_CLASS = STATUS_BADGE_CLASS;
  protected readonly formatTimestampLabel = formatTimestampLabel;

  protected versionNumber(versionId: string): number | null {
    return this.detail().document.versions.find(
      (version) => version.id === versionId,
    )?.versionNumber ?? null;
  }
}
