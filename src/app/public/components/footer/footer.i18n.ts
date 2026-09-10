import {
  ILegalLink,
  IResolvedLegalLink,
} from '../../../core/interfaces/i-legal';
import { IMenu, IResolvedMenu } from '../../../core/interfaces/i-menu';
import {
  IResolvedSocialLink,
  ISocialLink,
} from '../../../core/interfaces/i-socials';
import {
  CommonLegalTranslations,
  CommonNavTranslations,
  CommonSocialTranslations,
} from '../../../core/types/i18n/common';
import { FooterTranslations } from '../../../core/types/i18n/footer';
import {
  createCommonActionsI18n,
  createCommonErrorsI18n,
  createCommonLegalI18n,
  createCommonLabelsI18n,
  createCommonNavI18n,
  createCommonSocialI18n,
  createCommonStatusI18n,
} from '../../../core/translations/common.i18n';
import { createScopedObjectI18n } from '../../../core/translations/scoped.i18n';

export function createFooterI18n() {
  const footer = createScopedObjectI18n<FooterTranslations>('footer', 'footer');
  const commonActions = createCommonActionsI18n();
  const commonErrors = createCommonErrorsI18n();
  const commonLabels = createCommonLabelsI18n();
  const commonLegal = createCommonLegalI18n();
  const commonNav = createCommonNavI18n();
  const commonSocial = createCommonSocialI18n();
  const commonStatus = createCommonStatusI18n();

  const resolveNavLabel = (labelKey: string): string => {
    const key = labelKey.replace(/^nav\./, '') as keyof CommonNavTranslations;
    return commonNav()[key] ?? labelKey;
  };

  const resolveSocialLabel = (labelKey: string): string => {
    const key = labelKey.replace(
      /^social\./,
      '',
    ) as keyof CommonSocialTranslations;
    return commonSocial()[key] ?? labelKey;
  };

  const resolveLegalLabel = (labelKey: string): string => {
    const key = labelKey.replace(
      /^legal\./,
      '',
    ) as keyof CommonLegalTranslations;
    return commonLegal()[key] ?? labelKey;
  };

  const resolveFooterMenu = (items: IMenu[]): IResolvedMenu[] =>
    items.map(({ children: _children, badgeKey: _badgeKey, ...item }) => ({
      ...item,
      label: resolveNavLabel(item.labelKey),
    }));

  const resolveSocialLinks = (items: ISocialLink[]): IResolvedSocialLink[] =>
    items.map((item) => ({
      ...item,
      label: resolveSocialLabel(item.labelKey),
    }));

  const resolveLegalLinks = (items: ILegalLink[]): IResolvedLegalLink[] =>
    items.map((item) => ({
      ...item,
      label: resolveLegalLabel(item.labelKey),
    }));

  return {
    footer,
    commonActions,
    commonErrors,
    commonLabels,
    commonNav,
    commonStatus,
    resolveFooterMenu,
    resolveSocialLinks,
    resolveLegalLinks,
  };
}
