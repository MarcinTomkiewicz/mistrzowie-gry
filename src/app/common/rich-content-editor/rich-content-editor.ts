import { NgTemplateOutlet } from '@angular/common';
import { Component, input, viewChildren } from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

import {
  richContentInlineText,
  updateRichContentInlineText,
} from '../../core/domain/rich-content/rich-content-inline-operations';
import type { RichContentEditorControl } from '../../core/types/rich-content-editor';
import type {
  RichContentBlock,
  RichContentInlineNode,
  RichContentListItem,
  RichContentSection,
} from '../../core/types/rich-content';
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

  protected readonly i18n = createCommonRichContentEditorI18n();
  protected readonly actions = createCommonActionsI18n();
  protected readonly labels = createCommonLabelsI18n();
  private readonly inlineEditors = viewChildren(
    RichContentInlineEditor,
  );
  private activeInlineEditor: RichContentInlineEditor | null = null;

  protected sections(): RichContentSection[] {
    return this.control().getRawValue().sections;
  }

  protected blockLabel(type: RichContentBlock['type']): string {
    return this.i18n()[type];
  }

  protected addSection(): void {
    this.sections().push({
      blocks: [this.createBlock('paragraph')],
    });
    this.commit();
  }

  protected updateSectionTitle(
    section: RichContentSection,
    value: string,
  ): void {
    section.title = value;
    this.commit();
  }

  protected addBlock(
    blocks: RichContentBlock[],
    type: RichContentBlock['type'],
    listItem?: RichContentListItem,
  ): void {
    const target = listItem
      ? (listItem.blocks ??= [])
      : blocks;
    target.push(this.createBlock(type));
    this.commit();
  }

  protected addListItem(items: RichContentListItem[]): void {
    items.push({ content: [] });
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

    const nodes = this.ensureInlineNodes();
    const end = richContentInlineText(nodes).length;
    nodes.splice(
      0,
      nodes.length,
      ...updateRichContentInlineText(nodes, end, end, syntax),
    );
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

  private createBlock(type: RichContentBlock['type']): RichContentBlock {
    return type === 'paragraph'
      ? { type, content: [] }
      : {
          type,
          items: [{ content: [] }],
        };
  }

  private ensureInlineNodes(): RichContentInlineNode[] {
    let section = this.sections()[0];
    if (!section) {
      section = { blocks: [] };
      this.sections().push(section);
    }

    let block = section.blocks.find((candidate) =>
      candidate.type === 'paragraph'
    );
    if (!block || block.type !== 'paragraph') {
      block = { type: 'paragraph', content: [] };
      section.blocks.push(block);
    }

    block.content ??= [];
    return block.content;
  }

  protected commit(): void {
    const control = this.control();
    control.setValue({ sections: [...this.sections()] });
    control.markAsDirty();
  }
}
