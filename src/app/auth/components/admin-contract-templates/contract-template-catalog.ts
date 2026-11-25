import { Component, computed, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { filter, switchMap } from 'rxjs';

import { FileUpload } from '../../../common/file-upload/file-upload';
import { LoadingOverlay } from '../../../common/loading-overlay/loading-overlay';
import { PdfViewerDialog } from '../../../common/pdf-viewer-dialog/pdf-viewer-dialog';
import { STATUS_BADGE_CLASS } from '../../../core/configs/badge-class.config';
import {
  type ContractTemplateFamily,
  CONTRACT_TEMPLATE_PDF_MAX_BYTES,
  CONTRACT_TEMPLATE_PDF_MIME,
} from '../../../core/configs/admin-contract-templates.config';
import type { ContractTemplate } from '../../../core/services/admin-contract-templates/admin-contract-templates.contract';
import { UiConfirm } from '../../../core/services/ui-confirm/ui-confirm';
import type { FileUploadOptions } from '../../../core/types/file-upload';
import { createAdminContractTemplatesI18n } from './admin-contract-templates.i18n';
import { ContractTemplatesFacade } from './contract-templates-facade';

@Component({
  selector: 'app-contract-template-catalog',
  imports: [
    ReactiveFormsModule, ButtonModule, IftaLabelModule, SelectModule, TableModule,
    FileUpload, LoadingOverlay, PdfViewerDialog,
  ],
  templateUrl: './contract-template-catalog.html',
})
export class ContractTemplateCatalog {
  private readonly destroyRef = inject(DestroyRef);
  private readonly confirm = inject(UiConfirm);
  protected readonly catalog = inject(ContractTemplatesFacade);
  protected readonly i18n = createAdminContractTemplatesI18n();
  protected readonly uploadForm = new FormGroup({
    family: new FormControl<ContractTemplateFamily | null>(null, Validators.required),
    file: new FormControl<File | null>(null, [Validators.required, (control) => {
      const file: File | null = control.value;
      return file === null || (
        file.size >= 5 && file.size <= CONTRACT_TEMPLATE_PDF_MAX_BYTES &&
        file.type === CONTRACT_TEMPLATE_PDF_MIME && file.name.toLowerCase().endsWith('.pdf')
      ) ? null : { pdf: true };
    }]),
  });
  protected readonly rows = computed(() => {
    const { families, statuses } = this.i18n.copy();
    if (!families || !statuses) return [];
    const { active, withdrawn } = this.i18n.entityStatuses();
    const statusLabels = {
      staged: statuses.staged,
      active: active?.masculine,
      retired: withdrawn?.masculine,
    };
    const statusClasses = {
      staged: STATUS_BADGE_CLASS.pending,
      active: STATUS_BADGE_CLASS.active,
      retired: STATUS_BADGE_CLASS.withdrawn,
    };
    return this.catalog.templates().map((template) => ({
      template,
      familyLabel: families[template.family],
      statusLabel: statusLabels[template.status],
      statusClass: `tag-badge ${statusClasses[template.status]}`,
    }));
  });
  protected readonly uploadOptions = computed<Partial<FileUploadOptions>>(() => ({
    mode: 'files',
    accept: CONTRACT_TEMPLATE_PDF_MIME,
    maxFileSize: CONTRACT_TEMPLATE_PDF_MAX_BYTES,
    clearAfterSelect: true,
    chooseIcon: 'pi pi-report-spy',
    emptyIcon: 'pi pi-report-spy',
    disabled: !this.catalog.canAct(),
  }));

  protected selectFile(files: readonly File[]): void {
    this.uploadForm.controls.file.setValue(files[0] ?? null);
    this.uploadForm.controls.file.markAsTouched();
  }

  protected addTemplate(): void {
    if (!this.catalog.canAct()) return;
    this.uploadForm.markAllAsTouched();
    const { family, file } = this.uploadForm.getRawValue();
    if (this.uploadForm.invalid || family === null || file === null) return;

    this.catalog.upload({ family, file }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.uploadForm.controls.file.reset());
  }

  protected confirmActivation(template: ContractTemplate): void {
    if (!this.catalog.canAct() || template.status !== 'staged') return;
    const { activation } = this.i18n.copy();
    const { activate, cancel } = this.i18n.actions();
    this.confirm.modalDecision({
      header: activation.title,
      message: activation.message.replace('{{filename}}', () => template.original_filename),
      acceptLabel: activate,
      rejectLabel: cancel,
      acceptSeverity: 'success',
    }).pipe(
      filter(Boolean),
      switchMap(() => this.catalog.activate(template.template_id)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  protected confirmDeletion(template: ContractTemplate): void {
    if (!this.catalog.canAct() || !template.can_delete) return;
    const { deletion } = this.i18n.copy();
    const actions = this.i18n.actions();
    const message = template.status === 'active' ? deletion.confirmActive : deletion.confirm;
    this.confirm.modalDecision({
      header: actions.delete,
      message: message.replace('{{filename}}', () => template.original_filename),
      acceptLabel: actions.delete,
      rejectLabel: actions.cancel,
      acceptSeverity: 'danger',
    }).pipe(
      filter(Boolean),
      switchMap(() => this.catalog.deleteTemplate(template)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }
}
