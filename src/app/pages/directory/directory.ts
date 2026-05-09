import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { employeesStore, Department } from '../../core/mock-data';
import { BreadcrumbComponent } from '../../components/layout/breadcrumb/breadcrumb';
import { PageHeaderComponent } from '../../components/layout/page-header/page-header';
import { CardComponent } from '../../components/atoms/card/card';
import { AvatarComponent } from '../../components/atoms/avatar/avatar';
import { BadgeComponent, BadgeVariant } from '../../components/atoms/badge/badge';
import { ChipComponent } from '../../components/atoms/chip/chip';
import { EmptyStateComponent } from '../../components/atoms/empty-state/empty-state';
import { MasonryComponent } from '../../components/data/masonry/masonry';
import { MultiSelectComponent } from '../../components/forms/multi-select/multi-select';
import { ButtonGroupComponent, ButtonGroupOption } from '../../components/forms/button-group/button-group';
import { PopoverComponent } from '../../components/feedback/popover/popover';
import { TooltipDirective } from '../../components/feedback/tooltip/tooltip.directive';

@Component({
  selector: 'app-directory',
  imports: [
    FormsModule, RouterLink,
    BreadcrumbComponent, PageHeaderComponent,
    CardComponent, AvatarComponent, BadgeComponent, ChipComponent, EmptyStateComponent,
    MasonryComponent, MultiSelectComponent, ButtonGroupComponent,
    PopoverComponent, TooltipDirective,
  ],
  templateUrl: './directory.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DirectoryComponent {
  protected readonly search      = signal('');
  protected readonly selectedDepts = signal<unknown[]>([]);
  protected readonly viewMode    = signal<unknown>('grid');

  protected readonly viewOptions: ButtonGroupOption[] = [
    { value: 'grid', label: 'Grid', icon: 'grid_view' },
    { value: 'list', label: 'List', icon: 'view_list' },
  ];

  protected readonly deptOptions = (
    ['Engineering','Design','Product','Sales','HR','Finance','Operations'] as Department[]
  ).map(d => ({ value: d, label: d }));

  protected readonly deptColors: Record<string, string> = {
    Engineering: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    Design:      'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    Product:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    Sales:       'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    HR:          'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    Finance:     'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    Operations:  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  };

  protected readonly filteredEmployees = computed(() => {
    const q     = this.search().trim().toLowerCase();
    const depts = this.selectedDepts() as string[];
    return employeesStore().filter(emp => {
      const matchesDept   = depts.length === 0 || depts.includes(emp.department);
      const matchesSearch = !q
        || emp.name.toLowerCase().includes(q)
        || emp.role.toLowerCase().includes(q)
        || emp.department.toLowerCase().includes(q)
        || emp.location.toLowerCase().includes(q);
      return matchesDept && matchesSearch;
    });
  });

  protected removeDeptFilter(dept: unknown): void {
    this.selectedDepts.update(d => (d as string[]).filter(x => x !== dept));
  }

  protected statusVariant(status: string): BadgeVariant {
    const map: Record<string, BadgeVariant> = {
      active: 'active', remote: 'info', 'on-leave': 'pending', terminated: 'failed',
    };
    return map[status] ?? 'draft';
  }

  protected statusLabel(status: string): string {
    return status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}
