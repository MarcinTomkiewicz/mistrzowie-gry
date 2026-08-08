import type { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';
import { minimumRoleGuard } from '../../core/guards/minimum-role.guard';

const loaders = {
  contentList: () =>
    import('../components/admin-content-articles/article-list/article-list').then(
      (m) => m.ArticleList,
    ),
  contentEditor: () =>
    import(
      '../components/admin-content-articles/article-editor/article-editor'
    ).then((m) => m.ArticleEditor),
  commercialPageList: () =>
    import(
      '../components/admin-commercial-pages/commercial-page-list/commercial-page-list'
    ).then((m) => m.CommercialPageList),
  commercialPageEditor: () =>
    import(
      '../components/admin-commercial-pages/commercial-page-editor/commercial-page-editor'
    ).then((m) => m.CommercialPageEditor),
  commercialPagePreview: () =>
    import(
      '../components/admin-commercial-pages/commercial-page-preview/commercial-page-preview'
    ).then((m) => m.CommercialPagePreview),
  eventList: () =>
    import('../components/admin-events/core-list/core-list').then(
      (m) => m.EventCoreList,
    ),
  eventCoreEditor: () =>
    import('../components/admin-events/core-editor/core-editor').then(
      (m) => m.EventCoreEditor,
    ),
  eventEditionEditor: () =>
    import('../components/admin-events/edition-editor/edition-editor').then(
      (m) => m.EventEditionEditor,
    ),
  gmAvailability: () =>
    import(
      '../components/gm-availability-overview/gm-availability-overview'
    ).then((m) => m.GmAvailabilityOverview),
  workLog: () =>
    import('../components/work-log-overview/work-log-overview').then(
      (m) => m.WorkLogOverview,
    ),
  users: () =>
    import('../components/admin-users/admin-users').then((m) => m.AdminUsers),
} as const;

const adminGuards = [authGuard, minimumRoleGuard('admin')];
const managementGuards = [
  authGuard,
  minimumRoleGuard('customer_manager'),
];

const adminChildren: Routes = [
  {
    path: 'content',
    loadComponent: loaders.contentList,
  },
  {
    path: 'content/:id/edit',
    loadComponent: loaders.contentEditor,
  },
  {
    path: 'offers',
    loadComponent: loaders.commercialPageList,
  },
  {
    path: 'offers/:id/edit',
    loadComponent: loaders.commercialPageEditor,
  },
  {
    path: 'offers/:id/preview',
    loadComponent: loaders.commercialPagePreview,
  },
  {
    path: 'events',
    loadComponent: loaders.eventList,
  },
  {
    path: 'events/new',
    loadComponent: loaders.eventCoreEditor,
  },
  {
    path: 'events/:coreId/edit',
    loadComponent: loaders.eventCoreEditor,
  },
  {
    path: 'events/:coreId/editions/new',
    loadComponent: loaders.eventEditionEditor,
  },
  {
    path: 'events/:coreId/editions/:eventId/edit',
    loadComponent: loaders.eventEditionEditor,
  },
  {
    path: 'coworkers',
    loadChildren: () =>
      import('./admin-coworker-routes').then((m) => m.adminCoworkerRoutes),
  },
];

export const adminRoutes: Routes = [
  {
    path: 'admin',
    canActivate: adminGuards,
    children: adminChildren,
  },
];

export const authAdminRoutes: Routes = [
  {
    path: 'gm-availability',
    loadComponent: loaders.gmAvailability,
    canActivate: managementGuards,
  },
  {
    path: 'work-log',
    loadComponent: loaders.workLog,
    canActivate: managementGuards,
  },
  {
    path: 'users',
    loadComponent: loaders.users,
    canActivate: [authGuard, minimumRoleGuard('marketing_manager')],
  },
];
