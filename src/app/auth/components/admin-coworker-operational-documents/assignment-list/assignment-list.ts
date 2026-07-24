import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { finalize, forkJoin, map, switchMap } from 'rxjs';

import { STATUS_BADGE_CLASS } from '../../../../core/configs/badge-class.config';
import { targetKey } from '../../../../core/contracts/admin-operational-documents/targets.contract';
import type { IAdminOperationalAssignmentListItem } from '../../../../core/interfaces/i-admin-operational-assignment';
import type { IAdminOperationalCatalog } from '../../../../core/interfaces/i-admin-operational-catalog';
import type { IAdminOperationalDocumentDetail } from '../../../../core/interfaces/i-admin-operational-document';
import { AdminCoworkerOperationalDocuments } from '../../../../core/services/admin-coworker-operational-documents/admin-coworker-operational-documents';
import { Platform } from '../../../../core/services/platform/platform';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import type { AdminOperationalStoredVersion } from '../../../../core/types/admin-operational-version';
import type { EdgeFunctionError } from '../../../../core/types/edge-function-error';
import { assertEdgeContract } from '../../../../core/utils/edge-contract';
import {
  isEdgeAccessError,
  normalizeEdgeFunctionError,
} from '../../../../core/utils/edge-function-error-mapping';
import { ContextHelp } from '../../../../public/common/context-help/context-help';
import { LoadingOverlay } from '../../../../public/common/loading-overlay/loading-overlay';
import { resolveAdminOperationalError } from '../admin-operational-document-errors';
import {
  createAdminOperationalDocumentsI18n,
  OPERATIONAL_DOCUMENTS_ADMIN_SCOPE,
} from '../admin-operational-documents.i18n';
import { AssignmentTable } from '../assignment-table/assignment-table';
import { WaiverDialog } from '../waiver-dialog/waiver-dialog';

@Component({
  selector: 'app-admin-operational-assignment-list',
  standalone: true,
  imports: [
    RouterLink,
    ButtonModule,
    AssignmentTable,
    ContextHelp,
    LoadingOverlay,
    WaiverDialog,
  ],
  templateUrl: './assignment-list.html',
  providers: [
    provideTranslocoScope(OPERATIONAL_DOCUMENTS_ADMIN_SCOPE, 'common'),
  ],
})
export class AssignmentList {
  private readonly api = inject(AdminCoworkerOperationalDocuments);
  private readonly platform = inject(Platform);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(UiToast);
  private readonly documentId: string;
  private readonly documentVersionId: string;

