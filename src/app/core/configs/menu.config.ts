import { IMenu } from '../interfaces/i-menu';

export const MENU_CONFIG: IMenu[] = [
  { label: 'O nas', path: '/about', footer: true },

  {
    label: 'Oferta',
    children: [
      { label: 'Oferta indywidualna', path: '/offer/individual', footer: true },
      { label: 'Oferta dla firm', path: '/offer/business', footer: true },
      { label: 'Oferta dla instytucji', path: '/offer/institutions', footer: true },
      { label: 'Oferta imprezowa', path: '/offer/events', footer: true },
    ],
  },

  { label: 'Chaotyczne Czwartki', path: '/chaotic-thursdays', footer: true },
  { label: 'Dołącz do Drużyny', path: '/join-the-party', footer: true },
  { label: 'Kontakt', path: '/contact', footer: true },
];
