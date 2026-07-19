import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { provideTranslocoScope } from '@jsverse/transloco';
import { Observable, finalize } from 'rxjs';

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
import { getCoworkerDocumentCapability } from '../../../../core/utils/coworker-document-capability';
import { formatDateLabel, formatTimestampLabel } from '../../../../core/utils/date';
import { normalizeEdgeFunctionError } from '../../../../core/utils/edge-function-error-mapping';
import { LoadingOverlay } from '../../../../public/common/loading-overlay/loading-overlay';
import { DocumentCard } from './document-card/document-card';
import { DocumentNotifications } from './document-notifications/document-notifications';
import { DocumentUpload } from './document-upload/document-upload';
import { createDocumentsI18n } from './documents.i18n';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [ButtonModule, DocumentCard, DocumentNotifications, DocumentUpload, LoadingOverlay],
  templateUrl: './documents.html',
  providers: [provideTranslocoScope('auth', 'common')],
})
export class Documents {
  private readonly coworkerDocuments = inject(CoworkerDocumentsApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platform = inject(Platform);

  protected readonly i18n = createDocumentsI18n();
  protected readonly STATUS_BADGE_CLASS = STATUS_BADGE_CLASS;
  protected readonly getDocumentCapability = getCoworkerDocumentCapability;
  protected readonly formatTimestampLabel = formatTimestampLabel;
  protected readonly portal = signal<ICoworkerDocumentPortalResponse | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly downloadingVersionId = signal<string | null>(null);
  protected readonly mutationBusy = signal(false);
  protected readonly activeMutationId = signal<string | null>(null);
  protected readonly requiresReload = signal(false);
  protected readonly loadError = signal<EdgeFunctionError | null>(null);
  protected readonly downloadError = signal<EdgeFunctionError | null>(null);
  protected readonly mutationError = signal<EdgeFunctionError | null>(null);

  protected readonly activeError = computed(
    () => this.loadError() ?? this.mutationError() ?? this.downloadError(),
  );
  protected readonly isAccessBlocked = computed(() => {
    const status = this.activeError()?.status;
    return status === 401 || status === 403;
  });
  protected readonly actionsBlocked = computed(() =>
    this.isLoading() ||
    this.loadError() !== null ||
    this.mutationBusy() ||
    this.downloadingVersionId() !== null ||
    this.requiresReload() ||
    this.isAccessBlocked()
  );
  protected readonly documentDefinitions = computed(() => {
    const data = this.portal();
    const definitions = data === null ? [] : [
      ...data.availableDefinitions,
      ...data.requirements.map((requirement) => requirement.documentDefinition),
    ];
    return new Map(definitions.map((definition) => [definition.id, definition]));
  });
  protected readonly unassignedDocumentsByDefinition = computed(() => {
    const result = new Map<string, ICoworkerPortalDocument[]>();
    const data = this.portal();
    if (data === null) return result;

    for (const document of data.unassignedDocuments) {
      const grouped = result.get(document.documentDefinitionId);
      if (grouped === undefined) {
        result.set(document.documentDefinitionId, [document]);
      } else {
        grouped.push(document);
      }
    }
    return result;
  });
  protected readonly errorTitle = computed(() => {
    const error = this.activeError();
    const translations = this.i18n.errors();
    if (error?.status === 401) return translations.sessionTitle;
    if (error?.status === 403) return translations.unauthorizedTitle;
    if (this.loadError()) return translations.loadTitle;
    return this.mutationError() ? translations.actionTitle : translations.downloadTitle;
  });
  protected readonly errorDescription = computed(() => {
    const error = this.activeError();
    const translations = this.i18n.errors();
    if (error?.status === 401) return translations.sessionDescription;
    if (error?.status === 403) return translations.unauthorizedDescription;
    if (this.loadError()) return translations.loadDescription;
    if (this.mutationError()) {
      return error?.status === 409
        ? translations.conflictDescription
        : translations.actionDescription;
    }
    if (error?.code === 'EDGE_INVALID_SUCCESS_RESPONSE') {
      return translations.invalidDownloadResponse;
    }
    if (error?.status === 404) return translations.downloadNotFound;
    if (error?.status === 409) return translations.downloadConflict;
    if (error?.status === 502) return translations.storageError;
    return translations.unexpectedDescription;
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    if (this.isLoading()) return;
    this.isLoading.set(true);
    this.loadError.set(null);
    this.downloadError.set(null);
    this.mutationError.set(null);

    this.coworkerDocuments.getPortal().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.isLoading.set(false)),
    ).subscribe({
      next: (portal) => {
        this.portal.set(portal);
        this.requiresReload.set(false);
      },
      error: (error: unknown) => this.loadError.set(this.normalizeError(error)),
    });
  }

  protected downloadVersion(version: ICoworkerDocumentVersion): void {
    if (this.actionsBlocked()) return;
    this.downloadError.set(null);
    this.mutationError.set(null);
    this.downloadingVersionId.set(version.id);

    this.coworkerDocuments.downloadDocumentVersion(version.id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.downloadingVersionId.set(null)),
    ).subscribe({
      next: (response) => {
        const signedUrl = response.download.signedUrl.trim();
        if (signedUrl === '') {
          this.downloadError.set(new EdgeFunctionError(
            null,
            'EDGE_INVALID_SUCCESS_RESPONSE',
            this.i18n.errors().invalidDownloadResponse,
            {},
            null,
          ));
          return;
        }
        this.platform.openNewTab(signedUrl);
      },
      error: (error: unknown) => {
        const normalized = this.normalizeError(error);
        this.downloadError.set(normalized);
        this.registerBlockingError(normalized, false);
      },
    });
  }

  protected submitDocument(documentId: string): void {
    this.runMutation(documentId, this.coworkerDocuments.submitDocument(documentId));
  }

  protected withdrawDocument(documentId: string): void {
    this.runMutation(documentId, this.coworkerDocuments.withdrawDocument(documentId));
  }

  protected markNotificationRead(notificationId: string): void {
    this.runMutation(
      notificationId,
      this.coworkerDocuments.markNotificationRead(notificationId),
    );
  }

  protected handleUploadBusy(busy: boolean): void {
    this.mutationBusy.set(busy);
    this.activeMutationId.set(null);
  }

  protected handleUploadCompleted(): void {
    this.load();
  }

  protected requestReload(): void {
    this.requiresReload.set(true);
    this.load();
  }

  protected registerBlockingError(
    error: EdgeFunctionError,
    exposeAsMutationError = true,
  ): void {
    if (error.status === 409) this.requiresReload.set(true);
    if (exposeAsMutationError &&
      (error.status === 401 || error.status === 403 || error.status === 409)) {
      this.mutationError.set(error);
    }
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

  protected signatureLabels(types: readonly CoworkerSignatureDeclarationType[]): string {
    const labels = this.i18n.statuses().signatures;
    return types.map((type) => labels[type]).join(', ');
  }

  private runMutation(mutationId: string, request: Observable<void>): void {
    if (this.actionsBlocked()) return;
    this.mutationError.set(null);
    this.downloadError.set(null);
    this.mutationBusy.set(true);
    this.activeMutationId.set(mutationId);

    request.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.mutationBusy.set(false);
        this.activeMutationId.set(null);
      }),
    ).subscribe({
      next: () => this.load(),
      error: (error: unknown) => {
        const normalized = this.normalizeError(error);
        this.mutationError.set(normalized);
        this.registerBlockingError(normalized);
      },
    });
  }

  private normalizeError(error: unknown): EdgeFunctionError {
    return normalizeEdgeFunctionError(
      error,
      this.i18n.errors().unexpectedDescription,
    );
  }
}
