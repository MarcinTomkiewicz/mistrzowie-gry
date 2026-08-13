import type {
  FileUploadCropConfig,
  FileUploadOptions,
  FileUploadTexts,
} from '../../core/types/file-upload';

export const DEFAULT_FILE_UPLOAD_TEXTS: FileUploadTexts = {
  chooseLabel: '',
  clearLabel: '',
  dropLabel: '',
  formatsLabel: '',
  previewAlt: '',
  cropTitle: '',
  cropHint: '',
  cropFrameAriaLabel: '',
  cropConfirmLabel: '',
  cropCancelLabel: '',
  cropProcessingLabel: '',
  zoomLabel: '',
  cropPreviewLabel: '',
  cropPreviewLandscapeLabel: '',
  cropPreviewCircleLabel: '',
  cropPreviewSquareLabel: '',
};

export const DEFAULT_FILE_UPLOAD_OPTIONS: FileUploadOptions = {
  mode: 'image',
  accept: 'image/png,image/jpeg,image/webp,image/avif',
  maxFileSize: 5_000_000,
  currentUrl: null,
  disabled: false,
  previewShape: 'circle',
  multiple: false,
  clearAfterSelect: false,
  chooseIcon: 'pi pi-mona-lisa',
  emptyIcon: 'pi pi-soul',
};

export const DEFAULT_FILE_UPLOAD_CROP_CONFIG: FileUploadCropConfig = {
  aspectRatio: 1,
  roundCropper: false,
  resizeToWidth: 0,
  resizeToHeight: 0,
  previewShapes: [],
};
