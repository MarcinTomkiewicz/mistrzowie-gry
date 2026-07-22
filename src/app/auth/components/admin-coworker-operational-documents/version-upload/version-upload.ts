import { HttpStatusCode } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { finalize, map, switchMap, tap } from 'rxjs';

import {
  IAdminOperationalCatalog,
} from '../../../../core/interfaces/i-admin-operational-catalog';
import {
  IAdminOperationalDocumentDetail,
} from '../../../../core/interfaces/i-admin-operational-document';
import {
  type AdminOperationalUploadRecovery,
  type AdminOperationalUploadState,
} from '../../../../core/types/admin-operational-upload';
import { AdminCoworkerOperationalDocuments } from '../../../../core/services/admin-coworker-operational-documents/admin-coworker-operational-documents';
import { SignedStorage } from '../../../../core/services/signed-storage/signed-storage';
import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import {
  ADMIN_OPERATIONAL_ERROR_CODE,
} from '../../../../core/types/admin-operational-document';
import type { AdminOperationalVersionMetadataForm } from '../../../../core/types/admin-operational-forms';
import { EdgeFunctionError } from '../../../../core/types/edge-function-error';
import { formatTimestampLabel } from '../../../../core/utils/date';
import {
  isEdgeAccessError,
  isEdgeMutationResultUncertain,
  normalizeEdgeFunctionError,
} from '../../../../core/utils/edge-function-error-mapping';
import { FileUpload } from '../../../../public/common/file-upload/file-upload';
import { resolveAdminOperationalError } from '../admin-operational-document-errors';
import { createAdminOperationalDocumentsI18n } from '../admin-operational-documents.i18n';
import {
  mapAdminOperationalReserveUpload,
} from '../version-editor/version-form';
import {
  adminOperationalUploadAccept,
  adminOperationalUploadFormatLabel,
  validateAdminOperationalUploadFile,
} from './version-upload-file';

@Component({
  selector: 'app-admin-operational-version-upload',
  standalone: true,
  imports: [ButtonModule, FileUpload],
  templateUrl: './version-upload.html',
})
export class VersionUpload {
  private readonly documents = inject(AdminCoworkerOperationalDocuments);
  private readonly signedStorage = inject(SignedStorage);
  private readonly confirm = inject(UiConfirm);
  private readonly toast = inject(UiToast);
  private readonly destroyRef = inject(DestroyRef);
  private activeUploadSessionId: string | null = null;

  readonly document = input.required<IAdminOperationalDocumentDetail>();
  readonly catalog = input.required<IAdminOperationalCatalog>();
  readonly metadata = input.required<AdminOperationalVersionMetadataForm>();
  readonly disabled = input(false);
  readonly reloadRequested = output<void>();
  readonly busyChange = output<boolean>();

  protected readonly i18n = createAdminOperationalDocumentsI18n();
  protected readonly cleanupErrorCode = ADMIN_OPERATIONAL_ERROR_CODE.storageCleanup;
  protected readonly formatTimestampLabel = formatTimestampLabel;
  protected readonly state = signal<AdminOperationalUploadState>('idle');
  protected readonly actionError = signal<EdgeFunctionError | null>(null);
  protected readonly cleanupError = signal<EdgeFunctionError | null>(null);
  protected readonly fileError = signal('');
  protected readonly recovery = computed(() => this.document().uploadRecovery);
  protected readonly hasReadyVersion = computed(() =>
    this.document().versions.some((version) => version.status === 'ready'),
  );
  protected readonly isBusy = computed(() => this.state() !== 'idle');
  protected readonly isAccessBlocked = computed(
    () => isEdgeAccessError(this.actionError()) || isEdgeAccessError(this.cleanupError()),
  );
  protected readonly uploadStorage = computed(() => this.catalog().storage);
  protected readonly canReserve = computed(
    () => !this.disabled() &&
      !this.isBusy() &&
      !this.isAccessBlocked() &&
      this.document().status !== 'archived' &&
      !this.hasReadyVersion() &&
      this.recovery() === null &&
      this.uploadStorage() !== null,
  );
  protected readonly acceptedFiles = computed(() => {
    const storage = this.uploadStorage();
    return storage === null ? '' : adminOperationalUploadAccept(storage);
  });
  protected readonly formatLabel = computed(() => {
    const storage = this.uploadStorage();
    return storage === null
      ? ''
      : adminOperationalUploadFormatLabel(storage);
  });
  protected readonly progressLabel = computed(() => {
    const state = this.state();
    return state === 'idle' ? '' : this.i18n.statuses().versionActions[state];
  });
  protected readonly actionErrorDescription = computed(() => {
    const error = this.actionError();
    if (error === null) return '';
    if (error.code === ADMIN_OPERATIONAL_ERROR_CODE.uploadedFile) {
      return this.i18n.errors().uploadedFile;
    }
    if (error.code === ADMIN_OPERATIONAL_ERROR_CODE.storage) {
      return this.i18n.errors().storage;
    }
    return resolveAdminOperationalError(
      error,
      this.i18n.errors(),
      this.i18n.errors().versionAction,
    );
  });
  protected readonly actionFieldErrors = computed(() =>
    Object.values(this.actionError()?.fieldErrors ?? {}),
  );

