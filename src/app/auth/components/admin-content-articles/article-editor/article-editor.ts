import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { filter, finalize, of, switchMap } from 'rxjs';
import {
  ARTICLE_EDITOR_MAIN_FORM_FIELD_ROWS,
  ARTICLE_EDITOR_SEO_FORM_FIELD_ROWS,
} from '../../../../core/configs/article-editor-form.config';
import { IAdminContentArticleDetail } from '../../../../core/interfaces/i-content-article';
import { ContentArticles } from '../../../../core/services/content-articles/content-articles';
import { ImageStorage } from '../../../../core/services/image-storage/image-storage';
import { Storage } from '../../../../core/services/storage/storage';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import {
  ArticleEditorForm,
  ArticleEditorFormFieldInputAction,
  ArticleEditorVisibleFormControlName,
} from '../../../../core/types/article-editor-form';
import {
  hasArticleEditorHeadingWithoutBody,
  hasArticleEditorImageWithoutPath,
  hasInvalidArticleLinkSyntax,
} from '../../../../core/validators/article-editor-block.validator';
import { normalizeText, stringToSlug } from '../../../../core/utils/normalize-text';
import { ImageUpload } from '../../../../common/image-upload/image-upload';
import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import { ArticleBlocksEditor } from '../article-blocks-editor/article-blocks-editor';
import { getContentArticleStatusBadgeClass } from '../content-article-publication';
import { createArticleEditorBlockForm, mapArticleEditorFormToPayload, populateArticleEditorForm } from './article-editor-form';
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
  private readonly storage = inject(Storage);
  private readonly router = inject(Router);
  private readonly toast = inject(UiToast);
  private readonly confirm = inject(UiConfirm);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly articleId =
    inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  protected readonly i18n = createAdminContentArticleEditorI18n();
  protected readonly article = signal<IAdminContentArticleDetail | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly activeHeroUploads = signal(false);
  private readonly activeBlockUploads = signal(false);
  protected readonly isUploading = computed(
    () => this.activeHeroUploads() || this.activeBlockUploads(),
  );
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

  protected getFieldLabel(controlName: ArticleEditorVisibleFormControlName): string {
    if (controlName === 'excerpt') return this.i18n.commonLabels().lead;
    if (controlName === 'heroImageAlt') return this.i18n.fields().heroImageAlt;

    return this.i18n.commonLabels()[controlName];
  }

  protected getStatusLabel(status: IAdminContentArticleDetail['status']): string {
    return status === 'draft'
      ? this.i18n.statusLabels().draft
      : this.i18n.commonValues()[status];
  }
  constructor() {
    this.form.controls.title.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((title) => this.syncTitleDerivedFields(title));
    this.form.controls.heroImagePath.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((path) =>
        this.heroPreviewUrl.set(path ? this.storage.getPublicUrl(path) : null),
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
            summary: this.i18n.commonErrors().articleLoadFailed,
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
    this.activeBlockUploads.set(isUploading);
  }

  protected saveArticle(): void {
    const article = this.article();
    if (!article || this.isLoading() || this.isSaving() || this.isUploading()) return;
    const toast = this.i18n.toast();
    this.showBlockValidation.set(true);
    if (
      this.textBlocks.controls.some((block) =>
        hasArticleEditorHeadingWithoutBody(block) ||
        hasArticleEditorImageWithoutPath(block) ||
        hasInvalidArticleLinkSyntax(block),
      )
    ) {
      this.toast.danger({
        summary: toast.invalidSummary,
        detail: toast.invalidDetail,
      });
      return;
    }
    const payload = mapArticleEditorFormToPayload(this.form, article, this.slugEdited());
    const value = JSON.stringify(this.form.getRawValue());
    const actions = this.i18n.editorActions();
    const decision = article.publishedAt !== null && payload.slug !== article.slug
      ? this.confirm.modalDecision({
          header: actions.changeUrlHeader,
          message: actions.changeUrlMessage
            .replace('{{current}}', `/artykuly/${article.slug}`)
            .replace('{{next}}', `/artykuly/${payload.slug ?? ''}`),
          acceptLabel: actions.changeUrlAction,
          rejectLabel: this.i18n.commonActions().cancel,
        })
      : of(true);
    decision.pipe(
      filter((accepted) => accepted && this.article() === article && !this.isSaving() &&
        !this.isLoading() && !this.isUploading() && JSON.stringify(this.form.getRawValue()) === value),
      switchMap(() => {
        this.isSaving.set(true);
        return this.articles.saveAdminArticle(payload).pipe(
          finalize(() => this.isSaving.set(false)),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    )
      .subscribe({
        next: () => {
          this.toast.success({
            summary: toast.saveSuccessSummary,
            detail: this.i18n.commonStatus().changesSaved,
          });
          void this.router.navigate(['/admin/content']);
        },
        error: () => {
          this.toast.danger({
            summary: toast.saveFailedSummary,
            detail: this.i18n.commonErrors().changesNotSaved,
          });
        },
      });
  }

  protected goBack(): void {
    if (this.isSaving() || this.isUploading()) {
      return;
    }

    void this.router.navigate(['/admin/content']);
  }

  private populateForm(article: IAdminContentArticleDetail): void {
    const title = normalizeText(article.title) ?? '';
    const seoTitle = normalizeText(article.seoTitle);
    this.slugEdited.set(false);
    this.seoTitleEdited.set(!!seoTitle && seoTitle !== title);
    this.showBlockValidation.set(false);
    populateArticleEditorForm(this.form, article);
    this.syncTitleDerivedFields(title);
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.heroPreviewUrl.set(
      article.heroImagePath
        ? this.storage.getPublicUrl(article.heroImagePath)
        : null,
    );
  }

  private syncTitleDerivedFields(title: string): void {
    const article = this.article();
    if (!this.slugEdited() && article?.publishedAt === null &&
      (!article.slug || article.slug === stringToSlug(article.title ?? ''))) {
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
    this.activeHeroUploads.set(true);

    return this.imageStorage
      .transcodeAndUpload(file, {
        folder: `content/articles/${this.articleId}`,
        replacePath: this.form.controls.heroImagePath.getRawValue(),
        usePublicUrl: false,
      })
      .pipe(
        finalize(() => this.activeHeroUploads.set(false)),
      );
  }

  private showUploadError(): void {
    this.toast.danger({
      summary: this.i18n.toast().uploadFailedSummary,
      detail: this.i18n.toast().uploadFailedDetail,
    });
  }
}
