import { DOCUMENT } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { finalize } from 'rxjs';

import { CommercialConstantAdmin } from '../../../../core/services/commercial-constant-admin/commercial-constant-admin';
import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import type {
  CommercialConstantAdminItem,
  CommercialConstantValue,
  CommercialConstantValueType,
} from '../../../../core/types/commercial-constant-admin';
import type { CommercialConstantEditorSave } from '../../../../core/types/commercial-constant-editor-form';
import { formatTimestampLabel } from '../../../../core/utils/date';
import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import { createAdminCommercialConstantsI18n } from '../admin-commercial-constants.i18n';
import { CommercialConstantEditor } from '../commercial-constant-editor/commercial-constant-editor';

@Component({
  selector: 'app-commercial-constant-list',
  imports: [
    RouterLink,
    ButtonModule,
    TableModule,
    LoadingOverlay,
    CommercialConstantEditor,
  ],
  templateUrl: './commercial-constant-list.html',
  providers: [provideTranslocoScope('adminCommercialPages', 'common')],
})
export class CommercialConstantList {
  private readonly constants = inject(CommercialConstantAdmin);
  private readonly confirm = inject(UiConfirm);
  private readonly toast = inject(UiToast);
  private readonly document = inject(DOCUMENT);

  protected readonly i18n = createAdminCommercialConstantsI18n();
  protected readonly rows = signal<CommercialConstantAdminItem[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly hasLoadError = signal(false);
  protected readonly activeAction = signal<string | null>(null);
  protected readonly editorVisible = signal(false);
  protected readonly selectedConstant =
    signal<CommercialConstantAdminItem | null>(null);
  protected readonly draftConstants = computed(() =>
    this.rows().filter((constant) => constant.hasDraftChanges),
  );
  protected readonly isSaving = computed(
    () => this.activeAction()?.startsWith('save:') ?? false,
  );
  protected readonly isBusy = computed(
    () => this.isLoading() || this.activeAction() !== null,
  );
  protected readonly rowVms = computed(() => {
    const values = this.i18n.commonValues();
    const status = this.i18n.status();
    const units = this.i18n.durationUnit();

    return this.rows().map((constant) => ({
      constant,
      typeLabel:
        constant.valueType === 'duration'
          ? this.i18n.commonLabels().duration
          : this.i18n.valueType()[constant.valueType],
      draftValueLabel: formatValue(
        constant.draftValue,
        constant.valueType,
        values.notAvailable,
        units.hoursShort,
        units.minutesShort,
      ),
      publishedValueLabel: formatValue(
        constant.publishedValue,
        constant.valueType,
        values.notAvailable,
        units.hoursShort,
        units.minutesShort,
      ),
      publicationLabel: constant.isPublished
        ? status.published
        : status.unpublished,
      publicationClass: constant.isPublished
        ? 'tag-badge tag-badge--success'
        : 'tag-badge tag-badge--warn',
      draftLabel: constant.hasDraftChanges
        ? status.draftChanged
        : status.draftCurrent,
      draftClass: constant.hasDraftChanges
        ? 'tag-badge tag-badge--warn'
        : 'tag-badge tag-badge--success',
      draftUpdatedAtLabel:
        formatTimestampLabel(constant.draftUpdatedAt) ?? values.notAvailable,
      draftUpdatedByLabel: constant.draftUpdatedBy ?? values.notAvailable,
      publishedAtLabel:
        formatTimestampLabel(constant.publishedAt) ?? values.notAvailable,
      publishedByLabel: constant.publishedBy ?? values.notAvailable,
    }));
  });

  constructor() {
    this.loadConstants();
  }

  protected loadConstants(): void {
    this.isLoading.set(true);
    this.hasLoadError.set(false);

    this.constants
      .getList()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (constants) => this.rows.set(constants),
        error: () => {
          const toast = this.i18n.toast();
          this.rows.set([]);
          this.hasLoadError.set(true);
          this.toast.danger({
            summary: this.i18n.page().loadErrorTitle,
            detail: toast.loadFailedDetail,
          });
        },
      });
  }

  protected openCreate(): void {
    this.selectedConstant.set(null);
    this.editorVisible.set(true);
  }

  protected openEdit(constant: CommercialConstantAdminItem): void {
    this.selectedConstant.set(constant);
    this.editorVisible.set(true);
  }

  protected onEditorVisibleChange(visible: boolean): void {
    this.editorVisible.set(visible);
    if (!visible && !this.isSaving()) {
      this.selectedConstant.set(null);
    }
  }

  protected saveConstant(event: CommercialConstantEditorSave): void {
    this.activeAction.set(`save:${event.constantId ?? 'new'}`);

    this.constants
      .save(event.constantId, event.payload)
      .pipe(finalize(() => this.activeAction.set(null)))
      .subscribe({
        next: () => {
          const toast = this.i18n.toast();
          this.toast.success({
            summary: toast.saveSuccessSummary,
            detail: toast.saveSuccessDetail,
          });
          this.editorVisible.set(false);
          this.selectedConstant.set(null);
          this.loadConstants();
        },
        error: () => this.showFailureToast('save'),
      });
  }

  protected publishAll(): void {
    this.publish(this.draftConstants().map((constant) => constant.id));
  }

  protected publishOne(constant: CommercialConstantAdminItem): void {
    this.publish([constant.id]);
  }

  protected confirmDelete(
    event: Event,
    constant: CommercialConstantAdminItem,
  ): void {
    if (!constant.canDelete) {
      return;
    }

    this.confirm.dangerDecision(event, {
      message: this.i18n
        .confirmation()
        .delete.replace('{{token}}', constant.syntax),
      acceptLabel: this.i18n.commonActions().delete,
      rejectLabel: this.i18n.commonActions().cancel,
      accept: () => this.deleteConstant(constant),
    });
  }

  protected async copyToken(
    constant: CommercialConstantAdminItem,
  ): Promise<void> {
    const clipboard = this.document.defaultView?.navigator.clipboard;
    const toast = this.i18n.toast();

    try {
      if (!clipboard) {
        throw new Error('Clipboard API is unavailable.');
      }

      await clipboard.writeText(constant.syntax);
      this.toast.success({
        summary: toast.copySuccessSummary,
        detail: toast.copySuccessDetail.replace('{{token}}', constant.syntax),
      });
    } catch {
      this.toast.danger({
        summary: toast.copyFailedSummary,
        detail: toast.copyFailedDetail,
      });
    }
  }

  private publish(constantIds: string[]): void {
    if (!constantIds.length) {
      return;
    }

    this.activeAction.set(`publish:${constantIds.join(',')}`);
    this.constants
      .publish(constantIds)
      .pipe(finalize(() => this.activeAction.set(null)))
      .subscribe({
        next: () => {
          const toast = this.i18n.toast();
          this.toast.success({
            summary: toast.publishSuccessSummary,
            detail: toast.publishSuccessDetail,
          });
          this.loadConstants();
        },
        error: () => this.showFailureToast('publish'),
      });
  }

  private deleteConstant(constant: CommercialConstantAdminItem): void {
    this.activeAction.set(`delete:${constant.id}`);
    this.constants
      .delete(constant.id)
      .pipe(finalize(() => this.activeAction.set(null)))
      .subscribe({
        next: () => {
          const toast = this.i18n.toast();
          this.toast.success({
            summary: toast.deleteSuccessSummary,
            detail: toast.deleteSuccessDetail,
          });
          this.loadConstants();
        },
        error: () => this.showFailureToast('delete'),
      });
  }

  private showFailureToast(action: 'delete' | 'publish' | 'save'): void {
    const toast = this.i18n.toast();
    const copy = {
      delete: [toast.deleteFailedSummary, toast.deleteFailedDetail],
      publish: [toast.publishFailedSummary, toast.publishFailedDetail],
      save: [toast.saveFailedSummary, toast.saveFailedDetail],
    } satisfies Record<typeof action, [string, string]>;

    this.toast.danger({ summary: copy[action][0], detail: copy[action][1] });
  }
}

function formatValue(
  value: CommercialConstantValue | null,
  valueType: CommercialConstantValueType,
  notAvailable: string,
  hoursShort: string,
  minutesShort: string,
): string {
  if (value === null) {
    return notAvailable;
  }

  if (valueType !== 'duration' || typeof value !== 'number') {
    return String(value);
  }

  return value % 60 === 0
    ? `${value / 60} ${hoursShort}`
    : `${value} ${minutesShort}`;
}
