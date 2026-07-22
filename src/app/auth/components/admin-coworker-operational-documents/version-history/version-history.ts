import { Component, computed, input } from '@angular/core';

import {
  IAdminOperationalCatalog,
} from '../../../../core/interfaces/i-admin-operational-catalog';
import {
  IAdminOperationalDocumentDetail,
} from '../../../../core/interfaces/i-admin-operational-document';
import { ContextHelp } from '../../../../public/common/context-help/context-help';
import { createAdminOperationalDocumentsI18n } from '../admin-operational-documents.i18n';
import { DocumentVersion } from '../document-version/document-version';

@Component({
  selector: 'app-admin-operational-version-history',
  standalone: true,
  imports: [ContextHelp, DocumentVersion],
  templateUrl: './version-history.html',
})
export class VersionHistory {
  readonly document = input.required<IAdminOperationalDocumentDetail>();
  readonly catalog = input.required<IAdminOperationalCatalog>();

  protected readonly i18n = createAdminOperationalDocumentsI18n();
  protected readonly currentVersion = computed(
    () => this.document().currentPublishedVersion,
  );
  protected readonly otherVersions = computed(() => {
    const document = this.document();
    const recoveryVersionId = document.uploadRecovery?.documentVersionId;
    return document.versions.filter(
      (version) =>
        version.id !== document.currentPublishedVersionId &&
        version.id !== recoveryVersionId &&
        version.status !== 'ready',
    );
  });
}
