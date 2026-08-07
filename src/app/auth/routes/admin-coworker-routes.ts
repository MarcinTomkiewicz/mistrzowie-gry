import type { Routes } from '@angular/router';

const loaders = {
  shell: () =>
    import(
      '../components/admin-coworkers/admin-coworker-shell/admin-coworker-shell'
    ).then((m) => m.AdminCoworkerShell),
  onboardingList: () =>
    import(
      '../components/admin-coworker-onboarding/onboarding-list/onboarding-list'
    ).then((m) => m.CoworkerOnboardingList),
  onboardingDetail: () =>
    import(
      '../components/admin-coworker-onboarding/onboarding-detail/onboarding-detail'
    ).then((m) => m.CoworkerOnboardingDetail),
  sharedDocuments: () =>
    import(
      '../components/admin-coworker-onboarding/shared-documents/shared-documents'
    ).then((m) => m.AdminSharedDocuments),
  privateDocuments: () =>
    import(
      '../components/admin-coworker-documents/private-documents/private-documents'
    ).then((m) => m.PrivateDocuments),
  signingSources: () =>
    import(
      '../components/admin-coworker-signing-sources/signing-sources/signing-sources'
    ).then((m) => m.SigningSources),
  documentReview: () =>
    import(
      '../components/admin-coworker-documents/review-detail/review-detail'
    ).then((m) => m.ReviewDetail),
  operationalDocuments: () =>
    import(
      '../components/admin-coworker-operational-documents/document-list/document-list'
    ).then((m) => m.DocumentList),
  operationalDocumentEditor: () =>
    import(
      '../components/admin-coworker-operational-documents/document-editor/document-editor'
    ).then((m) => m.DocumentEditor),
  operationalAssignments: () =>
    import(
      '../components/admin-coworker-operational-documents/assignment-list/assignment-list'
    ).then((m) => m.AssignmentList),
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
        path: 'private-documents/:userId/review/:documentId',
        loadComponent: loaders.documentReview,
      },
      {
        path: 'private-documents',
        loadComponent: loaders.privateDocuments,
      },
      {
        path: 'signing-sources',
        loadComponent: loaders.signingSources,
      },
      {
        path: 'operational-documents/new',
        loadComponent: loaders.operationalDocumentEditor,
      },
      {
        path: 'operational-documents/:documentId/versions/:documentVersionId/assignments',
        loadComponent: loaders.operationalAssignments,
      },
      {
        path: 'operational-documents/:documentId/edit',
        loadComponent: loaders.operationalDocumentEditor,
      },
      {
        path: 'operational-documents',
        loadComponent: loaders.operationalDocuments,
      },
    ],
  },
];
