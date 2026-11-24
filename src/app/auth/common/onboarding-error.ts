import type { createCoworkerOnboardingI18n } from '../../core/translations/coworker-onboarding.i18n';
import { EdgeFunctionError } from '../../core/types/edge-function-error';
import type { ToastOptions } from '../../core/types/toast';
import { isEdgeMutationResultUncertain } from '../../core/utils/edge-function-error-mapping';

type OnboardingErrorI18n = Pick<ReturnType<typeof createCoworkerOnboardingI18n>, 'toast' | 'apiErrors' | 'commonErrors'>;

export function getOnboardingErrorMessage(
  error: unknown,
  i18n: OnboardingErrorI18n,
  fallback: string,
): string {
  if (!(error instanceof EdgeFunctionError)) return fallback;

  switch (error.code) {
    case 'UNAUTHENTICATED':
      return i18n.commonErrors().sessionExpired ?? fallback;
    case 'ACCESS_DENIED':
      return i18n.commonErrors().accessDenied ?? fallback;
    case 'INTERNAL_ERROR':
      return i18n.commonErrors().internalError ?? fallback;
    case 'VALIDATION_FAILED':
    case 'NOT_FOUND':
    case 'CONFLICT':
    case 'UPLOAD_FAILED':
      return i18n.apiErrors()[error.code] ?? fallback;
    default:
      return fallback;
  }
}

export function getOnboardingMutationErrorToast(
  error: unknown,
  i18n: OnboardingErrorI18n,
): ToastOptions {
  const translations = i18n.toast();
  if (!(error instanceof EdgeFunctionError) || isEdgeMutationResultUncertain(error)) {
    return {
      summary: translations.mutationUncertainSummary,
      detail: translations.mutationUncertainDetail,
    };
  }

  return {
    summary: translations.mutationFailedSummary,
    detail: getOnboardingErrorMessage(error, i18n, translations.mutationFailedDetail),
  };
}
