import { Component, computed, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { provideTranslocoScope } from '@jsverse/transloco';
import type { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { finalize, type Observable, type Subscription } from 'rxjs';

import { STATUS_BADGE_CLASS } from '../../../../core/configs/badge-class.config';
import { COWORKER_PDF_UPLOAD_OPTIONS } from '../../../../core/configs/coworker-onboarding.config';
import type {
  IAdminSharedDocument,
  IAdminSharedDocumentAssignment,
} from '../../../../core/interfaces/i-admin-coworker-onboarding';
import type { IPdfPreview } from '../../../../core/interfaces/i-pdf';
import { AdminCoworkerOnboarding } from '../../../../core/services/admin-coworker-onboarding/admin-coworker-onboarding';
import { Platform } from '../../../../core/services/platform/platform';
import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import {
  COWORKER_ONBOARDING_SCOPE,
  createCoworkerOnboardingI18n,
} from '../../../../core/translations/coworker-onboarding.i18n';
import { formatTimestampLabel } from '../../../../core/utils/date';
import { scrollElementIntoViewWhenReady } from '../../../../core/utils/scroll';
import { getUserDisplayName } from '../../../../core/utils/user-display';
import { FileUpload } from '../../../../common/file-upload/file-upload';
import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import { PdfThumbnail } from '../../../../common/pdf-thumbnail/pdf-thumbnail';
import { PdfViewerDialog } from '../../../../common/pdf-viewer-dialog/pdf-viewer-dialog';
import { DocumentOperations } from '../../../common/document-operations/document-operations';
import { getOnboardingErrorMessage, getOnboardingMutationErrorToast } from '../../../common/onboarding-error';

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
    DocumentOperations,
  ],
  templateUrl: './shared-documents.html',
  providers: [provideTranslocoScope(COWORKER_ONBOARDING_SCOPE, 'common')],
})
export class SharedDocuments {
  private readonly api = inject(AdminCoworkerOnboarding);
  private readonly confirm = inject(UiConfirm);
  private readonly platform = inject(Platform);
  private readonly toast = inject(UiToast);
  private readonly destroyRef = inject(DestroyRef);
  private readonly editor = viewChild<ElementRef<HTMLElement>>('sharedDocumentEditor');
  private loadRequest?: Subscription;
  private assignmentsRequest?: Subscription;
  private previewRequest?: Subscription;
  private thumbnailRequest?: Subscription;

  protected readonly i18n = createCoworkerOnboardingI18n();
  protected readonly documents = signal<readonly IAdminSharedDocument[]>([]);
  private readonly assignments = signal<readonly IAdminSharedDocumentAssignment[]>([]);
  protected readonly assignmentRows = computed(() => this.assignments().map((assignment) => ({
    id: assignment.assignment_id,
    email: assignment.email,
    name: getUserDisplayName({
      firstName: assignment.first_name,
      nickname: assignment.nickname,
      useNickname: assignment.use_nickname,
    }) || assignment.email,
    status: this.i18n.statuses().assignment?.[assignment.status],
    statusClass: 'tag-badge ' + STATUS_BADGE_CLASS[assignment.status],
    acknowledgedAt: formatTimestampLabel(assignment.acknowledged_at),
  })));
  protected readonly rows = computed(() => this.documents().map((document) => ({
    document,
    status: document.status === 'active'
      ? this.i18n.commonEntityStatuses().active?.masculine
      : this.i18n.commonValues().archived,
    statusClass: 'tag-badge ' + STATUS_BADGE_CLASS[document.status],
    menu: this.createOperations(document),
  })));
  protected readonly editedDocument = signal<IAdminSharedDocument | null>(null);
  protected readonly assignmentsDocument = signal<IAdminSharedDocument | null>(null);
  protected readonly preview = signal<IPdfPreview | null>(null);
  protected readonly replacementThumbnail =
    signal<IPdfPreview | null>(null);
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
  constructor() {
    this.load();
  }

  protected load(): void {
    this.loadRequest?.unsubscribe();
    this.loading.set(true);
    this.loadFailed.set(false);
    this.loadRequest = this.api
      .getSharedDocuments()
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
      .subscribe({
        next: (documents) => this.documents.set(documents),
        error: () => this.loadFailed.set(true),
      });
  }

  protected selectFile(files: readonly File[]): void {
    this.form.controls.file.setValue(files[0] ?? null);
  }

  protected cancelEdit(): void {
    this.thumbnailRequest?.unsubscribe();
    this.editedDocument.set(null);
    this.replacementThumbnail.set(null);
    this.form.reset({ title: '', assign_after_onboarding: true, file: null });
  }

