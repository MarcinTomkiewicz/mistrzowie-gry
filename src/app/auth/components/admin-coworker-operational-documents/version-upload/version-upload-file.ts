import {
  ADMIN_OPERATIONAL_UPLOAD_FORMATS,
  ADMIN_OPERATIONAL_VERSION_LIMITS,
} from '../../../../core/configs/admin-coworker-operational-documents.config';
import type { IAdminOperationalStorageCatalog } from '../../../../core/interfaces/i-admin-operational-catalog';
import type {
  AdminOperationalUploadFileValidation,
  AdminOperationalUploadMimeType,
} from '../../../../core/types/admin-operational-upload';

const GENERIC_BROWSER_MIME_TYPES = [
  '',
  'application/octet-stream',
  'binary/octet-stream',
] as const;

const BROWSER_MIME_ALIASES: Readonly<
  Record<AdminOperationalUploadMimeType, readonly string[]>
> = {
  'application/pdf': ['application/x-pdf'],
  'image/jpeg': ['image/jpg', 'image/pjpeg'],
  'image/png': ['image/x-png'],
  'image/webp': [],
  'application/xml': ['text/xml'],
  'text/xml': ['application/xml'],
  'application/zip': ['application/x-zip-compressed'],
  'application/pkcs7-signature': ['application/x-pkcs7-signature'],
  'application/pkcs7-mime': ['application/x-pkcs7-mime'],
  'application/vnd.etsi.asic-e+zip': [
    'application/zip',
    'application/x-zip-compressed',
  ],
  'application/vnd.etsi.asic-s+zip': [
    'application/zip',
    'application/x-zip-compressed',
  ],
};

export function validateAdminOperationalUploadFile(
  file: File,
  storage: IAdminOperationalStorageCatalog,
): AdminOperationalUploadFileValidation {
  const originalFilename = file.name.normalize('NFC').trim();
  if (
    originalFilename.length === 0 ||
    originalFilename.length > ADMIN_OPERATIONAL_VERSION_LIMITS.originalFilenameLength ||
    /[/\\]/.test(originalFilename) ||
    /[\u0000-\u001f\u007f]/.test(originalFilename)
  ) {
    return { error: 'name' };
  }

  const extension = originalFilename.includes('.')
    ? originalFilename.split('.').pop()?.toLowerCase() ?? ''
    : '';
  const formats = ADMIN_OPERATIONAL_UPLOAD_FORMATS.filter(
    (format) =>
      format.extensions.some((candidate) => candidate === extension) &&
      storage.allowedMimeTypes.some(
        (mimeType) => mimeType === format.mimeType,
      ),
  );
  const browserMimeType = file.type.trim().toLowerCase();
  const format = formats.find(
    (candidate) => candidate.mimeType === browserMimeType,
  ) ?? formats.find((candidate) =>
    BROWSER_MIME_ALIASES[candidate.mimeType].some(
      (mimeType) => mimeType === browserMimeType,
    ),
  ) ?? (
    GENERIC_BROWSER_MIME_TYPES.some(
      (mimeType) => mimeType === browserMimeType,
    )
      ? formats[0]
      : undefined
  );
  if (format === undefined) return { error: 'type' };
  if (file.size < 1 || file.size > storage.fileSizeLimit) {
    return { error: 'size' };
  }

  return {
    error: null,
    originalFilename,
    declaredMimeType: format.mimeType,
  };
}

export function adminOperationalUploadAccept(
  storage: IAdminOperationalStorageCatalog,
): string {
  return [...new Set([
    ...storage.allowedMimeTypes,
    ...allowedExtensions(storage).map((extension) => `.${extension}`),
  ])].join(',');
}

export function adminOperationalUploadFormatLabel(
  storage: IAdminOperationalStorageCatalog,
): string {
  return [...new Set(allowedExtensions(storage))].join(', ');
}

function allowedExtensions(
  storage: IAdminOperationalStorageCatalog,
): string[] {
  return ADMIN_OPERATIONAL_UPLOAD_FORMATS
    .filter((format) =>
      storage.allowedMimeTypes.some(
        (mimeType) => mimeType === format.mimeType,
      ),
    )
    .flatMap((format) => [...format.extensions]);
}
