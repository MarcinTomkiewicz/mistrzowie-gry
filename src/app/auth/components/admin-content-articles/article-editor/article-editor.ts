import { Component, DestroyRef, inject, signal } from '@angular/core';
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
  ARTICLE_EDITOR_MAIN_FORM_FIELD_ROWS,
  ARTICLE_EDITOR_SEO_FORM_FIELD_ROWS,
} from '../../../../core/configs/article-editor-form.config';
import { IAdminContentArticleDetail } from '../../../../core/interfaces/i-content-article';
import { ContentArticles } from '../../../../core/services/content-articles/content-articles';
import { ImageStorage } from '../../../../core/services/image-storage/image-storage';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import {
  ArticleEditorForm,
  ArticleEditorFormFieldInputAction,
} from '../../../../core/types/article-editor-form';
import {
  hasArticleEditorHeadingWithoutBody,
  hasArticleEditorImageWithoutPath,
} from '../../../../core/validators/article-editor-block.validator';
import { getContentArticleStatusBadgeClass } from '../../../../core/utils/content-articles';
import { normalizeText } from '../../../../core/utils/normalize-text';
import { stringToSlug } from '../../../../core/utils/slug';
import { ImageUpload } from '../../../../public/common/image-upload/image-upload';
import { LoadingOverlay } from '../../../../public/common/loading-overlay/loading-overlay';
import { ArticleBlocksEditor } from '../article-blocks-editor/article-blocks-editor';
import { createArticleEditorBlockForm, mapArticleEditorFormToPayload } from './article-editor-form';
import { createAdminContentArticleEditorI18n } from './article-editor.i18n';

@Component({
  selector: 'app-article-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    IftaLabelModule,
    InputTextModule,
    TextareaModule,
    LoadingOverlay,
    ArticleBlocksEditor,
    ImageUpload,
  ],
  templateUrl: './article-editor.html',
  providers: [provideTranslocoScope('adminContentArticles', 'common')],
})
export class ArticleEditor {
  private readonly articles = inject(ContentArticles);
  private readonly imageStorage = inject(ImageStorage);
  private readonly router = inject(Router);
  private readonly toast = inject(UiToast);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly articleId =
    inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  protected readonly i18n = createAdminContentArticleEditorI18n();
  protected readonly article = signal<IAdminContentArticleDetail | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly isUploading = signal(false);
  protected readonly hasLoadError = signal(false);
  protected readonly isNotFound = signal(false);
  protected readonly showBlockValidation = signal(false);
  protected readonly heroPreviewUrl = signal<string | null>(null);
  private readonly slugEdited = signal(false);
  private readonly seoTitleEdited = signal(false);
  protected readonly form: ArticleEditorForm = new FormGroup({
    title: new FormControl('', { nonNullable: true }),
    slug: new FormControl('', { nonNullable: true }),
    excerpt: new FormControl('', { nonNullable: true }),
    heroImagePath: new FormControl('', { nonNullable: true }),
    heroImageAlt: new FormControl('', { nonNullable: true }),
    seoTitle: new FormControl('', { nonNullable: true }),
    seoDescription: new FormControl('', { nonNullable: true }),
    blocks: new FormArray([createArticleEditorBlockForm('text_section')]),
  });
  protected readonly mainFieldRows = ARTICLE_EDITOR_MAIN_FORM_FIELD_ROWS;
  protected readonly seoFieldRows = ARTICLE_EDITOR_SEO_FORM_FIELD_ROWS;
  protected readonly getStatusBadgeClass = getContentArticleStatusBadgeClass;
  protected readonly textBlocks = this.form.controls.blocks;
  constructor() {
    this.form.controls.title.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((title) => this.syncTitleDerivedFields(title));
    this.form.controls.heroImagePath.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((path) =>
        this.heroPreviewUrl.set(path ? this.imageStorage.publicUrl(path) : null),
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

  protected onFieldInputAction(
    action: ArticleEditorFormFieldInputAction | undefined,
  ): void {
    if (action === 'slugManualEdit') {
      this.slugEdited.set(true);
    }

    if (action === 'seoTitleManualEdit') {
      this.seoTitleEdited.set(true);
    }
  }

  protected onHeroImageSelected(file: File | null): void {
    if (!file) {
      this.form.controls.heroImagePath.setValue('');
      this.heroPreviewUrl.set(null);
      this.form.markAsDirty();
      return;
    }
    this.uploadArticleImage(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (path) => {
          this.form.controls.heroImagePath.setValue(path);
          this.form.markAsDirty();
        },
        error: () => this.showUploadError(),
      });
  }

  protected onBlockUploadingChange(isUploading: boolean): void {
    this.isUploading.set(isUploading);
  }

  protected saveArticle(): void {
    const toast = this.i18n.toast();
    this.showBlockValidation.set(true);
    if (
      this.textBlocks.controls.some((block) =>
        hasArticleEditorHeadingWithoutBody(block) ||
        hasArticleEditorImageWithoutPath(block),
      )
    ) {
      this.toast.danger({
        summary: toast.invalidSummary,
        detail: toast.invalidDetail,
      });
      return;
    }
    if (this.isUploading()) {
      return;
    }
    this.isSaving.set(true);
    this.articles
      .saveAdminArticle(
        mapArticleEditorFormToPayload(
          this.form,
          this.article()?.id ?? this.articleId,
        ),
      )
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.toast.success({
            summary: toast.saveSuccessSummary,
            detail: toast.saveSuccessDetail,
          });
          void this.router.navigate(['/admin/content']);
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
    for (const block of [...article.blocks].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    )) {
      const blockForm = block.kind === 'text_section'
        ? createArticleEditorBlockForm(
            'text_section',
            block.heading ?? '',
            block.body,
          )
        : createArticleEditorBlockForm(
            'image',
            '',
            '',
            block.imagePath,
            block.imageAlt,
            block.caption ?? '',
          );

      this.textBlocks.push(blockForm, { emitEvent: false });
    }
    if (!this.textBlocks.length) {
      this.textBlocks.push(
        createArticleEditorBlockForm('text_section'),
        { emitEvent: false },
      );
    }
    this.form.patchValue(
      {
        title: article.title ?? '',
        slug: article.slug ?? '',
        excerpt: article.excerpt ?? '',
        heroImagePath: article.heroImagePath ?? '',
        heroImageAlt: article.heroImageAlt ?? '',
        seoTitle: article.seoTitle ?? '',
        seoDescription: article.seoDescription ?? '',
      },
      { emitEvent: false },
    );
    this.syncTitleDerivedFields(title);
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.heroPreviewUrl.set(
      article.heroImagePath
        ? this.imageStorage.publicUrl(article.heroImagePath)
        : null,
    );
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

  private uploadArticleImage(file: File) {
    this.isUploading.set(true);

    return this.imageStorage
      .transcodeAndUpload(file, `content/articles/${this.articleId}`)
      .pipe(finalize(() => this.isUploading.set(false)));
  }

  private showUploadError(): void {
    this.toast.danger({
      summary: this.i18n.toast().uploadFailedSummary,
      detail: this.i18n.toast().uploadFailedDetail,
    });
  }
}