  protected save(): void {
    if (this.loading() || this.busy()) return;
    this.form.markAllAsTouched();
    const value = this.form.getRawValue();
    if (this.form.invalid || !value.file) return;

    this.runMutation(
      this.api.uploadSharedDocument(
        this.editedDocument()?.document_id ?? null,
        value.title,
        value.assign_after_onboarding,
        value.file,
      ),
      () => this.cancelEdit(),
    );
  }

  protected showAssignments(document: IAdminSharedDocument): void {
    this.closePreview();
    this.closeAssignments();
    this.assignmentsDocument.set(document);
    this.assignmentsLoading.set(true);
    this.assignmentsRequest = this.api.getSharedDocumentAssignments(document.document_id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.assignmentsLoading.set(false)),
    ).subscribe({
      next: (assignments) => this.assignments.set(assignments),
      error: (error: unknown) => {
        this.closeAssignments();
        const summary = getOnboardingErrorMessage(error, this.i18n.toast().errors, this.i18n.adminShared().loadError);
        this.toast.danger({ summary });
      },
    });
  }

  protected closeAssignments(): void {
    this.assignmentsRequest?.unsubscribe();
    this.assignmentsDocument.set(null);
    this.assignments.set([]);
  }

  protected closePreview(): void {
    this.previewRequest?.unsubscribe();
    this.preview.set(null);
  }

  private createOperations(document: IAdminSharedDocument): MenuItem[] {
    const actions = this.i18n.actions();
    const items: MenuItem[] = [];
    if (document.current_version_id) {
      items.push(
        {
          label: this.i18n.commonActions().preview, icon: 'pi pi-horus',
          command: () => this.openFile(document, 'preview'),
        },
        {
          label: actions.download, icon: 'pi pi-missile-swarm',
          command: () => this.openFile(document, 'download'),
        },
      );
    }
    if (document.status === 'active') {
      items.push(
        {
          label: actions.replaceShared, icon: 'pi pi-equip',
          command: () => this.edit(document),
        },
        {
          label: this.i18n.commonActions().archive, icon: 'pi pi-lockers',
          command: () => this.confirmArchive(document),
        },
      );
    }
    return items;
  }

  private edit(document: IAdminSharedDocument): void {
    this.closePreview();
    this.thumbnailRequest?.unsubscribe();
    this.editedDocument.set(document);
    this.replacementThumbnail.set(null);
    this.form.reset({
      title: document.title,
      assign_after_onboarding: document.assign_after_onboarding,
      file: null,
    });
    if (document.current_version_id) this.openFile(document, 'thumbnail');
    scrollElementIntoViewWhenReady(() => this.editor()?.nativeElement);
  }

  private confirmArchive(document: IAdminSharedDocument): void {
    this.closePreview();
    this.confirm.modalDecision({
      header: this.i18n.commonActions().archive,
      message: this.i18n.dialogs().archiveMessage,
      acceptLabel: this.i18n.commonActions().archive,
      rejectLabel: this.i18n.commonActions().cancel,
      acceptSeverity: 'danger',
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((accepted) => {
      if (!accepted || this.loading() || this.busy() ||
          !this.documents().some(({ document_id, status }) =>
            document_id === document.document_id && status === 'active')) return;
      this.runMutation(this.api.archiveSharedDocument(document.document_id), () => {
        if (this.editedDocument()?.document_id === document.document_id) this.cancelEdit();
      });
    });
  }

  private openFile(document: IAdminSharedDocument, purpose: 'preview' | 'download' | 'thumbnail'): void {
    if (purpose === 'preview') this.closeAssignments();
    if (purpose !== 'thumbnail') this.closePreview();
    const request = this.api.getSharedSourceDownload(document.document_id).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ({ url, filename }) => {
        if (purpose === 'preview') {
          this.preview.set({ url, title: filename });
        } else if (purpose === 'thumbnail') {
          this.replacementThumbnail.set({ url, title: filename });
        } else {
          this.platform.openNewTab(url);
        }
      },
      error: (error: unknown) => {
        const copy = this.i18n.toast();
        this.toast.danger({
          summary: copy.downloadFailedSummary,
          detail: getOnboardingErrorMessage(error, copy.errors, copy.downloadFailedDetail),
        });
      },
    });
    if (purpose === 'preview') this.previewRequest = request;
    if (purpose === 'thumbnail') this.thumbnailRequest = request;
  }

  private runMutation(request: Observable<unknown>, after: () => void): void {
    this.busy.set(true);
    request.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.busy.set(false)),
    ).subscribe({
      next: () => {
        after();
        this.toast.success({
          summary: this.i18n.toast().mutationSuccessSummary,
          detail: this.i18n.commonStatus().changesSaved,
        });
        this.load();
      },
      error: (error: unknown) => this.toast.danger(getOnboardingMutationErrorToast(error, this.i18n.toast())),
    });
  }
}
