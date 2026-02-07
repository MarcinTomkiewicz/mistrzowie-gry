import { Routes } from '@angular/router';

/**
 * Lazy loader dla Home (SSR-safe).
 *
 * Uwaga: zakładamy strukturę:
 * src/app/public/home/home.ts  -> export class Home
 *
 * Jeśli u Ciebie jest inaczej, trzeba skorygować ścieżkę lub nazwę eksportu.
 */
const loadHome = () => import('./public/components/home/home').then((m) => m.Home);

/**
 * Routing publiczny bazujący na MENU_CONFIG.
 *
 * Na ten moment wszystkie ścieżki (z menu) prowadzą do Home,
 * bo inne komponenty stron jeszcze nie istnieją.
 *
 * Dzięki temu:
 * - menu działa od razu,
 * - URL-e są docelowe (SEO-friendly),
 * - podmiana na prawdziwe strony później jest minimalna (wymieniasz tylko loadComponent).
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Mistrzowie Gry',
    loadComponent: loadHome,
  },

  {
    path: 'about',
    title: 'O nas • Mistrzowie Gry',
    loadComponent: loadHome,
  },

  {
    path: 'offer',
    children: [
      {
        path: 'individual',
        title: 'Oferta indywidualna • Mistrzowie Gry',
        loadComponent: loadHome,
      },
      {
        path: 'business',
        title: 'Oferta dla firm • Mistrzowie Gry',
        loadComponent: loadHome,
      },
      {
        path: 'institutions',
        title: 'Oferta dla instytucji • Mistrzowie Gry',
        loadComponent: loadHome,
      },
      {
        path: 'events',
        title: 'Oferta imprezowa • Mistrzowie Gry',
        loadComponent: loadHome,
      },
      // opcjonalnie: wejście /offer bez childa (na przyszłość)
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
    loadComponent: loadHome,
  },

  {
    path: 'join',
    title: 'Dołącz do Drużyny • Mistrzowie Gry',
    loadComponent: loadHome,
  },

  {
    path: 'contact',
    title: 'Kontakt • Mistrzowie Gry',
    loadComponent: loadHome,
  },

  /**
   * Fallback:
   * - na publicznym MVP bez osobnego 404 lepiej nie serwować "pustej" strony
   * - później można podmienić na dedykowane NotFoundPage (lazy)
   */
  {
    path: '**',
    redirectTo: '',
  },
];

/**
 * Back-compat alias:
 * jeśli gdzieś w app.config.ts importujesz np. APP_ROUTES,
 * to nie rozwalisz sobie importów.
 */
export const APP_ROUTES = routes;
