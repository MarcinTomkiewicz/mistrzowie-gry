import { computed } from '@angular/core';
import { translateObjectSignal, translateSignal } from '@jsverse/transloco';

import {
  CommonActionsTranslations,
  CommonStatusTranslations,
} from '../../../core/types/common-i18n';

export function createGmSessionsI18n() {
  const commonActionsDict = translateObjectSignal('actions', {}, { scope: 'common' });
  const commonStatusDict = translateObjectSignal('status', {}, { scope: 'common' });

  const title = translateSignal('gmSessions.title', {}, { scope: 'auth' });
  const subtitle = translateSignal('gmSessions.subtitle', {}, { scope: 'auth' });

  const actionsAddLabel = translateSignal('gmSessions.actions.addLabel', {}, { scope: 'auth' });
  const actionsCreateLabel = translateSignal(
    'gmSessions.actions.createLabel',
    {},
    { scope: 'auth' },
  );
  const actionsUpdateLabel = translateSignal(
    'gmSessions.actions.updateLabel',
    {},
    { scope: 'auth' },
  );

  const emptyTitle = translateSignal('gmSessions.empty.title', {}, { scope: 'auth' });
  const emptyDescription = translateSignal(
    'gmSessions.empty.description',
    {},
    { scope: 'auth' },
  );

  const systemLabel = translateSignal('sessionForm.form.systemLabel', {}, { scope: 'auth' });
  const titleLabel = translateSignal('sessionForm.form.titleLabel', {}, { scope: 'auth' });
  const difficultyLabel = translateSignal(
    'sessionForm.form.difficultyLabel',
    {},
    { scope: 'auth' },
  );

  const beginnerDifficultyLabel = translateSignal(
    'sessionForm.difficulty.beginner',
    {},
    { scope: 'auth' },
  );
  const intermediateDifficultyLabel = translateSignal(
    'sessionForm.difficulty.intermediate',
    {},
    { scope: 'auth' },
  );
  const advancedDifficultyLabel = translateSignal(
    'sessionForm.difficulty.advanced',
    {},
    { scope: 'auth' },
  );

  const toastLoadFailedSummary = translateSignal(
    'gmSessions.toast.loadFailedSummary',
    {},
    { scope: 'auth' },
  );
  const toastLoadFailedDetail = translateSignal(
    'gmSessions.toast.loadFailedDetail',
    {},
    { scope: 'auth' },
  );
  const toastSaveSuccessSummary = translateSignal(
    'gmSessions.toast.saveSuccessSummary',
    {},
    { scope: 'auth' },
  );
  const toastSaveSuccessDetail = translateSignal(
    'gmSessions.toast.saveSuccessDetail',
    {},
    { scope: 'auth' },
  );
  const toastSaveFailedSummary = translateSignal(
    'gmSessions.toast.saveFailedSummary',
    {},
    { scope: 'auth' },
  );
  const toastSaveFailedDetail = translateSignal(
    'gmSessions.toast.saveFailedDetail',
    {},
    { scope: 'auth' },
  );
  const toastDeleteSuccessSummary = translateSignal(
    'gmSessions.toast.deleteSuccessSummary',
    {},
    { scope: 'auth' },
  );
  const toastDeleteSuccessDetail = translateSignal(
    'gmSessions.toast.deleteSuccessDetail',
    {},
    { scope: 'auth' },
  );
  const toastDeleteFailedSummary = translateSignal(
    'gmSessions.toast.deleteFailedSummary',
    {},
    { scope: 'auth' },
  );
  const toastDeleteFailedDetail = translateSignal(
    'gmSessions.toast.deleteFailedDetail',
    {},
    { scope: 'auth' },
  );

  const commonActions = computed(
    () => commonActionsDict() as CommonActionsTranslations,
  );

  const commonStatus = computed(
    () => commonStatusDict() as CommonStatusTranslations,
  );

  return {
    title,
    subtitle,
    actionsAddLabel,
    actionsCreateLabel,
    actionsUpdateLabel,
    emptyTitle,
    emptyDescription,
    systemLabel,
    titleLabel,
    difficultyLabel,
    beginnerDifficultyLabel,
    intermediateDifficultyLabel,
    advancedDifficultyLabel,
    toastLoadFailedSummary,
    toastLoadFailedDetail,
    toastSaveSuccessSummary,
    toastSaveSuccessDetail,
    toastSaveFailedSummary,
    toastSaveFailedDetail,
    toastDeleteSuccessSummary,
    toastDeleteSuccessDetail,
    toastDeleteFailedSummary,
    toastDeleteFailedDetail,
    commonActions,
    commonStatus,
    playersHeaderLabel: () => 'Gracze',
    minAgeHeaderLabel: () => 'Wiek',
    playersLabel: (minPlayers: number, maxPlayers: number) =>
      `${minPlayers}-${maxPlayers}`,
    minAgeLabel: (minAge: number) => `${minAge}+`,
  };
}