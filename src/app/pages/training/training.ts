import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, delay, of } from 'rxjs';
import {
  trainingStore, employeesStore, TrainingRecord, TRAINING_COLORS,
  getEmployeeName, Department,
} from '../../core/mock-data';
import { PagedResult, TableParams, ColumnDef } from '../../components/data/table/table';
import { BreadcrumbComponent } from '../../components/layout/breadcrumb/breadcrumb';
import { PageHeaderComponent } from '../../components/layout/page-header/page-header';
import { CardComponent } from '../../components/atoms/card/card';
import { ButtonComponent } from '../../components/atoms/button/button';
import { TableComponent } from '../../components/data/table/table';
import { SelectComponent } from '../../components/forms/select/select';
import { ModalComponent } from '../../components/feedback/modal/modal';
import { InputComponent } from '../../components/forms/input/input';
import { DatePickerComponent } from '../../components/forms/date-picker/date-picker';

@Component({
  selector: 'app-training',
  imports: [
    FormsModule,
    BreadcrumbComponent, PageHeaderComponent, CardComponent,
    ButtonComponent, TableComponent,
    SelectComponent, ModalComponent, InputComponent, DatePickerComponent,
  ],
  templateUrl: './training.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrainingComponent {

  protected readonly statusFilter   = signal('');
  protected readonly deptFilter     = signal('');
  protected readonly categoryFilter = signal('');
  protected readonly showModal      = signal(false);

  // new training form
  protected newCourse    = signal('');
  protected newEmployee  = signal('');
  protected newCategory  = signal('');
  protected newDueDate   = signal('');

  protected readonly statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'completed',    label: 'Completed' },
    { value: 'in-progress',  label: 'In Progress' },
    { value: 'not-started',  label: 'Not Started' },
    { value: 'overdue',      label: 'Overdue' },
  ];

  protected readonly categoryOptions = [
    { value: '', label: 'All Categories' },
    ...['Technical','Leadership','Compliance','Design','Sales','HR','Finance','Operations']
      .map(c => ({ value: c, label: c })),
  ];

  protected readonly deptOptions = [
    { value: '', label: 'All Departments' },
    ...(['Engineering','Design','Product','Sales','HR','Finance','Operations'] as Department[])
      .map(d => ({ value: d, label: d })),
  ];

  protected readonly employeeOptions = computed(() =>
    employeesStore().map(e => ({ value: e.id, label: e.name }))
  );

  protected readonly stats = computed(() => {
    const tr = trainingStore();
    return [
      { label: 'Total Courses',  value: tr.length,                                           icon: 'school',        bg: 'bg-blue-50 dark:bg-blue-900/20',    iconColor: 'text-blue-500' },
      { label: 'Completed',      value: tr.filter(t => t.status === 'completed').length,     icon: 'check_circle',  bg: 'bg-emerald-50 dark:bg-emerald-900/20', iconColor: 'text-emerald-500' },
      { label: 'In Progress',    value: tr.filter(t => t.status === 'in-progress').length,   icon: 'pending',       bg: 'bg-primary/5 dark:bg-primary/10',   iconColor: 'text-primary' },
      { label: 'Overdue',        value: tr.filter(t => t.status === 'overdue').length,       icon: 'warning',       bg: 'bg-rose-50 dark:bg-rose-900/20',    iconColor: 'text-rose-500' },
    ];
  });

  protected readonly columns: ColumnDef<TrainingRecord>[] = [
    {
      key: 'employeeId', header: 'Employee', sortable: true,
      cell: row => {
        const name = getEmployeeName(row.employeeId);
        const emp  = employeesStore().find(e => e.id === row.employeeId);
        return `
          <div class="flex items-center gap-2.5">
            <div class="size-7 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
              ${name.split(' ').map((n: string) => n[0]).join('').slice(0,2)}
            </div>
            <div>
              <div class="text-sm font-medium text-slate-900 dark:text-white">${name}</div>
              <div class="text-xs text-slate-400">${emp?.department ?? ''}</div>
            </div>
          </div>`;
      },
    },
    { key: 'course', header: 'Course', sortable: true },
    {
      key: 'category', header: 'Category',
      cell: r => `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">${r.category}</span>`,
    },
    {
      key: 'status', header: 'Status', sortable: true,
      cell: r => {
        const c = TRAINING_COLORS[r.status];
        const label = r.status.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
        return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${c}">${label}</span>`;
      },
    },
    {
      key: 'progress', header: 'Progress',
      cell: r => `
        <div class="flex items-center gap-2">
          <div class="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden min-w-[70px]">
            <div class="h-full rounded-full ${r.status === 'completed' ? 'bg-emerald-500' : r.status === 'overdue' ? 'bg-rose-500' : 'bg-primary'}" style="width:${r.progress}%"></div>
          </div>
          <span class="text-xs text-slate-500 w-8 shrink-0 text-right">${r.progress}%</span>
        </div>`,
    },
    { key: 'assignedDate', header: 'Assigned',  sortable: true },
    { key: 'dueDate',      header: 'Due Date',  sortable: true },
  ];

  protected readonly loadFn = (params: TableParams): Observable<PagedResult<TrainingRecord>> => {
    let data = trainingStore();

    const status   = this.statusFilter();
    const category = this.categoryFilter();
    const dept     = this.deptFilter();

    if (status)   data = data.filter(t => t.status === status);
    if (category) data = data.filter(t => t.category === category);
    if (dept) {
      const empIds = employeesStore().filter(e => e.department === dept).map(e => e.id);
      data = data.filter(t => empIds.includes(t.employeeId));
    }

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

  protected addTraining(): void {
    if (!this.newCourse() || !this.newEmployee()) return;
    const newRecord: TrainingRecord = {
      id:           't' + Date.now(),
      employeeId:   this.newEmployee(),
      course:       this.newCourse(),
      category:     this.newCategory() || 'General',
      status:       'not-started',
      progress:     0,
      assignedDate: new Date().toISOString().slice(0, 10),
      dueDate:      this.newDueDate() || new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
    };
    trainingStore.update(tr => [...tr, newRecord]);
    this.newCourse.set(''); this.newEmployee.set('');
    this.newCategory.set(''); this.newDueDate.set('');
    this.showModal.set(false);
  }
}
