import { Component, computed, inject, input, signal } from '@angular/core';
import { finalize } from 'rxjs';

import {
  IAdminOperationalCatalog,
} from '../../../../core/interfaces/i-admin-operational-catalog';
import {
  IAdminOperationalDocumentDetail,
} from '../../../../core/interfaces/i-admin-operational-document';
import { AdminCoworkerOperationalDocuments } from '../../../../core/services/admin-coworker-operational-documents/admin-coworker-operational-documents';
import { Platform } from '../../../../core/services/platform/platform';
import type { AdminOperationalStoredVersion } from '../../../../core/types/admin-operational-version';
import { EdgeFunctionError } from '../../../../core/types/edge-function-error';
import { normalizeEdgeFunctionError } from '../../../../core/utils/edge-function-error-mapping';
import { ContextHelp } from '../../../../public/common/context-help/context-help';
import { resolveAdminOperationalError } from '../admin-operational-document-errors';
import { createAdminOperationalDocumentsI18n } from '../admin-operational-documents.i18n';
import { DocumentVersion } from '../document-version/document-version';

@Component({
  selector: 'app-admin-operational-version-history',
  standalone: true,
  imports: [ContextHelp, DocumentVersion],
  templateUrl: './version-history.html',
})
export class VersionHistory {
  private readonly documents = inject(AdminCoworkerOperationalDocuments);
  private readonly platform = inject(Platform);

  readonly document = input.required<IAdminOperationalDocumentDetail>();
  readonly catalog = input.required<IAdminOperationalCatalog>();

  protected readonly i18n = createAdminOperationalDocumentsI18n();
  protected readonly downloadingVersionId = signal<string | null>(null);
  protected readonly downloadError = signal<EdgeFunctionError | null>(null);
  protected readonly downloadErrorDescription = computed(() => {
    const error = this.downloadError();
    return error === null
      ? ''
      : resolveAdminOperationalError(
          error,
          this.i18n.errors(),
          this.i18n.errors().download,
        );
  });
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

  protected downloadVersion(version: AdminOperationalStoredVersion): void {
    if (this.downloadingVersionId() !== null) return;

    this.downloadError.set(null);
    this.downloadingVersionId.set(version.id);
    this.documents
      .downloadDocumentVersion({
        documentVersionId: version.id,
        purpose: 'admin_download',
      })
      .pipe(finalize(() => this.downloadingVersionId.set(null)))
      .subscribe({
        next: (response) =>
          this.platform.openNewTab(response.download.signedUrl),
        error: (error) => this.downloadError.set(
          normalizeEdgeFunctionError(error, this.i18n.errors().download),
        ),
      });
  }
}
