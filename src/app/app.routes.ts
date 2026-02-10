import { Routes } from '@angular/router';

const loaders = {
  home: () => import('./public/components/home/home').then((m) => m.Home),
  about: () => import('./public/components/about/about').then((m) => m.About),

  offerIndividual: () => import('./public/components/home/home').then((m) => m.Home),
  offerBusiness: () => import('./public/components/home/home').then((m) => m.Home),
  offerInstitutions: () => import('./public/components/home/home').then((m) => m.Home),
  offerEvents: () => import('./public/components/home/home').then((m) => m.Home),

  chaoticThursdays: () => import('./public/components/chaotic-thursdays/chaotic-thursdays').then((m) => m.ChaoticThursdays),
  joinTheParty: () => import('./public/components/join-the-party/join-the-party').then((m) => m.JoinTheParty),
  contact: () => import('./public/components/contact/contact').then((m) => m.Contact),
} as const;

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Mistrzowie Gry',
    loadComponent: loaders.home,
  },

  {
    path: 'about',
    title: 'O nas • Mistrzowie Gry',
    loadComponent: loaders.about,
  },

  {
    path: 'offer',
    children: [
      {
        path: 'individual',
        title: 'Oferta indywidualna • Mistrzowie Gry',
        loadComponent: loaders.offerIndividual,
      },
      {
        path: 'business',
        title: 'Oferta dla firm • Mistrzowie Gry',
        loadComponent: loaders.offerBusiness,
      },
      {
        path: 'institutions',
        title: 'Oferta dla instytucji • Mistrzowie Gry',
        loadComponent: loaders.offerInstitutions,
      },
      {
        path: 'events',
        title: 'Oferta imprezowa • Mistrzowie Gry',
        loadComponent: loaders.offerEvents,
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'individual',
      },
    ],
  },

  {
    path: 'chaotic-thursdays',
    title: 'Chaotyczne Czwartki • Mistrzowie Gry',
    loadComponent: loaders.chaoticThursdays,
  },

  {
    path: 'join-the-party',
    title: 'Dołącz do Drużyny • Mistrzowie Gry',
    loadComponent: loaders.joinTheParty,
  },

  {
    path: 'contact',
    title: 'Kontakt • Mistrzowie Gry',
    loadComponent: loaders.contact,
  },

  {
    path: '**',
    redirectTo: '',
  },
];

export const APP_ROUTES = routes;
