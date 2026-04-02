import { ILegalLink } from '../../interfaces/i-legal';
import { IMenu } from '../../interfaces/i-menu';
import { ISocialLink } from '../../interfaces/i-socials';

export type FooterTranslations = {
  brandAlt: string;
  description: string;
  socialAriaLabel: string;
  shortcutTitle: string;
  contactTitle: string;
  legalAriaLabel: string;
  copyrightSuffix: string;
  phoneLabel: string;
  phoneValue: string;
  phoneHref: string;
  emailLabel: string;
  emailValue: string;
  emailHref: string;
};

export type UIFooterMenu = IMenu & { label: string };
export type UISocialLink = ISocialLink & { label: string };
export type UILegalLink = ILegalLink & { label: string };
