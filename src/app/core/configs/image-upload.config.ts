import {
  FileUploadCropConfig,
  FileUploadOptions,
} from '../types/file-upload';

export const IMAGE_UPLOAD_OPTIONS: Omit<
  FileUploadOptions,
  'currentUrl' | 'disabled'
> = {
  mode: 'image',
  accept: 'image/png,image/jpeg,image/webp,image/avif',
  maxFileSize: 5_000_000,
  previewShape: 'landscape',
  chooseIcon: 'pi pi-mona-lisa',
  emptyIcon: 'pi pi-mona-lisa',
};

export const IMAGE_UPLOAD_CROP_CONFIG: FileUploadCropConfig = {
  aspectRatio: 16 / 9,
  roundCropper: false,
  resizeToWidth: 1280,
  resizeToHeight: 720,
  previewShapes: ['landscape', 'circle'],
};
