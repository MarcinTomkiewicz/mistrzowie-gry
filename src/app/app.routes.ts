// path: src/app/app.routes.ts
import { Routes } from '@angular/router';

const loaders = {
  home: () => import('./public/components/home/home').then((m) => m.Home),
  about: () => import('./public/components/about/about').then((m) => m.About),

  offerPage: () =>
    import('./public/components/offers/offers').then((m) => m.Offers),

  chaoticThursdays: () =>
    import('./public/components/chaotic-thursdays/chaotic-thursdays').then(
      (m) => m.ChaoticThursdays,
    ),
  joinTheParty: () =>
    import('./public/components/join-the-party/join-the-party').then(
      (m) => m.JoinTheParty,
    ),
  contact: () =>
    import('./public/components/contact/contact').then((m) => m.Contact),
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
    path: 'offer/:slug',
    title: 'Oferta • Mistrzowie Gry',
    loadComponent: loaders.offerPage,
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

  { path: '**', redirectTo: '' },
];

export const APP_ROUTES = routes;
