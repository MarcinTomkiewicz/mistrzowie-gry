import { Component, computed, DestroyRef, effect, inject, input, output, signal, untracked, type AnimationCallbackEvent } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { filter } from 'rxjs';

import { ItemEditorActions } from '../../../common/item-editor-actions/item-editor-actions';
import { LoadingOverlay } from '../../../common/loading-overlay/loading-overlay';
import { PdfViewerDialog } from '../../../common/pdf-viewer-dialog/pdf-viewer-dialog';
import { CONTRACT_TEMPLATE_PDF_MIME } from '../../../core/configs/admin-contract-templates.config';
import type { ContractTemplate } from '../../../core/services/admin-contract-templates/admin-contract-templates.contract';
import { UiConfirm } from '../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import {
  CONFIGURATION_LIMITS, type ContractArea, type ContractField, type ContractPlacement,
} from '../../../core/types/contract-template-configuration';
import { createAdminContractTemplatesI18n } from './admin-contract-templates.i18n';
import { ContractConfigurationFacade } from './contract-configuration-facade';
import { contractDependencyLabels, contractPlacementRows, updateContractFields } from './contract-configuration-fields';
import { ContractFieldEditor } from './contract-field-editor';
import { ContractGeneratedPdf } from './contract-generated-pdf';
import { ContractPlacementOverlay } from './contract-placement-overlay';
import { ContractPlacementProperties } from './contract-placement-properties';
import { ContractPreparationFacade } from './contract-preparation-facade';
import { ContractTemplatesFacade } from './contract-templates-facade';
import { ContractValuesForm } from './contract-values-form';

type PropertiesPanel = { kind: 'field'; id: string } | { kind: 'placement'; index: number };

@Component({
  selector: 'app-contract-configuration-editor',
  imports: [
    FormsModule, ButtonModule, DialogModule, SelectModule, TableModule, ItemEditorActions, LoadingOverlay, PdfViewerDialog,
    ContractFieldEditor, ContractGeneratedPdf, ContractPlacementOverlay, ContractPlacementProperties, ContractValuesForm,
  ],
  providers: [ContractConfigurationFacade, ContractPreparationFacade],
  templateUrl: './contract-configuration-editor.html',
})
export class ContractConfigurationEditor {
  readonly template = input.required<ContractTemplate>();
  readonly closed = output<void>();

  protected readonly facade = inject(ContractConfigurationFacade);
  protected readonly i18n = createAdminContractTemplatesI18n();
  private readonly catalog = inject(ContractTemplatesFacade);
  private readonly confirm = inject(UiConfirm);
  private readonly toast = inject(UiToast);

  private readonly properties = signal<PropertiesPanel | null>(null);
  protected readonly drawFieldId = signal<string | null>(null);
  protected readonly pdfPlacementIndex = signal<number | null>(null);
  protected readonly sourceId = signal<string | null>(null);
  protected readonly drawOption = signal<string | null>(null);
  protected readonly drawMode = signal(true);
  protected readonly previewFormId = 'contract-example-values';
  protected readonly limits = CONFIGURATION_LIMITS;
  protected readonly layoutOpen = signal(false);
  protected readonly layoutInitialPage = signal(1);
  protected readonly fields = computed(() => this.facade.draft()?.fields ?? []);
  protected readonly fieldOptions = computed(() => this.fields().map(({ id, label }) => ({
    id, label: this.i18n.fieldLabel(label),
  })));
  protected readonly labels = computed(() => Object.fromEntries(this.fieldOptions().map(({ id, label }) => [id, label])));
  protected readonly dependencies = computed(() => contractDependencyLabels(this.fields(), this.labels(), this.i18n.values()));
  protected readonly fieldId = computed(() => {
    const panel = this.properties();
    return panel?.kind === 'field' ? panel.id : null;
  });
  protected readonly placementIndex = computed(() => {
    const panel = this.properties();
    return panel?.kind === 'placement' ? panel.index : null;
  });
  private readonly fieldIndex = computed(() => this.fields().findIndex(({ id }) => id === this.fieldId()));
  protected readonly field = computed<ContractField | undefined>(() => this.fields()[this.fieldIndex()]);
  protected readonly drawField = computed(() => this.fields().find(({ id }) => id === this.drawFieldId()));
  protected readonly earlier = computed(() => this.fields().slice(0, this.fieldIndex()));
  protected readonly trackField = (_index: number, field: ContractField) => field.id;
  protected readonly placementRows = computed(() => contractPlacementRows(
    this.facade.draft()?.placements ?? [], this.fields(), this.labels(), this.i18n.values().notProvided,
  ));
  protected readonly hasPlacementOptions = computed(() => this.placementRows().some(({ optionLabel }) => !!optionLabel));
  protected readonly trackPlacement = (_index: number, row: { index: number }) => row.index;
  protected readonly placement = computed(() => {
    const index = this.placementIndex();
    return index === null ? null : this.facade.draft()?.placements[index] ?? null;
  });
  protected readonly placementField = computed(() => this.fields().find(({ id }) => id === this.placement()?.fieldId));
  protected readonly sources = computed(() => this.catalog.templates().filter((row) =>
    row.family === this.template().family && row.template_id !== this.template().template_id));
  protected readonly layoutPreview = signal<{ url: string; title: string } | null>(null);
  protected readonly canDraw = computed(() =>
    this.facade.editable() && this.drawMode() && !!this.drawField() &&
    (this.facade.draft()?.placements.length ?? 0) < this.limits.placements);

