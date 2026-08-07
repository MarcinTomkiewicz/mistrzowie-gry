import type { FileUploadOptions } from '../types/file-upload';

export const COWORKER_DOCUMENT_MAX_FILE_SIZE = 26_214_400;

export const COWORKER_PDF_UPLOAD_OPTIONS = {
  mode: 'files',
  accept: 'application/pdf',
  maxFileSize: COWORKER_DOCUMENT_MAX_FILE_SIZE,
  currentUrl: null,
  disabled: false,
  previewShape: 'landscape',
  multiple: false,
  clearAfterSelect: true,
  chooseIcon: 'pi pi-file-pdf',
  emptyIcon: 'pi pi-file-pdf',
} satisfies FileUploadOptions;
