import { Component, input } from '@angular/core';

import {
  SIGNATURE_BADGE_CLASS,
  STATUS_BADGE_CLASS,
} from '../../../../core/configs/badge-class.config';
import { IAdminCoworkerDocumentReviewDetail } from '../../../../core/interfaces/i-admin-coworker-document';
import { formatTimestampLabel } from '../../../../core/utils/date';
import { ContextHelp } from '../../../../public/common/context-help/context-help';
import { createAdminCoworkerDocumentsI18n } from '../private-documents/private-documents.i18n';

@Component({
  selector: 'app-admin-review-document-summary',
  standalone: true,
  imports: [ContextHelp],
  templateUrl: './review-document-summary.html',
})
export class ReviewDocumentSummary {
  readonly detail = input.required<IAdminCoworkerDocumentReviewDetail>();

  protected readonly i18n = createAdminCoworkerDocumentsI18n();
  protected readonly STATUS_BADGE_CLASS = STATUS_BADGE_CLASS;
  protected readonly SIGNATURE_BADGE_CLASS = SIGNATURE_BADGE_CLASS;
  protected readonly formatTimestampLabel = formatTimestampLabel;
}
