import { Component, computed, DestroyRef, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { filter } from 'rxjs';

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
import { ContractFieldEditor } from './contract-field-editor';
import { ContractGeneratedPdf } from './contract-generated-pdf';
import { ContractPlacementOverlay } from './contract-placement-overlay';
import { ContractPreparationFacade } from './contract-preparation-facade';
import { ContractTemplatesFacade } from './contract-templates-facade';
import { ContractValuesForm } from './contract-values-form';

@Component({
  selector: 'app-contract-configuration-editor',
  imports: [
    FormsModule, ButtonModule, CheckboxModule, DialogModule, InputNumberModule, SelectModule,
    LoadingOverlay, PdfViewerDialog, ContractFieldEditor, ContractGeneratedPdf, ContractPlacementOverlay, ContractValuesForm,
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

  protected readonly fieldId = signal<string | null>(null);
  protected readonly placementIndex = signal<number | null>(null);
  protected readonly sourceId = signal<string | null>(null);
  protected readonly drawOption = signal<string | null>(null);
  protected readonly drawMode = signal(true);
  protected readonly limits = CONFIGURATION_LIMITS;
  protected readonly layoutOpen = signal(false);
  protected readonly fields = computed(() => this.facade.draft()?.fields ?? []);
  protected readonly labels = computed(() => Object.fromEntries(this.fields().map(({ id, label }) => [id, label])));
  protected readonly index = computed(() => this.fields().findIndex(({ id }) => id === this.fieldId()));
  protected readonly field = computed<ContractField | undefined>(() =>
    this.index() < 0 ? undefined : this.fields()[this.index()]);
  protected readonly earlier = computed(() => this.fields().slice(0, this.index()));
  protected readonly placement = computed(() => {
    const index = this.placementIndex();
    return index === null ? null : this.facade.draft()?.placements[index] ?? null;
  });
  protected readonly placementOptions = computed(() => {
    const position = this.placement();
    return position?.kind === 'checkbox' && position.optionValue !== null
      ? this.fields().find(({ id }) => id === position.fieldId)?.options ?? [] : [];
  });
  protected readonly sources = computed(() => this.catalog.templates().filter((row) =>
    row.family === this.template().family && row.template_id !== this.template().template_id));
  protected readonly layoutPreview = signal<{ url: string; title: string } | null>(null);
  protected readonly canDraw = computed(() =>
    this.facade.editable() && this.drawMode() && !!this.field() &&
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

  protected selectField(id: string | null): void {
    this.fieldId.set(id);
    this.drawOption.set(null);
    this.placementIndex.set(null);
  }

  protected addField(): void {
    const draft = this.facade.draft();
    if (!draft || draft.fields.length >= this.limits.fields) return;
    let sequence = draft.fields.length + 1;
    while (draft.fields.some(({ id }) => id === 'field_' + sequence)) sequence++;
    const id = 'field_' + sequence;
    this.updateFields([...draft.fields, { id, label: '', kind: 'text',
      required: false, options: [], visibleWhen: null, rules: {} }]);
    this.selectField(id);
  }

  protected applyField(field: ContractField): void {
    this.updateFields(this.fields().map((item) => item.id === field.id ? field : item));
  }

  protected removeField(): void {
    this.updateFields(this.fields().filter(({ id }) => id !== this.fieldId()));
    this.selectField(null);
  }

  protected moveField(delta: number): void {
    const index = this.index();
    const other = index + delta;
    const fields = [...this.fields()];
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
    if (!draft || !this.facade.editable()) return;
    if (change.index !== null) {
      this.patchPlacement(change.index, { ...change.area });
      return;
    }
    const field = this.field();
    if (!field || !this.canDraw()) return;
    const base = { ...change.area, fieldId: field.id, page: change.page };
    const option = this.drawOption();
    const placement: ContractPlacement = field.kind === 'checkbox' || (field.kind === 'select' && option !== null)
      ? { ...base, kind: 'checkbox', optionValue: field.kind === 'checkbox' ? null : option }
      : { ...base, kind: 'text', multiline: field.kind === 'multiline', font: { family: 'regular', sizePt: 11, minSizePt: 8 } };
    this.facade.update({ ...draft, placements: [...draft.placements, placement] });
    this.placementIndex.set(draft.placements.length);
  }

  protected selectPlacement(index: number): void {
    const placement = this.facade.draft()?.placements[index];
    if (!placement) return;
    this.selectField(placement.fieldId);
    this.placementIndex.set(index);
  }

  protected font(key: 'sizePt' | 'minSizePt', value: number | null): void {
    const index = this.placementIndex();
    const placement = this.placement();
    if (index !== null && placement?.kind === 'text' && value !== null) {
      this.replacePlacement(index, { ...placement, font: { ...placement.font, [key]: value } });
    }
  }

  protected multiline(value: boolean): void {
    const index = this.placementIndex();
    const placement = this.placement();
    if (index !== null && placement?.kind === 'text') this.replacePlacement(index, { ...placement, multiline: value });
  }

  protected placementOption(value: string): void {
    const index = this.placementIndex();
    const placement = this.placement();
    if (index !== null && placement?.kind === 'checkbox' && this.placementOptions().some((option) => option.value === value)) {
      this.replacePlacement(index, { ...placement, optionValue: value });
    }
  }

  protected placementLabel(position: ContractPlacement): string {
    const field = this.fields().find(({ id }) => id === position.fieldId);
    const option = position.kind === 'checkbox' && position.optionValue !== null
      ? field?.options.find(({ value }) => value === position.optionValue) : undefined;
    return [this.i18n.editor().page + ' ' + position.page, field?.label, option?.label].filter(Boolean).join(' · ');
  }

  protected removePlacement(): void {
    const index = this.placementIndex();
    const draft = this.facade.draft();
    if (!draft || index === null) return;
    this.facade.update({ ...draft, placements: draft.placements.filter((_, position) => index !== position) });
    this.placementIndex.set(null);
  }

  protected copyFromSource(): void {
    const source = this.sourceId();
    if (!source) return;
    const copy = () => {
      void this.facade.copy(source).then((copied) => {
        if (copied) this.selectField(null);
      });
    };
    if (this.facade.loaded()?.revision.configuration || this.facade.dirty()) {
      this.confirmAction(this.i18n.editor().copyWarning, this.i18n.editor().copyDraft, copy);
    } else {
      copy();
    }
  }

  protected reload(): void {
    const load = () => { this.selectField(null); void this.facade.load(this.template().template_id); };
    if (this.facade.dirty()) this.confirmAction(this.i18n.editor().discardDraft, this.i18n.actions().refresh, load);
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
      }, copy.title);
  }

  protected close(): void {
    if (this.facade.pending()) return;
    if (this.facade.dirty()) {
      this.confirmAction(this.i18n.editor().discardDraft, this.i18n.actions().close, () => this.closed.emit());
    } else {
      this.closed.emit();
    }
  }

  private updateFields(fields: ContractField[]): void {
    const draft = this.facade.draft();
    if (!draft) return;
    const byId = new Map(fields.map((field) => [field.id, field]));
    const selected = byId.get(this.fieldId() ?? '');
    if (selected?.kind !== 'select' || !selected.options.some(({ value }) => value === this.drawOption())) {
      this.drawOption.set(null);
    }
    const placements = draft.placements.flatMap<ContractPlacement>((p) => {
      const field = byId.get(p.fieldId);
      if (!field) return [];
      if (p.kind === 'text') return field.kind === 'checkbox' ? [] :
        [{ ...p, multiline: field.kind === 'multiline' || p.multiline }];
      return (field.kind === 'checkbox' && p.optionValue === null) ||
        (field.kind === 'select' && field.options.some(({ value }) => value === p.optionValue)) ? [p] : [];
    });
    const updated = fields.map((field) => {
      const condition = field.visibleWhen;
      const source = condition ? byId.get(condition.fieldId) : undefined;
      if (!condition || (source?.kind === 'checkbox' && typeof condition.equals === 'boolean') ||
        (source?.kind === 'select' && source.options.some(({ value }) => value === condition.equals))) return field;
      return { ...field, visibleWhen: null };
    });
    if (placements.length !== draft.placements.length) this.placementIndex.set(null);
    this.facade.update({ ...draft, fields: updated, placements });
  }

  private patchPlacement(index: number, area: ContractArea): void {
    const old = this.facade.draft()?.placements[index];
    if (old) this.replacePlacement(index, { ...old, ...area });
  }

  private replacePlacement(index: number, position: ContractPlacement): void {
    const draft = this.facade.draft();
    if (draft) this.facade.update({ ...draft, placements: draft.placements.map((p, i) => i === index ? position : p) });
  }

  private confirmAction(message: string, acceptLabel: string, action: () => void, header = acceptLabel): void {
    this.confirm.modalDecision({ header, message, acceptLabel, rejectLabel: this.i18n.actions().cancel,
      acceptSeverity: 'success' }).pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef)).subscribe(action);
  }

  private readonly destroyRef = inject(DestroyRef);
}
