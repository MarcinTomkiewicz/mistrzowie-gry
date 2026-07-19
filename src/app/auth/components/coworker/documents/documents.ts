import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { provideTranslocoScope } from '@jsverse/transloco';
import { finalize } from 'rxjs';

import { ButtonModule } from 'primeng/button';

import { STATUS_BADGE_CLASS } from '../../../../core/configs/badge-class.config';
import {
  ICoworkerDocumentPortalResponse,
  ICoworkerDocumentVersion,
  ICoworkerPortalDocument,
} from '../../../../core/interfaces/i-coworker-document';
import { CoworkerDocuments as CoworkerDocumentsApi } from '../../../../core/services/coworker-documents/coworker-documents';
import { Platform } from '../../../../core/services/platform/platform';
import {
  CoworkerPortalRequirementStatus,
  CoworkerSignatureDeclarationType,
} from '../../../../core/types/coworker-document';
import { EdgeFunctionError } from '../../../../core/types/edge-function-error';
import {
  formatDateLabel,
  formatTimestampLabel,
} from '../../../../core/utils/date';
import { LoadingOverlay } from '../../../../public/common/loading-overlay/loading-overlay';
import { DocumentVersionList } from './document-version-list/document-version-list';
import { createDocumentsI18n } from './documents.i18n';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [ButtonModule, DocumentVersionList, LoadingOverlay],
  templateUrl: './documents.html',
  providers: [provideTranslocoScope('auth', 'common')],
})
export class Documents {
  private readonly coworkerDocuments = inject(CoworkerDocumentsApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platform = inject(Platform);

  protected readonly i18n = createDocumentsI18n();
  protected readonly STATUS_BADGE_CLASS = STATUS_BADGE_CLASS;
  protected readonly portal = signal<ICoworkerDocumentPortalResponse | null>(
    null,
  );
  protected readonly isLoading = signal(false);
  protected readonly downloadingVersionId = signal<string | null>(null);
  protected readonly loadError = signal<EdgeFunctionError | null>(null);
  protected readonly downloadError = signal<EdgeFunctionError | null>(null);

  protected readonly activeError = computed(
    () => this.loadError() ?? this.downloadError(),
  );
  protected readonly isAccessBlocked = computed(() => {
    const status = this.activeError()?.status;
    return status === 401 || status === 403;
  });
  protected readonly errorTitle = computed(() => {
    const error = this.activeError();
    const translations = this.i18n.errors();

    if (error?.status === 401) return translations.sessionTitle;
    if (error?.status === 403) return translations.unauthorizedTitle;
    return this.loadError() ? translations.loadTitle : translations.downloadTitle;
  });
  protected readonly errorDescription = computed(() => {
    const error = this.activeError();
    const translations = this.i18n.errors();

    if (error?.status === 401) return translations.sessionDescription;
    if (error?.status === 403) return translations.unauthorizedDescription;
    if (this.loadError()) return translations.loadDescription;
    if (error?.code === 'EDGE_INVALID_SUCCESS_RESPONSE') {
      return translations.invalidDownloadResponse;
    }
    if (error?.status === 404) return translations.downloadNotFound;
    if (error?.status === 409) return translations.downloadConflict;
    if (error?.status === 502) return translations.storageError;
    return translations.unexpectedDescription;
  });

  protected readonly formatTimestampLabel = formatTimestampLabel;

  constructor() {
    this.load();
  }

  protected load(): void {
    if (this.isLoading()) return;

    this.isLoading.set(true);
    this.loadError.set(null);
    this.downloadError.set(null);

    this.coworkerDocuments
      .getPortal()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (portal) => this.portal.set(portal),
        error: (error: unknown) => {
          this.loadError.set(this.normalizeError(error));
        },
      });
  }

  protected downloadVersion(version: ICoworkerDocumentVersion): void {
    if (version.status !== 'ready' || this.downloadingVersionId() !== null) {
      return;
    }

    this.downloadError.set(null);
    this.downloadingVersionId.set(version.id);

    this.coworkerDocuments
      .downloadDocumentVersion(version.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.downloadingVersionId.set(null)),
      )
      .subscribe({
        next: (response) => {
          const signedUrl = response.download.signedUrl.trim();
          if (signedUrl === '') {
            this.downloadError.set(
              new EdgeFunctionError(
                null,
                'EDGE_INVALID_SUCCESS_RESPONSE',
                this.i18n.errors().invalidDownloadResponse,
                {},
                null,
              ),
            );
            return;
          }

          this.platform.openNewTab(signedUrl);
        },
        error: (error: unknown) => {
          this.downloadError.set(this.normalizeError(error));
        },
      });
  }

  protected documentTitle(
    document: ICoworkerPortalDocument,
    definitionTitle?: string,
  ): string {
    return document.title ??
      document.currentVersion?.originalFilename ??
      definitionTitle ??
      this.i18n.labels().documentFallback;
  }

  protected deadlineLabel(dueAt: string): string {
    return formatDateLabel(dueAt.slice(0, 10), 'pl-PL', true);
  }

  protected isRequirementLate(
    dueAt: string,
    status: CoworkerPortalRequirementStatus,
  ): boolean {
    return status === 'pending' && new Date(dueAt).getTime() < Date.now();
  }

  protected signatureLabels(
    types: readonly CoworkerSignatureDeclarationType[],
  ): string {
    const labels = this.i18n.statuses().signatures;
    return types.map((type) => labels[type]).join(', ');
  }

  private normalizeError(error: unknown): EdgeFunctionError {
    if (error instanceof EdgeFunctionError) return error;

    return new EdgeFunctionError(
      null,
      'UNEXPECTED_ERROR',
      this.i18n.errors().unexpectedDescription,
      {},
      error,
    );
  }
}
