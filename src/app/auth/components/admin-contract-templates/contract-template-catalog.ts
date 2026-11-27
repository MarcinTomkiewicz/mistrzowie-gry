import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import type { MenuItem } from 'primeng/api';
import { AutoFocus } from 'primeng/autofocus';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { IftaLabelModule } from 'primeng/iftalabel';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { filter, switchMap } from 'rxjs';

import { FileUpload } from '../../../common/file-upload/file-upload';
import { LoadingOverlay } from '../../../common/loading-overlay/loading-overlay';
import { PdfViewerDialog } from '../../../common/pdf-viewer-dialog/pdf-viewer-dialog';
import { STATUS_BADGE_CLASS } from '../../../core/configs/badge-class.config';
import {
  CONTRACT_TEMPLATE_PDF_MAX_BYTES,
  CONTRACT_TEMPLATE_PDF_MIME,
} from '../../../core/configs/admin-contract-templates.config';
import type { ContractFamily, ContractTemplate } from '../../../core/services/admin-contract-templates/admin-contract-templates.contract';
import { UiConfirm } from '../../../core/services/ui-confirm/ui-confirm';
import type { FileUploadOptions } from '../../../core/types/file-upload';
import { isContractFamilyLabel, isContractLabel, trimContractFamilyLabel } from '../../../core/types/contract-template-configuration';
import { stringToSlug } from '../../../core/utils/normalize-text';
import { DocumentOperations } from '../../common/document-operations/document-operations';
import { ContractConfigurationEditor } from './contract-configuration-editor';
import { createAdminContractTemplatesI18n } from './admin-contract-templates.i18n';
import { ContractTemplatesFacade } from './contract-templates-facade';

type FamilyDialog = { mode: 'list' | 'create' } | { mode: 'rename'; family: ContractFamily };

