import { computed } from '@angular/core';
import { translateObjectSignal } from '@jsverse/transloco';

import { CommonErrorsTranslations, CommonFormTranslations } from '../../../core/types/common-i18n';
import { pickTranslations } from '../../../core/utils/pick-translation';

export function createLoginFormI18n() {
  const titleDict = translateObjectSignal('loginForm.title', {}, { scope: 'auth' });
  const formDict = translateObjectSignal('loginForm.form', {}, { scope: 'auth' });
  const actionsDict = translateObjectSignal('loginForm.actions', {}, { scope: 'auth' });
  const errorsDict = translateObjectSignal('loginForm.errors', {}, { scope: 'auth' });

  const commonErrorsDict = translateObjectSignal('errors', {}, { scope: 'common' });
  const commonFormDict = translateObjectSignal('form', {}, { scope: 'common' });

  const commonErrors = computed(
    () => commonErrorsDict() as CommonErrorsTranslations,
  );
  const commonForm = computed(
    () => commonFormDict() as CommonFormTranslations,
  );

  const title = pickTranslations(titleDict, ['main'] as const);
  const form = pickTranslations(formDict, ['emailLabel', 'passwordLabel'] as const);
  const actions = pickTranslations(actionsDict, ['submitLabel'] as const);
  const errors = pickTranslations(errorsDict, ['invalidCredentials'] as const);

  return {
    title,
    form,
    actions,
    errors,
    commonErrors,
    commonForm,
  };
}