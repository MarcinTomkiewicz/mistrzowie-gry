import { Component, computed, input, signal } from '@angular/core';

import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';

import { createCommonCtaI18n } from '../../../core/translations/common.i18n';
import type {
  RichContent as RichContentModel,
  RichContentBlock,
  RichContentInlineNode,
  RichContentListItem,
} from '../../../core/types/rich-content';
import { RichContent } from '../rich-content/rich-content';

const EXPANDABLE_TEXT_THRESHOLD = 180;

@Component({
  selector: 'app-expandable-text',
  imports: [ButtonModule, RichContent],
  host: { class: 'd-block' },
  templateUrl: './expandable-text.html',
  providers: [provideTranslocoScope('common')],
})
export class ExpandableText {
  readonly text = input<string | null | undefined>(null);
  readonly richContent = input<RichContentModel | null>(null);
  readonly muted = input(false);
  readonly icon = input<string | undefined>('pi pi-lever');

  protected readonly cta = createCommonCtaI18n();
  protected readonly expanded = signal(false);
  protected readonly expandable = computed(
    () => this.contentLength() > EXPANDABLE_TEXT_THRESHOLD,
  );
  protected readonly collapsed = computed(
    () => this.expandable() && !this.expanded(),
  );

  protected toggle(): void {
    this.expanded.update((expanded) => !expanded);
  }

  private contentLength(): number {
    const richContent = this.richContent();
    return richContent
      ? richContentLength(richContent)
      : (this.text()?.trim().length ?? 0);
  }
}

function richContentLength(content: RichContentModel): number {
  return content.sections.reduce(
    (length, section) =>
      length +
      (section.title?.length ?? 0) +
      section.blocks.reduce(
        (blocksLength, block) => blocksLength + blockLength(block),
        0,
      ),
    0,
  );
}

function blockLength(block: RichContentBlock): number {
  if (block.type === 'paragraph') {
    return inlineLength(block.content) || block.text?.length || 0;
  }

  return block.items.reduce(
    (length, item) => length + listItemLength(item),
    0,
  );
}

function listItemLength(item: RichContentListItem): number {
  return (item.text?.length ?? 0) +
    inlineLength(item.content) +
    (item.blocks?.reduce(
      (length, block) => length + blockLength(block),
      0,
    ) ?? 0);
}

function inlineLength(nodes: RichContentInlineNode[] | undefined): number {
  return nodes?.reduce((length, node) => length + node.text.length, 0) ?? 0;
}
