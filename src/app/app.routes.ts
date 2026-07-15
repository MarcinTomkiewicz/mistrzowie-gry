import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { minimumRoleGuard } from './core/guards/minimum-role.guard';

const loaders = {
  home: () => import('./public/components/home/home').then((m) => m.Home),
  about: () => import('./public/components/about/about').then((m) => m.About),
  ourTeam: () =>
    import('./public/components/our-team/our-team').then((m) => m.OurTeam),
  offerPage: () =>
    import('./public/components/offers/offers').then((m) => m.Offers),
  contentArticleList: () =>
    import('./public/components/content-articles/content-article-list/content-article-list').then(
      (m) => m.ContentArticleList,
    ),
  contentArticleDetail: () =>
    import('./public/components/content-articles/content-article-detail/content-article-detail').then(
      (m) => m.ContentArticleDetail,
    ),
  universalCalendarPreview: () =>
    import('./public/components/universal-calendar-preview/universal-calendar-preview').then(
      (m) => m.UniversalCalendarPreview,
    ),
  notFound: () =>
    import('./public/common/not-found/not-found').then((m) => m.NotFound),
  notAuthorized: () =>
    import('./public/common/not-authorized/not-authorized').then(
      (m) => m.NotAuthorized,
    ),
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
  sessionReservation: () =>
    import('./public/components/session-reservation/session-reservation').then(
      (m) => m.SessionReservation,
    ),
  adminContentArticleList: () =>
    import('./auth/components/admin-content-articles/article-list/article-list').then(
      (m) => m.ArticleList,
    ),
  adminContentArticleEditor: () =>
    import('./auth/components/admin-content-articles/article-editor/article-editor').then(
      (m) => m.ArticleEditor,
    ),
  adminEventCoreList: () =>
    import('./auth/components/admin-events/core-list/core-list').then(
      (m) => m.EventCoreList,
    ),
  adminEventCoreEditor: () =>
    import('./auth/components/admin-events/core-editor/core-editor').then(
      (m) => m.EventCoreEditor,
    ),
  adminEventEditionEditor: () =>
    import('./auth/components/admin-events/edition-editor/edition-editor').then(
      (m) => m.EventEditionEditor,
    ),
} as const;

export const routes: Routes = [
  { path: '', pathMatch: 'full', loadComponent: loaders.home },
  { path: 'about', loadComponent: loaders.about },
  { path: 'our-team', loadComponent: loaders.ourTeam },
  { path: 'artykuly', loadComponent: loaders.contentArticleList },
  { path: 'artykuly/:slug', loadComponent: loaders.contentArticleDetail },
  {
    path: 'preview/universal-calendar',
    loadComponent: loaders.universalCalendarPreview,
  },

  { path: 'offer/:slug', loadComponent: loaders.offerPage },

  { path: 'chaotic-thursdays', loadComponent: loaders.chaoticThursdays },
  { path: 'join-the-party', loadComponent: loaders.joinTheParty },
  {
    path: 'rezerwacja-sesji',
    loadComponent: loaders.sessionReservation,
    canActivate: [authGuard],
  },
  { path: 'contact', loadComponent: loaders.contact },
  { path: 'not-found', loadComponent: loaders.notFound },
  { path: 'not-authorized', loadComponent: loaders.notAuthorized },
  {
    path: 'admin/content',
    loadComponent: loaders.adminContentArticleList,
    canActivate: [authGuard, minimumRoleGuard('admin')],
  },
  {
    path: 'admin/content/:id/edit',
    loadComponent: loaders.adminContentArticleEditor,
    canActivate: [authGuard, minimumRoleGuard('admin')],
  },
  {
    path: 'admin/events',
    loadComponent: loaders.adminEventCoreList,
    canActivate: [authGuard, minimumRoleGuard('admin')],
  },
  {
    path: 'admin/events/new',
    loadComponent: loaders.adminEventCoreEditor,
    canActivate: [authGuard, minimumRoleGuard('admin')],
  },
  {
    path: 'admin/events/:coreId/edit',
    loadComponent: loaders.adminEventCoreEditor,
    canActivate: [authGuard, minimumRoleGuard('admin')],
  },
  {
    path: 'admin/events/:coreId/editions/new',
    loadComponent: loaders.adminEventEditionEditor,
    canActivate: [authGuard, minimumRoleGuard('admin')],
  },
  {
    path: 'admin/events/:coreId/editions/:eventId/edit',
    loadComponent: loaders.adminEventEditionEditor,
    canActivate: [authGuard, minimumRoleGuard('admin')],
  },

  {
    path: 'auth',
    loadChildren: () => import('./auth/auth-routes').then((m) => m.authRoutes),
  },

  { path: '**', loadComponent: loaders.notFound },
];
