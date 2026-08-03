import { Component, computed, input, output } from '@angular/core';
import { AccordionModule } from 'primeng/accordion';

import { ICoworkerDocumentVersion } from '../../../../core/interfaces/i-coworker-document';
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
  readonly disabled = input(false);
  readonly downloadingVersionId = input<string | null>(null);
  readonly downloadRequested = output<ICoworkerDocumentVersion>();

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
}
