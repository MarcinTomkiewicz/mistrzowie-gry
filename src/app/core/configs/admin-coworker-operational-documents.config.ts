import { COWORKER_DOCUMENT_SHELL_LIMITS } from './coworker-documents.config';

export const ADMIN_OPERATIONAL_DOCUMENT_CODE_PATTERN =
  /^[a-z0-9][a-z0-9_-]*$/;

export const ADMIN_OPERATIONAL_VERSION_LIMITS = {
  titleLength: COWORKER_DOCUMENT_SHELL_LIMITS.titleLength,
  summaryLength: COWORKER_DOCUMENT_SHELL_LIMITS.descriptionLength,
  statementTextLength: 8000,
  originalFilenameLength: 255,
} as const;
