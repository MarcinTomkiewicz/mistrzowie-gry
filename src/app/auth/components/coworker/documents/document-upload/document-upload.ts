import { HttpStatusCode } from '@angular/common/http';
import { Component, DestroyRef, computed, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Observable, catchError, finalize, switchMap, tap, throwError } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { COWORKER_DOCUMENTS_STORAGE } from '../../../../../core/configs/coworker-documents.config';
import {
  ICoworkerDocumentDefinition,
  ICoworkerDocumentPortalSubmission,
} from '../../../../../core/interfaces/i-coworker-document';
import { ICoworkerUploadCancellationResult } from '../../../../../core/interfaces/i-coworker-document-upload';
import { CoworkerDocumentUploadOrchestrator } from '../../../../../core/services/coworker-document-upload/coworker-document-upload-orchestrator';
import { CoworkerDocuments as CoworkerDocumentsApi } from '../../../../../core/services/coworker-documents/coworker-documents';
import { UiConfirm } from '../../../../../core/services/ui-confirm/ui-confirm';
import {
  COWORKER_DOCUMENT_ACTION,
  CoworkerDocumentActionRequest,
  CoworkerDocumentUploadState,
  CoworkerSignatureDeclarationType,
} from '../../../../../core/types/coworker-document';
import { EdgeFunctionError } from '../../../../../core/types/edge-function-error';
import { isEdgeAccessError, normalizeEdgeFunctionError } from '../../../../../core/utils/edge-function-error-mapping';
import { setControlEnabled } from '../../../../../core/utils/form-controls';
import { normalizeText } from '../../../../../core/utils/normalize-text';
import { FileUpload } from '../../../../../public/common/file-upload/file-upload';
import { createDocumentsI18n } from '../documents.i18n';

