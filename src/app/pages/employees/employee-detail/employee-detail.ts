import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, delay, of } from 'rxjs';
import {
  employeesStore, trainingStore, absencesStore,
  TrainingRecord, AbsenceRequest, STATUS_COLORS,
  TRAINING_COLORS, ABSENCE_COLORS, ABSENCE_TYPE_LABELS,
  getEmployeeName, calcTenure,
} from '../../../core/mock-data';
import { PagedResult, TableParams, ColumnDef } from '../../../components/data/table/table';
import { BreadcrumbComponent } from '../../../components/layout/breadcrumb/breadcrumb';
import { CardComponent } from '../../../components/atoms/card/card';
import { ButtonComponent } from '../../../components/atoms/button/button';
import { AvatarComponent } from '../../../components/atoms/avatar/avatar';
import { ProgressComponent } from '../../../components/atoms/progress/progress';
import { TabsComponent, TabComponent } from '../../../components/data/tabs/tabs';
import { TableComponent } from '../../../components/data/table/table';

@Component({
  selector: 'app-employee-detail',
  imports: [
    TitleCasePipe, RouterLink, BreadcrumbComponent,
    CardComponent, ButtonComponent, AvatarComponent,
    ProgressComponent, TabsComponent, TabComponent, TableComponent,
  ],
  templateUrl: './employee-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeDetailComponent {
  private readonly route  = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly employee = computed(() => {
    const id = this.route.snapshot.paramMap.get('id');
    return employeesStore().find(e => e.id === id) ?? null;
  });

  protected readonly manager = computed(() => {
    const mgr = this.employee()?.managerId;
    return mgr ? employeesStore().find(e => e.id === mgr) ?? null : null;
  });

  protected readonly trainingRecords = computed(() =>
    trainingStore().filter(t => t.employeeId === this.employee()?.id)
  );

  protected readonly absenceRecords = computed(() =>
    absencesStore().filter(a => a.employeeId === this.employee()?.id)
  );

  protected readonly trainingCompletion = computed(() => {
    const tr = this.trainingRecords();
    if (!tr.length) return 0;
    return Math.round(tr.filter(t => t.status === 'completed').length / tr.length * 100);
  });

  protected readonly pendingAbsences = computed(() =>
    this.absenceRecords().filter(a => a.status === 'pending').length
  );

  protected readonly statusColors = STATUS_COLORS;
  protected readonly trainingColors = TRAINING_COLORS;
  protected readonly absenceColors = ABSENCE_COLORS;
  protected readonly absenceTypeLabels = ABSENCE_TYPE_LABELS;
  protected readonly calcTenure = calcTenure;

  protected readonly trainingColumns: ColumnDef<TrainingRecord>[] = [
    { key: 'course', header: 'Course', sortable: true },
    {
      key: 'category', header: 'Category',
      cell: r => `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">${r.category}</span>`,
    },
    {
      key: 'status', header: 'Status',
      cell: r => {
        const c = TRAINING_COLORS[r.status];
        const label = r.status.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
        return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${c}">${label}</span>`;
      },
    },
    {
      key: 'progress', header: 'Progress',
      cell: r => `
        <div class="flex items-center gap-2">
          <div class="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden min-w-[60px]">
            <div class="h-full rounded-full ${r.status === 'completed' ? 'bg-emerald-500' : r.status === 'overdue' ? 'bg-rose-500' : 'bg-primary'}" style="width:${r.progress}%"></div>
          </div>
          <span class="text-xs text-slate-500 w-8 text-right">${r.progress}%</span>
        </div>`,
    },
    { key: 'dueDate', header: 'Due Date', sortable: true },
  ];

  protected readonly absenceColumns: ColumnDef<AbsenceRequest>[] = [
    {
      key: 'type', header: 'Type',
      cell: r => `<span class="text-sm font-medium text-slate-800 dark:text-white">${ABSENCE_TYPE_LABELS[r.type]}</span>`,
    },
    { key: 'startDate', header: 'Start', sortable: true },
    { key: 'endDate',   header: 'End',   sortable: true },
    {
      key: 'days', header: 'Days',
      cell: r => `<span class="font-semibold text-slate-700 dark:text-slate-300">${r.days}</span>`,
    },
    {
      key: 'status', header: 'Status',
      cell: r => {
        const c = ABSENCE_COLORS[r.status];
        const label = r.status.charAt(0).toUpperCase() + r.status.slice(1);
        return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${c}">${label}</span>`;
      },
    },
  ];

  protected readonly loadTraining = (params: TableParams): Observable<PagedResult<TrainingRecord>> => {
    let data = this.trainingRecords();
    if (params.sort) {
      const { key, dir } = params.sort;
      data = [...data].sort((a, b) => {
        const av = String((a as any)[key]);
        const bv = String((b as any)[key]);
        return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return of({ data, total: data.length }).pipe(delay(200));
  };

  protected readonly loadAbsences = (params: TableParams): Observable<PagedResult<AbsenceRequest>> => {
    let data = this.absenceRecords();
    if (params.sort) {
      const { key, dir } = params.sort;
      data = [...data].sort((a, b) => {
        const av = String((a as any)[key]);
        const bv = String((b as any)[key]);
        return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return of({ data, total: data.length }).pipe(delay(200));
  };

  protected goBack(): void {
    this.router.navigate(['/employees']);
  }
}
