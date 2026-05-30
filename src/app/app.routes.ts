import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'tabs', pathMatch: 'full' },

  {
    path: 'auth',
    loadComponent: () =>
      import('./pages/auth/auth.page').then((m) => m.AuthPage),
  },
  {
    path: 'tabs',
    loadComponent: () =>
      import('./tabs/tabs/tabs.page').then((m) => m.TabsPage),
    canActivate: [authGuard],
  },
];