  protected readonly i18n = createAdminOperationalDocumentsI18n();
  protected readonly STATUS_BADGE_CLASS = STATUS_BADGE_CLASS;
  protected readonly catalog = signal<IAdminOperationalCatalog | null>(null);
  protected readonly document =
    signal<IAdminOperationalDocumentDetail | null>(null);
  protected readonly version = signal<AdminOperationalStoredVersion | null>(
    null,
  );
  protected readonly assignments =
    signal<IAdminOperationalAssignmentListItem[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly downloading = signal(false);
  protected readonly waiverBusy = signal(false);
  protected readonly selectedItem =
    signal<IAdminOperationalAssignmentListItem | null>(null);
  protected readonly loadError = signal<EdgeFunctionError | null>(null);
  protected readonly downloadError = signal<EdgeFunctionError | null>(null);
  protected readonly waiverError = signal<EdgeFunctionError | null>(null);
  protected readonly isAccessBlocked = computed(() =>
    isEdgeAccessError(this.loadError()),
  );
  protected readonly loadErrorDescription = computed(() =>
    this.describeError(this.loadError(), this.i18n.errors().assignmentLoad),
  );
  protected readonly downloadErrorDescription = computed(() =>
    this.describeError(this.downloadError(), this.i18n.errors().download),
  );
  protected readonly waiverErrorDescription = computed(() =>
    this.describeError(this.waiverError(), this.i18n.errors().waiver),
  );

  constructor() {
    const documentId = this.route.snapshot.paramMap.get('documentId');
    const documentVersionId = this.route.snapshot.paramMap.get(
      'documentVersionId',
    );
    if (documentId === null || documentVersionId === null) {
      throw new Error('Operational assignment report route params are missing.');
    }
    this.documentId = documentId;
    this.documentVersionId = documentVersionId;
    this.loadReport();
  }

  protected loadReport(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.downloadError.set(null);
    this.selectedItem.set(null);
    this.waiverError.set(null);

    this.api
      .getDashboard()
      .pipe(
        switchMap((dashboard) =>
          forkJoin({
            document: this.api.getDocumentDetail(
              this.documentId,
              dashboard.catalog,
            ),
            assignments: this.api.getAssignmentList(this.documentVersionId),
          }).pipe(
            map(({ document, assignments }) => {
              const version = document.versions.find(
                (item) => item.id === this.documentVersionId,
              );
              assertEdgeContract(
                version !== undefined &&
                  version.documentId === this.documentId,
                'assignmentReport.version',
                'the requested document and version relationship',
              );
              const versionTargetKeys = new Map(
                version.targets.map((target) => [
                  target.id,
                  targetKey(target),
                ]),
              );
              assertEdgeContract(
                assignments.every(
                  (item) =>
                    item.assignment.documentId === this.documentId &&
                    item.targetProvenance.every(
                      (target) =>
                        versionTargetKeys.get(target.targetId) ===
                        targetKey(target),
                    ),
                ),
                'assignmentReport.assignments',
                'assignments related to the requested document and targets',
              );
              return {
                catalog: dashboard.catalog,
                document,
                version,
                assignments,
              };
            }),
          ),
        ),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: ({ catalog, document, version, assignments }) => {
          this.catalog.set(catalog);
          this.document.set(document);
          this.version.set(version);
          this.assignments.set(assignments);
        },
        error: (error) => {
          this.catalog.set(null);
          this.document.set(null);
          this.version.set(null);
          this.assignments.set([]);
          this.loadError.set(
            normalizeEdgeFunctionError(
              error,
              this.i18n.errors().assignmentLoad,
            ),
          );
        },
      });
  }

  protected openWaiver(item: IAdminOperationalAssignmentListItem): void {
    if (this.waiverBusy()) return;

    this.waiverError.set(null);
    this.selectedItem.set(item);
  }

  protected closeWaiver(): void {
    if (this.waiverBusy()) return;
    this.selectedItem.set(null);
    this.waiverError.set(null);
  }

  protected waiveAssignment(reason: string): void {
    const selected = this.selectedItem();
    if (selected === null || this.waiverBusy()) return;

    this.waiverBusy.set(true);
    this.waiverError.set(null);
    this.api
      .waiveAssignment(selected.assignment.id, reason)
      .pipe(finalize(() => this.waiverBusy.set(false)))
      .subscribe({
        next: (assignment) => {
          this.assignments.update((items) =>
            items.map((item) =>
              item.assignment.id === assignment.id
                ? { ...item, assignment }
                : item,
            ),
          );
          this.selectedItem.set(null);
          this.toast.success({
            summary: this.i18n.messages().waiverSuccessSummary,
            detail: this.i18n.messages().waiverSuccess,
          });
        },
        error: (error) => this.waiverError.set(
          normalizeEdgeFunctionError(error, this.i18n.errors().waiver),
        ),
      });
  }

  protected downloadVersion(): void {
    const version = this.version();
    if (version === null || this.downloading()) return;

    this.downloading.set(true);
    this.downloadError.set(null);
    this.api
      .downloadDocumentVersion({
        documentVersionId: version.id,
        purpose: 'admin_download',
      })
      .pipe(finalize(() => this.downloading.set(false)))
      .subscribe({
        next: (response) =>
          this.platform.openNewTab(response.download.signedUrl),
        error: (error) => this.downloadError.set(
          normalizeEdgeFunctionError(error, this.i18n.errors().download),
        ),
      });
  }

  private describeError(
    error: EdgeFunctionError | null,
    fallback: string,
  ): string {
    return error === null
      ? ''
      : resolveAdminOperationalError(error, this.i18n.errors(), fallback);
  }
}
