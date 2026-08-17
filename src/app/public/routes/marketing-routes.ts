import { inject } from '@angular/core';
import type { ResolveFn, Routes } from '@angular/router';

import { TranslocoService } from '@jsverse/transloco';

const loadHomeTranslations: ResolveFn<unknown> = () => {
  const transloco = inject(TranslocoService);

  return transloco.load(`home/${transloco.getActiveLang()}`);
};

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
  {
    path: '',
    pathMatch: 'full',
    loadComponent: loaders.home,
    resolve: { homeTranslations: loadHomeTranslations },
  },
  { path: 'about', loadComponent: loaders.about },
  { path: 'our-team', loadComponent: loaders.ourTeam },
  { path: 'offer/:slug', loadComponent: loaders.offer },
  { path: 'join-the-party', loadComponent: loaders.joinTheParty },
  { path: 'contact', loadComponent: loaders.contact },
];
