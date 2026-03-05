import { Routes } from '@angular/router';

const loaders = {
  home: () => import('./public/components/home/home').then((m) => m.Home),
  about: () => import('./public/components/about/about').then((m) => m.About),
  offerPage: () => import('./public/components/offers/offers').then((m) => m.Offers),
  chaoticThursdays: () =>
    import('./public/components/chaotic-thursdays/chaotic-thursdays').then((m) => m.ChaoticThursdays),
  joinTheParty: () =>
    import('./public/components/join-the-party/join-the-party').then((m) => m.JoinTheParty),
  contact: () => import('./public/components/contact/contact').then((m) => m.Contact),
} as const;

export const routes: Routes = [
  { path: '', pathMatch: 'full', loadComponent: loaders.home },
  { path: 'about', loadComponent: loaders.about },

  { path: 'offer/:slug', loadComponent: loaders.offerPage },

  { path: 'chaotic-thursdays', loadComponent: loaders.chaoticThursdays },
  { path: 'join-the-party', loadComponent: loaders.joinTheParty },
  { path: 'contact', loadComponent: loaders.contact },

  { path: '**', redirectTo: '' },
];