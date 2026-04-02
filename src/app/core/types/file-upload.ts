export type FileUploadPreviewShape = 'circle' | 'square' | 'landscape';

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
  accept: string;
  maxFileSize: number;
  currentUrl: string | null;
  disabled: boolean;
  previewShape: FileUploadPreviewShape;
}

export interface FileUploadCropConfig {
  aspectRatio: number;
  roundCropper: boolean;
  resizeToWidth: number;
  resizeToHeight: number;
  previewShapes: FileUploadPreviewShape[];
}
