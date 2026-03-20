import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';

import {
  RichContentInlineNode,
  RichContentInput,
  RichContentListItem,
  RichContentSection,
} from '../../../core/types/rich-content';
import { resolveRichContent } from '../../../core/utils/rich-content';

@Component({
  selector: 'app-rich-content',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rich-content.html',
  styleUrl: './rich-content.scss',
})
export class RichContent {
  readonly content = input<RichContentInput>(null);

  protected readonly resolvedContent = computed(() =>
    resolveRichContent(this.content()),
  );

  protected readonly sections = computed(
    () => this.resolvedContent()?.sections ?? [],
  );

  protected readonly hasSections = computed(() => this.sections().length > 0);

  protected trackByIndex(index: number): number {
    return index;
  }

  protected hasSectionTitle(section: RichContentSection): boolean {
    return !!section.title;
  }

  protected hasInlineContent(
    value: { content?: RichContentInlineNode[] | null } | null | undefined,
  ): boolean {
    return !!value?.content?.length;
  }

  protected hasNestedBlocks(
    item: RichContentListItem | null | undefined,
  ): boolean {
    return !!item?.blocks?.length;
  }

  protected isExternalLink(node: RichContentInlineNode): boolean {
    return node.type === 'link' && !!node.external;
  }

  protected splitLines(value: string | null | undefined): string[] {
    return (value ?? '').split('\n');
  }
}