import { QuestionnaireErrorsTranslations } from '../../../../core/types/i18n/coworker-questionnaire';
import { EdgeFunctionError } from '../../../../core/types/edge-function-error';

const STATEMENT_FIELD_PATHS = [
  'finalDeclaration.statementKey',
  'finalDeclaration.statementVersion',
] as const;

export function normalizeQuestionnaireError(
  error: unknown,
  fallbackMessage: string,
): EdgeFunctionError {
  if (error instanceof EdgeFunctionError) return error;

  return new EdgeFunctionError(
    null,
    'UNEXPECTED_ERROR',
    fallbackMessage,
    {},
    error,
  );
}

export function getQuestionnaireErrorTitle(
  error: EdgeFunctionError | null,
  isLoadError: boolean,
  translations: QuestionnaireErrorsTranslations,
): string {
  if (error?.status === 401) return translations.sessionTitle;
  if (error?.status === 403) return translations.unauthorizedTitle;
  if (isLoadError) return translations.loadTitle;
  if (error?.code === 'VALIDATION_FAILED') return translations.validationTitle;
  if (error?.status === 409) return translations.conflictTitle;
  return translations.fatalTitle;
}

export function getQuestionnaireErrorDescription(
  error: EdgeFunctionError | null,
  isLoadError: boolean,
  translations: QuestionnaireErrorsTranslations,
): string {
  if (error?.status === 401) return translations.sessionDescription;
  if (error?.status === 403) return translations.unauthorizedDescription;
  if (isLoadError) return translations.loadDescription;
  if (isQuestionnaireStatementChanged(error)) {
    return translations.statementChangedDescription;
  }
  if (error?.code === 'VALIDATION_FAILED') {
    return translations.validationDescription;
  }
  if (error?.code === 'CONCURRENT_MODIFICATION') {
    return translations.concurrentModificationDescription;
  }
  if (error?.code === 'PESEL_CONFLICT') {
    return translations.peselConflictDescription;
  }
  return error?.message ?? translations.unexpectedDescription;
}

export function isQuestionnaireStatementChanged(
  error: EdgeFunctionError | null,
): boolean {
  return error?.code === 'VALIDATION_FAILED' && STATEMENT_FIELD_PATHS.some(
    (path) => Object.prototype.hasOwnProperty.call(error.fieldErrors, path),
  );
}