  constructor() {
    effect(() => {
      const id = this.template().template_id;
      untracked(() => { void this.facade.load(id); });
    });
    effect((cleanup) => {
      const snapshot = this.facade.loaded()?.document;
      if (!this.layoutOpen() || !snapshot) {
        this.layoutPreview.set(null);
        return;
      }
      const url = URL.createObjectURL(new Blob([snapshot.pdfBytes], { type: CONTRACT_TEMPLATE_PDF_MIME }));
      this.layoutPreview.set({ url, title: snapshot.template.original_filename });
      cleanup(() => URL.revokeObjectURL(url));
    });
  }

  protected toggleProperties(panel: PropertiesPanel, event?: Event): void {
    if (event instanceof KeyboardEvent) {
      event.preventDefault();
      if (event.repeat) return;
    }
    const expanded = panel.kind === 'field' ? this.fieldId() === panel.id : this.placementIndex() === panel.index;
    this.properties.set(expanded ? null : panel);
  }

  protected collapseProperties({ target, animationComplete }: AnimationCallbackEvent): void {
    target.setAttribute('inert', '');
    target.removeAttribute('id');
    target.classList.add('animate-grid-leave');
    void Promise.allSettled(target.getAnimations().map((animation) => animation.finished)).then(() => animationComplete());
  }

  protected selectDrawField(id: string | null): void {
    if (this.drawFieldId() === id) return;
    this.drawFieldId.set(id);
    this.drawOption.set(null);
  }

  protected selectPdfPlacement(index: number): void {
    this.pdfPlacementIndex.set(index);
  }

  protected openLayout(): void {
    const index = this.placementIndex() ?? this.pdfPlacementIndex();
    const placement = index === null ? undefined : this.facade.draft()?.placements[index];
    this.pdfPlacementIndex.set(index);
    this.layoutInitialPage.set(placement?.page ?? 1);
    this.layoutOpen.set(true);
  }

  protected addField(): void {
    const draft = this.facade.draft();
    if (!draft || !this.facade.editable() || this.facade.pending() || draft.fields.length >= this.limits.fields) return;
    let sequence = draft.fields.length + 1;
    while (draft.fields.some(({ id }) => id === 'field_' + sequence)) sequence++;
    const id = 'field_' + sequence;
    this.updateFields([...draft.fields, { id, label: '', kind: 'text',
      required: false, options: [], visibleWhen: null, rules: {} }]);
    this.properties.set({ kind: 'field', id });
  }

  protected applyField(field: ContractField): void {
    this.updateFields(this.fields().map((item) => item.id === field.id ? field : item));
  }

  protected removeField(fieldId: string): void {
    this.updateFields(this.fields().filter(({ id }) => id !== fieldId));
  }

  protected moveField(fieldId: string, delta: number): void {
    if (!this.facade.editable() || this.facade.pending()) return;
    const fields = [...this.fields()];
    const index = fields.findIndex(({ id }) => id === fieldId);
    const other = index + delta;
    if (index < 0 || other < 0 || other >= fields.length) return;
    [fields[index], fields[other]] = [fields[other], fields[index]];
    if (fields.some((field, position) => field.visibleWhen !== null &&
      !fields.slice(0, position).some(({ id }) => id === field.visibleWhen?.fieldId))) {
      this.toast.danger({ summary: this.i18n.editor().invalidOrder });
      return;
    }
    this.updateFields(fields);
  }

