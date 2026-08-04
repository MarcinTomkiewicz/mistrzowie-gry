import type { Routes } from '@angular/router';

const loaders = {
  shell: () =>
    import(
      '../components/admin-coworkers/admin-coworker-shell/admin-coworker-shell'
    ).then((m) => m.AdminCoworkerShell),
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
      { path: '', pathMatch: 'full', redirectTo: 'private-documents' },
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
