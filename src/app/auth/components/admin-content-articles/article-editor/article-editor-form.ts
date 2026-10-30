import { FormControl, FormGroup } from '@angular/forms';

import { IAdminContentArticleDetail, ISaveContentArticlePayload } from '../../../../core/interfaces/i-content-article';
import {
  ArticleEditorBlockForm,
  ArticleEditorForm,
} from '../../../../core/types/article-editor-form';
import { ContentArticleBlockKind } from '../../../../core/types/content-article';
import { normalizeText, stringToSlug } from '../../../../core/utils/normalize-text';

export function createArticleEditorBlockForm(
  kind: ContentArticleBlockKind,
  heading = '',
  body = '',
  imagePath = '',
  imageAlt = '',
  caption = '',
): ArticleEditorBlockForm {
  return new FormGroup({
    kind: new FormControl(kind, { nonNullable: true }),
    heading: new FormControl(heading, { nonNullable: true }),
    body: new FormControl(body, { nonNullable: true }),
    imagePath: new FormControl(imagePath, { nonNullable: true }),
    imageAlt: new FormControl(imageAlt, { nonNullable: true }),
    caption: new FormControl(caption, { nonNullable: true }),
  });
}

export function mapArticleEditorFormToPayload(
  form: ArticleEditorForm,
  article: IAdminContentArticleDetail,
  slugEdited: boolean,
): ISaveContentArticlePayload {
  const value = form.getRawValue();

  return {
    id: article.id,
    title: normalizeText(value.title),
    slug: value.slug === article.slug || (article.publishedAt !== null && !slugEdited)
      ? article.slug
      : normalizeText(stringToSlug(value.slug)),
    excerpt: normalizeText(value.excerpt),
    heroImagePath: normalizeText(value.heroImagePath),
    heroImageAlt: normalizeText(value.heroImageAlt),
    seoTitle: normalizeText(value.seoTitle),
    seoDescription: normalizeText(value.seoDescription),
    blocks: value.blocks
      .map((block) => ({
        kind: block.kind,
        heading: normalizeText(block.heading),
        body: normalizeText(block.body) ?? '',
        imagePath: normalizeText(block.imagePath),
        imageAlt: normalizeText(block.imageAlt),
        caption: normalizeText(block.caption),
      }))
      .filter((block) =>
        block.kind === 'image' || !!block.heading || !!block.body,
      )
      .map((block) =>
        block.kind === 'image'
          ? {
              kind: 'image',
              imagePath: block.imagePath ?? '',
              imageAlt: block.imageAlt,
              caption: block.caption,
            }
          : {
              kind: 'text_section',
              heading: block.heading,
              body: block.body,
            },
      ),
  };
}

export function populateArticleEditorForm(
  form: ArticleEditorForm,
  article: IAdminContentArticleDetail,
): void {
  const blocks = form.controls.blocks;
  blocks.clear({ emitEvent: false });
  for (const block of [...article.blocks].sort((a, b) => a.sortOrder - b.sortOrder)) {
    blocks.push(block.kind === 'text_section'
      ? createArticleEditorBlockForm('text_section', block.heading ?? '', block.body)
      : createArticleEditorBlockForm('image', '', '', block.imagePath, block.imageAlt, block.caption ?? ''),
    { emitEvent: false });
  }
  if (!blocks.length) {
    blocks.push(createArticleEditorBlockForm('text_section'), { emitEvent: false });
  }
  form.patchValue({
    title: article.title ?? '',
    slug: article.slug ?? '',
    excerpt: article.excerpt ?? '',
    heroImagePath: article.heroImagePath ?? '',
    heroImageAlt: article.heroImageAlt ?? '',
    seoTitle: article.seoTitle ?? '',
    seoDescription: article.seoDescription ?? '',
  }, { emitEvent: false });
}
