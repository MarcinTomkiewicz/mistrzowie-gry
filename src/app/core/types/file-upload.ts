export type FileUploadPreviewShape = 'circle' | 'square' | 'landscape';
export type FileUploadMode = 'image' | 'files';

export interface FileUploadTexts {
  chooseLabel: string;
  clearLabel: string;
  dropLabel: string;
  formatsLabel: string;
  previewAlt: string;
  cropTitle: string;
  cropHint: string;
  cropFrameAriaLabel: string;
  cropConfirmLabel: string;
  cropCancelLabel: string;
  cropProcessingLabel: string;
  zoomLabel: string;
  cropPreviewLabel: string;
  cropPreviewLandscapeLabel: string;
  cropPreviewCircleLabel: string;
  cropPreviewSquareLabel: string;
}

export interface FileUploadOptions {
  mode?: FileUploadMode;
  accept: string;
  maxFileSize: number;
  currentUrl: string | null;
  disabled: boolean;
  previewShape: FileUploadPreviewShape;
  multiple?: boolean;
  clearAfterSelect?: boolean;
  chooseIcon?: string;
  emptyIcon?: string;
}

export interface FileUploadCropConfig {
  aspectRatio: number;
  roundCropper: boolean;
  resizeToWidth: number;
  resizeToHeight: number;
  previewShapes: FileUploadPreviewShape[];
}
