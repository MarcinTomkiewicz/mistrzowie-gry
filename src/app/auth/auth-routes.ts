import { Routes } from '@angular/router';
import { authGuard } from '../core/guards/auth.guard';


const loaders = {
  // login: () => import('./components/login/login').then((m) => m.Login),
  register: () => import('./components/register/register').then((m) => m.Register),
  editProfile: () =>
    import('./components/edit-profile/edit-profile').then((m) => m.EditProfile),
} as const;

export const authRoutes: Routes = [
  // { path: 'login', loadComponent: loaders.login },
  { path: 'secret-register', loadComponent: loaders.register },
  {
    path: 'edit-profile',
    loadComponent: loaders.editProfile,
    canActivate: [authGuard],
  },
];