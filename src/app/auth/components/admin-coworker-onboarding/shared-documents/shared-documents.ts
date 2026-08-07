import { Component, computed, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { finalize } from 'rxjs';

import { STATUS_BADGE_CLASS } from '../../../../core/configs/badge-class.config';
import { COWORKER_PDF_UPLOAD_OPTIONS } from '../../../../core/configs/coworker-onboarding.config';
import type {
  AdminSharedDocument,
  AdminSharedDocumentAssignment,
} from '../../../../core/interfaces/i-admin-coworker-onboarding';
import { AdminCoworkerOnboarding } from '../../../../core/services/admin-coworker-onboarding/admin-coworker-onboarding';
import { Platform } from '../../../../core/services/platform/platform';
import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import {
  COWORKER_ONBOARDING_SCOPE,
  createCoworkerOnboardingI18n,
} from '../../../../core/translations/coworker-onboarding.i18n';
import type { CoworkerDocumentAssignmentStatus } from '../../../../core/types/coworker-onboarding';
import { formatTimestampLabel } from '../../../../core/utils/date';
import { FileUpload } from '../../../../public/common/file-upload/file-upload';
import { LoadingOverlay } from '../../../../public/common/loading-overlay/loading-overlay';
import { PdfThumbnail } from '../../../../public/common/pdf-thumbnail/pdf-thumbnail';
import {
  IPdfPreviewDialogValue,
  PdfViewerDialog,
} from '../../../../public/common/pdf-viewer-dialog/pdf-viewer-dialog';

@Component({
  selector: 'app-admin-shared-documents',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    IftaLabelModule,
    InputTextModule,
    TableModule,
    ToggleSwitchModule,
    FileUpload,
    LoadingOverlay,
    PdfThumbnail,
    PdfViewerDialog,
  ],
  templateUrl: './shared-documents.html',
  providers: [provideTranslocoScope(COWORKER_ONBOARDING_SCOPE, 'common')],
})
export class AdminSharedDocuments {
  private readonly api = inject(AdminCoworkerOnboarding);
  private readonly confirm = inject(UiConfirm);
  private readonly platform = inject(Platform);
  private readonly toast = inject(UiToast);

  protected readonly i18n = createCoworkerOnboardingI18n();
  protected readonly STATUS_BADGE_CLASS = STATUS_BADGE_CLASS;
  protected readonly formatTimestampLabel = formatTimestampLabel;
  protected readonly documents = signal<readonly AdminSharedDocument[]>([]);
  protected readonly assignments = signal<AdminSharedDocumentAssignment[]>([]);
  protected readonly editedDocument = signal<AdminSharedDocument | null>(null);
  protected readonly assignmentsDocument = signal<AdminSharedDocument | null>(null);
  protected readonly preview = signal<IPdfPreviewDialogValue | null>(null);
  protected readonly replacementThumbnail =
    signal<IPdfPreviewDialogValue | null>(null);
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly assignmentsLoading = signal(false);
  protected readonly loadFailed = signal(false);
  protected readonly form = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    assign_after_onboarding: new FormControl(true, { nonNullable: true }),
    file: new FormControl<File | null>(null, Validators.required),
  });
  protected readonly uploadOptions = computed(() => ({
    ...COWORKER_PDF_UPLOAD_OPTIONS,
    disabled: this.busy(),
  }));
  protected readonly uploadTexts = computed(() => ({
    chooseLabel: this.i18n.upload().choose,
    dropLabel: this.i18n.upload().drop,
    formatsLabel: this.i18n.upload().formats,
  }));

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.loadFailed.set(false);
    this.api
      .getSharedDocuments()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (documents) => this.documents.set(documents),
        error: () => this.loadFailed.set(true),
      });
  }

  protected selectFile(files: readonly File[]): void {
    this.form.controls.file.setValue(files[0] ?? null);
  }

  protected edit(document: AdminSharedDocument): void {
    this.editedDocument.set(document);
    this.replacementThumbnail.set(null);
    this.form.reset({
      title: document.title,
      assign_after_onboarding: document.assign_after_onboarding,
      file: null,
    });
    this.api.getSourceDownload(document.document_id, null).subscribe({
      next: (preview) =>
        this.replacementThumbnail.set({
          url: preview.url,
          title: preview.filename,
        }),
      error: () =>
        this.toast.danger({
          summary: this.i18n.toast().downloadFailedSummary,
          detail: this.i18n.toast().downloadFailedDetail,
        }),
    });
  }

  protected cancelEdit(): void {
    this.editedDocument.set(null);
    this.replacementThumbnail.set(null);
    this.form.reset({
      title: '',
      assign_after_onboarding: true,
      file: null,
    });
  }

  protected save(): void {
    this.form.markAllAsTouched();
    const value = this.form.getRawValue();

    if (this.form.invalid || !value.file) return;

    this.busy.set(true);
    this.api
      .uploadSharedDocument(
        this.editedDocument()?.document_id ?? null,
        value.title,
        value.assign_after_onboarding,
        value.file,
      )
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: () => {
          this.cancelEdit();
          this.showMutationSuccess();
          this.load();
        },
        error: () => this.showMutationError(),
      });
  }

  protected previewDocument(document: AdminSharedDocument): void {
    this.prepareDownload(document, true);
  }

  protected download(document: AdminSharedDocument): void {
    this.prepareDownload(document, false);
  }

  protected confirmArchive(event: Event, documentId: string): void {
    this.confirm.dangerDecision(event, {
      message: this.i18n.dialogs().archiveMessage,
      acceptLabel: this.i18n.actions().archive,
      rejectLabel: this.i18n.commonActions().cancel,
      accept: () => this.archive(documentId),
    });
  }

  protected showAssignments(document: AdminSharedDocument): void {
    this.assignmentsDocument.set(document);
    this.assignments.set([]);
    this.assignmentsLoading.set(true);
    this.api
      .getSharedDocumentAssignments(document.document_id)
      .pipe(finalize(() => this.assignmentsLoading.set(false)))
      .subscribe({
        next: (assignments) => this.assignments.set([...assignments]),
        error: () => {
          this.assignmentsDocument.set(null);
          this.showMutationError();
        },
      });
  }

  protected closeAssignments(): void {
    this.assignmentsDocument.set(null);
    this.assignments.set([]);
  }

  protected assignmentStatusClass(
    status: CoworkerDocumentAssignmentStatus,
  ): string {
    return STATUS_BADGE_CLASS[status];
  }

  protected assignmentStatusLabel(
    status: CoworkerDocumentAssignmentStatus,
  ): string {
    return this.i18n.statuses().assignment[status];
  }

  private archive(documentId: string): void {
    this.busy.set(true);
    this.api
      .archiveSharedDocument(documentId)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: () => {
          this.showMutationSuccess();
          this.load();
        },
        error: () => this.showMutationError(),
      });
  }

  private prepareDownload(
    document: AdminSharedDocument,
    showPreview: boolean,
  ): void {
    this.api.getSourceDownload(document.document_id, null).subscribe({
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
      detail: this.i18n.toast().mutationSuccessDetail,
    });
  }

  private showMutationError(): void {
    this.toast.danger({
      summary: this.i18n.toast().mutationFailedSummary,
      detail: this.i18n.toast().mutationFailedDetail,
    });
  }
}
