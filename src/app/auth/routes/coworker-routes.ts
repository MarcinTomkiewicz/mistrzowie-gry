import type { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';

const loaders = {
  shell: () =>
    import('../components/coworker/coworker-shell/coworker-shell').then(
      (m) => m.CoworkerShell,
    ),
  questionnaire: () =>
    import('../components/coworker/questionnaire/questionnaire').then(
      (m) => m.Questionnaire,
    ),
  documents: () =>
    import('../components/coworker/documents/documents').then(
      (m) => m.Documents,
    ),
  operationalDocuments: () =>
    import(
      '../components/coworker/operational-documents/operational-documents'
    ).then((m) => m.OperationalDocuments),
} as const;

export const coworkerRoutes: Routes = [
  {
    path: '',
    loadComponent: loaders.shell,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'questionnaire' },
      {
        path: 'questionnaire',
        loadComponent: loaders.questionnaire,
      },
      {
        path: 'documents',
        loadComponent: loaders.documents,
      },
      {
        path: 'operational-documents',
        loadComponent: loaders.operationalDocuments,
      },
    ],
  },
];
