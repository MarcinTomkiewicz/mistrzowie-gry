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
  onboardingDocuments: () =>
    import(
      '../components/coworker/onboarding-documents/onboarding-documents'
    ).then((m) => m.CoworkerOnboardingDocuments),
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
        loadComponent: loaders.onboardingDocuments,
      },
      {
        path: 'shared-documents',
        loadComponent: loaders.onboardingDocuments,
      },
    ],
  },
];
