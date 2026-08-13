import {
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { finalize } from 'rxjs';

import { ImageStorage } from '../../../../core/services/image-storage/image-storage';
import { Storage } from '../../../../core/services/storage/storage';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import {
  ArticleEditorBlockForm,
  ArticleEditorBlocksForm,
} from '../../../../core/types/article-editor-form';
import {
  hasArticleEditorHeadingWithoutBody,
  hasArticleEditorImageWithoutPath,
  hasInvalidArticleLinkSyntax,
} from '../../../../core/validators/article-editor-block.validator';
import { ImageUpload } from '../../../../common/image-upload/image-upload';
import { createArticleEditorBlockForm } from '../article-editor/article-editor-form';
import { createAdminContentArticleEditorI18n } from '../article-editor/article-editor.i18n';

@Component({
  selector: 'app-article-blocks-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    IftaLabelModule,
    InputTextModule,
    TextareaModule,
    ImageUpload,
  ],
  templateUrl: './article-blocks-editor.html',
})
export class ArticleBlocksEditor {
  private readonly imageStorage = inject(ImageStorage);
  private readonly storage = inject(Storage);
  private readonly toast = inject(UiToast);
  private readonly destroyRef = inject(DestroyRef);

  readonly articleId = input.required<string>();
  readonly blocks = input.required<ArticleEditorBlocksForm>();
  readonly cropHint = input('');
  readonly disabled = input(false);
  readonly showValidation = input(false);
  readonly uploadingChange = output<boolean>();

  protected readonly i18n = createAdminContentArticleEditorI18n();
  private readonly activeUploads = signal<ReadonlySet<ArticleEditorBlockForm>>(
    new Set(),
  );
  protected readonly isUploading = computed(() => this.activeUploads().size > 0);
  protected readonly hasHeadingWithoutBody = hasArticleEditorHeadingWithoutBody;
  protected readonly hasImageWithoutPath = hasArticleEditorImageWithoutPath;
  protected readonly hasInvalidLinkSyntax = hasInvalidArticleLinkSyntax;

  protected addTextSectionAfter(index: number | null): void {
    this.addBlockAfter(index, createArticleEditorBlockForm('text_section'));
  }

  protected addImageBlockAfter(index: number | null): void {
    this.addBlockAfter(index, createArticleEditorBlockForm('image'));
  }

  protected removeBlock(index: number): void {
    this.blocks().removeAt(index);
    this.blocks().markAsDirty();
  }

  protected moveBlockUp(index: number): void {
    if (index <= 0) {
      return;
    }

    this.moveBlock(index, index - 1);
  }

  protected moveBlockDown(index: number): void {
    if (index >= this.blocks().length - 1) {
      return;
    }

    this.moveBlock(index, index + 1);
  }

  protected imagePreviewUrl(path: string): string | null {
    return path ? this.storage.getPublicUrl(path) : null;
  }

  protected isBlockUploading(block: ArticleEditorBlockForm): boolean {
    return this.activeUploads().has(block);
  }

  protected onBlockImageSelected(file: File | null, index: number): void {
    const block = this.blocks().at(index);
    const previousPath = block.controls.imagePath.getRawValue();

    if (!file) {
      block.controls.imagePath.setValue('');
      this.blocks().markAsDirty();
      return;
    }

    this.setBlockUploading(block, true);

    this.imageStorage
      .transcodeAndUpload(file, {
        folder: `content/articles/${this.articleId()}`,
        replacePath: previousPath,
        usePublicUrl: false,
      })
      .pipe(
        finalize(() => this.setBlockUploading(block, false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (path) => {
          block.controls.imagePath.setValue(path);
          this.blocks().markAsDirty();
        },
        error: () => {
          this.toast.danger({
            summary: this.i18n.toast().uploadFailedSummary,
            detail: this.i18n.toast().uploadFailedDetail,
          });
        },
      });
  }

  private addBlockAfter(
    index: number | null,
    block: ArticleEditorBlockForm,
  ): void {
    const insertIndex = index === null ? this.blocks().length : index + 1;

    this.blocks().insert(insertIndex, block);
    this.blocks().markAsDirty();
  }

  private moveBlock(fromIndex: number, toIndex: number): void {
    const control = this.blocks().at(fromIndex);
    this.blocks().removeAt(fromIndex);
    this.blocks().insert(toIndex, control);
    this.blocks().markAsDirty();
  }

  private setBlockUploading(
    block: ArticleEditorBlockForm,
    isUploading: boolean,
  ): void {
    const uploads = new Set(this.activeUploads());

    if (isUploading) {
      uploads.add(block);
    } else {
      uploads.delete(block);
    }

    this.activeUploads.set(uploads);
    this.uploadingChange.emit(uploads.size > 0);
  }
}
