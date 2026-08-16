import {
  Component,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

import {
  applyRichContentLink,
  removeRichContentLink,
  richContentInlineText,
  toggleRichContentStrong,
  updateRichContentInlineText,
} from '../../core/domain/rich-content/rich-content-inline-operations';
import { RichContentInlineHistory } from '../../core/domain/rich-content/rich-content-inline-history';
import {
  isRichContentSelectionStrong,
  richContentLinkAtSelection,
  richContentLinks,
  richContentSelectionHasStrong,
  richContentSelectionHasLink,
} from '../../core/domain/rich-content/rich-content-inline-selection';
import { resolveRichContentTextInput } from '../../core/domain/rich-content/rich-content-text-input';
import type { NumericInterval } from '../../core/types/interval';
import type {
  RichContentLinkEditTarget,
  RichContentLinkRange,
  RichContentTextInput,
} from '../../core/types/rich-content-editor';
import type { RichContentInlineNode } from '../../core/types/rich-content';
import { requiredTrimmedValidator } from '../../core/validators/required-trimmed.validator';
import {
  createCommonActionsI18n,
  createCommonRichContentEditorI18n,
} from '../../core/translations/common.i18n';
import { RichContentInline } from '../rich-content/rich-content-inline';

@Component({
  selector: 'app-rich-content-inline-editor',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    CheckboxModule,
    InputTextModule,
    TextareaModule,
    RichContentInline,
  ],
  templateUrl: './rich-content-inline-editor.html',
})
export class RichContentInlineEditor {
  readonly nodes = input.required<RichContentInlineNode[]>();
  readonly controlId = input.required<string>();
  readonly changed = output<void>();
  readonly blurred = output<void>();
  readonly activated = output<RichContentInlineEditor>();

  protected readonly i18n = createCommonRichContentEditorI18n();
  protected readonly actions = createCommonActionsI18n();
  protected readonly selection = signal<NumericInterval>({ start: 0, end: 0 });
  protected readonly linkEditTarget =
    signal<RichContentLinkEditTarget | null>(null);
  protected readonly linkHrefControl = new FormControl('', {
    nonNullable: true,
    validators: [requiredTrimmedValidator()],
  });
  protected readonly linkExternalControl = new FormControl(false, {
    nonNullable: true,
  });

  private readonly textSurface = viewChild<ElementRef<HTMLTextAreaElement>>(
    'textSurface',
  );
  private readonly history = new RichContentInlineHistory();
  private pendingTextInput: RichContentTextInput | null = null;
  private handledHistoryInput = false;

  protected text(): string {
    return richContentInlineText(this.nodes());
  }

  protected links(): RichContentLinkRange[] {
    return richContentLinks(this.nodes());
  }

  protected strongActive(): boolean {
    const { start, end } = this.selection();
    return isRichContentSelectionStrong(this.nodes(), start, end);
  }

  protected strongDisabled(): boolean {
    const { start, end } = this.selection();
    return start === end ||
      richContentSelectionHasLink(this.nodes(), start, end);
  }

  protected linkDisabled(): boolean {
    const { start, end } = this.selection();
    const existingLink = richContentLinkAtSelection(
      this.nodes(),
      start,
      end,
    );

    return richContentSelectionHasStrong(this.nodes(), start, end) ||
      (start === end && existingLink === null) ||
      (existingLink === null &&
        richContentSelectionHasLink(this.nodes(), start, end));
  }

  protected prepareTextInput(
    event: InputEvent,
    textarea: HTMLTextAreaElement,
  ): void {
    if (event.inputType === 'historyUndo' || event.inputType === 'historyRedo') {
      event.preventDefault();
      this.pendingTextInput = null;
      this.handledHistoryInput = true;
      this.restoreHistory(event.inputType, textarea);
      return;
    }

    this.handledHistoryInput = false;
    this.pendingTextInput = {
      inputType: event.inputType,
      value: textarea.value,
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
    };
  }

  protected updateText(textarea: HTMLTextAreaElement): void {
    if (this.handledHistoryInput) {
      this.handledHistoryInput = false;
      const { start, end } = this.selection();
      this.restoreSelection(start, end);
      return;
    }

    const snapshot = this.pendingTextInput;
    this.pendingTextInput = null;
    if (!snapshot) {
      const { start, end } = this.selection();
      this.restoreSelection(start, end);
      return;
    }

    const replacement = resolveRichContentTextInput(
      snapshot,
      textarea.value,
      textarea.selectionStart,
    );
    const nextNodes = updateRichContentInlineText(
      this.nodes(),
      replacement.start,
      replacement.end,
      replacement.text,
    );
    this.recordHistory({
      start: snapshot.start,
      end: snapshot.end,
    });
    this.commitNodes(nextNodes);
    this.setSelection(textarea.selectionStart, textarea.selectionEnd);
  }

