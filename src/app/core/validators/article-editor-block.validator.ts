import type { ArticleEditorBlockForm } from '../types/article-editor-form';
import {
  hasInvalidInternalLinkSyntax,
} from '../domain/internal-link/internal-link-markup';
import { normalizeText } from '../utils/normalize-text';

export function hasArticleEditorHeadingWithoutBody(
  block: ArticleEditorBlockForm,
): boolean {
  return (
    block.controls.kind.value === 'text_section' &&
    !!normalizeText(block.controls.heading.value) &&
    !normalizeText(block.controls.body.value)
  );
}

export function hasArticleEditorImageWithoutPath(
  block: ArticleEditorBlockForm,
): boolean {
  return (
    block.controls.kind.value === 'image' &&
    !normalizeText(block.controls.imagePath.value)
  );
}

export function hasInvalidArticleLinkSyntax(
  block: ArticleEditorBlockForm,
): boolean {
  return (
    block.controls.kind.value === 'text_section' &&
    hasInvalidInternalLinkSyntax(block.controls.body.value)
  );
}
