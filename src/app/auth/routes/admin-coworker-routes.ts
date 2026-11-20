import type { Routes } from '@angular/router';

const loaders = {
  shell: () =>
    import(
      '../components/admin-coworkers/admin-coworker-shell/admin-coworker-shell'
    ).then((m) => m.AdminCoworkerShell),
  onboardingList: () =>
    import(
      '../components/admin-coworker-onboarding/onboarding-list/onboarding-list'
    ).then((m) => m.OnboardingList),
  onboardingDetail: () =>
    import(
      '../components/admin-coworker-onboarding/onboarding-detail/coworker-onboarding-detail'
    ).then((m) => m.CoworkerOnboardingDetail),
  sharedDocuments: () =>
    import(
      '../components/admin-coworker-onboarding/shared-documents/shared-documents'
    ).then((m) => m.SharedDocuments),
  documentCategories: () =>
    import(
      '../components/admin-coworker-onboarding/document-categories/document-categories'
    ).then((m) => m.DocumentCategories),
} as const;

export const adminCoworkerRoutes: Routes = [
  {
    path: '',
    loadComponent: loaders.shell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'onboarding' },
      {
        path: 'onboarding/:onboarding_id',
        loadComponent: loaders.onboardingDetail,
      },
      {
        path: 'onboarding',
        loadComponent: loaders.onboardingList,
      },
      {
        path: 'shared-documents',
        loadComponent: loaders.sharedDocuments,
      },
      {
        path: 'document-categories',
        loadComponent: loaders.documentCategories,
      },
    ],
  },
];