  protected toggleStrong(): void {
    if (this.strongDisabled()) return;

    const { start, end } = this.selection();
    const nextNodes = toggleRichContentStrong(this.nodes(), start, end);
    this.recordHistory({ start, end });
    this.commitNodes(nextNodes);
    this.restoreSelection(start, end);
  }

  protected openLinkEditor(): void {
    if (this.linkDisabled()) return;

    const { start, end } = this.selection();
    const existingLink = richContentLinkAtSelection(
      this.nodes(),
      start,
      end,
    );
    const target: RichContentLinkEditTarget = existingLink
      ? {
          start: existingLink.start,
          end: existingLink.end,
          existing: true,
        }
      : {
          start,
          end,
          existing: false,
        };

    this.linkEditTarget.set(target);
    this.linkHrefControl.reset(existingLink?.href ?? '', {
      emitEvent: false,
    });
    this.linkExternalControl.reset(existingLink?.external ?? false, {
      emitEvent: false,
    });
  }

  protected editLink(link: RichContentLinkRange): void {
    this.linkEditTarget.set({
      start: link.start,
      end: link.end,
      existing: true,
    });
    this.linkHrefControl.reset(link.href, { emitEvent: false });
    this.linkExternalControl.reset(link.external, { emitEvent: false });
    this.setSelection(link.start, link.end);
    this.restoreSelection(link.start, link.end);
  }

  protected saveLink(): void {
    this.linkHrefControl.markAsTouched();
    const target = this.linkEditTarget();

    if (!target || this.linkHrefControl.invalid) return;

    const nextNodes = applyRichContentLink(
      this.nodes(),
      target.start,
      target.end,
      this.linkHrefControl.getRawValue(),
      this.linkExternalControl.value,
    );
    this.recordHistory({
      start: target.start,
      end: target.end,
    });
    this.commitNodes(nextNodes);
    this.restoreSelection(target.start, target.end);
  }

  protected removeLink(): void {
    const target = this.linkEditTarget();
    if (!target?.existing) return;

    const nextNodes = removeRichContentLink(
      this.nodes(),
      target.start,
      target.end,
    );
    this.recordHistory({
      start: target.start,
      end: target.end,
    });
    this.commitNodes(nextNodes);
    this.restoreSelection(target.start, target.end);
  }

  protected closeLinkEditor(): void {
    this.linkEditTarget.set(null);
    this.linkHrefControl.reset('', { emitEvent: false });
    this.linkExternalControl.reset(false, { emitEvent: false });
  }

  insertText(text: string, atEnd = false): void {
    const selection = this.selection();
    const start = atEnd ? this.text().length : selection.start;
    const end = atEnd ? start : selection.end;
    const caret = start + text.length;
    const nextNodes = updateRichContentInlineText(
      this.nodes(),
      start,
      end,
      text,
    );

    this.recordHistory({ start, end });
    this.commitNodes(nextNodes);
    this.setSelection(caret, caret);
    this.restoreSelection(caret, caret);
  }

  protected setSelection(start: number | null, end: number | null): void {
    const textLength = this.text().length;
    const normalizedStart = start ?? textLength;
    const normalizedEnd = end ?? normalizedStart;
    this.selection.set({ start: normalizedStart, end: normalizedEnd });
    this.activated.emit(this);
  }

  private restoreSelection(start: number, end: number): void {
    const textarea = this.textSurface()?.nativeElement;
    if (!textarea) return;

    textarea.value = this.text();
    textarea.focus();
    textarea.setSelectionRange(start, end);
  }

  private commitNodes(nodes: readonly RichContentInlineNode[]): void {
    this.nodes().splice(0, this.nodes().length, ...nodes);
    this.closeLinkEditor();
    this.changed.emit();
  }

  private recordHistory(selection: NumericInterval): void {
    this.history.record(this.nodes(), selection);
  }

  private restoreHistory(
    inputType: 'historyUndo' | 'historyRedo',
    textarea: HTMLTextAreaElement,
  ): void {
    const selection = {
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
    };
    const state = this.history.restore(inputType, this.nodes(), selection);

    if (!state) {
      this.setSelection(selection.start, selection.end);
      this.restoreSelection(selection.start, selection.end);
      return;
    }

    this.commitNodes(state.nodes);
    this.setSelection(state.selection.start, state.selection.end);
    this.restoreSelection(state.selection.start, state.selection.end);
  }
}
