import { IMenu } from '../../../core/interfaces/i-menu';
import { ISocialLink } from '../../../core/interfaces/i-socials';
import {
  CommonLegalTranslations,
  CommonNavTranslations,
  CommonSocialTranslations,
} from '../../../core/types/i18n/common';
import {
  FooterTranslations,
  UIFooterMenu,
  UILegalLink,
  UISocialLink,
} from '../../../core/types/i18n/footer';
import { ILegalLink } from '../../../core/interfaces/i-legal';
import {
  createCommonLegalI18n,
  createCommonNavI18n,
  createCommonSocialI18n,
} from '../../../core/translations/common.i18n';
import { createScopedObjectI18n } from '../../../core/translations/scoped.i18n';

export function createFooterI18n() {
  const footer = createScopedObjectI18n<FooterTranslations>('footer', 'footer');
  const nav = createCommonNavI18n();
  const social = createCommonSocialI18n();
  const legal = createCommonLegalI18n();

  const resolveNavLabel = (labelKey: string): string => {
    const key = labelKey.replace(/^nav\./, '') as keyof CommonNavTranslations;
    return nav()[key] ?? labelKey;
  };

  const resolveSocialLabel = (labelKey: string): string => {
    const key = labelKey.replace(
      /^social\./,
      '',
    ) as keyof CommonSocialTranslations;
    return social()[key] ?? labelKey;
  };

  const resolveLegalLabel = (labelKey: string): string => {
    const key = labelKey.replace(
      /^legal\./,
      '',
    ) as keyof CommonLegalTranslations;
    return legal()[key] ?? labelKey;
  };

  const resolveFooterMenu = (items: IMenu[]): UIFooterMenu[] =>
    items.map((item) => ({
      ...item,
      label: resolveNavLabel(item.labelKey),
    }));

  const resolveSocialLinks = (items: ISocialLink[]): UISocialLink[] =>
    items.map((item) => ({
      ...item,
      label: resolveSocialLabel(item.labelKey),
    }));

  const resolveLegalLinks = (items: ILegalLink[]): UILegalLink[] =>
    items.map((item) => ({
      ...item,
      label: resolveLegalLabel(item.labelKey),
    }));

  return {
    footer,
    resolveFooterMenu,
    resolveSocialLinks,
    resolveLegalLinks,
  };
}
