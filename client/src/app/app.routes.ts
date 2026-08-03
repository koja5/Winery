import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'podrum/posude',
    loadComponent: () => import('./features/podrum/vessels/vessels.component').then((m) => m.VesselsComponent)
  },
  {
    path: 'superadmin',
    loadComponent: () =>
      import('./features/superadmin/superadmin-shell.component').then((m) => m.SuperadminShellComponent),
    children: [
      { path: '', redirectTo: 'tenants', pathMatch: 'full' },
      {
        path: 'tenants',
        loadComponent: () =>
          import('./features/superadmin/tenants/superadmin-tenants.component').then(
            (m) => m.SuperadminTenantsComponent
          )
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/superadmin/users/superadmin-users.component').then((m) => m.SuperadminUsersComponent)
      },
      {
        path: 'tickets',
        loadComponent: () =>
          import('./features/superadmin/tickets/superadmin-tickets.component').then(
            (m) => m.SuperadminTicketsComponent
          )
      }
    ]
  }
];
