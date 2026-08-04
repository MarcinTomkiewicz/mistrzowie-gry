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
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { finalize } from 'rxjs';

import { STATUS_BADGE_CLASS } from '../../../../core/configs/badge-class.config';
import {
  IAdminCoworkerSigningSourceCatalogItem,
  IAdminCoworkerSigningSourceDetail,
  IAdminCoworkerSigningSourceVersion,
} from '../../../../core/interfaces/i-admin-coworker-signing-source';
import { AdminCoworkerSigningSources } from '../../../../core/services/admin-coworker-signing-sources/admin-coworker-signing-sources';
import { Platform } from '../../../../core/services/platform/platform';
import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { AdminCoworkerSigningSourceTarget } from '../../../../core/types/admin-coworker-signing-source';
import { EdgeFunctionError } from '../../../../core/types/edge-function-error';
import { formatTimestampLabel } from '../../../../core/utils/date';
import {
  isEdgeAccessError,
  isEdgeMutationResultUncertain,
  normalizeEdgeFunctionError,
} from '../../../../core/utils/edge-function-error-mapping';
import { formatFileSizeMiB } from '../../../../core/utils/file-size';
import { LoadingOverlay } from '../../../../public/common/loading-overlay/loading-overlay';
import { SigningSourceUpload } from '../signing-source-upload/signing-source-upload';
import { createAdminCoworkerSigningSourcesI18n } from '../signing-sources/signing-sources.i18n';

type VersionAction = {
  readonly action: 'publish' | 'download';
  readonly versionId: string;
};

@Component({
  selector: 'app-admin-coworker-signing-source-workspace',
  standalone: true,
  imports: [ButtonModule, LoadingOverlay, SigningSourceUpload],
  templateUrl: './signing-source-workspace.html',
})
export class SigningSourceWorkspace {
  private readonly signingSources = inject(AdminCoworkerSigningSources);
  private readonly platform = inject(Platform);
  private readonly confirm = inject(UiConfirm);
  private readonly toast = inject(UiToast);
  private readonly destroyRef = inject(DestroyRef);
  private detailRequestId = 0;
  private activeTargetKey: string | null = null;

  readonly target = input.required<AdminCoworkerSigningSourceTarget>();
  readonly source = input.required<IAdminCoworkerSigningSourceCatalogItem | null>();
  readonly disabled = input(false);
  readonly catalogReloadRequested = output<void>();
  readonly busyChange = output<boolean>();

  protected readonly i18n = createAdminCoworkerSigningSourcesI18n();
  protected readonly STATUS_BADGE_CLASS = STATUS_BADGE_CLASS;
  protected readonly formatTimestampLabel = formatTimestampLabel;
  protected readonly formatFileSizeMiB = formatFileSizeMiB;
  protected readonly accessError = isEdgeAccessError;
  protected readonly detail = signal<IAdminCoworkerSigningSourceDetail | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly loadError = signal<EdgeFunctionError | null>(null);
  protected readonly actionError = signal<EdgeFunctionError | null>(null);
  protected readonly actionErrorDescription = signal('');
  protected readonly activeAction = signal<VersionAction | null>(null);
  protected readonly uploadBusy = signal(false);
  protected readonly isBusy = computed(
    () => this.isLoading() || this.uploadBusy() || this.activeAction() !== null,
  );
  protected readonly interactionsBlocked = computed(
    () => this.disabled() || this.isBusy() || isEdgeAccessError(this.actionError()) ||
      (this.source() !== null && this.loadError() !== null),
  );
  protected readonly versions = computed(() =>
    [...(this.detail()?.versions ?? [])].sort(
      (left, right) => right.versionNumber - left.versionNumber,
    ),
  );

  private readonly busyEffect = effect(() => {
    this.busyChange.emit(this.isBusy());
  });
  private readonly sourceEffect = effect(() => {
    const target = this.target();
    const source = this.source();
    const targetKey = [
      source?.id ?? null,
      target.sourceType,
      target.sourceCode,
      target.onboardingCaseId,
    ].join(':');
    if (targetKey === this.activeTargetKey) return;

    this.activeTargetKey = targetKey;
    this.detailRequestId += 1;
    this.detail.set(null);
    this.loadError.set(null);
    this.actionError.set(null);
    this.actionErrorDescription.set('');
    if (source === null) {
      return;
    }
    this.loadDetail(source.id);
  });

