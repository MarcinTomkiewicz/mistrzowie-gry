import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { finalize } from 'rxjs';

import { STATUS_BADGE_CLASS } from '../../../../core/configs/badge-class.config';
import { COWORKER_PDF_UPLOAD_OPTIONS } from '../../../../core/configs/coworker-onboarding.config';
import type {
  ICoworkerDocumentPortal,
  ICoworkerPrivateDocument,
  ICoworkerSharedDocument,
} from '../../../../core/interfaces/i-coworker-onboarding';
import type { IPdfPreview } from '../../../../core/interfaces/i-pdf';
import { CoworkerOnboarding } from '../../../../core/services/coworker-onboarding/coworker-onboarding';
import { Platform } from '../../../../core/services/platform/platform';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import {
  COWORKER_ONBOARDING_SCOPE,
  createCoworkerOnboardingI18n,
} from '../../../../core/translations/coworker-onboarding.i18n';
import type { CoworkerDocumentDownloadTarget } from '../../../../core/types/coworker-onboarding';
import { formatTimestampLabel } from '../../../../core/utils/date';
import { FileUpload } from '../../../../common/file-upload/file-upload';
import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import { PdfViewerDialog } from '../../../../common/pdf-viewer-dialog/pdf-viewer-dialog';

@Component({
  selector: 'app-coworker-onboarding-documents',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    ButtonModule,
    CheckboxModule,
    FileUpload,
    LoadingOverlay,
    PdfViewerDialog,
  ],
  templateUrl: './onboarding-documents.html',
  providers: [provideTranslocoScope(COWORKER_ONBOARDING_SCOPE, 'common')],
})
export class CoworkerOnboardingDocuments {
  private readonly api = inject(CoworkerOnboarding);
  private readonly platform = inject(Platform);
  private readonly toast = inject(UiToast);
  protected readonly sharedView =
    inject(ActivatedRoute).snapshot.routeConfig?.path === 'shared-documents';

  protected readonly i18n = createCoworkerOnboardingI18n();
  protected readonly STATUS_BADGE_CLASS = STATUS_BADGE_CLASS;
  protected readonly formatTimestampLabel = formatTimestampLabel;
  protected readonly portal = signal<ICoworkerDocumentPortal | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadFailed = signal(false);
  protected readonly activeAssignmentId = signal<string | null>(null);
  protected readonly selectedFiles =
    signal<ReadonlyMap<string, File>>(new Map());
  protected readonly declaredAssignmentIds =
    signal<ReadonlySet<string>>(new Set());
  protected readonly acknowledgedAssignmentIds =
    signal<ReadonlySet<string>>(new Set());
  protected readonly preview = signal<IPdfPreview | null>(null);
  protected readonly uploadOptions = computed(() => ({
    ...COWORKER_PDF_UPLOAD_OPTIONS,
    disabled: this.activeAssignmentId() !== null,
  }));

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.loadFailed.set(false);
    this.api
      .getPortal()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (portal) => this.portal.set(portal),
        error: () => this.loadFailed.set(true),
      });
  }

  protected selectSignedFile(
    assignmentId: string,
    files: readonly File[],
  ): void {
    const file = files[0];
    if (!file) return;
    this.selectedFiles.update((current) => {
      const next = new Map(current);
      next.set(assignmentId, file);
      return next;
    });
  }

  protected setDeclared(assignmentId: string, checked: boolean): void {
    this.declaredAssignmentIds.update((current) => {
      const next = new Set(current);
      if (checked) next.add(assignmentId);
      else next.delete(assignmentId);
      return next;
    });
  }

  protected uploadSigned(document: ICoworkerPrivateDocument): void {
    const file = this.selectedFiles().get(document.assignment_id);
    if (!file || !this.declaredAssignmentIds().has(document.assignment_id)) {
      return;
    }

    this.activeAssignmentId.set(document.assignment_id);
    this.api
      .uploadSignedDocument(document.assignment_id, file)
      .pipe(finalize(() => this.activeAssignmentId.set(null)))
      .subscribe({
        next: () => {
          this.selectedFiles.update((current) => {
            const next = new Map(current);
            next.delete(document.assignment_id);
            return next;
          });
          this.declaredAssignmentIds.update((current) => {
            const next = new Set(current);
            next.delete(document.assignment_id);
            return next;
          });
          this.showMutationSuccess();
          this.load();
        },
        error: () => this.showMutationError(),
      });
  }

  protected setAcknowledged(assignmentId: string, checked: boolean): void {
    this.acknowledgedAssignmentIds.update((current) => {
      const next = new Set(current);
      if (checked) next.add(assignmentId);
      else next.delete(assignmentId);
      return next;
    });
  }

  protected acknowledge(): void {
    const assignmentIds = [...this.acknowledgedAssignmentIds()];
    if (!assignmentIds.length) return;

    this.activeAssignmentId.set('acknowledge');
    this.api
      .acknowledgeDocuments(assignmentIds)
      .pipe(finalize(() => this.activeAssignmentId.set(null)))
      .subscribe({
        next: () => {
          this.acknowledgedAssignmentIds.set(new Set());
          this.showMutationSuccess();
          this.load();
        },
        error: () => this.showMutationError(),
      });
  }

  protected previewDocument(
    document: ICoworkerPrivateDocument | ICoworkerSharedDocument,
    target: CoworkerDocumentDownloadTarget,
  ): void {
    this.prepareDownload(document.assignment_id, target, true);
  }

  protected download(
    document: ICoworkerPrivateDocument | ICoworkerSharedDocument,
    target: CoworkerDocumentDownloadTarget,
  ): void {
    this.prepareDownload(document.assignment_id, target, false);
  }

  private prepareDownload(
    assignmentId: string,
    target: CoworkerDocumentDownloadTarget,
    showPreview: boolean,
  ): void {
    this.api.getDownload(assignmentId, target).subscribe({
      next: ({ url, filename }) => {
        if (showPreview) {
          this.preview.set({ url, title: filename });
        } else {
          this.platform.openNewTab(url);
        }
      },
      error: () =>
        this.toast.danger({
          summary: this.i18n.toast().downloadFailedSummary,
          detail: this.i18n.toast().downloadFailedDetail,
        }),
    });
  }

  private showMutationSuccess(): void {
    this.toast.success({
      summary: this.i18n.toast().mutationSuccessSummary,
      detail: this.i18n.commonStatus().changesSaved,
    });
  }

  private showMutationError(): void {
    this.toast.danger({
      summary: this.i18n.toast().mutationFailedSummary,
      detail: this.i18n.toast().mutationFailedDetail,
    });
  }
}
