import {
  Component,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

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
  RichContentLinkDraft,
  RichContentLinkRange,
  RichContentTextInput,
} from '../../core/types/rich-content-editor';
import type { RichContentInlineNode } from '../../core/types/rich-content';
import {
  createCommonActionsI18n,
  createCommonRichContentEditorI18n,
} from '../../core/translations/common.i18n';
import { RichContentInline } from '../rich-content/rich-content-inline';

@Component({
  selector: 'app-rich-content-inline-editor',
  imports: [
    FormsModule,
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
  protected readonly linkDraft = signal<RichContentLinkDraft | null>(null);
  protected readonly linkSaveAttempted = signal(false);

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
    this.replaceNodes(nextNodes);
    this.closeLinkEditor();
    this.setSelection(textarea.selectionStart, textarea.selectionEnd);
    this.changed.emit();
  }

  protected captureSelection(
    start: number | null,
    end: number | null,
  ): void {
    this.setSelection(start, end);
  }

  protected toggleStrong(): void {
    if (this.strongDisabled()) return;

    const { start, end } = this.selection();
    const nextNodes = toggleRichContentStrong(this.nodes(), start, end);
    this.recordHistory({ start, end });
    this.replaceNodes(nextNodes);
    this.closeLinkEditor();
    this.changed.emit();
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
    const text = this.text();

    this.linkDraft.set(existingLink
      ? { ...existingLink, existing: true }
      : {
          start,
          end,
          text: text.slice(start, end),
          href: '',
          external: false,
          existing: false,
        });
    this.linkSaveAttempted.set(false);
  }

  protected editLink(link: RichContentLinkRange): void {
    this.linkDraft.set({ ...link, existing: true });
    this.linkSaveAttempted.set(false);
    this.setSelection(link.start, link.end);
    this.restoreSelection(link.start, link.end);
  }

  protected updateLinkHref(href: string): void {
    this.linkDraft.update((draft) => draft ? { ...draft, href } : null);
  }

  protected updateLinkExternal(external: boolean): void {
    this.linkDraft.update((draft) => draft ? { ...draft, external } : null);
  }

  protected saveLink(): void {
    this.linkSaveAttempted.set(true);
    const draft = this.linkDraft();
    if (!draft?.href.trim()) return;

    const nextNodes = applyRichContentLink(
      this.nodes(),
      draft.start,
      draft.end,
      draft.href,
      draft.external,
    );
    this.recordHistory({
      start: draft.start,
      end: draft.end,
    });
    this.replaceNodes(nextNodes);
    this.closeLinkEditor();
    this.changed.emit();
    this.restoreSelection(draft.start, draft.end);
  }

  protected removeLink(): void {
    const draft = this.linkDraft();
    if (!draft?.existing) return;

    const nextNodes = removeRichContentLink(
      this.nodes(),
      draft.start,
      draft.end,
    );
    this.recordHistory({
      start: draft.start,
      end: draft.end,
    });
    this.replaceNodes(nextNodes);
    this.closeLinkEditor();
    this.changed.emit();
    this.restoreSelection(draft.start, draft.end);
  }

  protected closeLinkEditor(): void {
    this.linkDraft.set(null);
    this.linkSaveAttempted.set(false);
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
    this.replaceNodes(nextNodes);
    this.closeLinkEditor();
    this.changed.emit();
    this.setSelection(caret, caret);
    this.restoreSelection(caret, caret);
  }

  private setSelection(start: number | null, end: number | null): void {
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

  private replaceNodes(nodes: readonly RichContentInlineNode[]): void {
    this.nodes().splice(0, this.nodes().length, ...nodes);
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

    this.replaceNodes(state.nodes);
    this.closeLinkEditor();
    this.setSelection(state.selection.start, state.selection.end);
    this.changed.emit();
    this.restoreSelection(state.selection.start, state.selection.end);
  }
}
