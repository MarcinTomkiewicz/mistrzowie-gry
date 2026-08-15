import {
  createCommonActionsI18n,
  createCommonErrorsI18n,
  createCommonLabelsI18n,
  createCommonNavI18n,
  createCommonStatusI18n,
  createCommonValuesI18n,
} from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import {
  DetailsCopy,
  SelectorsCopy,
  TitleDescriptionCopy,
  TitleSubtitleCopy,
} from '../../../core/types/i18n/event-signup';

export function createEventSignupI18n() {
  const {
    seo,
    page,
    selectors,
    details,
    occurrences,
    emptyCatalog,
    emptyOccurrences,
    error,
  } =
    createScopedSectionsI18n<{
      seo: Omit<TitleDescriptionCopy, 'title'>;
      page: Omit<TitleSubtitleCopy, 'title'>;
      selectors: SelectorsCopy;
      details: DetailsCopy;
      occurrences: TitleSubtitleCopy;
      emptyCatalog: TitleDescriptionCopy;
      emptyOccurrences: TitleDescriptionCopy;
      error: Omit<TitleDescriptionCopy, 'title'>;
    }>('eventSignup', {
      seo: 'page.seo',
      page: 'page.page',
      selectors: 'page.selectors',
      details: 'page.details',
      occurrences: 'page.occurrences',
      emptyCatalog: 'page.emptyCatalog',
      emptyOccurrences: 'page.emptyOccurrences',
      error: 'page.error',
    });
  const commonActions = createCommonActionsI18n();
  const commonErrors = createCommonErrorsI18n();
  const commonLabels = createCommonLabelsI18n();
  const commonNav = createCommonNavI18n();
  const commonStatus = createCommonStatusI18n();
  const commonValues = createCommonValuesI18n();

  return {
    seo,
    page,
    selectors,
    details,
    occurrences,
    emptyCatalog,
    emptyOccurrences,
    error,
    commonActions,
    commonErrors,
    commonLabels,
    commonNav,
    commonStatus,
    commonValues,
  };
}
