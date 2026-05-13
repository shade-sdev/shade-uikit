import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  employeesStore, Employee, STATUS_COLORS,
  Department, EmployeeStatus,
} from '../../core/mock-data';
import { Observable, delay, of } from 'rxjs';
import { ColumnDef, BulkAction } from '../../components/data/table/table';
import { BreadcrumbComponent } from '../../components/layout/breadcrumb/breadcrumb';
import { PageHeaderComponent } from '../../components/layout/page-header/page-header';
import { PageContainerComponent } from '../../components/layout/page-container/page-container';
import { GridComponent } from '../../components/layout/grid/grid';
import { StackComponent } from '../../components/layout/stack/stack';
import { TableComponent } from '../../components/data/table/table';
import { ButtonComponent } from '../../components/atoms/button/button';
import { CardComponent } from '../../components/atoms/card/card';
import { ChipComponent } from '../../components/atoms/chip/chip';
import { SelectComponent } from '../../components/forms/select/select';
import { InputComponent } from '../../components/forms/input/input';
import { AsyncSelectComponent } from '../../components/forms/async-select/async-select';
import { ModalComponent } from '../../components/feedback/modal/modal';
import { calcTenure } from '../../core/mock-data';

@Component({
  selector: 'app-employees',
  imports: [
    FormsModule,
    BreadcrumbComponent, PageHeaderComponent,
    PageContainerComponent, GridComponent, StackComponent,
    TableComponent,
    ButtonComponent, CardComponent, ChipComponent, SelectComponent, InputComponent,
    AsyncSelectComponent, ModalComponent,
  ],
  templateUrl: './employees.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeesComponent {
  private readonly router = inject(Router);

  // ── Filters (applied before passing data to table) ──────────────
  protected readonly deptFilter   = signal('');
  protected readonly statusFilter = signal('');

  // ── Add Employee modal ───────────────────────────────────────────
  protected readonly showModal    = signal(false);
  protected readonly newName      = signal('');
  protected readonly newEmail     = signal('');
  protected readonly newRole      = signal('');
  protected readonly newDept      = signal('');
  protected readonly newStatus    = signal('active');
  protected readonly newPhone     = signal('');
  protected readonly newLocation  = signal('');
  protected readonly newSalary    = signal('');
  protected readonly newManager   = signal<unknown>(null);

  /** Async employee search for the manager selector */
  protected readonly managerLoadFn = (search: string): Observable<{ value: unknown; label: string }[]> => {
    const q    = search.trim().toLowerCase();
    const opts = employeesStore()
      .filter(e => !q || e.name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q))
      .slice(0, 10)
      .map(e => ({ value: e.id, label: `${e.name} — ${e.role}` }));
    return of(opts).pipe(delay(150));
  };

  // ── Filter options ───────────────────────────────────────────────
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

  protected readonly newDeptOptions = [
    ...(['Engineering','Design','Product','Sales','HR','Finance','Operations'] as Department[])
      .map(d => ({ value: d, label: d })),
  ];

  protected readonly newStatusOptions = [
    { value: 'active',    label: 'Active' },
    { value: 'remote',    label: 'Remote' },
    { value: 'on-leave',  label: 'On Leave' },
    { value: 'terminated',label: 'Terminated' },
  ];

  // ── Headcount stats ──────────────────────────────────────────────
  protected readonly headcountStats = computed(() => {
    const e = employeesStore();
    return [
      { label: 'Total',    value: e.length,                                      color: 'text-slate-900 dark:text-white' },
      { label: 'Active',   value: e.filter(x => x.status === 'active').length,   color: 'text-emerald-600' },
      { label: 'Remote',   value: e.filter(x => x.status === 'remote').length,   color: 'text-blue-600' },
      { label: 'On Leave', value: e.filter(x => x.status === 'on-leave').length, color: 'text-amber-600' },
    ];
  });

  /**
   * CLIENT-SIDE DATA — pre-filter by dept/status dropdowns,
   * then hand the array to [data] so the table handles search/sort/paginate.
   */
  protected readonly tableData = computed(() => {
    let data = employeesStore();
    const dept   = this.deptFilter();
    const status = this.statusFilter();
    if (dept)   data = data.filter(e => e.department === dept);
    if (status) data = data.filter(e => e.status     === status);
    return data;
  });

  // ── Column definitions ───────────────────────────────────────────
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
      key: 'department', header: 'Department', sortable: true,
      cell: row => {
        const colors: Record<string, string> = {
          Engineering: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
          Design:      'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
          Product:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
          Sales:       'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
          HR:          'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
          Finance:     'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
          Operations:  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        };
        return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[row.department] ?? ''}">${row.department}</span>`;
      },
    },
    { key: 'role', header: 'Role', sortable: true, filterable: true },
    {
      key: 'status', header: 'Status', sortable: true,
      cell: row => {
        const c     = STATUS_COLORS[row.status as keyof typeof STATUS_COLORS] ?? '';
        const label = row.status.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
        return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${c}">${label}</span>`;
      },
    },
    {
      key: 'joinDate', header: 'Tenure', sortable: true,
      cell: row => `<span class="text-sm text-slate-600 dark:text-slate-400">${calcTenure(row.joinDate)}</span>`,
    },
    { key: 'location', header: 'Location', sortable: true, filterable: true },
  ];

  // ── Bulk actions ─────────────────────────────────────────────────
  protected readonly tableBulkActions: BulkAction[] = [
    { key: 'delete', label: 'Delete', icon: 'delete', variant: 'danger' },
  ];

  // ── Actions ──────────────────────────────────────────────────────
  protected viewEmployee(emp: Employee): void {
    this.router.navigate(['/employees', emp.id]);
  }

  protected onBulkAction(event: { action: BulkAction; rows: Employee[] }): void {
    if (event.action.key === 'delete') {
      const ids = new Set(event.rows.map(e => e.id));
      employeesStore.update(list => list.filter(e => !ids.has(e.id)));
    }
  }

  protected addEmployee(): void {
    if (!this.newName() || !this.newEmail() || !this.newRole() || !this.newDept()) return;
    const emp: Employee = {
      id:         'e' + Date.now(),
      name:       this.newName(),
      email:      this.newEmail(),
      role:       this.newRole(),
      department: this.newDept() as Department,
      status:     this.newStatus() as EmployeeStatus,
      joinDate:   new Date().toISOString().slice(0, 10),
      salary:     Number(this.newSalary()) || 0,
      managerId:  (this.newManager() as string) || undefined,
      phone:      this.newPhone(),
      location:   this.newLocation(),
    };
    employeesStore.update(list => [emp, ...list]);
    this.newName.set(''); this.newEmail.set(''); this.newRole.set('');
    this.newDept.set(''); this.newStatus.set('active'); this.newPhone.set('');
    this.newLocation.set(''); this.newSalary.set(''); this.newManager.set(null);
    this.showModal.set(false);
  }
}
