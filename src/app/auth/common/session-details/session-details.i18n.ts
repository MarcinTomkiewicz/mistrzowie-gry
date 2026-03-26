import { translateSignal } from '@jsverse/transloco';

export function createSessionDetailsI18n() {
  const descriptionLabel = translateSignal(
    'sessionForm.form.descriptionLabel',
    {},
    { scope: 'auth' },
  );

  const stylesLabel = translateSignal(
    'sessionForm.form.stylesLabel',
    {},
    { scope: 'auth' },
  );

  const triggersLabel = translateSignal(
    'sessionForm.form.triggersLabel',
    {},
    { scope: 'auth' },
  );

  return {
    descriptionLabel,
    stylesLabel,
    triggersLabel,
  };
}