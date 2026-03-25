import { translateSignal } from '@jsverse/transloco';

export function createGmProfileI18n() {
  const title = translateSignal('gmProfile.title', {}, { scope: 'auth' });

  const experienceLabel = translateSignal(
    'gmProfile.form.experienceLabel',
    {},
    { scope: 'auth' },
  );

  const imageLabel = translateSignal(
    'gmProfile.form.imageLabel',
    {},
    { scope: 'auth' },
  );

  const imageChooseLabel = translateSignal(
    'gmProfile.form.imageChooseLabel',
    {},
    { scope: 'auth' },
  );

  const imageCancelLabel = translateSignal(
    'gmProfile.form.imageCancelLabel',
    {},
    { scope: 'auth' },
  );

  const imageUploadLabel = translateSignal(
    'gmProfile.form.imageUploadLabel',
    {},
    { scope: 'auth' },
  );

  const imageDropLabel = translateSignal(
    'gmProfile.form.imageDropLabel',
    {},
    { scope: 'auth' },
  );

  const imageFormatsLabel = translateSignal(
    'gmProfile.form.imageFormatsLabel',
    {},
    { scope: 'auth' },
  );

  const imageUploadingLabel = translateSignal(
    'gmProfile.form.imageUploadingLabel',
    {},
    { scope: 'auth' },
  );

  const quoteLabel = translateSignal(
    'gmProfile.form.quoteLabel',
    {},
    { scope: 'auth' },
  );

  const stylesLabel = translateSignal(
    'gmProfile.form.stylesLabel',
    {},
    { scope: 'auth' },
  );

  const imagePreviewAlt = translateSignal(
    'gmProfile.form.imagePreviewAlt',
    {},
    { scope: 'auth' },
  );

  const quoteMaxLengthLabel = translateSignal(
    'gmProfile.form.quoteMaxLengthLabel',
    {},
    { scope: 'auth' },
  );

  const invalidStyleCount = translateSignal(
    'gmProfile.errors.invalidStyleCount',
    {},
    { scope: 'auth' },
  );

  const saveLabel = translateSignal(
    'gmProfile.actions.saveLabel',
    {},
    { scope: 'auth' },
  );

  const invalidFormSummary = translateSignal(
    'gmProfile.toast.invalidFormSummary',
    {},
    { scope: 'auth' },
  );

  const invalidFormDetail = translateSignal(
    'gmProfile.toast.invalidFormDetail',
    {},
    { scope: 'auth' },
  );

  const saveSuccessSummary = translateSignal(
    'gmProfile.toast.saveSuccessSummary',
    {},
    { scope: 'auth' },
  );

  const saveSuccessDetail = translateSignal(
    'gmProfile.toast.saveSuccessDetail',
    {},
    { scope: 'auth' },
  );

  const saveFailedSummary = translateSignal(
    'gmProfile.toast.saveFailedSummary',
    {},
    { scope: 'auth' },
  );

  const saveFailedDetail = translateSignal(
    'gmProfile.toast.saveFailedDetail',
    {},
    { scope: 'auth' },
  );

  const loadFailedSummary = translateSignal(
    'gmProfile.toast.loadFailedSummary',
    {},
    { scope: 'auth' },
  );

  const loadFailedDetail = translateSignal(
    'gmProfile.toast.loadFailedDetail',
    {},
    { scope: 'auth' },
  );

  const imageUploadSuccessSummary = translateSignal(
    'gmProfile.toast.imageUploadSuccessSummary',
    {},
    { scope: 'auth' },
  );

  const imageUploadSuccessDetail = translateSignal(
    'gmProfile.toast.imageUploadSuccessDetail',
    {},
    { scope: 'auth' },
  );

  const imageUploadFailedSummary = translateSignal(
    'gmProfile.toast.imageUploadFailedSummary',
    {},
    { scope: 'auth' },
  );

  const imageUploadFailedDetail = translateSignal(
    'gmProfile.toast.imageUploadFailedDetail',
    {},
    { scope: 'auth' },
  );

  const imageClearLabel = translateSignal(
  'gmProfile.form.imageClearLabel',
  {},
  { scope: 'auth' },
);

  return {
    title,
    experienceLabel,
    imageLabel,
    imageChooseLabel,
    imageCancelLabel,
    imageUploadLabel,
    imageDropLabel,
    imageFormatsLabel,
    imageUploadingLabel,
    quoteLabel,
    stylesLabel,
    imagePreviewAlt,
    quoteMaxLengthLabel,
    invalidStyleCount,
    saveLabel,
    invalidFormSummary,
    invalidFormDetail,
    saveSuccessSummary,
    saveSuccessDetail,
    saveFailedSummary,
    saveFailedDetail,
    loadFailedSummary,
    loadFailedDetail,
    imageUploadSuccessSummary,
    imageUploadSuccessDetail,
    imageUploadFailedSummary,
    imageUploadFailedDetail,
    imageClearLabel,
  };
}