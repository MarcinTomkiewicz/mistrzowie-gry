import { HttpStatusCode } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Observable,
  catchError,
  finalize,
  switchMap,
  tap,
  throwError,
} from 'rxjs';

import { COWORKER_DOCUMENTS_STORAGE } from '../../../../core/configs/coworker-documents.config';
import { AdminCoworkerSigningSources } from '../../../../core/services/admin-coworker-signing-sources/admin-coworker-signing-sources';
import { AdminCoworkerSigningSourceUpload as SigningSourceUploadOrchestrator } from '../../../../core/services/admin-coworker-signing-sources/admin-coworker-signing-source-upload';
import {
  AdminCoworkerSigningSourceTarget,
  AdminCoworkerSigningSourceUploadState,
} from '../../../../core/types/admin-coworker-signing-source';
import { EdgeFunctionError } from '../../../../core/types/edge-function-error';
import {
  isEdgeMutationResultUncertain,
  normalizeEdgeFunctionError,
} from '../../../../core/utils/edge-function-error-mapping';
import { FileUpload } from '../../../../public/common/file-upload/file-upload';
import { createAdminCoworkerSigningSourcesI18n } from '../signing-sources/signing-sources.i18n';

type UploadPhase = 'reserving' | 'uploading' | 'finalizing';

const MIME_PATTERN = /^[a-z0-9][a-z0-9.+-]*\/[a-z0-9][a-z0-9.+-]*$/;

@Component({
  selector: 'app-admin-coworker-signing-source-upload',
  standalone: true,
  imports: [FileUpload],
  templateUrl: './signing-source-upload.html',
})
export class SigningSourceUpload {
  private readonly signingSources = inject(AdminCoworkerSigningSources);
  private readonly orchestrator = inject(SigningSourceUploadOrchestrator);
  private readonly destroyRef = inject(DestroyRef);
  private activeUploadSessionId: string | null = null;
  private operationCompleted = true;
  private targetKey: string | null = null;

  readonly target = input.required<AdminCoworkerSigningSourceTarget>();
  readonly disabled = input(false);
  readonly completed = output<string>();
  readonly busyChange = output<boolean>();
  readonly reloadRequested = output<void>();

  protected readonly i18n = createAdminCoworkerSigningSourcesI18n();
  protected readonly state = signal<AdminCoworkerSigningSourceUploadState>('idle');
  protected readonly fileError = signal('');
  protected readonly operationError = signal<EdgeFunctionError | null>(null);
  protected readonly operationErrorDescription = signal('');
  protected readonly cleanupError = signal<EdgeFunctionError | null>(null);
  protected readonly isBusy = computed(() => this.state() !== 'idle');
  protected readonly progressLabel = computed(() => {
    const state = this.state();
    return state === 'idle' ? '' : this.i18n.upload()[state];
  });
  protected readonly operationFieldErrors = computed(() =>
    Object.values(this.operationError()?.fieldErrors ?? {}),
  );
  private readonly targetEffect = effect(() => {
    const target = this.target();
    const key = [
      target.sourceId,
      target.sourceType,
      target.sourceCode,
      target.onboardingCaseId,
    ].join(':');
    if (key === this.targetKey) return;
    this.targetKey = key;
    if (!untracked(this.isBusy)) this.clearErrors();
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.cancelInterruptedUpload());
  }

  protected uploadSelectedFiles(files: File[]): void {
    const file = files[0];
    if (file === undefined || this.disabled() || this.isBusy()) return;

    const declaredMimeType = file.type.trim().toLowerCase();
    const validationError = this.validateFile(file, declaredMimeType);
    if (validationError !== '') {
      this.fileError.set(validationError);
      return;
    }

    this.runUpload(file, declaredMimeType);
  }

