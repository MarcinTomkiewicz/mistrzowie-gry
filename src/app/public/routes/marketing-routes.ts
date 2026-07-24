import type { Routes } from '@angular/router';

const loaders = {
  home: () => import('../components/home/home').then((m) => m.Home),
  about: () => import('../components/about/about').then((m) => m.About),
  ourTeam: () =>
    import('../components/our-team/our-team').then((m) => m.OurTeam),
  offer: () =>
    import('../components/offers/offers').then((m) => m.Offers),
  joinTheParty: () =>
    import('../components/join-the-party/join-the-party').then(
      (m) => m.JoinTheParty,
    ),
  contact: () =>
    import('../components/contact/contact').then((m) => m.Contact),
} as const;

export const marketingRoutes: Routes = [
  { path: '', pathMatch: 'full', loadComponent: loaders.home },
  { path: 'about', loadComponent: loaders.about },
  { path: 'our-team', loadComponent: loaders.ourTeam },
  { path: 'offer/:slug', loadComponent: loaders.offer },
  { path: 'join-the-party', loadComponent: loaders.joinTheParty },
  { path: 'contact', loadComponent: loaders.contact },
];