  protected retryDetail(): void {
    const sourceId = this.source()?.id;
    if (sourceId !== undefined) this.loadDetail(sourceId);
  }

  protected confirmPublish(
    event: Event,
    version: IAdminCoworkerSigningSourceVersion,
  ): void {
    if (version.status !== 'ready' || this.interactionsBlocked()) return;

    this.confirm.decision(event, {
      message: this.i18n.messages().publishConfirmation
        .replace('{versionNumber}', String(version.versionNumber))
        .replace('{filename}', () => version.originalFilename),
      acceptLabel: this.i18n.actions().publishVersion,
      rejectLabel: this.i18n.commonActions().cancel,
      accept: () => this.publishVersion(version),
    });
  }

  protected downloadVersion(version: IAdminCoworkerSigningSourceVersion): void {
    if (!this.canDownload(version) || this.interactionsBlocked()) return;

    this.startAction('download', version.id);
    this.signingSources.downloadVersion(version.id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.activeAction.set(null)),
    ).subscribe({
      next: (download) => this.platform.openNewTab(download.signedUrl),
      error: (error: unknown) => this.handleActionError(
        error,
        this.i18n.errors().download,
        false,
      ),
    });
  }

  protected canDownload(version: IAdminCoworkerSigningSourceVersion): boolean {
    return version.status === 'ready' ||
      version.status === 'published' ||
      version.status === 'superseded';
  }

  protected actionActive(
    action: VersionAction['action'],
    versionId: string,
  ): boolean {
    const active = this.activeAction();
    return active?.action === action && active.versionId === versionId;
  }

  protected uploadCompleted(sourceId: string): void {
    this.toast.success({
      summary: this.i18n.commonStatus().success,
      detail: this.i18n.messages().uploadCompleted,
    });
    this.loadDetail(sourceId);
    this.catalogReloadRequested.emit();
  }

  protected reloadAfterUpload(): void {
    const sourceId = this.detail()?.id ?? this.source()?.id;
    if (sourceId !== undefined) this.loadDetail(sourceId);
    this.catalogReloadRequested.emit();
  }

  private loadDetail(sourceId: string): void {
    const requestId = ++this.detailRequestId;
    this.isLoading.set(true);
    this.loadError.set(null);
    this.signingSources.getDetail(sourceId).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        if (requestId === this.detailRequestId) this.isLoading.set(false);
      }),
    ).subscribe({
      next: (detail) => {
        if (requestId === this.detailRequestId) this.detail.set(detail);
      },
      error: (error: unknown) => {
        if (requestId !== this.detailRequestId) return;
        this.loadError.set(normalizeEdgeFunctionError(
          error,
          this.i18n.errors().loadDetail,
        ));
      },
    });
  }

  private publishVersion(version: IAdminCoworkerSigningSourceVersion): void {
    if (version.status !== 'ready' || this.interactionsBlocked()) return;

    this.startAction('publish', version.id);
    this.signingSources.publishVersion(version.id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.activeAction.set(null)),
    ).subscribe({
      next: (result) => {
        this.toast.success({
          summary: this.i18n.commonStatus().success,
          detail: this.i18n.messages().publishCompleted,
        });
        this.loadDetail(result.sourceId);
        this.catalogReloadRequested.emit();
      },
      error: (error: unknown) => this.handleActionError(
        error,
        this.i18n.errors().publish,
        true,
      ),
    });
  }

  private startAction(action: VersionAction['action'], versionId: string): void {
    this.actionError.set(null);
    this.actionErrorDescription.set('');
    this.activeAction.set({ action, versionId });
  }

  private handleActionError(
    error: unknown,
    description: string,
    mutation: boolean,
  ): void {
    const normalized = normalizeEdgeFunctionError(error, description);
    this.actionError.set(normalized);
    this.actionErrorDescription.set(description);
    if (
      normalized.status === HttpStatusCode.Conflict ||
      normalized.status === HttpStatusCode.NotFound ||
      (mutation && isEdgeMutationResultUncertain(normalized))
    ) {
      this.reloadAfterUpload();
    }
  }
}