  protected geometry(change: { index: number | null; area: ContractArea; page: number }): void {
    const draft = this.facade.draft();
    if (!draft || !this.facade.editable() || this.facade.pending()) return;
    if (change.index !== null) {
      const placement = draft.placements[change.index];
      if (placement) this.replacePlacement(change.index, { ...placement, ...change.area });
      return;
    }
    const field = this.drawField();
    if (!field || !this.canDraw()) return;
    const base = { ...change.area, fieldId: field.id, page: change.page };
    const option = this.drawOption();
    const placement: ContractPlacement = field.kind === 'checkbox' || (field.kind === 'select' && option !== null)
      ? { ...base, kind: 'checkbox', optionValue: field.kind === 'checkbox' ? null : option }
      : { ...base, kind: 'text', multiline: field.kind === 'multiline', font: { family: 'regular', sizePt: 11, minSizePt: 8 } };
    this.facade.update({ ...draft, placements: [...draft.placements, placement] });
    this.selectPdfPlacement(draft.placements.length);
  }

  protected updatePlacement(placement: ContractPlacement): void {
    const index = this.placementIndex();
    if (index !== null) this.replacePlacement(index, placement);
  }

  protected removePlacement(): void {
    const index = this.placementIndex();
    const draft = this.facade.draft();
    if (!draft || index === null || !this.facade.editable() || this.facade.pending()) return;
    this.remapPlacementSelection([...draft.placements.keys()].filter((position) => position !== index));
    this.facade.update({ ...draft, placements: draft.placements.filter((_, position) => index !== position) });
  }

  protected copyFromSource(): void {
    const source = this.sourceId();
    if (!source) return;
    const copy = () => {
      void this.facade.copy(source).then((copied) => {
        if (copied) this.resetSelection();
      });
    };
    if (this.facade.loaded()?.revision.configuration || this.facade.dirty()) {
      this.confirmAction(this.i18n.editor().copyWarning, this.i18n.editor().copyDraft, copy);
    } else {
      copy();
    }
  }

  protected reload(): void {
    const load = () => { this.resetSelection(); void this.facade.load(this.template().template_id); };
    if (this.facade.dirty()) this.confirmDiscard(load);
    else load();
  }

  protected activate(): void {
    const preview = this.facade.activationPreview();
    if (!preview) return;
    const copy = this.i18n.copy().activation;
    const message = copy.message.replace('{{filename}}', () => this.template().original_filename);
    this.confirmAction(message + ' ' + this.i18n.editor().previewConfirmation,
      this.i18n.actions().activate, () => {
        void this.facade.activate(preview).then((approved) => {
          if (!approved) return;
          this.toast.success({ summary: this.i18n.copy().activated });
          this.closed.emit();
        });
      }, { header: copy.title });
  }

  protected close(): void {
    if (this.facade.pending()) return;
    if (this.facade.dirty()) {
      this.confirmDiscard(() => this.closed.emit());
    } else {
      this.closed.emit();
    }
  }

  private updateFields(fields: ContractField[]): void {
    const draft = this.facade.draft();
    if (!draft || !this.facade.editable() || this.facade.pending()) return;
    const { configuration, retainedIndices } = updateContractFields(draft, fields);
    if (this.fieldId() !== null && !fields.some(({ id }) => id === this.fieldId())) this.properties.set(null);
    const target = fields.find(({ id }) => id === this.drawFieldId());
    if (!target) this.selectDrawField(null);
    if (target?.kind !== 'select' || !target.options.some(({ value }) => value === this.drawOption())) this.drawOption.set(null);
    this.remapPlacementSelection(retainedIndices);
    this.facade.update(configuration);
  }

  private remapPlacementSelection(retainedIndices: readonly number[]): void {
    const panel = this.placementIndex();
    if (panel !== null) {
      const index = retainedIndices.indexOf(panel);
      this.properties.set(index < 0 ? null : { kind: 'placement', index });
    }
    const selected = this.pdfPlacementIndex();
    if (selected !== null) {
      const index = retainedIndices.indexOf(selected);
      this.pdfPlacementIndex.set(index < 0 ? null : index);
    }
  }

  private resetSelection(): void {
    this.properties.set(null);
    this.selectDrawField(null);
    this.pdfPlacementIndex.set(null);
  }

  private replacePlacement(index: number, position: ContractPlacement): void {
    const draft = this.facade.draft();
    if (draft) this.facade.update({ ...draft, placements: draft.placements.map((p, i) => i === index ? position : p) });
  }

  private confirmDiscard(action: () => void): void {
    const copy = this.i18n.editor();
    this.confirmAction(copy.discardDraft, copy.discardChanges, action, { acceptSeverity: 'danger' });
  }

  private confirmAction(message: string, acceptLabel: string, action: () => void,
    { header = acceptLabel, acceptSeverity = 'success' }: { header?: string; acceptSeverity?: 'success' | 'danger' } = {},
  ): void {
    this.confirm.modalDecision({ header, message, acceptLabel, rejectLabel: this.i18n.actions().cancel,
      acceptSeverity }).pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef)).subscribe(action);
  }

  private readonly destroyRef = inject(DestroyRef);
}
