import { computed } from '@angular/core';
import { translateObjectSignal } from '@jsverse/transloco';

import { IMenu } from '../../../core/interfaces/i-menu';
import { ISocialLink } from '../../../core/interfaces/i-socials';
import {
  CommonFooterTranslations,
  CommonLegalTranslations,
  CommonNavTranslations,
  CommonSocialTranslations,
} from '../../../core/types/common-i18n';
import { ILegalLink } from '../../../core/interfaces/i-legal';
import { RichContent } from '../../../core/types/rich-content';

export type UIFooterMenu = IMenu & { label: string };
export type UISocialLink = ISocialLink & { label: string };
export type UILegalLink = ILegalLink & { label: string };

export interface LegalDialogContent {
  title: string;
  subtitle?: string;
  content: RichContent;
}

export function createFooterI18n() {
  const navDict = translateObjectSignal('nav', {}, { scope: 'common' });
  const socialDict = translateObjectSignal('social', {}, { scope: 'common' });
  const legalDict = translateObjectSignal('legal', {}, { scope: 'common' });
  const footerDict = translateObjectSignal('footer', {}, { scope: 'footer' });

  const termsDialogDict = translateObjectSignal('termsDialog', {}, { scope: 'legal' });
  const privacyPolicyDialogDict = translateObjectSignal('privacyPolicyDialog', {}, {
    scope: 'legal',
  });

  const nav = computed(() => navDict() as CommonNavTranslations);
  const social = computed(() => socialDict() as CommonSocialTranslations);
  const legal = computed(() => legalDict() as CommonLegalTranslations);
  const footer = computed(() => footerDict() as CommonFooterTranslations);

  const termsDialog = computed(
    () => termsDialogDict() as LegalDialogContent,
  );

  const privacyPolicyDialog = computed(
    () => privacyPolicyDialogDict() as LegalDialogContent,
  );

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
    termsDialog,
    privacyPolicyDialog,
    resolveFooterMenu,
    resolveSocialLinks,
    resolveLegalLinks,
  };
}