import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./auth.component').then((m) => m.AuthComponent),
    children: [
      { path: '', redirectTo: 'sign-in', pathMatch: 'full' },
      {
        path: 'sign-in',
        loadComponent: () => import('./pages/sign-in/sign-in.component').then((m) => m.SignInComponent)
      },
      {
        path: 'sign-up',
        loadComponent: () => import('./pages/sign-up/sign-up.component').then((m) => m.SignUpComponent)
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./pages/forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent)
      },
      {
        path: 'recovery-password/:id',
        loadComponent: () =>
          import('./pages/recovery-password/recovery-password.component').then((m) => m.RecoveryPasswordComponent)
      },
      {
        path: 'two-steps/:token',
        loadComponent: () => import('./pages/two-steps/two-steps.component').then((m) => m.TwoStepsComponent)
      }
    ]
  }
];
