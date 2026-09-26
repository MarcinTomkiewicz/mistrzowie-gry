import { Component, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { LEGAL_DIALOGS } from '../../core/configs/legal-dialogs.config';
import {
  applyRichContentDialog,
  applyRichContentLink,
  removeRichContentInlineTarget,
} from '../../core/domain/rich-content/rich-content-inline-operations';
import {
  canApplyRichContentInlineTarget,
  richContentInlineRanges,
  richContentInlineTargetAtSelection,
} from '../../core/domain/rich-content/rich-content-inline-selection';
import {
  createCommonActionsI18n,
  createCommonFormI18n,
  createCommonRichContentEditorI18n,
} from '../../core/translations/common.i18n';
import type { NumericInterval } from '../../core/types/interval';
import type { LegalDialogId } from '../../core/types/legal-dialog';
import type {
  RichContentInlineNode,
  RichContentInlineUpdate,
  RichContentInlineRange,
  RichContentInlineTargetType,
} from '../../core/types/rich-content';
import type {
  RichContentInlineEditTarget,
} from '../../core/types/rich-content-editor';
import { richContentLinkHrefValidator } from '../../core/validators/rich-content-link-href.validator';

@Component({
  selector: 'app-rich-content-inline-target-editor',
  imports: [
    ReactiveFormsModule, TranslocoPipe, ButtonModule, CheckboxModule,
    InputTextModule, SelectModule,
  ],
  templateUrl: './rich-content-inline-target-editor.html',
})
export class RichContentInlineTargetEditor {
  readonly nodes = input.required<RichContentInlineNode[]>();
  readonly controlId = input.required<string>();
  readonly disabled = input(false);
  readonly applied = output<RichContentInlineUpdate>();
  readonly selected = output<NumericInterval>();
  readonly blurred = output<void>();

  protected readonly i18n = createCommonRichContentEditorI18n();
  protected readonly actions = createCommonActionsI18n();
  protected readonly formCopy = createCommonFormI18n();
  protected readonly target = signal<RichContentInlineEditTarget | null>(null);
  protected readonly dialogOptions = Object.values(LEGAL_DIALOGS);
  protected readonly hrefControl = new FormControl('', {
    nonNullable: true, validators: [richContentLinkHrefValidator()],
  });
  protected readonly externalControl = new FormControl(false, { nonNullable: true });
  protected readonly dialogControl = new FormControl<LegalDialogId | null>(null, {
    validators: [Validators.required],
  });

  protected links() {
    return richContentInlineRanges(this.nodes()).filter((node) => node.type === 'link');
  }

  protected dialogs() {
    return richContentInlineRanges(this.nodes()).filter((node) => node.type === 'dialog');
  }

  protected dialogLabelKey(dialog: LegalDialogId): string {
    return LEGAL_DIALOGS[dialog].labelKey;
  }

  open(type: RichContentInlineTargetType, { start, end }: NumericInterval): void {
    if (this.disabled() || !canApplyRichContentInlineTarget(this.nodes(), start, end, type)) return;
    const existing = richContentInlineTargetAtSelection(this.nodes(), start, end, type);
    this.target.set({
      start: existing?.start ?? start,
      end: existing?.end ?? end,
      existing: existing !== null,
      type,
    });
    this.hrefControl.reset(existing?.type === 'link' ? existing.href : '');
    this.externalControl.reset(existing?.type === 'link' && !!existing.external);
    this.dialogControl.reset(existing?.type === 'dialog' ? existing.dialog : null);
  }

  protected edit(node: RichContentInlineRange): void {
    if (node.type !== 'link' && node.type !== 'dialog') return;
    this.open(node.type, node);
    this.selected.emit({ start: node.start, end: node.end });
  }

  protected save(): void {
    if (this.disabled()) return;
    const target = this.target();
    if (!target) return;
    let nodes: RichContentInlineNode[];
    if (target.type === 'link') {
      this.hrefControl.markAsTouched();
      if (this.hrefControl.invalid) return;
      nodes = applyRichContentLink(
        this.nodes(), target.start, target.end,
        this.hrefControl.getRawValue(), this.externalControl.value,
      );
    } else {
      this.dialogControl.markAsTouched();
      const dialog = this.dialogControl.value;
      if (this.dialogControl.invalid || dialog === null) return;
      nodes = applyRichContentDialog(this.nodes(), target.start, target.end, dialog);
    }
    this.applied.emit({ nodes, selection: { start: target.start, end: target.end } });
  }

  protected remove(): void {
    const target = this.target();
    if (!target?.existing) return;
    this.applied.emit({
      nodes: removeRichContentInlineTarget(this.nodes(), target.start, target.end),
      selection: { start: target.start, end: target.end },
    });
  }

  close(): void {
    this.target.set(null);
  }
}
