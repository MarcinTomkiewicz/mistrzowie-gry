import { Component, computed, input, output } from '@angular/core';

import {
  IMAGE_UPLOAD_CROP_CONFIG,
  IMAGE_UPLOAD_OPTIONS,
} from '../../../core/configs/image-upload.config';
import {
  createCommonActionsI18n,
  createCommonFormI18n,
} from '../../../core/translations/common.i18n';
import { FileUploadOptions, FileUploadTexts } from '../../../core/types/file-upload';
import { FileUpload } from '../file-upload/file-upload';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [FileUpload],
  templateUrl: './image-upload.html',
})
export class ImageUpload {
  readonly currentUrl = input<string | null>(null);
  readonly cropHint = input('');
  readonly disabled = input(false);
  readonly previewAlt = input('');
  readonly fileSelected = output<File | null>();

  protected readonly cropConfig = IMAGE_UPLOAD_CROP_CONFIG;
  private readonly commonActions = createCommonActionsI18n();
  private readonly commonForm = createCommonFormI18n();
  protected readonly options = computed<FileUploadOptions>(() => ({
    ...IMAGE_UPLOAD_OPTIONS,
    currentUrl: this.currentUrl(),
    disabled: this.disabled(),
  }));
  protected readonly texts = computed<FileUploadTexts>(() => {
    const fileUpload = this.commonForm().fileUpload;

    return {
      chooseLabel: fileUpload.chooseImage,
      clearLabel: this.commonActions().clear,
      dropLabel: fileUpload.dropImage,
      formatsLabel: fileUpload.imageFormats,
      previewAlt: this.previewAlt(),
      cropTitle: fileUpload.cropTitle,
      cropHint: this.cropHint(),
      cropFrameAriaLabel: fileUpload.cropFrameAriaLabel,
      cropConfirmLabel: fileUpload.cropConfirm,
      cropCancelLabel: this.commonActions().cancel,
      cropProcessingLabel: fileUpload.cropProcessingLabel,
      zoomLabel: fileUpload.zoomLabel,
      cropPreviewLabel: fileUpload.cropPreviewLabel,
      cropPreviewLandscapeLabel: fileUpload.cropPreviewLandscapeLabel,
      cropPreviewCircleLabel: fileUpload.cropPreviewCircleLabel,
      cropPreviewSquareLabel: fileUpload.cropPreviewSquareLabel,
    };
  });
}
