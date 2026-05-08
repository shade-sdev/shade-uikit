import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, delay, of } from 'rxjs';
import {
  employeesStore, Employee, STATUS_COLORS, DEPT_COLORS,
  calcTenure, Department,
} from '../../core/mock-data';
import { PagedResult, TableParams, ColumnDef } from '../../components/data/table/table';
import { BreadcrumbComponent } from '../../components/layout/breadcrumb/breadcrumb';
import { PageHeaderComponent } from '../../components/layout/page-header/page-header';
import { TableComponent } from '../../components/data/table/table';
import { ButtonComponent } from '../../components/atoms/button/button';
import { CardComponent } from '../../components/atoms/card/card';
import { SelectComponent } from '../../components/forms/select/select';

@Component({
  selector: 'app-employees',
  imports: [
    FormsModule,
    BreadcrumbComponent, PageHeaderComponent, TableComponent,
    ButtonComponent, CardComponent, SelectComponent,
  ],
  templateUrl: './employees.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeesComponent {
  private readonly router = inject(Router);

  protected readonly search   = signal('');
  protected readonly deptFilter = signal('');
  protected readonly statusFilter = signal('');

  protected readonly deptOptions = [
    { value: '', label: 'All Departments' },
    ...(['Engineering','Design','Product','Sales','HR','Finance','Operations'] as Department[])
      .map(d => ({ value: d, label: d })),
  ];

  protected readonly statusOptions = [
    { value: '',           label: 'All Statuses' },
    { value: 'active',     label: 'Active' },
    { value: 'remote',     label: 'Remote' },
    { value: 'on-leave',   label: 'On Leave' },
    { value: 'terminated', label: 'Terminated' },
  ];

  protected readonly headcountStats = computed(() => {
    const e = employeesStore();
    return [
      { label: 'Total',      value: e.length,                                         color: 'text-slate-900 dark:text-white' },
      { label: 'Active',     value: e.filter(x => x.status === 'active').length,      color: 'text-emerald-600' },
      { label: 'Remote',     value: e.filter(x => x.status === 'remote').length,      color: 'text-blue-600' },
      { label: 'On Leave',   value: e.filter(x => x.status === 'on-leave').length,    color: 'text-amber-600' },
    ];
  });

  protected readonly columns: ColumnDef<Employee>[] = [
    {
      key: 'name', header: 'Employee', sortable: true,
      cell: row => `
        <div class="flex items-center gap-3">
          <div class="size-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
            ${row.name.split(' ').map((n: string) => n[0]).join('').slice(0,2)}
          </div>
          <div>
            <div class="font-medium text-slate-900 dark:text-white text-sm">${row.name}</div>
            <div class="text-xs text-slate-400">${row.email}</div>
          </div>
        </div>`,
    },
    {
      key: 'department', header: 'Department', sortable: true, filterable: false,
      cell: row => {
        const colors: Record<string, string> = {
          Engineering: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
          Design: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
          Product: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
          Sales: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
          HR: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
          Finance: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
          Operations: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        };
        return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[row.department] ?? ''}">${row.department}</span>`;
      },
    },
    { key: 'role', header: 'Role', sortable: true },
    {
      key: 'status', header: 'Status', sortable: true,
      cell: row => {
        const c = STATUS_COLORS[row.status as keyof typeof STATUS_COLORS] ?? '';
        const label = row.status.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
        return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${c}">${label}</span>`;
      },
    },
    {
      key: 'joinDate', header: 'Tenure', sortable: true,
      cell: row => `<span class="text-sm text-slate-600 dark:text-slate-400">${calcTenure(row.joinDate)}</span>`,
    },
    { key: 'location', header: 'Location' },
  ];

  protected readonly loadFn = (params: TableParams): Observable<PagedResult<Employee>> => {
    let data = employeesStore();

    const search = this.search().toLowerCase();
    const dept   = this.deptFilter();
    const status = this.statusFilter();

    if (search) data = data.filter(e =>
      e.name.toLowerCase().includes(search) ||
      e.email.toLowerCase().includes(search) ||
      e.role.toLowerCase().includes(search)
    );
    if (dept)   data = data.filter(e => e.department === dept);
    if (status) data = data.filter(e => e.status === status);

    if (params.sort) {
      const { key, dir } = params.sort;
      data = [...data].sort((a, b) => {
        const av = String((a as any)[key]);
        const bv = String((b as any)[key]);
        return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }

    const total = data.length;
    const start = (params.page - 1) * params.pageSize;
    return of({ data: data.slice(start, start + params.pageSize), total }).pipe(delay(300));
  };

  protected onRowSelected(rows: Employee[]): void {}

  protected viewEmployee(emp: Employee): void {
    this.router.navigate(['/employees', emp.id]);
  }

  protected onSearch(e: Event): void {
    this.search.set((e.target as HTMLInputElement).value);
  }

  protected reload = signal(0);
  protected triggerReload(): void { this.reload.update(v => v + 1); }
}