@Component({
  selector: 'app-contract-template-catalog',
  imports: [
    ReactiveFormsModule, AutoFocus, ButtonModule, IftaLabelModule, SelectModule, TableModule,
    FileUpload, LoadingOverlay, PdfViewerDialog, DialogModule, InputTextModule, ContractConfigurationEditor, DocumentOperations,
  ],
  templateUrl: './contract-template-catalog.html',
})
export class ContractTemplateCatalog {
  private readonly destroyRef = inject(DestroyRef);
  private readonly confirm = inject(UiConfirm);
  protected readonly catalog = inject(ContractTemplatesFacade);
  protected readonly i18n = createAdminContractTemplatesI18n();
  protected readonly uploadForm = new FormGroup({
    family: new FormControl<string | null>(null, Validators.required),
    file: new FormControl<File | null>(null, [Validators.required, (control) => {
      const file: File | null = control.value;
      return file === null || (
        file.size >= 5 && file.size <= CONTRACT_TEMPLATE_PDF_MAX_BYTES &&
        file.type === CONTRACT_TEMPLATE_PDF_MIME && file.name.toLowerCase().endsWith('.pdf')
      ) ? null : { pdf: true };
    }]),
  });
  protected readonly editing = signal<ContractTemplate | null>(null);
  protected readonly familyDialog = signal<FamilyDialog | null>(null);
  protected readonly families = computed(() => Array.from(this.catalog.familiesByKey().values()));
  protected readonly familyName = new FormControl('', { nonNullable: true });
  protected readonly familyForm = new FormGroup({ name: this.familyName });
  protected readonly reassignmentTarget = new FormControl<string | null>(null);
  protected readonly reassignmentForm = new FormGroup({ family: this.reassignmentTarget });
  protected readonly reassignmentTargetValue = toSignal(this.reassignmentTarget.valueChanges, { initialValue: null });
  protected readonly reassignmentTargets = computed(() => {
    const change = this.catalog.reassignment();
    const source = change?.state === 'ready' ? change.snapshot.family : change?.template.family;
    return this.catalog.familyOptions().filter(({ value }) => value !== source);
  });
  protected readonly canSaveReassignment = computed(() => this.catalog.canChooseReassignment() &&
    this.reassignmentTargets().some(({ value }) => value === this.reassignmentTargetValue()));
  private readonly familyNameValue = toSignal(this.familyName.valueChanges, { initialValue: '' });
  private readonly renamingFamily = computed(() => this.familyDialog()?.mode === 'rename');
  private readonly familyLabel = computed(() => this.renamingFamily()
    ? trimContractFamilyLabel(this.familyNameValue()) : this.familyNameValue().trim());
  protected readonly familyLabelValid = computed(() => this.renamingFamily()
    ? isContractFamilyLabel(this.familyLabel()) : isContractLabel(this.familyLabel()));
  private readonly proposedFamilyKey = computed(() => {
    if (!this.familyLabelValid()) return null;
    const slug = stringToSlug(this.familyLabel()).replaceAll('-', '_');
    const base = (/^[a-z]/.test(slug) ? slug : 'rodzaj_' + slug).slice(0, 64).replace(/_+$/, '');
    const keys = this.catalog.familiesByKey();
    let family = base;
    for (let index = 2; keys.has(family); index++) {
      const suffix = '_' + index;
      family = base.slice(0, 64 - suffix.length) + suffix;
    }
    return family;
  });
  protected readonly familyForRename = computed(() => {
    const dialog = this.familyDialog();
    if (dialog?.mode !== 'rename') return undefined;
    const { family } = dialog;
    if (!this.catalog.renameIssue()) return family;
    return this.catalog.canAct() ? this.catalog.familiesByKey().get(family.family) : undefined;
  });
  protected readonly canSaveFamily = computed(() => {
    const dialog = this.familyDialog();
    if (!dialog || dialog.mode === 'list' || !this.catalog.canAct() || !this.familyLabelValid()) return false;
    if (dialog.mode === 'create') return this.proposedFamilyKey() !== null;
    const current = this.familyForRename();
    return !!current && this.familyLabel() !== current.label;
  });
  protected readonly rows = computed(() => {
    const { statuses } = this.i18n.copy();
    if (!statuses) return [];
    const families = this.catalog.familiesByKey();
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
      familyLabel: families.get(template.family)?.label,
      statusLabel: statusLabels[template.status],
      statusClass: `tag-badge ${statusClasses[template.status]}`,
      menu: this.createOperations(template),
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

  protected openFamilyDialog(dialog: FamilyDialog = { mode: 'list' }): void {
    if (dialog.mode === 'list' ? this.catalog.saving() : !this.catalog.canAct()) return;
    this.catalog.clearRenameIssue();
    this.familyName.reset(dialog.mode === 'rename' ? dialog.family.label : '');
    this.familyDialog.set(dialog);
  }

  protected closeFamilyDialog(): void {
    if (!this.catalog.saving()) this.familyDialog.set(null);
  }

  protected saveFamily(): void {
    if (!this.canSaveFamily()) return;
    const label = this.familyLabel();
    const current = this.familyForRename();
    if (current) {
      this.catalog.renameFamily(current, label).pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.familyDialog.set(null));
      return;
    }
    const family = this.proposedFamilyKey();
    if (family === null) return;
    this.closeFamilyDialog();
    this.catalog.createFamily(family, label).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  private createOperations(template: ContractTemplate): MenuItem[] {
    const { preview, download, configure, delete: deleteLabel } = this.i18n.actions();
    const menu: MenuItem[] = [{
      label: template.status === 'staged' ? configure : this.i18n.editor().configuration,
      icon: 'pi pi-blacksmith',
      command: () => { if (this.catalog.canAct()) this.editing.set(template); },
    }];
    if (template.status === 'staged' || template.status === 'active') {
      menu.push(
        { label: preview, icon: 'pi pi-horus', command: () => this.catalog.openFile(template.template_id, true) },
        { label: download, icon: 'pi pi-missile-swarm', command: () => this.catalog.openFile(template.template_id, false) },
      );
    }
    if (template.status === 'staged') {
      menu.push({ label: this.i18n.reassignment().title, icon: 'pi pi-trade', command: () => {
        if (!this.catalog.canAct()) return;
        this.reassignmentTarget.reset();
        this.catalog.openReassignment(template);
      } });
    }
    if (template.can_delete) {
      menu.push({ label: deleteLabel, icon: 'pi pi-demolish', command: () => this.confirmDeletion(template) });
    }
    return menu;
  }

  private confirmDeletion(template: ContractTemplate): void {
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
