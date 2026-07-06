import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { finalize } from 'rxjs';
import {
  CONTENT_ARTICLE_EDITOR_MAIN_FORM_FIELD_ROWS,
  CONTENT_ARTICLE_EDITOR_SEO_FORM_FIELD_ROWS,
} from '../../../../core/configs/content-article-editor-form.config';
import { IAdminContentArticleDetail, ISaveContentArticlePayload } from '../../../../core/interfaces/i-content-article';
import { ContentArticlesService } from '../../../../core/services/content-articles/content-articles';
import { Storage } from '../../../../core/services/storage/storage';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import {
  ContentArticleEditorForm,
  ContentArticleEditorFormFieldInputAction,
  ContentArticleEditorTextBlockForm,
} from '../../../../core/types/content-article-editor-form';
import { getContentArticleStatusBadgeClass } from '../../../../core/utils/content-articles';
import { normalizeText } from '../../../../core/utils/normalize-text';
import { resolvePublicStorageUrl } from '../../../../core/utils/storage-url';
import { stringToSlug } from '../../../../core/utils/type-mappings';
import { LoadingOverlay } from '../../../../public/common/loading-overlay/loading-overlay';
import { createAdminContentArticleEditorI18n } from './admin-content-article-editor.i18n';
@Component({
  selector: 'app-admin-content-article-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    IftaLabelModule,
    InputTextModule,
    TextareaModule,
    LoadingOverlay,
  ],
  templateUrl: './admin-content-article-editor.html',
  providers: [provideTranslocoScope('adminContentArticles', 'common')],
})
export class AdminContentArticleEditor {
  private readonly articles = inject(ContentArticlesService);
  private readonly router = inject(Router);
  private readonly storage = inject(Storage);
  private readonly toast = inject(UiToast);
  private readonly articleId = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  protected readonly i18n = createAdminContentArticleEditorI18n();
  protected readonly article = signal<IAdminContentArticleDetail | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly hasLoadError = signal(false);
  protected readonly isNotFound = signal(false);
  protected readonly showBlockValidation = signal(false);
  protected readonly heroPreviewUrl = signal<string | null>(null);
  private readonly slugEdited = signal(false);
  private readonly seoTitleEdited = signal(false);
  protected readonly form: ContentArticleEditorForm = new FormGroup({
    title: new FormControl('', { nonNullable: true }),
    slug: new FormControl('', { nonNullable: true }),
    excerpt: new FormControl('', { nonNullable: true }),
    heroImagePath: new FormControl('', { nonNullable: true }),
    heroImageAlt: new FormControl('', { nonNullable: true }),
    seoTitle: new FormControl('', { nonNullable: true }),
    seoDescription: new FormControl('', { nonNullable: true }),
    blocks: new FormArray<ContentArticleEditorTextBlockForm>([]),
  });
  protected readonly mainFieldRows = CONTENT_ARTICLE_EDITOR_MAIN_FORM_FIELD_ROWS;
  protected readonly seoFieldRows = CONTENT_ARTICLE_EDITOR_SEO_FORM_FIELD_ROWS;
  protected readonly getStatusBadgeClass = getContentArticleStatusBadgeClass;
  protected readonly hasUnsupportedImageBlocks = computed(
    () => this.article()?.blocks.some((block) => block.kind === 'image') ?? false,
  );
  protected readonly textBlocks = this.form.controls.blocks;
  constructor() {
    this.form.controls.title.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((title) => this.syncTitleDerivedFields(title));
    this.form.controls.heroImagePath.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((path) =>
        this.heroPreviewUrl.set(resolvePublicStorageUrl(this.storage, path)),
      );
    this.loadArticle();
  }

