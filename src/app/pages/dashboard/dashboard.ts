import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  employeesStore, trainingStore, absencesStore,
  DEPT_COLORS, ABSENCE_TYPE_LABELS, getEmployeeName,
  Department, calcTenure,
} from '../../core/mock-data';
import { PageHeaderComponent } from '../../components/layout/page-header/page-header';
import { PageContainerComponent } from '../../components/layout/page-container/page-container';
import { GridComponent } from '../../components/layout/grid/grid';
import { CardComponent } from '../../components/atoms/card/card';
import { ButtonComponent } from '../../components/atoms/button/button';
import { AvatarComponent } from '../../components/atoms/avatar/avatar';
import { AlertComponent } from '../../components/atoms/alert/alert';
import { ProgressComponent } from '../../components/atoms/progress/progress';
import { DividerComponent } from '../../components/atoms/divider/divider';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [
    RouterLink, PageHeaderComponent,
    PageContainerComponent, GridComponent,
    CardComponent, ButtonComponent, AvatarComponent, AlertComponent,
    ProgressComponent, DividerComponent,
  ],
  templateUrl: './dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly employees  = employeesStore;
  protected readonly training   = trainingStore;
  protected readonly absences   = absencesStore;

  protected readonly stats = computed(() => {
    const emps = this.employees();
    const total      = emps.length;
    const active     = emps.filter(e => e.status === 'active').length;
    const onLeave    = emps.filter(e => e.status === 'on-leave').length;
    const remote     = emps.filter(e => e.status === 'remote').length;
    const newThisMonth = emps.filter(e => {
      const d = new Date(e.joinDate);
      const now = new Date();
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
    return { total, active, onLeave, remote, newThisMonth };
  });

  protected readonly deptStats = computed(() => {
    const emps = this.employees();
    const depts: Department[] = ['Engineering','Design','Product','Sales','HR','Finance','Operations'];
    return depts.map(dept => ({
      dept,
      count: emps.filter(e => e.department === dept).length,
      color: DEPT_COLORS[dept],
      pct: Math.round(emps.filter(e => e.department === dept).length / emps.length * 100),
    })).sort((a, b) => b.count - a.count);
  });

  protected readonly trainingStats = computed(() => {
    const tr = this.training();
    const total = tr.length;
    return {
      completed:   Math.round(tr.filter(t => t.status === 'completed').length   / total * 100),
      inProgress:  Math.round(tr.filter(t => t.status === 'in-progress').length / total * 100),
      overdue:     tr.filter(t => t.status === 'overdue').length,
      notStarted:  tr.filter(t => t.status === 'not-started').length,
    };
  });

  protected readonly pendingAbsences = computed(() =>
    this.absences()
      .filter(a => a.status === 'pending')
      .slice(0, 5)
  );

  protected readonly recentEmployees = computed(() =>
    [...this.employees()]
      .sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime())
      .slice(0, 5)
  );

  protected readonly kpiCards = computed(() => {
    const s = this.stats();
    return [
      { label: 'Total Employees', value: s.total,       icon: 'people',       iconBg: 'bg-blue-50 dark:bg-blue-900/20',    iconColor: 'text-blue-500',    change: `+${s.newThisMonth} this month`, changeBg: 'bg-blue-50 dark:bg-blue-900/20',    changeColor: 'text-blue-600 dark:text-blue-400' },
      { label: 'Active',          value: s.active,      icon: 'check_circle', iconBg: 'bg-emerald-50 dark:bg-emerald-900/20', iconColor: 'text-emerald-500', change: `${Math.round(s.active/s.total*100)}%`, changeBg: 'bg-emerald-50 dark:bg-emerald-900/20', changeColor: 'text-emerald-600 dark:text-emerald-400' },
      { label: 'On Leave',        value: s.onLeave,     icon: 'event_busy',   iconBg: 'bg-amber-50 dark:bg-amber-900/20',  iconColor: 'text-amber-500',   change: 'Active leaves',  changeBg: 'bg-amber-50 dark:bg-amber-900/20',  changeColor: 'text-amber-600 dark:text-amber-400' },
      { label: 'Remote',          value: s.remote,      icon: 'home_work',    iconBg: 'bg-violet-50 dark:bg-violet-900/20',iconColor: 'text-violet-500',  change: 'Working remote', changeBg: 'bg-violet-50 dark:bg-violet-900/20',changeColor: 'text-violet-600 dark:text-violet-400' },
    ];
  });

  protected readonly statusColors: Record<string, string> = {
    'active':    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'remote':    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'on-leave':  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'terminated':'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  };

  protected getEmployeeName = getEmployeeName;
  protected calcTenure = calcTenure;
  protected absenceTypeLabel = ABSENCE_TYPE_LABELS;

  protected readonly activityFeed = computed(() => {
    const items = [
      ...this.absences().filter(a => a.status === 'pending').map(a => ({
        icon: 'event_busy', color: 'text-amber-500',
        text: `${getEmployeeName(a.employeeId)} requested ${ABSENCE_TYPE_LABELS[a.type].toLowerCase()}`,
        time: a.submittedDate, type: 'absence' as const, id: a.id,
      })),
      ...this.training().filter(t => t.status === 'overdue').map(t => ({
        icon: 'warning', color: 'text-rose-500',
        text: `${getEmployeeName(t.employeeId)}'s training "${t.course}" is overdue`,
        time: t.dueDate, type: 'training' as const, id: t.id,
      })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 6);
    return items;
  });

  protected navigate(path: string): void {
    this.router.navigate([path]);
  }
}
