import { Routes } from '@angular/router';

const loaders = {
  home: () => import('./public/components/home/home').then((m) => m.Home),
  about: () => import('./public/components/about/about').then((m) => m.About),
  ourTeam: () => import('./public/components/our-team/our-team').then((m) => m.OurTeam),
  offerPage: () => import('./public/components/offers/offers').then((m) => m.Offers),
  notFound: () =>
    import('./public/common/not-found/not-found').then((m) => m.NotFound),
  notAuthorized: () =>
    import('./public/common/not-authorized/not-authorized').then((m) => m.NotAuthorized),
  chaoticThursdays: () =>
    import('./public/components/chaotic-thursdays/chaotic-thursdays').then((m) => m.ChaoticThursdays),
  joinTheParty: () =>
    import('./public/components/join-the-party/join-the-party').then((m) => m.JoinTheParty),
  contact: () => import('./public/components/contact/contact').then((m) => m.Contact),
} as const;

export const routes: Routes = [
  { path: '', pathMatch: 'full', loadComponent: loaders.home },
  { path: 'about', loadComponent: loaders.about },
  { path: 'our-team', loadComponent: loaders.ourTeam },

  { path: 'offer/:slug', loadComponent: loaders.offerPage },

  { path: 'chaotic-thursdays', loadComponent: loaders.chaoticThursdays },
  { path: 'join-the-party', loadComponent: loaders.joinTheParty },
  { path: 'contact', loadComponent: loaders.contact },
  { path: 'not-found', loadComponent: loaders.notFound },
  { path: 'not-authorized', loadComponent: loaders.notAuthorized },

  {
    path: 'auth',
    loadChildren: () => import('./auth/auth-routes').then((m) => m.authRoutes),
  },

  { path: '**', loadComponent: loaders.notFound },
];
