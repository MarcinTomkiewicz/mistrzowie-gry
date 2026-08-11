import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';

import type { CommercialRichContentEditorControl } from '../../../../core/types/commercial-rich-content-editor-form';
import type {
  RichContentBlock,
  RichContentInlineNode,
  RichContentListItem,
  RichContentSection,
} from '../../../../core/types/rich-content';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';
import { CommercialItemEditorActions } from './commercial-item-editor-actions';

type RichContentBlockType = RichContentBlock['type'];
type RichContentInlineNodeType = RichContentInlineNode['type'];

@Component({
  selector: 'app-commercial-rich-content-editor',
  imports: [
    NgTemplateOutlet,
    FormsModule,
    ButtonModule,
    CheckboxModule,
    InputTextModule,
    SelectModule,
    TextareaModule,
    CommercialItemEditorActions,
  ],
  templateUrl: './commercial-rich-content-editor.html',
})
export class CommercialRichContentEditor {
  readonly control = input.required<CommercialRichContentEditorControl>();
  readonly controlId = input.required<string>();
  readonly label = input.required<string>();
  readonly tokens = input<readonly string[]>([]);

  protected readonly i18n = createAdminCommercialPagesI18n();
  protected readonly inlineTypeOptions = computed(() => {
    const copy = this.i18n.richContent();

    return [
      { value: 'text' as const, label: copy.textNode },
      { value: 'strong' as const, label: copy.strongNode },
      { value: 'link' as const, label: copy.linkNode },
    ];
  });

  private activeSelection: {
    node: RichContentInlineNode;
    start: number;
    end: number;
  } | null = null;

  protected sections(): RichContentSection[] {
    return this.control().getRawValue().sections;
  }

  protected blockLabel(type: RichContentBlockType): string {
    return this.i18n.richContent()[type];
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
    type: RichContentBlockType,
  ): void {
    blocks.push(this.createBlock(type));
    this.commit();
  }

  protected addListItem(items: RichContentListItem[]): void {
    items.push({ content: [{ type: 'text', text: '' }] });
    this.commit();
  }

  protected nestedBlocks(item: RichContentListItem): RichContentBlock[] {
    item.blocks ??= [];
    return item.blocks;
  }

  protected addNode(
    nodes: RichContentInlineNode[],
    type: RichContentInlineNodeType,
  ): void {
    nodes.push(this.createNode(type));
    this.commit();
  }

  protected changeNodeType(
    nodes: RichContentInlineNode[],
    index: number,
    type: RichContentInlineNodeType,
  ): void {
    nodes[index] = this.createNode(type, nodes[index]?.text ?? '');
    this.activeSelection = null;
    this.commit();
  }

  protected updateNodeText(
    node: RichContentInlineNode,
    value: string,
    start: number | null,
    end: number | null,
  ): void {
    node.text = value;
    this.focusNode(node, start, end);
    this.commit();
  }

  protected updateLinkHref(node: RichContentInlineNode, value: string): void {
    if (node.type !== 'link') return;

    node.href = value;
    this.commit();
  }

  protected updateLinkExternal(
    node: RichContentInlineNode,
    external: boolean,
  ): void {
    if (node.type !== 'link') return;

    node.external = external;
    this.commit();
  }

  protected focusNode(
    node: RichContentInlineNode,
    start: number | null,
    end: number | null,
  ): void {
    this.activeSelection = {
      node,
      start: start ?? node.text.length,
      end: end ?? node.text.length,
    };
  }

  protected insertToken(syntax: string): void {
    const selection = this.activeSelection ?? this.endSelection(
      this.ensureTextNode(),
    );
    const { node, start, end } = selection;

    node.text = `${node.text.slice(0, start)}${syntax}${node.text.slice(end)}`;
    const caret = start + syntax.length;
    this.activeSelection = { node, start: caret, end: caret };
    this.commit();
  }

  protected removeItem<TValue>(items: TValue[], index: number): void {
    items.splice(index, 1);
    this.activeSelection = null;
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

  private createBlock(type: RichContentBlockType): RichContentBlock {
    return type === 'paragraph'
      ? { type, content: [{ type: 'text', text: '' }] }
      : {
          type,
          items: [{ content: [{ type: 'text', text: '' }] }],
        };
  }

  private createNode(
    type: RichContentInlineNodeType,
    text = '',
  ): RichContentInlineNode {
    return type === 'link'
      ? { type, text, href: '', external: false }
      : { type, text };
  }

  private ensureTextNode(): RichContentInlineNode {
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
    let node = block.content.at(-1);
    if (!node) {
      node = this.createNode('text');
      block.content.push(node);
    }

    return node;
  }

  private commit(): void {
    const control = this.control();
    control.setValue({ sections: [...this.sections()] });
    control.markAsDirty();
  }

  private endSelection(node: RichContentInlineNode) {
    return { node, start: node.text.length, end: node.text.length };
  }
}
