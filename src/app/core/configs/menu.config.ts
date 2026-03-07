import { IMenu } from '../interfaces/i-menu';

export const MENU_CONFIG: IMenu[] = [
  {
    labelKey: 'nav.about',
    path: '/about',
    footer: true,
  },

  {
    labelKey: 'nav.offer',
    children: [
      {
        labelKey: 'nav.individualOffer',
        path: '/offer/oferta-indywidualna',
        footer: true,
      },
      {
        labelKey: 'nav.businessOffer',
        path: '/offer/oferta-biznesowa',
        footer: true,
      },
      {
        labelKey: 'nav.institutionOffer',
        path: '/offer/oferta-dla-instytucji',
        footer: true,
      },
      {
        labelKey: 'nav.eventOffer',
        path: '/offer/oferta-imprezowa',
        footer: true,
      },
    ],
  },

  {
    labelKey: 'nav.chaoticThursdays',
    path: '/chaotic-thursdays',
    footer: true,
  },
  {
    labelKey: 'nav.join',
    path: '/join-the-party',
    footer: true,
  },
  {
    labelKey: 'nav.contact',
    path: '/contact',
    footer: true,
  },
];