import { NgTemplateOutlet } from '@angular/common';
import { Component, input, viewChildren } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

import { escapeInlineMarkupText } from '../../core/domain/rich-content/rich-content-inline-markup';
import type {
  RichContentEditorControl,
  RichContentEditorIssue,
} from '../../core/types/rich-content-editor';
import type {
  RichContentEditorBlock,
  RichContentEditorListItem,
  RichContentEditorParagraph,
  RichContentEditorSection,
} from '../../core/types/rich-content-editor-value';
import {
  createCommonActionsI18n,
  createCommonLabelsI18n,
  createCommonRichContentEditorI18n,
} from '../../core/translations/common.i18n';
import { ItemEditorActions } from '../item-editor-actions/item-editor-actions';
import { RichContentInlineEditor } from './rich-content-inline-editor';

@Component({
  selector: 'app-rich-content-editor',
  imports: [
    NgTemplateOutlet,
    TranslocoPipe,
    ButtonModule,
    InputTextModule,
    ItemEditorActions,
    RichContentInlineEditor,
  ],
  templateUrl: './rich-content-editor.html',
})
export class RichContentEditor {
  readonly control = input.required<RichContentEditorControl>();
  readonly controlId = input.required<string>();
  readonly label = input.required<string>();
  readonly tokens = input<readonly string[]>([]);
  readonly issues = input<readonly RichContentEditorIssue[]>([]);

  protected readonly i18n = createCommonRichContentEditorI18n();
  protected readonly actions = createCommonActionsI18n();
  protected readonly labels = createCommonLabelsI18n();
  private readonly inlineEditors = viewChildren(
    RichContentInlineEditor,
  );
  private activeInlineEditor: RichContentInlineEditor | null = null;

  protected sections(): RichContentEditorSection[] {
    return this.control().getRawValue().sections;
  }

  protected blockLabel(type: RichContentEditorBlock['type']): string {
    return this.i18n()[type];
  }

  protected issuesAt(path: readonly string[]): readonly RichContentEditorIssue[] {
    return this.issues().filter((issue) =>
      issue.path.length === path.length &&
      path.every((segment, index) => issue.path[index] === segment)
    );
  }

  protected issuesWithin(path: readonly string[]): readonly RichContentEditorIssue[] {
    return this.issues().filter((issue) =>
      path.every((segment, index) => issue.path[index] === segment)
    );
  }

  protected inlineIssues(path: readonly string[]): readonly RichContentEditorIssue[] {
    return [
      ...this.issuesWithin([...path, 'content']),
      ...this.issuesWithin([...path, 'text']),
    ];
  }

  protected addSection(): void {
    this.sections().push({
      blocks: [this.createBlock('paragraph')],
    });
    this.commit();
  }

  protected updateSectionTitle(
    section: RichContentEditorSection,
    value: string,
  ): void {
    section.title = value;
    this.commit();
  }

  protected addBlock(
    blocks: RichContentEditorBlock[],
    type: RichContentEditorBlock['type'],
    listItem?: RichContentEditorListItem,
  ): void {
    const target = listItem
      ? (listItem.blocks ??= [])
      : blocks;
    target.push(this.createBlock(type));
    this.commit();
  }

  protected addListItem(items: RichContentEditorListItem[]): void {
    items.push({ content: '' });
    this.commit();
  }

  protected updateInlineContent(
    inline: RichContentEditorParagraph | RichContentEditorListItem,
    source: string,
  ): void {
    inline.content = source;
    this.commit();
  }

  protected activateInlineEditor(
    editor: RichContentInlineEditor,
  ): void {
    this.activeInlineEditor = editor;
  }

  protected insertToken(syntax: string): void {
    const editors = this.inlineEditors();
    const activeEditor = this.activeInlineEditor &&
      editors.includes(this.activeInlineEditor)
      ? this.activeInlineEditor
      : null;
    const editor = activeEditor ?? editors[0];
    if (editor) {
      editor.insertText(syntax, activeEditor === null);
      return;
    }

    this.ensureInlineParagraph().content += escapeInlineMarkupText(syntax);
    this.commit();
  }

  protected removeItem<TValue>(items: TValue[], index: number): void {
    items.splice(index, 1);
    this.activeInlineEditor = null;
    this.commit();
  }

  protected moveItem<TValue>(
    items: TValue[],
    index: number,
    offset: -1 | 1,
  ): void {
    const [item] = items.splice(index, 1);
    if (item === undefined) return;

    items.splice(index + offset, 0, item);
    this.commit();
  }

  private createBlock(type: RichContentEditorBlock['type']): RichContentEditorBlock {
    return type === 'paragraph'
      ? { type, content: '' }
      : {
          type,
          items: [{ content: '' }],
        };
  }

  private ensureInlineParagraph(): RichContentEditorParagraph {
    let section = this.sections()[0];
    if (!section) {
      section = { blocks: [] };
      this.sections().push(section);
    }

    let block = section.blocks.find((candidate) =>
      candidate.type === 'paragraph'
    );
    if (!block || block.type !== 'paragraph') {
      block = { type: 'paragraph', content: '' };
      section.blocks.push(block);
    }

    return block;
  }

  protected commit(): void {
    const control = this.control();
    control.setValue({ sections: [...this.sections()] });
    control.markAsDirty();
  }
}
