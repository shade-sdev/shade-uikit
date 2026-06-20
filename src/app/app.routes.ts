import { Routes } from '@angular/router';
import { jwtGuard, roleGuard } from './core/jwt';
import { APP_PERMISSIONS } from './core/permissions';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () => import('./layout/app-layout').then((m) => m.AppLayoutComponent),
    canActivate: [jwtGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      {
        path: 'payments',
        canActivate: [roleGuard(...APP_PERMISSIONS.payments.view)],
        loadComponent: () =>
          import('./pages/payments/payments').then((m) => m.PaymentsComponent),
      },
      {
        path: 'coaches',
        canActivate: [roleGuard(...APP_PERMISSIONS.coaches.view)],
        loadComponent: () =>
          import('./pages/coaches/coaches').then((m) => m.CoachesComponent),
      },
      {
        path: 'coaches/add',
        canActivate: [roleGuard(...APP_PERMISSIONS.coaches.create)],
        loadComponent: () =>
          import('./pages/coaches/coach-add/coach-add').then((m) => m.CoachAddComponent),
      },
      {
        path: 'coaches/:id',
        canActivate: [roleGuard(...APP_PERMISSIONS.coaches.view)],
        loadComponent: () =>
          import('./pages/coaches/coach-detail/coach-detail').then((m) => m.CoachDetailComponent),
      },
      {
        path: 'coaches/:id/edit',
        canActivate: [roleGuard(...APP_PERMISSIONS.coaches.edit)],
        loadComponent: () =>
          import('./pages/coaches/coach-edit/coach-edit').then((m) => m.CoachEditComponent),
      },
      {
        path: 'clients',
        canActivate: [roleGuard(...APP_PERMISSIONS.clients.view)],
        loadComponent: () =>
          import('./pages/clients/clients').then((m) => m.ClientsComponent),
      },
      {
        path: 'clients/add',
        canActivate: [roleGuard(...APP_PERMISSIONS.clients.create)],
        loadComponent: () =>
          import('./pages/clients/client-add/client-add').then((m) => m.ClientAddComponent),
      },
      {
        path: 'clients/:id',
        canActivate: [roleGuard(...APP_PERMISSIONS.clients.view)],
        loadComponent: () =>
          import('./pages/clients/client-detail/client-detail').then((m) => m.ClientDetailComponent),
      },
      {
        path: 'clients/:id/edit',
        canActivate: [roleGuard(...APP_PERMISSIONS.clients.edit)],
        loadComponent: () =>
          import('./pages/clients/client-edit/client-edit').then((m) => m.ClientEditComponent),
      },
      {
        path: 'companies',
        canActivate: [roleGuard(...APP_PERMISSIONS.companies.view)],
        loadComponent: () =>
          import('./pages/companies/companies').then((m) => m.CompaniesComponent),
      },
      {
        path: 'companies/add',
        canActivate: [roleGuard(...APP_PERMISSIONS.companies.create)],
        loadComponent: () =>
          import('./pages/companies/company-add/company-add').then((m) => m.CompanyAddComponent),
      },
      {
        path: 'companies/:id',
        canActivate: [roleGuard(...APP_PERMISSIONS.companies.view)],
        loadComponent: () =>
          import('./pages/companies/company-detail/company-detail').then(
            (m) => m.CompanyDetailComponent,
          ),
      },
      {
        path: 'companies/:id/edit',
        canActivate: [roleGuard(...APP_PERMISSIONS.companies.edit)],
        loadComponent: () =>
          import('./pages/companies/company-edit/company-edit').then((m) => m.CompanyEditComponent),
      },
      {
        path: 'employees',
        canActivate: [roleGuard(...APP_PERMISSIONS.employees.view)],
        loadComponent: () =>
          import('./pages/employees/employees').then((m) => m.EmployeesComponent),
      },
      {
        path: 'employees/:id',
        canActivate: [roleGuard(...APP_PERMISSIONS.employees.view)],
        loadComponent: () =>
          import('./pages/employees/employee-detail/employee-detail').then(
            (m) => m.EmployeeDetailComponent,
          ),
      },
      {
        path: 'training',
        canActivate: [roleGuard(...APP_PERMISSIONS.training.view)],
        loadComponent: () =>
          import('./pages/training/training').then((m) => m.TrainingComponent),
      },
      {
        path: 'absences',
        canActivate: [roleGuard(...APP_PERMISSIONS.absences.view)],
        loadComponent: () =>
          import('./pages/absences/absences').then((m) => m.AbsencesComponent),
      },
      {
        path: 'directory',
        canActivate: [roleGuard(...APP_PERMISSIONS.directory.view)],
        loadComponent: () =>
          import('./pages/directory/directory').then((m) => m.DirectoryComponent),
      },
      {
        path: 'leave-calendar',
        canActivate: [roleGuard(...APP_PERMISSIONS.leaveCalendar.view)],
        loadComponent: () =>
          import('./pages/leave-calendar/leave-calendar').then((m) => m.LeaveCalendarComponent),
      },
      {
        path: 'settings',
        canActivate: [roleGuard(...APP_PERMISSIONS.settings.view)],
        loadComponent: () =>
          import('./pages/settings/settings').then((m) => m.SettingsComponent),
      },
      {
        path: 'metric-definitions',
        canActivate: [roleGuard(...APP_PERMISSIONS.clientMetricDefinitions.view)],
        loadComponent: () =>
          import('./pages/client-metric-definitions/client-metric-definitions').then(
            (m) => m.ClientMetricDefinitionsComponent,
          ),
      },
      {
        path: 'my-profile',
        canActivate: [roleGuard(...APP_PERMISSIONS.selfProfile.view)],
        loadComponent: () =>
          import('./pages/my-profile/my-profile').then((m) => m.MyProfileComponent),
      },
      {
        path: 'metric-values',
        canActivate: [roleGuard(...APP_PERMISSIONS.clientMetricValues.view)],
        loadComponent: () =>
          import('./pages/client-metric-values/client-metric-values').then(
            (m) => m.ClientMetricValuesComponent,
          ),
      },
      {
        path: 'metric-formulas',
        canActivate: [roleGuard(...APP_PERMISSIONS.metricFormulas.view)],
        loadComponent: () =>
          import('./pages/metric-formulas/metric-formulas').then(
            (m) => m.MetricFormulasComponent,
          ),
      },
      {
        path: 'showcase',
        loadComponent: () => import('./showcase/showcase').then((m) => m.ShowcaseComponent),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
