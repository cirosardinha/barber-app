import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './guards/auth-guard';

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
    canActivateChild: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'schedule',
        pathMatch: 'full',
      },
      {
        path: 'schedule',
        loadComponent: () =>
          import('./pages/schedule/schedule.page').then((m) => m.SchedulePage),
      },
      {
        path: 'my-appointments',
        loadComponent: () =>
          import('./pages/my-appointments/my-appointments.page').then(
            (m) => m.MyAppointmentsPage,
          ),
      },
    ],
  },
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./pages/admin/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'admin/dashboard',
    loadComponent: () =>
      import('./pages/admin/dashboard/dashboard.page').then(
        (m) => m.DashboardPage,
      ),
    canActivate: [adminGuard],
  },
  {
    path: 'success',
    loadComponent: () =>
      import('./pages/success/success.page').then((m) => m.SuccessPage),
    canActivate: [authGuard],
  },
];
