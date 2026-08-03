import { Component, computed, inject, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

import {
  SIGNATURE_BADGE_CLASS,
  STATUS_BADGE_CLASS,
} from '../../../../core/configs/badge-class.config';
import { ICoworkerDocumentVersion } from '../../../../core/interfaces/i-coworker-document';
import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { CoworkerDocumentPreservationKind } from '../../../../core/types/coworker-document';
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
  private readonly confirm = inject(UiConfirm);

  readonly version = input.required<ICoworkerDocumentVersion>();
  readonly role = input.required<'submitted' | 'current' | 'historical'>();
  readonly isCurrent = input(false);
  readonly disabled = input(false);
  readonly deletionRequested = input(false);
  readonly canDelete = input(false);
  readonly deletionBlockingReasons = input<readonly string[]>([]);
  readonly downloadDisabled = input(false);
  readonly downloadingVersionId = input<string | null>(null);
  readonly downloadRequested = output<ICoworkerDocumentVersion>();
  readonly deleteVersionRequested = output<ICoworkerDocumentVersion>();
  readonly preservationRequested =
    output<CoworkerDocumentPreservationKind | null>();

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

  protected confirmDelete(event: Event): void {
    if (this.disabled() || this.deletionRequested() || !this.canDelete()) return;
    const version = this.version();

    this.confirm.dangerDecision(event, {
      message: this.i18n.review().messages.deleteVersionConfirmation,
      acceptLabel: this.i18n.review().actions.deleteVersion,
      rejectLabel: this.i18n.commonActions().cancel,
      accept: () => this.deleteVersionRequested.emit(version),
    });
  }

  protected setPreservation(
    preservationKind: CoworkerDocumentPreservationKind | null,
  ): void {
    if (this.disabled() || this.deletionRequested()) return;
    this.preservationRequested.emit(preservationKind);
  }
}