@Component({
  selector: 'app-document-upload',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonModule, FileUpload, InputTextModule, SelectModule],
  templateUrl: './document-upload.html',
})
export class DocumentUpload {
  private readonly coworkerDocuments = inject(CoworkerDocumentsApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly confirm = inject(UiConfirm);
  private readonly uploadOrchestrator = inject(CoworkerDocumentUploadOrchestrator);
  private activeUploadSessionId: string | null = null;
  private operationCompleted = true;

  readonly definition = input.required<ICoworkerDocumentDefinition>();
  readonly document = input<ICoworkerDocumentPortalSubmission | null>(null);
  readonly requirementId = input.required<string>();
  readonly onboardingCaseId = input.required<string | null>();
  readonly disabled = input(false);

  readonly completed = output<void>();
  readonly busyChange = output<boolean>();
  readonly blockingError = output<EdgeFunctionError>();
  readonly reloadRequired = output<void>();

  protected readonly i18n = createDocumentsI18n();
  protected readonly isOpen = signal(false);
  protected readonly state = signal<CoworkerDocumentUploadState>('idle');
  protected readonly titleControl = new FormControl('', { nonNullable: true });
  protected readonly signatureTypeControl = new FormControl<CoworkerSignatureDeclarationType | null>(null);
  protected readonly operationError = signal<EdgeFunctionError | null>(null);
  protected readonly operationErrorDescription = signal('');
  protected readonly cleanupError = signal<EdgeFunctionError | null>(null);
  protected readonly cancellationResult = signal<ICoworkerUploadCancellationResult | null>(null);
  protected readonly cleanupFailed = computed(
    () => this.cancellationResult()?.cleanupStatus === 'failed',
  );
  protected readonly controlId = computed(() => this.document()?.id ?? this.requirementId() ?? this.definition().id);

  protected readonly isBusy = computed(() => this.state() !== 'idle');
  protected readonly signatureOptions = computed(() => {
    const labels = this.i18n.statuses().signatures;
    return this.definition().signaturePolicy.allowedDeclarationTypes
      .map((value) => ({ value, label: labels[value] }));
  });
  protected readonly acceptedFiles = computed(() => [
    ...this.definition().allowedMimeTypes,
    ...this.definition().allowedExtensions.map((extension) =>
      extension.startsWith('.') ? extension : `.${extension}`
    ),
  ].join(','));
  protected readonly maxFileSize = computed(() => Math.min(
    this.definition().maxSizeBytes,
    COWORKER_DOCUMENTS_STORAGE.maxFileSizeBytes,
  ));
  protected readonly formatsLabel = computed(() => [
    ...this.definition().allowedExtensions,
    ...this.definition().allowedMimeTypes,
  ].join(', ') || this.i18n.commonEmpty().title);
  protected canChooseFile(): boolean {
    return !this.disabled() && !this.isBusy() && this.signatureTypeControl.value !== null;
  }
  protected readonly progressLabel = computed(() => {
    const upload = this.i18n.upload();
    switch (this.state()) {
      case 'reserving': return upload.reserving;
      case 'uploading': return upload.uploading;
      case 'finalizing': return upload.finalizing;
      default: return '';
    }
  });
  protected readonly operationFieldErrors = computed(() => Object.values(this.operationError()?.fieldErrors ?? {}));
  protected readonly cleanupErrorDescription = computed(() =>
    this.cleanupError()?.code === 'STORAGE_CLEANUP_FAILED'
      ? this.i18n.upload().cleanupError
      : this.i18n.upload().cancelError
  );
  private readonly syncControlsDisabledEffect = effect(() => {
    const enabled = !this.disabled() && !this.isBusy();
    setControlEnabled(this.titleControl, enabled);
    setControlEnabled(this.signatureTypeControl, enabled);
  });

  protected open(event: Event): void {
    const show = () => {
      this.resetForm(this.document()?.title ?? '');
      this.isOpen.set(true);
    };

    if (this.document()?.status !== 'rejected') {
      show();
      return;
    }

    this.confirm.decision(event, {
      message: this.i18n.confirmations().replace,
      acceptLabel: this.i18n.actions().addVersion,
      rejectLabel: this.i18n.commonActions().cancel,
      accept: show,
    });
  }

  protected close(): void {
    if (!this.isBusy()) this.isOpen.set(false);
  }

  protected uploadSelectedFiles(files: File[]): void {
    const file = files[0];
    const signatureDeclarationType = this.signatureTypeControl.value;
    if (file === undefined || signatureDeclarationType === null) return;

    const document = this.document();
    const isNewDocument = document === null;
    const request: Extract<CoworkerDocumentActionRequest, { action: typeof COWORKER_DOCUMENT_ACTION.reserveUpload }> = {
      action: COWORKER_DOCUMENT_ACTION.reserveUpload,
      documentId: document?.id ?? null,
      requirementId: isNewDocument ? this.requirementId() : null,
      documentDefinitionId: isNewDocument ? this.definition().id : null,
      onboardingCaseId: isNewDocument ? this.onboardingCaseId() : null,
      originalFilename: file.name,
      declaredMimeType: file.type.toLowerCase(),
      sizeBytes: file.size,
      signatureDeclarationType,
      title: normalizeText(this.titleControl.value),
    };

    this.runUpload(file, request);
  }

  private runUpload(
    file: File,
    request: Extract<CoworkerDocumentActionRequest, { action: typeof COWORKER_DOCUMENT_ACTION.reserveUpload }>,
  ): void {
    let errorDescription = this.i18n.upload().reserveError;

    this.activeUploadSessionId = null;
    this.operationCompleted = false;
    this.operationError.set(null);
    this.operationErrorDescription.set('');
    this.cleanupError.set(null);
    this.cancellationResult.set(null);
    this.state.set('reserving');
    this.busyChange.emit(true);

    this.coworkerDocuments.reserveUpload(request).pipe(
      tap((response) => {
        this.activeUploadSessionId = response.upload.uploadSessionId;
        errorDescription = this.i18n.upload().uploadError;
        this.state.set('uploading');
      }),
      switchMap((response) => this.uploadOrchestrator.transfer(
        file,
        request.declaredMimeType,
        response,
      )),
      tap(() => {
        errorDescription = this.i18n.upload().finalizeError;
        this.state.set('finalizing');
      }),
      switchMap((response) => this.coworkerDocuments
        .finalizeUpload(response.upload.uploadSessionId)),
      tap(() => {
        this.activeUploadSessionId = null;
        this.operationCompleted = true;
      }),
      catchError((error: unknown) => this.cancelAfterFailure(error, errorDescription)),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.busyChange.emit(false);
        this.cancelInterruptedUpload();
      }),
    ).subscribe({
      next: () => this.resetAfterSuccess(),
      error: () => this.state.set('idle'),
    });
  }

  private cancelAfterFailure(error: unknown, description: string): Observable<never> {
    const phase = this.state();
    const normalized = normalizeEdgeFunctionError(
      error, this.i18n.errors().unexpectedDescription,
    );
    const documentStateInvalid = normalized.code === 'DOCUMENT_STATE_INVALID';
    const uploadedFileInvalid = phase === 'finalizing' &&
      normalized.code === 'UPLOADED_FILE_INVALID';
    this.operationError.set(normalized);
    this.operationErrorDescription.set(
      uploadedFileInvalid ? this.i18n.upload().mismatchError : description,
    );
    this.emitBlockingError(normalized);

    const shouldCancel = !documentStateInvalid &&
      (phase === 'uploading' || uploadedFileInvalid);
    const uploadSessionId = this.activeUploadSessionId;

    if (!shouldCancel || uploadSessionId === null) {
      this.operationCompleted = true;
      if (phase === 'finalizing' || documentStateInvalid) {
        this.activeUploadSessionId = null;
        if (documentStateInvalid || this.isAmbiguousFinalizeError(normalized)) {
          this.reloadRequired.emit();
        }
      }
      return throwError(() => normalized);
    }

    return this.uploadOrchestrator.cancel(uploadSessionId).pipe(
      tap((result) => this.completeCancellation(result)),
      catchError((cancelError: unknown) => {
        const cleanupError = normalizeEdgeFunctionError(
          cancelError, this.i18n.upload().cancelError,
        );
        this.cleanupError.set(cleanupError);
        this.emitBlockingError(cleanupError);
        this.operationCompleted = true;
        return throwError(() => normalized);
      }),
      switchMap(() => throwError(() => normalized)),
    );
  }

  private resetAfterSuccess(): void {
    this.completed.emit();
    this.isOpen.set(false);
    this.resetForm('');
  }

  private resetForm(title: string): void {
    this.titleControl.reset(title);
    this.signatureTypeControl.reset(null);
    this.operationError.set(null);
    this.operationErrorDescription.set('');
    this.cleanupError.set(null);
    this.cancellationResult.set(null);
    this.state.set('idle');
  }

  private cancelInterruptedUpload(): void {
    const uploadSessionId = this.activeUploadSessionId;
    if (uploadSessionId === null || this.operationCompleted) return;

    this.uploadOrchestrator.cancel(uploadSessionId).subscribe({
      next: (result) => this.completeCancellation(result),
      error: (error: unknown) => {
        const normalized = normalizeEdgeFunctionError(
          error, this.i18n.upload().cancelError,
        );
        console.error('[COWORKER DOCUMENT UPLOAD CANCEL FAILED]', {
          code: normalized.code,
          status: normalized.status,
          uploadSessionId,
        });
        this.operationCompleted = true;
      },
    });
  }

  private completeCancellation(
    result: ICoworkerUploadCancellationResult,
  ): void {
    this.cancellationResult.set(result);
    this.activeUploadSessionId = null;
    this.operationCompleted = true;
  }

  private isAmbiguousFinalizeError(error: EdgeFunctionError): boolean {
    return error.status === null ||
      error.status === HttpStatusCode.Conflict || error.status >= HttpStatusCode.InternalServerError;
  }

  private emitBlockingError(error: EdgeFunctionError): void {
    if (isEdgeAccessError(error) ||
      error.status === HttpStatusCode.Conflict) {
      this.blockingError.emit(error);
    }
  }
}
