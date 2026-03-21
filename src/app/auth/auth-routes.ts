import { Routes } from '@angular/router';

const loaders = {
//   login: () => import('./components/login/login').then((m) => m.Login),
  register: () => import('./components/register/register').then((m) => m.Register),
} as const;

export const authRoutes: Routes = [
//   { path: 'login', loadComponent: loaders.login },
  { path: 'secret-register', loadComponent: loaders.register },
];