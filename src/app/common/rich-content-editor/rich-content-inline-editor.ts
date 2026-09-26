import {
  Component,
  computed,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';

import { LEGAL_DIALOGS } from '../../core/configs/legal-dialogs.config';
import { RichContentInlineHistory } from '../../core/domain/rich-content/rich-content-inline-history';
import {
  parseInlineMarkup,
  escapeInlineMarkupText,
} from '../../core/domain/rich-content/rich-content-inline-markup';
import {
  serializeRichContentInlineMarkup,
  richContentMarkupSelectionToText,
  richContentTextSelectionToMarkup,
  richContentDialogTargetAtCaret,
} from '../../core/domain/rich-content/rich-content-markup-source';
import { toggleRichContentStrong } from '../../core/domain/rich-content/rich-content-inline-operations';
import {
  isRichContentSelectionStrong,
  canApplyRichContentInlineTarget,
  richContentSelectionHasFormat,
} from '../../core/domain/rich-content/rich-content-inline-selection';
import type { NumericInterval } from '../../core/types/interval';
import type { LegalDialogId } from '../../core/types/legal-dialog';
import type { RichContentEditorIssue } from '../../core/types/rich-content-editor';
import type {
  RichContentInlineUpdate,
  RichContentInlineTargetType,
} from '../../core/types/rich-content';
import { createCommonRichContentEditorI18n } from '../../core/translations/common.i18n';
import { RichContentInline } from '../rich-content/rich-content-inline';
import { RichContentInlineTargetEditor } from './rich-content-inline-target-editor';

@Component({
  selector: 'app-rich-content-inline-editor',
  imports: [
    TranslocoPipe, ButtonModule, TextareaModule,
    RichContentInline, RichContentInlineTargetEditor,
  ],
  templateUrl: './rich-content-inline-editor.html',
})
export class RichContentInlineEditor {
  readonly source = input.required<string>();
  readonly controlId = input.required<string>();
  readonly issues = input<readonly RichContentEditorIssue[]>([]);
  readonly changed = output<string>();
  readonly blurred = output<void>();
  readonly activated = output<RichContentInlineEditor>();

  protected readonly i18n = createCommonRichContentEditorI18n();
  protected readonly markup = computed(() => parseInlineMarkup(this.source()));
  protected readonly sourceInvalid = computed(() => this.markup().issues.length > 0);
  protected readonly selection = signal<NumericInterval>({ start: 0, end: 0 });
  protected readonly dialogOptions = Object.values(LEGAL_DIALOGS);
  protected readonly dialogTarget = computed(() => {
    const selection = this.selection();
    return selection.start === selection.end
      ? richContentDialogTargetAtCaret(this.source(), selection.start) : null;
  });
  private readonly targetEditor = viewChild.required(RichContentInlineTargetEditor);
  private readonly textSurface = viewChild<ElementRef<HTMLTextAreaElement>>('textSurface');
  private readonly history = new RichContentInlineHistory();
  private inputSelection: NumericInterval | null = null;

  private textSelection(): NumericInterval {
    return richContentMarkupSelectionToText(this.source(), this.markup(), this.selection());
  }

  protected strongActive(): boolean {
    if (this.sourceInvalid()) return false;
    const { start, end } = this.textSelection();
    return isRichContentSelectionStrong(this.markup().nodes, start, end);
  }

  protected strongDisabled(): boolean {
    if (this.sourceInvalid()) return true;
    const { start, end } = this.textSelection();
    return start === end ||
      richContentSelectionHasFormat(this.markup().nodes, start, end, 'link') ||
      richContentSelectionHasFormat(this.markup().nodes, start, end, 'dialog');
  }

  protected targetDisabled(type: RichContentInlineTargetType): boolean {
    if (this.sourceInvalid()) return true;
    const { start, end } = this.textSelection();
    return !canApplyRichContentInlineTarget(this.markup().nodes, start, end, type);
  }

  protected prepareTextInput(event: InputEvent, textarea: HTMLTextAreaElement): void {
    if (event.inputType === 'historyUndo' || event.inputType === 'historyRedo') {
      event.preventDefault();
      this.restoreHistory(event.inputType, textarea);
      return;
    }
    this.inputSelection = { start: textarea.selectionStart, end: textarea.selectionEnd };
  }

  protected updateText(textarea: HTMLTextAreaElement): void {
    const value = textarea.value;
    const selection = { start: textarea.selectionStart, end: textarea.selectionEnd };
    this.history.record(this.source(), this.inputSelection ?? this.selection());
    this.inputSelection = null;
    this.updateSource(value, selection);
  }

  protected handleHistoryKey(event: KeyboardEvent, textarea: HTMLTextAreaElement): void {
    if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
    const key = event.key.toLowerCase();
    if (key !== 'z' && key !== 'y') return;
    event.preventDefault();
    this.restoreHistory(key === 'y' || event.shiftKey ? 'historyRedo' : 'historyUndo', textarea);
  }

  protected toggleStrong(): void {
    if (this.strongDisabled()) return;
    const { start, end } = this.textSelection();
    this.applyTarget({
      nodes: toggleRichContentStrong(this.markup().nodes, start, end),
      selection: { start, end },
    });
  }

  protected openTargetEditor(type: RichContentInlineTargetType): void {
    if (!this.targetDisabled(type)) this.targetEditor().open(type, this.textSelection());
  }

  protected selectTarget(selection: NumericInterval): void {
    const range = richContentTextSelectionToMarkup(this.source(), this.markup(), selection);
    this.setSelection(range.start, range.end);
    this.restoreSelection(range);
  }

  protected applyTarget(state: RichContentInlineUpdate): void {
    if (this.sourceInvalid()) return;
    const source = serializeRichContentInlineMarkup(state.nodes);
    const selection = richContentTextSelectionToMarkup(source, parseInlineMarkup(source), state.selection);
    this.commitSource(source, selection);
  }

  insertText(text: string, atEnd = false): void {
    const range = atEnd
      ? { start: this.source().length, end: this.source().length } : this.selection();
    this.replaceSource(range, escapeInlineMarkupText(text));
  }

  protected completeDialogTarget(dialog: LegalDialogId): void {
    const range = this.dialogTarget();
    if (range) this.replaceSource(range, dialog);
  }

  protected setSelection(start: number, end: number): void {
    this.selection.set({ start, end });
    this.activated.emit(this);
  }

  private replaceSource(range: NumericInterval, text: string): void {
    const source = this.source().slice(0, range.start) + text + this.source().slice(range.end);
    const caret = range.start + text.length;
    this.commitSource(source, { start: caret, end: caret });
  }

  private commitSource(source: string, selection: NumericInterval): void {
    this.history.record(this.source(), this.selection());
    this.updateSource(source, selection);
    this.restoreSelection(selection, source);
  }

  private updateSource(source: string, selection: NumericInterval): void {
    this.setSelection(selection.start, selection.end);
    this.targetEditor().close();
    this.changed.emit(source);
  }

  private restoreSelection(selection: NumericInterval, source = this.source()): void {
    const textarea = this.textSurface()?.nativeElement;
    if (!textarea) return;
    if (textarea.value !== source) textarea.value = source;
    textarea.setSelectionRange(selection.start, selection.end);
    textarea.focus();
  }

  private restoreHistory(inputType: 'historyUndo' | 'historyRedo', textarea: HTMLTextAreaElement): void {
    const selection = { start: textarea.selectionStart, end: textarea.selectionEnd };
    const state = this.history.restore(inputType, this.source(), selection);
    this.inputSelection = null;
    if (!state) return;
    this.updateSource(state.source, state.selection);
    this.restoreSelection(state.selection, state.source);
  }
}
