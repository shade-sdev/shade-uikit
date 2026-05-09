import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () => import('./layout/app-layout').then(m => m.AppLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: 'dashboard',  loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardComponent) },
      { path: 'employees',  loadComponent: () => import('./pages/employees/employees').then(m => m.EmployeesComponent) },
      { path: 'employees/:id', loadComponent: () => import('./pages/employees/employee-detail/employee-detail').then(m => m.EmployeeDetailComponent) },
      { path: 'training',        loadComponent: () => import('./pages/training/training').then(m => m.TrainingComponent) },
      { path: 'absences',        loadComponent: () => import('./pages/absences/absences').then(m => m.AbsencesComponent) },
      { path: 'directory',       loadComponent: () => import('./pages/directory/directory').then(m => m.DirectoryComponent) },
      { path: 'leave-calendar',  loadComponent: () => import('./pages/leave-calendar/leave-calendar').then(m => m.LeaveCalendarComponent) },
      { path: 'settings',        loadComponent: () => import('./pages/settings/settings').then(m => m.SettingsComponent) },
      { path: 'showcase',        loadComponent: () => import('./showcase/showcase').then(m => m.ShowcaseComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
