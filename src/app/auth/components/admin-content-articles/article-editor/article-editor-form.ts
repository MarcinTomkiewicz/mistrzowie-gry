import { FormControl, FormGroup } from '@angular/forms';

import { ISaveContentArticlePayload } from '../../../../core/interfaces/i-content-article';
import {
  ArticleEditorBlockForm,
  ArticleEditorForm,
} from '../../../../core/types/article-editor-form';
import { ContentArticleBlockKind } from '../../../../core/types/content-article';
import { normalizeText } from '../../../../core/utils/normalize-text';

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
  articleId: string,
): ISaveContentArticlePayload {
  const value = form.getRawValue();

  return {
    id: articleId,
    title: normalizeText(value.title),
    slug: normalizeText(value.slug),
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
