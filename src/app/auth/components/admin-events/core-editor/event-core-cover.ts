import { Component, computed, DestroyRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { finalize } from 'rxjs';

import { ImageUpload } from '../../../../common/image-upload/image-upload';
import { Storage } from '../../../../core/services/storage/storage';
import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { createScopedObjectI18n } from '../../../../core/translations/scoped.i18n';
import type { CoreCoverCopy } from '../../../../core/types/i18n/admin-events';
import type { FileUploadImageChange } from '../../../../core/types/file-upload';
import { resolveEventCoreAdminErrorMessage } from '../event-admin-errors';
import { createEventCoreEditorI18n } from './core-editor.i18n';
import { EventCoreCoverController } from './event-core-cover-controller';
import { EventCoreMetadataController } from './event-core-metadata-controller';

@Component({
  selector: 'app-event-core-cover',
  imports: [ImageUpload, ButtonModule, MessageModule],
  template: `
    <section class="mg-card flex-col-start-stretch gap-md p-md w-100 min-w-0">
      <h2 class="mg-section__title mg-section__title--md m-0">{{ i18n.commonLabels().cover }}</h2>
      <p class="m-0 muted-text">{{ copy().info }}</p>
      @if (!metadata.canEditCore() && !cover.locked()) {
        <p class="m-0 muted-text">{{ copy().readOnly }}</p>
      }
      @if (metadata.coreForm.dirty || metadata.editionForm.dirty) {
        <p class="m-0 muted-text">{{ copy().metadataFirst }}</p>
      }
      <app-image-upload [currentUrl]="previewUrl()" [clearCurrent]="true"
        [cropHint]="copy().cropHint" [previewAlt]="copy().previewAlt"
        [disabled]="!canSelect()" (imageChange)="select($event)" />
      @if (errorMessage(); as message) {
        <p-message [severity]="cover.needsReconciliation() || cover.conflict() ? 'warn' : 'error'" role="alert">{{ message }}</p-message>
      }
      <div class="flex-row-start-center flex-wrap gap-sm border-top pt-md w-100">
        <p-button type="button" severity="success" size="small" icon="pi pi-done-it" loadingIcon="pi pi-d20"
          [label]="cover.needsReconciliation() ? i18n.commonActions().refresh : cover.state() === 'cleanup' ? i18n.commonActions().retry
            : cover.locked() ? i18n.creation().retryRead : copy().save"
          [loading]="cover.isBusy() || metadata.isBusy()" [disabled]="!canSave()" (onClick)="save()" />
        <p-button type="button" severity="secondary" size="small" [outlined]="true" icon="pi pi-interdiction"
          [label]="i18n.commonActions().cancel" [disabled]="!canDiscard()" (onClick)="discard()" />
      </div>
    </section>
  `,
})
export class EventCoreCover {
  private readonly storage = inject(Storage);
  private readonly confirm = inject(UiConfirm);
  private readonly toast = inject(UiToast);
  private readonly destroyRef = inject(DestroyRef);
  private readonly imageUpload = viewChild(ImageUpload);
  protected readonly metadata = inject(EventCoreMetadataController);
  protected readonly cover = inject(EventCoreCoverController);
  private readonly isConfirming = signal(false);
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly copy = createScopedObjectI18n<CoreCoverCopy>('adminEvents', 'editor.cover');
  protected readonly previewUrl = computed(() => this.cover.removing() ? null
    : this.storage.getPublicUrl(this.metadata.core()?.coverImagePath, 'images'));
  protected readonly errorMessage = computed(() => {
    if (this.cover.needsReconciliation()) {
      if (this.metadata.errors().core !== undefined) return this.copy().refreshFailed;
      return this.cover.abandoned() === 'cleanup' ? this.copy().cleanupAbandoned : this.copy().abandoned;
    }
    if (this.cover.state() === 'cleanup' && this.cover.error() !== null) return this.copy().cleanupFailed;
    if (this.cover.conflict()) return this.copy().conflict;
    const error = this.cover.error();
    if (error === null) return null;
    if (this.cover.locked()) return this.copy().uncertain;
    return resolveEventCoreAdminErrorMessage(error, this.i18n.rpcErrors(), this.i18n.commonErrors().concurrentModification);
  });

  protected canSelect(): boolean {
    return !this.isConfirming() && this.metadata.canEditCore() && !this.metadata.locked() && !this.metadata.blocked() &&
      !this.metadata.coreForm.dirty && !this.metadata.editionForm.dirty && this.cover.ready();
  }

  protected canSave(): boolean {
    if (this.isConfirming() || this.cover.isBusy() || this.metadata.locked() || this.metadata.blocked()) return false;
    return this.cover.needsReconciliation() || this.cover.locked() || (this.canSelect() && this.cover.dirty());
  }

  protected canDiscard(): boolean {
    return !this.isConfirming() && (this.cover.canAbandon() || (!this.cover.locked() && this.cover.dirty()));
  }

  protected select(change: FileUploadImageChange): void {
    const core = this.metadata.core();
    if (core && this.canSelect()) this.cover.select(change, core);
  }

  protected save(): void {
    const core = this.metadata.core();
    if (!core || !this.canSave()) return;
    const refreshing = this.cover.needsReconciliation();
    const operation = refreshing ? this.metadata.refresh('core') : this.cover.save(core);
    operation.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: saved => {
        if (this.metadata.core()?.id !== core.id) return;
        this.syncCore();
        if (!this.cover.dirty()) this.imageUpload()?.resetSelection();
        if (refreshing || !saved) return;
        this.toast.success({ summary: this.i18n.toast().saveSuccessSummary, detail: this.copy().saved });
      },
      error: () => {
        if (this.metadata.core()?.id !== core.id) return;
        this.syncCore();
        this.toast.danger({ summary: this.i18n.toast().saveFailedSummary,
          detail: this.errorMessage() ?? this.i18n.rpcErrors().unknown });
      },
    });
  }

  protected discard(): void {
    const coreId = this.metadata.core()?.id;
    if (!coreId || !this.canDiscard()) return;
    if (!this.cover.canAbandon()) {
      this.cover.reset();
      this.imageUpload()?.resetSelection();
      return;
    }
    this.isConfirming.set(true);
    this.confirm.modalDecision({
      header: this.i18n.commonLabels().cover,
      message: this.cover.state() === 'cleanup' ? this.copy().abandonCleanupConfirm : this.copy().abandonConfirm,
      acceptLabel: this.copy().abandonAction, rejectLabel: this.i18n.commonActions().cancel,
    }).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.isConfirming.set(false))).subscribe(accepted => {
      if (!accepted || this.metadata.core()?.id !== coreId || !this.cover.abandon()) return;
      this.syncCore();
      this.imageUpload()?.resetSelection();
    });
  }

  private syncCore(): void {
    const core = this.cover.currentCore();
    if (core && core.id === this.metadata.core()?.id && !this.cover.needsReconciliation()) this.metadata.load(core);
  }
}
