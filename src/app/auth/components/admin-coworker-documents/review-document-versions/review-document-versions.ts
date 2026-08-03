import { Component, computed, input, output } from '@angular/core';
import { AccordionModule } from 'primeng/accordion';

import { ICoworkerDocumentVersion } from '../../../../core/interfaces/i-coworker-document';
import { ICoworkerDocumentDeletionCapabilities } from '../../../../core/interfaces/i-coworker-document-deletion';
import { AdminCoworkerDocumentPreservationInput } from '../../../../core/types/admin-coworker-document';
import { ContextHelp } from '../../../../public/common/context-help/context-help';
import { createAdminCoworkerDocumentsI18n } from '../private-documents/private-documents.i18n';
import { ReviewDocumentVersion } from '../review-document-version/review-document-version';

@Component({
  selector: 'app-admin-review-document-versions',
  standalone: true,
  imports: [AccordionModule, ContextHelp, ReviewDocumentVersion],
  templateUrl: './review-document-versions.html',
})
export class ReviewDocumentVersions {
  readonly versions = input.required<readonly ICoworkerDocumentVersion[]>();
  readonly currentVersion = input.required<ICoworkerDocumentVersion | null>();
  readonly submittedVersion = input.required<ICoworkerDocumentVersion | null>();
  readonly deletionCapabilities =
    input.required<ICoworkerDocumentDeletionCapabilities>();
  readonly disabled = input(false);
  readonly downloadDisabled = input(false);
  readonly downloadingVersionId = input<string | null>(null);
  readonly downloadRequested = output<ICoworkerDocumentVersion>();
  readonly deleteVersionRequested = output<ICoworkerDocumentVersion>();
  readonly preservationRequested =
    output<AdminCoworkerDocumentPreservationInput>();

  protected readonly i18n = createAdminCoworkerDocumentsI18n();
  protected readonly distinctCurrentVersion = computed(() => {
    const currentVersion = this.currentVersion();
    return currentVersion?.id === this.submittedVersion()?.id
      ? null
      : currentVersion;
  });
  protected readonly historicalVersions = computed(() => {
    const submittedVersionId = this.submittedVersion()?.id;
    const currentVersionId = this.currentVersion()?.id;
    return this.versions().filter(
      (version) =>
        version.id !== submittedVersionId && version.id !== currentVersionId,
    );
  });
  protected readonly deletionByVersionId = computed(() => {
    const capabilities = this.deletionCapabilities();
    const deletionByVersionId = new Map(
      capabilities.versions.map((version) => [
        version.documentVersionId,
        {
          canDelete: version.canDelete,
          blockingReasons: version.blockingReasons,
        },
      ] as const),
    );
    if (capabilities.currentVersionId !== null) {
      deletionByVersionId.set(capabilities.currentVersionId, {
        canDelete: capabilities.canDeleteCurrentVersion,
        blockingReasons: capabilities.currentVersionBlockingReasons,
      });
    }
    return deletionByVersionId;
  });

  protected preserveVersion(
    documentVersionId: string,
    preservationKind: AdminCoworkerDocumentPreservationInput['preservationKind'],
  ): void {
    this.preservationRequested.emit({ documentVersionId, preservationKind });
  }
}
