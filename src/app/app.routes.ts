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
        path: 'showcase',
        loadComponent: () => import('./showcase/showcase').then((m) => m.ShowcaseComponent),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