  protected loadArticle(): void {
    if (!this.articleId) {
      this.isLoading.set(false);
      this.hasLoadError.set(true);
      return;
    }

    this.isLoading.set(true);
    this.hasLoadError.set(false);
    this.isNotFound.set(false);

    this.articles
      .getAdminArticleDetail(this.articleId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (article) => {
          if (!article) {
            this.article.set(null);
            this.isNotFound.set(true);
            return;
          }

          this.article.set(article);
          this.populateForm(article);
        },
        error: () => {
          this.article.set(null);
          this.hasLoadError.set(true);
          this.toast.danger({
            summary: this.i18n.toast().loadFailedSummary,
            detail: this.i18n.toast().loadFailedDetail,
          });
        },
      });
  }

  protected onFieldInputAction(action: ContentArticleEditorFormFieldInputAction | undefined): void {
    if (action === 'slugManualEdit') {
      this.slugEdited.set(true);
    }
    if (action === 'seoTitleManualEdit') {
      this.seoTitleEdited.set(true);
    }
  }

  protected addTextSectionAfter(index: number | null): void {
    const insertIndex = index === null ? this.textBlocks.length : index + 1;

    this.textBlocks.insert(insertIndex, this.createTextSectionForm());
    this.form.markAsDirty();
  }

  protected removeTextSection(index: number): void {
    this.textBlocks.removeAt(index);
    this.form.markAsDirty();
  }

  protected moveTextSectionUp(index: number): void {
    if (index <= 0) {
      return;
    }

    this.moveTextSection(index, index - 1);
  }

  protected moveTextSectionDown(index: number): void {
    if (index >= this.textBlocks.length - 1) {
      return;
    }

    this.moveTextSection(index, index + 1);
  }

  protected hasHeadingWithoutBody(block: ContentArticleEditorTextBlockForm): boolean {
    return (
      !!normalizeText(block.controls.heading.value) &&
      !normalizeText(block.controls.body.value)
    );
  }

  protected saveArticle(): void {
    const toast = this.i18n.toast();
    this.showBlockValidation.set(true);
    if (this.textBlocks.controls.some((block) => this.hasHeadingWithoutBody(block))) {
      this.toast.danger({
        summary: toast.invalidSummary,
        detail: toast.invalidDetail,
      });
      return;
    }
    if (this.hasUnsupportedImageBlocks()) {
      this.toast.danger({
        summary: toast.unsupportedImageBlocksSummary,
        detail: toast.unsupportedImageBlocksDetail,
      });
      return;
    }
    this.isSaving.set(true);
    this.articles
      .saveAdminArticle(this.createSavePayload())
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (article) => {
          this.article.set(article);
          this.populateForm(article);
          this.toast.success({
            summary: toast.saveSuccessSummary,
            detail: toast.saveSuccessDetail,
          });
        },
        error: () => {
          this.toast.danger({
            summary: toast.saveFailedSummary,
            detail: toast.saveFailedDetail,
          });
        },
      });
  }

  protected goBack(): void {
    void this.router.navigate(['/admin/content']);
  }

  private populateForm(article: IAdminContentArticleDetail): void {
    const title = normalizeText(article.title) ?? '';
    const slug = normalizeText(article.slug);
    const seoTitle = normalizeText(article.seoTitle);

    this.slugEdited.set(!!slug && slug !== stringToSlug(title));
    this.seoTitleEdited.set(!!seoTitle && seoTitle !== title);
    this.showBlockValidation.set(false);
    this.textBlocks.clear({ emitEvent: false });
    for (const block of article.blocks
      .filter((block) => block.kind === 'text_section')
      .sort((a, b) => a.sortOrder - b.sortOrder)) {
      this.textBlocks.push(
        this.createTextSectionForm(block.heading ?? '', block.body),
        { emitEvent: false },
      );
    }
    if (!this.textBlocks.length) {
      this.textBlocks.push(this.createTextSectionForm(), { emitEvent: false });
    }

    this.form.patchValue({
      title: article.title ?? '',
      slug: article.slug ?? '',
      excerpt: article.excerpt ?? '',
      heroImagePath: article.heroImagePath ?? '',
      heroImageAlt: article.heroImageAlt ?? '',
      seoTitle: article.seoTitle ?? '',
      seoDescription: article.seoDescription ?? '',
    }, { emitEvent: false });
    this.syncTitleDerivedFields(title);
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.heroPreviewUrl.set(resolvePublicStorageUrl(this.storage, article.heroImagePath));
  }

  private createTextSectionForm(heading = '', body = ''): ContentArticleEditorTextBlockForm {
    return new FormGroup({
      heading: new FormControl(heading, { nonNullable: true }),
      body: new FormControl(body, { nonNullable: true }),
    });
  }
  private moveTextSection(fromIndex: number, toIndex: number): void {
    const control = this.textBlocks.at(fromIndex);
    this.textBlocks.removeAt(fromIndex);
    this.textBlocks.insert(toIndex, control);
    this.form.markAsDirty();
  }

  private syncTitleDerivedFields(title: string): void {
    if (!this.slugEdited()) {
      this.form.controls.slug.setValue(
        stringToSlug(title),
        { emitEvent: false },
      );
    }
    if (!this.seoTitleEdited()) {
      this.form.controls.seoTitle.setValue(
        normalizeText(title) ?? '',
        { emitEvent: false },
      );
    }
  }

  private createSavePayload(): ISaveContentArticlePayload {
    if (this.hasUnsupportedImageBlocks()) {
      throw new Error('Cannot save article with image blocks in text-only editor.');
    }
    const value = this.form.getRawValue();
    return {
      id: this.article()?.id ?? this.articleId,
      title: normalizeText(value.title),
      slug: normalizeText(value.slug),
      excerpt: normalizeText(value.excerpt),
      heroImagePath: normalizeText(value.heroImagePath),
      heroImageAlt: normalizeText(value.heroImageAlt),
      seoTitle: normalizeText(value.seoTitle),
      seoDescription: normalizeText(value.seoDescription),
      blocks: value.blocks
        .map((block) => ({
          kind: 'text_section' as const,
          heading: normalizeText(block.heading),
          body: normalizeText(block.body) ?? '',
        }))
        .filter((block) => !!block.heading || !!block.body),
    };
  }
}
