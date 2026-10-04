import type { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';
import { minimumRoleGuard } from '../../core/guards/minimum-role.guard';

const loaders = {
  staffingRealizationList: () =>
    import(
      '../components/admin-staffing/staffing-realization-list/staffing-realization-list'
    ).then((m) => m.StaffingRealizationList),
  staffingRecruitmentPolicyEditor: () =>
    import(
      '../components/admin-staffing/staffing-recruitment-policy-editor/staffing-recruitment-policy-editor'
    ).then((m) => m.StaffingRecruitmentPolicyEditor),
  contentShell: () =>
    import('../components/admin-content-shell/admin-content-shell').then(
      (m) => m.AdminContentShell,
    ),
  userShell: () =>
    import('../components/admin-user-shell/admin-user-shell').then(
      (m) => m.AdminUserShell,
    ),
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
  commercialConstantList: () =>
    import(
      '../components/admin-commercial-pages/commercial-constant-list/commercial-constant-list'
    ).then((m) => m.CommercialConstantList),
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
  staffingRealizationCoreEditor: () =>
    import(
      '../components/admin-staffing/staffing-realization-core-editor/staffing-realization-core-editor'
    ).then((m) => m.StaffingRealizationCoreEditor),
  staffingRealizationShell: () =>
    import(
      '../components/admin-staffing/staffing-realization-shell/staffing-realization-shell'
    ).then((m) => m.StaffingRealizationShell),
  staffingRealizationScheduleEditor: () =>
    import(
      '../components/admin-staffing/staffing-realization-schedule-editor/staffing-realization-schedule-editor'
    ).then((m) => m.StaffingRealizationScheduleEditor),
  staffingRealizationTravelTermsEditor: () =>
    import(
      '../components/admin-staffing/staffing-realization-travel-terms-editor/staffing-realization-travel-terms-editor'
    ).then((m) => m.StaffingRealizationTravelTermsEditor),
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
    path: 'content/offers/constants',
    loadComponent: loaders.commercialConstantList,
  },
  {
    path: 'content/offers/:id/edit',
    loadComponent: loaders.commercialPageEditor,
  },
  {
    path: 'content/offers/:id/preview',
    loadComponent: loaders.commercialPagePreview,
  },
  {
    path: 'content/events/new',
    loadComponent: loaders.eventCoreEditor,
  },
  {
    path: 'content/events/:coreId/edit',
    loadComponent: loaders.eventCoreEditor,
  },
  {
    path: 'content/events/:coreId/editions/new',
    loadComponent: loaders.eventEditionEditor,
  },
  {
    path: 'content/events/:coreId/editions/:eventId/edit',
    loadComponent: loaders.eventEditionEditor,
  },
  {
    path: 'content/:id/edit',
    loadComponent: loaders.contentEditor,
  },
  {
    path: 'staffing/new',
    loadComponent: loaders.staffingRealizationCoreEditor,
  },
  {
    path: 'staffing',
    pathMatch: 'full',
    loadComponent: loaders.staffingRealizationList,
  },
  {
    path: 'staffing/:realizationId',
    loadComponent: loaders.staffingRealizationShell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'edit' },
      {
        path: 'recruitment-policy',
        loadComponent: loaders.staffingRecruitmentPolicyEditor,
      },
      {
        path: 'edit',
        loadComponent: loaders.staffingRealizationCoreEditor,
      },
      {
        path: 'schedule',
        loadComponent: loaders.staffingRealizationScheduleEditor,
      },
      {
        path: 'travel-terms',
        loadComponent: loaders.staffingRealizationTravelTermsEditor,
      },
    ],
  },
  {
    path: 'content',
    loadComponent: loaders.contentShell,
    children: [
      { path: '', pathMatch: 'full', loadComponent: loaders.contentList },
      {
        path: 'offers',
        pathMatch: 'full',
        loadComponent: loaders.commercialPageList,
      },
      {
        path: 'events',
        pathMatch: 'full',
        loadComponent: loaders.eventList,
      },
    ],
  },
  {
    path: 'coworkers',
    loadChildren: () =>
      import('./admin-coworker-routes').then((m) => m.adminCoworkerRoutes),
  },
];

export const adminRoutes: Routes = [
  {
    path: '',
    canActivate: adminGuards,
    children: adminChildren,
  },
];

export const authAdminRoutes: Routes = [
  {
    path: 'users',
    loadComponent: loaders.userShell,
    canActivate: managementGuards,
    children: [
      { path: '', pathMatch: 'full', loadComponent: loaders.users },
      { path: 'availability', loadComponent: loaders.gmAvailability },
      { path: 'work-log', loadComponent: loaders.workLog },
    ],
  },
];
