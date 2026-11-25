import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';

import { FileUpload } from '../../../common/file-upload/file-upload';
import { LoadingOverlay } from '../../../common/loading-overlay/loading-overlay';
import { PdfViewerDialog } from '../../../common/pdf-viewer-dialog/pdf-viewer-dialog';
import { STATUS_BADGE_CLASS } from '../../../core/configs/badge-class.config';
import {
  type ContractTemplateFamily,
  CONTRACT_TEMPLATE_FAMILIES,
  CONTRACT_TEMPLATE_PDF_MAX_BYTES,
  CONTRACT_TEMPLATE_PDF_MIME,
  CONTRACT_TEMPLATE_SOURCES,
  INITIAL_TEMPLATE_APPROVAL_REFERENCE,
} from '../../../core/configs/admin-contract-templates.config';
import type { ContractTemplate } from '../../../core/services/admin-contract-templates/admin-contract-templates.contract';
import type { FileUploadOptions } from '../../../core/types/file-upload';
import { isContractTemplateSourceUrl } from '../../../core/utils/contract-template-source';
import { requiredTrimmedValidator } from '../../../core/validators/required-trimmed.validator';
import { ADMIN_CONTRACT_TEMPLATES_SCOPE, createAdminContractTemplatesI18n } from './admin-contract-templates.i18n';
import { ContractTemplatesFacade } from './contract-templates-facade';

@Component({
  selector: 'app-contract-template-catalog',
  imports: [
    ReactiveFormsModule, ButtonModule, DialogModule, IftaLabelModule, InputTextModule,
    SelectModule, TableModule, FileUpload, LoadingOverlay, PdfViewerDialog,
  ],
  templateUrl: './contract-template-catalog.html',
  providers: [ContractTemplatesFacade, provideTranslocoScope(ADMIN_CONTRACT_TEMPLATES_SCOPE, 'common')],
})
export class ContractTemplateCatalog {
  private readonly destroyRef = inject(DestroyRef);
  protected readonly catalog = inject(ContractTemplatesFacade);
  protected readonly i18n = createAdminContractTemplatesI18n();
  protected readonly selectedForActivation = signal<ContractTemplate | null>(null);
  protected readonly approvalReference = new FormControl('', {
    nonNullable: true,
    validators: [requiredTrimmedValidator()],
  });
  protected readonly activationForm = new FormGroup({ approvalReference: this.approvalReference });
  protected readonly uploadForm = new FormGroup({
    family: new FormControl<ContractTemplateFamily | null>(null, Validators.required),
    sourceUrl: new FormControl('', {
      nonNullable: true,
      validators: [(control) => isContractTemplateSourceUrl(control.value) ? null : { sourceUrl: true }],
    }),
    file: new FormControl<File | null>(null, [Validators.required, (control) => {
      const file: File | null = control.value;
      return file === null || (
        file.size >= 5 && file.size <= CONTRACT_TEMPLATE_PDF_MAX_BYTES &&
        file.type === CONTRACT_TEMPLATE_PDF_MIME && file.name.toLowerCase().endsWith('.pdf')
      ) ? null : { pdf: true };
    }]),
  });
  protected readonly familyOptions = computed(() => {
    const labels = this.i18n.copy().families;
    return labels ? CONTRACT_TEMPLATE_FAMILIES.map((value) => ({ value, label: labels[value] })) : [];
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

  constructor() {
    this.uploadForm.controls.family.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((family) => {
      this.uploadForm.controls.sourceUrl.reset(family ? CONTRACT_TEMPLATE_SOURCES[family] : '');
    });
  }

  protected selectFile(files: readonly File[]): void {
    this.uploadForm.controls.file.setValue(files[0] ?? null);
    this.uploadForm.controls.file.markAsTouched();
  }

  protected addTemplate(): void {
    if (!this.catalog.canAct()) return;
    this.uploadForm.markAllAsTouched();
    const { family, sourceUrl, file } = this.uploadForm.getRawValue();
    if (this.uploadForm.invalid || family === null || file === null) return;

    this.catalog.upload({ family, sourceUrl: sourceUrl.trim(), file }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.uploadForm.controls.file.reset());
  }

  protected startActivation(template: ContractTemplate): void {
    if (!this.catalog.canAct() || template.status !== 'staged') return;
    const initialSource = template.source_document_url === CONTRACT_TEMPLATE_SOURCES[template.family] &&
      !this.catalog.templates().some((row) => row.family === template.family && row.approved_at !== null);
    this.approvalReference.reset(initialSource ? INITIAL_TEMPLATE_APPROVAL_REFERENCE : '');
    this.selectedForActivation.set(template);
  }

  protected activateTemplate(): void {
    const template = this.selectedForActivation();
    if (template === null || !this.catalog.canAct()) return;
    this.approvalReference.markAsTouched();
    if (this.approvalReference.invalid) return;

    this.selectedForActivation.set(null);
    this.catalog.activate(template.template_id, this.approvalReference.value.trim()).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }
}
