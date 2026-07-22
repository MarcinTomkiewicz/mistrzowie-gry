import { COWORKER_DOCUMENT_SHELL_LIMITS } from './coworker-documents.config';

export const ADMIN_OPERATIONAL_DOCUMENT_CODE_PATTERN =
  /^[a-z0-9][a-z0-9_-]*$/;

export const ADMIN_OPERATIONAL_VERSION_LIMITS = {
  titleLength: COWORKER_DOCUMENT_SHELL_LIMITS.titleLength,
  summaryLength: COWORKER_DOCUMENT_SHELL_LIMITS.descriptionLength,
  statementTextLength: 8000,
  originalFilenameLength: 255,
  targetCount: 500,
} as const;

export const ADMIN_OPERATIONAL_UPLOAD_FORMATS = [
  {
    mimeType: 'application/pdf',
    extensions: ['pdf'],
  },
  {
    mimeType: 'image/jpeg',
    extensions: ['jpg', 'jpeg'],
  },
  {
    mimeType: 'image/png',
    extensions: ['png'],
  },
  {
    mimeType: 'image/webp',
    extensions: ['webp'],
  },
  {
    mimeType: 'application/xml',
    extensions: ['xml'],
  },
  {
    mimeType: 'text/xml',
    extensions: ['xml'],
  },
  {
    mimeType: 'application/zip',
    extensions: ['zip'],
  },
  {
    mimeType: 'application/pkcs7-signature',
    extensions: ['p7s'],
  },
  {
    mimeType: 'application/pkcs7-mime',
    extensions: ['p7m'],
  },
  {
    mimeType: 'application/vnd.etsi.asic-e+zip',
    extensions: ['asice'],
  },
  {
    mimeType: 'application/vnd.etsi.asic-s+zip',
    extensions: ['asics'],
  },
] as const;
