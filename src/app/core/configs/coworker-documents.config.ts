export const COWORKER_DOCUMENTS_STORAGE = {
  bucket: 'coworker-documents',
  maxFileSizeBytes: 25 * 1024 * 1024,
} as const;

export const COWORKER_DOCUMENT_SHELL_LIMITS = {
  codeLength: 100,
  titleLength: 250,
  descriptionLength: 4000,
  categoryLength: 150,
} as const;

export const COWORKER_DOCUMENT_DEFINITION_LIMITS = {
  ...COWORKER_DOCUMENT_SHELL_LIMITS,
  signaturePolicyCodeLength: 100,
  allowedItemCount: 50,
  mimeTypeLength: 150,
  extensionLength: 16,
  retentionDays: 36500,
} as const;

export const COWORKER_DOCUMENT_REVIEW_LIMITS = {
  signatureReasonLength: 2000,
  rejectionReasonLength: 2000,
  noteLength: 4000,
} as const;
