import { Routes } from '@angular/router';
import { jwtGuard } from './core/jwt';
import { CompaniesComponent } from './pages/companies/companies';

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
        loadComponent: () =>
          import('./pages/companies/companies').then((m) => m.CompaniesComponent),
      },
      {
        path: 'companies/add',
        loadComponent: () =>
          import('./pages/companies/company-add/company-add').then(
            (m) => m.CompanyAddComponent,
          ),
      },
      {
        path: 'companies/:id',
        loadComponent: () =>
          import('./pages/companies/company-detail/company-detail').then(
            (m) => m.CompanyDetailComponent,
          ),
      },
      {
        path: 'companies/:id/edit',
        loadComponent: () =>
          import('./pages/companies/company-edit/company-edit').then(
            (m) => m.CompanyEditComponent,
          ),
      },
      {
        path: 'employees',
        loadComponent: () =>
          import('./pages/employees/employees').then((m) => m.EmployeesComponent),
      },
      {
        path: 'employees/:id',
        loadComponent: () =>
          import('./pages/employees/employee-detail/employee-detail').then(
            (m) => m.EmployeeDetailComponent,
          ),
      },
      {
        path: 'training',
        loadComponent: () => import('./pages/training/training').then((m) => m.TrainingComponent),
      },
      {
        path: 'absences',
        loadComponent: () => import('./pages/absences/absences').then((m) => m.AbsencesComponent),
      },
      {
        path: 'directory',
        loadComponent: () =>
          import('./pages/directory/directory').then((m) => m.DirectoryComponent),
      },
      {
        path: 'leave-calendar',
        loadComponent: () =>
          import('./pages/leave-calendar/leave-calendar').then((m) => m.LeaveCalendarComponent),
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings').then((m) => m.SettingsComponent),
      },
      {
        path: 'showcase',
        loadComponent: () => import('./showcase/showcase').then((m) => m.ShowcaseComponent),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
