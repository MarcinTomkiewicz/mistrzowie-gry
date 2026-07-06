import { ArticleEditorBlockForm } from '../types/article-editor-form';
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
