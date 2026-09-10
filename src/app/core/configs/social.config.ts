import { PUBLIC_SOCIAL_URLS } from '../config/site';
import { ISocialLink } from '../interfaces/i-socials';

export const SOCIAL_LINKS: ISocialLink[] = [
  {
    labelKey: 'social.facebook',
    href: PUBLIC_SOCIAL_URLS.facebook,
    icon: 'pi pi-facebook',
  },
  {
    labelKey: 'social.instagram',
    href: PUBLIC_SOCIAL_URLS.instagram,
    icon: 'pi pi-instagram',
  },
  {
    labelKey: 'social.discord',
    href: PUBLIC_SOCIAL_URLS.discord,
    icon: 'pi pi-discord',
  },
];
