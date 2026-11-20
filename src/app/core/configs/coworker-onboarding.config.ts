import {
  COWORKER_DOCUMENT_MAX_FILE_SIZE,
  COWORKER_DOCUMENT_PDF_MIME_TYPE,
} from './coworker-document.config';
import type { FileUploadOptions } from '../types/file-upload';

export const DEFAULT_COWORKER_DOCUMENT_CATEGORY = 'other';

export const COWORKER_PDF_UPLOAD_OPTIONS = {
  mode: 'files',
  accept: COWORKER_DOCUMENT_PDF_MIME_TYPE,
  maxFileSize: COWORKER_DOCUMENT_MAX_FILE_SIZE,
  currentUrl: null,
  disabled: false,
  previewShape: 'landscape',
  multiple: false,
  clearAfterSelect: true,
  chooseIcon: 'pi pi-report-spy',
  emptyIcon: 'pi pi-report-spy',
} satisfies FileUploadOptions;
