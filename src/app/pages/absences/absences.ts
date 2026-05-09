import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, delay, of } from 'rxjs';
import {
  absencesStore, employeesStore, AbsenceRequest,
  ABSENCE_COLORS, ABSENCE_TYPE_LABELS,
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
import { TextareaComponent } from '../../components/forms/textarea/textarea';
import { ToastService } from '../../components/feedback/toast/toast.service';
import { TooltipDirective } from '../../components/feedback/tooltip/tooltip.directive';

@Component({
  selector: 'app-absences',
  imports: [
    FormsModule,
    BreadcrumbComponent, PageHeaderComponent, CardComponent,
    ButtonComponent, TableComponent,
    SelectComponent, ModalComponent, TextareaComponent, TooltipDirective,
  ],
  templateUrl: './absences.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AbsencesComponent {
  private readonly toast = inject(ToastService);
  protected readonly getEmployeeName = getEmployeeName;

  protected readonly statusFilter = signal('');
  protected readonly typeFilter   = signal('');
  protected readonly deptFilter   = signal('');

  protected readonly showDetailModal = signal(false);
  protected readonly selectedRecord  = signal<AbsenceRequest | null>(null);
  protected readonly rejectReason    = signal('');

  protected readonly statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'pending',  label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  protected readonly typeOptions = [
    { value: '', label: 'All Types' },
    ...(['vacation','sick','personal','maternity','paternity','unpaid'] as const)
      .map(t => ({ value: t, label: ABSENCE_TYPE_LABELS[t] })),
  ];

  protected readonly deptOptions = [
    { value: '', label: 'All Departments' },
    ...(['Engineering','Design','Product','Sales','HR','Finance','Operations'] as Department[])
      .map(d => ({ value: d, label: d })),
  ];

  protected readonly stats = computed(() => {
    const ab = absencesStore();
    const pending  = ab.filter(a => a.status === 'pending').length;
    const approved = ab.filter(a => a.status === 'approved').length;
    const rejected = ab.filter(a => a.status === 'rejected').length;
    const totalDays = ab.filter(a => a.status === 'approved').reduce((s, a) => s + a.days, 0);
    return [
      { label: 'Pending Review',   value: pending,   icon: 'pending',       bg: 'bg-amber-50 dark:bg-amber-900/20',    iconColor: 'text-amber-500' },
      { label: 'Approved',         value: approved,  icon: 'check_circle',  bg: 'bg-emerald-50 dark:bg-emerald-900/20', iconColor: 'text-emerald-500' },
      { label: 'Rejected',         value: rejected,  icon: 'cancel',        bg: 'bg-rose-50 dark:bg-rose-900/20',      iconColor: 'text-rose-500' },
      { label: 'Total Days Off',   value: totalDays, icon: 'calendar_month', bg: 'bg-blue-50 dark:bg-blue-900/20',     iconColor: 'text-blue-500' },
    ];
  });

  protected readonly columns: ColumnDef<AbsenceRequest>[] = [
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
    {
      key: 'type', header: 'Type',
      cell: r => {
        const typeColors: Record<string, string> = {
          vacation:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
          sick:      'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
          personal:  'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
          maternity: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
          paternity: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
          unpaid:    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
        };
        return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[r.type] ?? ''}">${ABSENCE_TYPE_LABELS[r.type]}</span>`;
      },
    },
    { key: 'startDate', header: 'Start',    sortable: true },
    { key: 'endDate',   header: 'End',      sortable: true },
    {
      key: 'days', header: 'Days',
      cell: r => `<span class="font-semibold text-slate-700 dark:text-slate-300">${r.days}d</span>`,
    },
    {
      key: 'status', header: 'Status', sortable: true,
      cell: r => {
        const c = ABSENCE_COLORS[r.status];
        const label = r.status.charAt(0).toUpperCase() + r.status.slice(1);
        return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${c}">${label}</span>`;
      },
    },
    { key: 'submittedDate', header: 'Submitted', sortable: true },
    {
      key: 'id', header: 'Actions', width: '96px',
      cell: r => r.status === 'pending'
        ? `<div class="flex items-center gap-1.5">
            <button data-action="approve" data-id="${r.id}"
              title="Approve"
              class="inline-flex items-center justify-center size-8 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer">
              <span class="material-symbols-outlined text-[18px]">check</span>
            </button>
            <button data-action="reject" data-id="${r.id}"
              title="Reject"
              class="inline-flex items-center justify-center size-8 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/40 transition-colors cursor-pointer">
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
           </div>`
        : `<span class="text-xs text-slate-400">—</span>`,
    },
  ];

  protected readonly loadFn = (params: TableParams): Observable<PagedResult<AbsenceRequest>> => {
    let data = absencesStore();

    const status = this.statusFilter();
    const type   = this.typeFilter();
    const dept   = this.deptFilter();

    if (status) data = data.filter(a => a.status === status);
    if (type)   data = data.filter(a => a.type === type);
    if (dept) {
      const empIds = employeesStore().filter(e => e.department === dept).map(e => e.id);
      data = data.filter(a => empIds.includes(a.employeeId));
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

  protected onTableClick(event: Event): void {
    const btn = (event.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
    if (!btn) return;
    const id     = btn.dataset['id'];
    const action = btn.dataset['action'];
    if (!id || !action) return;

    if (action === 'approve') {
      this.updateStatus(id, 'approved');
      this.toast.success('Request approved');
    } else if (action === 'reject') {
      const record = absencesStore().find(a => a.id === id) ?? null;
      this.selectedRecord.set(record);
      this.rejectReason.set('');
      this.showDetailModal.set(true);
    }
  }

  protected confirmReject(): void {
    const id = this.selectedRecord()?.id;
    if (!id) return;
    this.updateStatus(id, 'rejected');
    this.showDetailModal.set(false);
    this.toast.error('Request rejected');
  }

  private updateStatus(id: string, status: 'approved' | 'rejected'): void {
    absencesStore.update(list => list.map(a => a.id === id ? { ...a, status } : a));
  }
}