  protected uploadSelectedFiles(files: File[]): void {
    const file = files[0];
    const storage = this.uploadStorage();
    if (file === undefined || storage === null || !this.canReserve()) return;
    this.metadata().controls.actionDueAt.updateValueAndValidity();
    if (this.metadata().invalid) {
      this.metadata().markAllAsTouched();
      return;
    }
    const fileValidation = validateAdminOperationalUploadFile(file, storage);
    if (fileValidation.error !== null) {
      this.fileError.set(
        fileValidation.error === 'type' || fileValidation.error === 'name'
          ? this.i18n.errors().fileType
          : this.i18n.errors().fileSize,
      );
      return;
    }

    const upload = mapAdminOperationalReserveUpload(
      this.metadata(),
      this.document().id,
      file,
      fileValidation.originalFilename,
      fileValidation.declaredMimeType,
    );
    let failedPhase: AdminOperationalUploadState = 'reserving';
    this.clearErrors();
    this.setState('reserving');
    this.activeUploadSessionId = null;
    this.documents.reserveUpload(upload).pipe(
      tap((result) => {
        this.activeUploadSessionId = result.upload.uploadSessionId;
        failedPhase = 'uploading';
        this.setState('uploading');
      }),
      switchMap((result) => this.signedStorage.upload({
        bucket: storage.bucket,
        path: result.signedUpload.path,
        token: result.signedUpload.token,
        file,
        contentType: upload.declaredMimeType,
      }).pipe(map(() => result))),
      tap(() => {
        failedPhase = 'finalizing';
        this.setState('finalizing');
      }),
      switchMap((reservation) => this.documents.finalizeUpload({
        kind: 'reservation',
        upload,
        reservation,
      })),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.setState('idle');
        this.activeUploadSessionId = null;
        this.showSuccess(this.i18n.messages().uploadCompleted);
        this.reloadRequested.emit();
      },
      error: (error) => this.handleUploadError(error, failedPhase),
    });
  }

  protected finalizeRecovery(): void {
    const recovery = this.recovery();
    if (
      recovery === null ||
      !recovery.canFinalize ||
      recovery.expired ||
      this.isBusy() ||
      this.disabled()
    ) return;
    this.finalizeRecoveredUpload(recovery);
  }

  protected cancelRecovery(event: Event): void {
    const recovery = this.recovery();
    if (
      recovery === null ||
      !recovery.canCancel ||
      this.isBusy() ||
      this.disabled()
    ) return;
    this.confirm.decision(event, {
      message: this.i18n.messages().cancelReservationConfirmation,
      acceptLabel: this.i18n.actions().cancelReservation,
      rejectLabel: this.i18n.commonActions().cancel,
      accept: () =>
        this.cancelRecoveredUpload(recovery),
    });
  }

  private handleUploadError(
    error: unknown,
    phase: AdminOperationalUploadState,
  ): void {
    const normalized = normalizeEdgeFunctionError(
      error,
      this.phaseErrorFallback(phase),
    );
    this.actionError.set(normalized);
    const uploadSessionId = this.activeUploadSessionId;
    if (phase === 'uploading' && uploadSessionId !== null) {
      this.cancelFailedTransfer(uploadSessionId);
      return;
    }
    this.setState('idle');
    if (
      phase === 'finalizing' ||
      normalized.status === HttpStatusCode.Conflict ||
      isEdgeMutationResultUncertain(normalized)
    ) {
      this.reloadRequested.emit();
    }
  }

  private cancelFailedTransfer(uploadSessionId: string): void {
    this.setState('cancelling');
    this.documents.cancelUpload(uploadSessionId).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.setState('idle')),
    ).subscribe({
      next: () => {
        this.activeUploadSessionId = null;
        this.reloadRequested.emit();
      },
      error: (error) => {
        this.cleanupError.set(normalizeEdgeFunctionError(error, this.i18n.errors().cancel));
        this.reloadRequested.emit();
      },
    });
  }

  private finalizeRecoveredUpload(
    recovery: AdminOperationalUploadRecovery,
  ): void {
    this.clearErrors();
    this.setState('finalizing');
    this.documents.finalizeUpload({
      kind: 'recovery',
      documentId: this.document().id,
      recovery,
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.setState('idle')),
    ).subscribe({
      next: () => {
        this.showSuccess(this.i18n.messages().uploadCompleted);
        this.reloadRequested.emit();
      },
      error: (error: unknown) => {
        this.actionError.set(
          normalizeEdgeFunctionError(error, this.i18n.errors().finalize),
        );
        this.reloadRequested.emit();
      },
    });
  }

  private cancelRecoveredUpload(
    recovery: AdminOperationalUploadRecovery,
  ): void {
    if (this.disabled() || this.isBusy()) return;
    this.clearErrors();
    this.setState('cancelling');
    this.documents.cancelUpload(recovery.uploadSessionId).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.setState('idle')),
    ).subscribe({
      next: () => {
        this.showSuccess(this.i18n.messages().reservationCancelled);
        this.reloadRequested.emit();
      },
      error: (error: unknown) => {
        const normalized = normalizeEdgeFunctionError(
          error,
          this.i18n.errors().cancel,
        );
        if (normalized.code === ADMIN_OPERATIONAL_ERROR_CODE.storageCleanup) {
          this.cleanupError.set(normalized);
        } else {
          this.actionError.set(normalized);
        }
        this.reloadRequested.emit();
      },
    });
  }

  private phaseErrorFallback(phase: AdminOperationalUploadState): string {
    switch (phase) {
      case 'reserving': return this.i18n.errors().reserve;
      case 'uploading': return this.i18n.errors().upload;
      case 'finalizing': return this.i18n.errors().finalize;
      case 'cancelling': return this.i18n.errors().cancel;
      case 'idle': return this.i18n.errors().versionAction;
    }
  }

  private setState(state: AdminOperationalUploadState): void {
    const wasBusy = this.isBusy();
    this.state.set(state);
    if (wasBusy !== this.isBusy()) this.busyChange.emit(this.isBusy());
  }

  private clearErrors(): void {
    this.actionError.set(null);
    this.cleanupError.set(null);
    this.fileError.set('');
  }

  private showSuccess(detail: string): void {
    this.toast.success({ summary: this.i18n.messages().versionSavedSummary, detail });
  }
}