  private runUpload(file: File, declaredMimeType: string): void {
    let phase: UploadPhase = 'reserving';
    this.clearErrors();
    this.activeUploadSessionId = null;
    this.operationCompleted = false;
    this.setState('reserving');

    this.signingSources.reserveUpload({
      ...this.target(),
      originalFilename: file.name,
      declaredMimeType,
      sizeBytes: file.size,
    }).pipe(
      tap((reservation) => {
        this.activeUploadSessionId = reservation.upload.uploadSessionId;
        phase = 'uploading';
        this.setState('uploading');
      }),
      switchMap((reservation) =>
        this.orchestrator.transfer(file, declaredMimeType, reservation),
      ),
      tap(() => {
        phase = 'finalizing';
        this.setState('finalizing');
      }),
      switchMap((reservation) =>
        this.signingSources.finalizeUpload(
          reservation.upload.uploadSessionId,
        ),
      ),
      tap(() => {
        this.activeUploadSessionId = null;
        this.operationCompleted = true;
      }),
      catchError((error: unknown) => this.handleUploadError(error, phase)),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.setState('idle')),
    ).subscribe({
      next: (result) => this.completed.emit(result.sourceId),
      error: () => undefined,
    });
  }

  private handleUploadError(
    error: unknown,
    phase: UploadPhase,
  ): Observable<never> {
    const normalized = normalizeEdgeFunctionError(
      error,
      this.errorDescription(phase),
    );
    this.operationError.set(normalized);
    this.operationErrorDescription.set(this.errorDescription(phase));

    const uploadSessionId = this.activeUploadSessionId;
    const shouldCancel = phase === 'uploading' ||
      (phase === 'finalizing' && normalized.code === 'UPLOADED_FILE_INVALID');

    if (uploadSessionId !== null && shouldCancel) {
      this.setState('cancelling');
      return this.orchestrator.cancel(uploadSessionId).pipe(
        tap(() => {
          this.activeUploadSessionId = null;
          this.operationCompleted = true;
        }),
        catchError((cancelError: unknown) => {
          this.cleanupError.set(normalizeEdgeFunctionError(
            cancelError,
            this.i18n.errors().cleanup,
          ));
          this.operationCompleted = true;
          this.reloadRequested.emit();
          return throwError(() => normalized);
        }),
        switchMap(() => throwError(() => normalized)),
      );
    }

    this.operationCompleted = true;
    if (
      phase === 'finalizing' ||
      normalized.status === HttpStatusCode.Conflict ||
      normalized.status === HttpStatusCode.NotFound ||
      isEdgeMutationResultUncertain(normalized)
    ) {
      this.activeUploadSessionId = null;
      this.reloadRequested.emit();
    }
    return throwError(() => normalized);
  }

  private validateFile(file: File, mimeType: string): string {
    if (/[/\\\u0000-\u001f\u007f]/u.test(file.name) || file.name.length > 255) {
      return this.i18n.errors().invalidFilename;
    }
    if (!MIME_PATTERN.test(mimeType) || mimeType.length > 150) {
      return this.i18n.errors().invalidMimeType;
    }
    if (file.size < 1 || file.size > COWORKER_DOCUMENTS_STORAGE.maxFileSizeBytes) {
      return this.i18n.errors().invalidFileSize;
    }
    return '';
  }

  private errorDescription(phase: UploadPhase): string {
    switch (phase) {
      case 'reserving': return this.i18n.errors().reserve;
      case 'uploading': return this.i18n.errors().upload;
      case 'finalizing': return this.i18n.errors().finalize;
    }
  }

  private setState(state: AdminCoworkerSigningSourceUploadState): void {
    const wasBusy = this.isBusy();
    this.state.set(state);
    if (wasBusy !== this.isBusy()) this.busyChange.emit(this.isBusy());
  }

  private clearErrors(): void {
    this.fileError.set('');
    this.operationError.set(null);
    this.operationErrorDescription.set('');
    this.cleanupError.set(null);
  }

  private cancelInterruptedUpload(): void {
    const uploadSessionId = this.activeUploadSessionId;
    if (uploadSessionId === null || this.operationCompleted) return;

    this.orchestrator.cancel(uploadSessionId).subscribe({
      next: () => {
        this.activeUploadSessionId = null;
        this.operationCompleted = true;
      },
      error: (error: unknown) => {
        const normalized = normalizeEdgeFunctionError(
          error,
          this.i18n.errors().cancel,
        );
        console.error('[ADMIN SIGNING SOURCE UPLOAD CANCEL FAILED]', {
          code: normalized.code,
          status: normalized.status,
          uploadSessionId,
        });
        this.operationCompleted = true;
      },
    });
  }
}
