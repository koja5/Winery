import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./modules/auth/auth.routes').then((m) => m.authRoutes)
  },
  {
    path: '',
    loadComponent: () => import('./modules/layout/layout.component').then((m) => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports.component').then((m) => m.ReportsComponent)
      },
      {
        path: 'uskoro',
        loadComponent: () =>
          import('./shared/components/coming-soon/coming-soon.component').then((m) => m.ComingSoonComponent)
      },
      {
        path: 'podrum/posude',
        loadComponent: () => import('./features/podrum/vessels/vessels.component').then((m) => m.VesselsComponent)
      },
      {
        path: 'podrum/posude/pretoci',
        loadComponent: () =>
          import('./features/podrum/vessel-transfers/vessel-transfers.component').then(
            (m) => m.VesselTransfersComponent
          )
      },
      {
        path: 'podrum/posude/dodaci',
        loadComponent: () =>
          import('./features/podrum/enological-additions/enological-additions.component').then(
            (m) => m.EnologicalAdditionsComponent
          )
      },
      {
        path: 'podrum/vino/analize',
        loadComponent: () =>
          import('./features/podrum/wine-analyses/wine-analyses.component').then((m) => m.WineAnalysesComponent)
      },
      {
        path: 'podrum/radni-nalozi',
        loadComponent: () =>
          import('./features/podrum/work-orders/work-orders.component').then((m) => m.WorkOrdersComponent)
      },
      {
        path: 'superadmin',
        canActivate: [roleGuard('superadmin')],
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
    ]
  },
  { path: '**', redirectTo: '' }
];
