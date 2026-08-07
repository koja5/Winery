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
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then((m) => m.SettingsComponent)
      },
      {
        path: 'podrum/berba/dobavljaci',
        loadComponent: () => import('./features/berba/suppliers/suppliers.component').then((m) => m.SuppliersComponent)
      },
      {
        path: 'podrum/berba/najave',
        loadComponent: () =>
          import('./features/berba/harvest-announcements/harvest-announcements.component').then(
            (m) => m.HarvestAnnouncementsComponent
          )
      },
      {
        path: 'podrum/berba/prijem',
        loadComponent: () =>
          import('./features/berba/grape-receptions/grape-receptions.component').then((m) => m.GrapeReceptionsComponent)
      },
      {
        path: 'podrum/berba/obracuni',
        loadComponent: () =>
          import('./features/berba/harvest-settlements/harvest-settlements.component').then(
            (m) => m.HarvestSettlementsComponent
          )
      },
      {
        path: 'vinograd/parcele',
        loadComponent: () => import('./features/vinograd/parcele/parcele.component').then((m) => m.ParceleComponent)
      },
      {
        path: 'vinograd/utrosak-sredstava',
        loadComponent: () =>
          import('./features/vinograd/parcel-treatments/parcel-treatments.component').then(
            (m) => m.ParcelTreatmentsComponent
          )
      },
      {
        path: 'vinograd/radni-nalozi',
        loadComponent: () =>
          import('./features/vinograd/vineyard-work-orders/vineyard-work-orders.component').then(
            (m) => m.VineyardWorkOrdersComponent
          )
      },
      {
        path: 'vinograd/analize',
        loadComponent: () =>
          import('./features/vinograd/soil-analyses/soil-analyses.component').then((m) => m.SoilAnalysesComponent)
      },
      {
        path: 'vinograd/mapa',
        loadComponent: () => import('./features/vinograd/parcel-map/parcel-map.component').then((m) => m.ParcelMapComponent)
      },
      {
        path: 'vinograd/geo-izvestaji',
        loadComponent: () => import('./features/vinograd/geo-reports/geo-reports.component').then((m) => m.GeoReportsComponent)
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
        path: 'podrum/vino/fermentacija',
        loadComponent: () =>
          import('./features/podrum/fermentations/fermentations.component').then((m) => m.FermentationsComponent)
      },
      {
        path: 'podrum/vino/nega',
        loadComponent: () =>
          import('./features/podrum/wine-agings/wine-agings.component').then((m) => m.WineAgingsComponent)
      },
      {
        path: 'podrum/vino/punjenje',
        loadComponent: () =>
          import('./features/podrum/wine-chargings/wine-chargings.component').then((m) => m.WineChargingsComponent)
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
        path: 'dokumenti',
        loadComponent: () => import('./features/documents/documents.component').then((m) => m.DocumentsComponent)
      },
      {
        path: 'saradnici/kupci',
        loadComponent: () => import('./features/saradnici/customers/customers.component').then((m) => m.CustomersComponent)
      },
      {
        path: 'saradnici/dobavljaci',
        loadComponent: () =>
          import('./features/saradnici/suppliers/suppliers.component').then((m) => m.SaradniciSuppliersComponent)
      },
      {
        path: 'saradnici/zaposleni',
        loadComponent: () => import('./features/saradnici/employees/employees.component').then((m) => m.EmployeesComponent)
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
