import { EdgeFunctionError } from '../../../core/types/edge-function-error';
import type { CoworkerOnboardingToastTranslations } from '../../../core/types/i18n/coworker-onboarding';
import type { ToastOptions } from '../../../core/types/toast';
import { isEdgeMutationResultUncertain } from '../../../core/utils/edge-function-error-mapping';

export function getOnboardingErrorMessage(
  error: unknown,
  translations: CoworkerOnboardingToastTranslations['errors'] | undefined,
  fallback: string,
): string {
  if (!(error instanceof EdgeFunctionError)) return fallback;

  switch (error.code) {
    case 'UNAUTHENTICATED':
    case 'ACCESS_DENIED':
    case 'VALIDATION_FAILED':
    case 'NOT_FOUND':
    case 'CONFLICT':
    case 'UPLOAD_FAILED':
    case 'INTERNAL_ERROR':
      return translations?.[error.code] ?? fallback;
    default:
      return fallback;
  }
}

export function getOnboardingMutationErrorToast(
  error: unknown,
  translations: CoworkerOnboardingToastTranslations,
): ToastOptions {
  if (!(error instanceof EdgeFunctionError) || isEdgeMutationResultUncertain(error)) {
    return {
      summary: translations.mutationUncertainSummary,
      detail: translations.mutationUncertainDetail,
    };
  }

  return {
    summary: translations.mutationFailedSummary,
    detail: getOnboardingErrorMessage(error, translations.errors, translations.mutationFailedDetail),
  };
}
