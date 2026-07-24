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
  coworkerPrivateDocuments: () =>
    import(
      '../components/admin-coworker-documents/private-documents/private-documents'
    ).then((m) => m.PrivateDocuments),
  coworkerDocumentReview: () =>
    import(
      '../components/admin-coworker-documents/review-detail/review-detail'
    ).then((m) => m.ReviewDetail),
  operationalDocumentList: () =>
    import(
      '../components/admin-coworker-operational-documents/document-list/document-list'
    ).then((m) => m.DocumentList),
  operationalDocumentEditor: () =>
    import(
      '../components/admin-coworker-operational-documents/document-editor/document-editor'
    ).then((m) => m.DocumentEditor),
  operationalAssignmentList: () =>
    import(
      '../components/admin-coworker-operational-documents/assignment-list/assignment-list'
    ).then((m) => m.AssignmentList),
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
    path: 'coworkers/private-documents/:userId/review/:documentId',
    loadComponent: loaders.coworkerDocumentReview,
  },
  {
    path: 'coworkers/private-documents',
    loadComponent: loaders.coworkerPrivateDocuments,
  },
  {
    path: 'coworkers/operational-documents',
    loadComponent: loaders.operationalDocumentList,
  },
  {
    path: 'coworkers/operational-documents/new',
    loadComponent: loaders.operationalDocumentEditor,
  },
  {
    path: 'coworkers/operational-documents/:documentId/edit',
    loadComponent: loaders.operationalDocumentEditor,
  },
  {
    path: 'coworkers/operational-documents/:documentId/versions/:documentVersionId/assignments',
    loadComponent: loaders.operationalAssignmentList,
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
