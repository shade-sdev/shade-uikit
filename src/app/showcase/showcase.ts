import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Observable, delay, of } from 'rxjs';

import { AppShellComponent } from '../components/layout/app-shell/app-shell';
import { BreadcrumbComponent } from '../components/layout/breadcrumb/breadcrumb';
import { PageHeaderComponent } from '../components/layout/page-header/page-header';

import { AlertComponent } from '../components/atoms/alert/alert';
import { AvatarComponent } from '../components/atoms/avatar/avatar';
import { BadgeComponent } from '../components/atoms/badge/badge';
import { ButtonComponent } from '../components/atoms/button/button';
import { CardComponent } from '../components/atoms/card/card';
import { ChipComponent } from '../components/atoms/chip/chip';
import { DividerComponent } from '../components/atoms/divider/divider';
import { EmptyStateComponent } from '../components/atoms/empty-state/empty-state';
import { ProgressComponent } from '../components/atoms/progress/progress';
import { SpinnerComponent } from '../components/atoms/spinner/spinner';

import { SkeletonComponent } from '../components/feedback/skeleton/skeleton';
import { ToastService } from '../components/feedback/toast/toast.service';
import { ToastContainerComponent } from '../components/feedback/toast/toast-container';
import { ModalComponent } from '../components/feedback/modal/modal';
import { PopoverComponent } from '../components/feedback/popover/popover';
import { LoadingOverlayComponent } from '../components/feedback/loading-overlay/loading-overlay';
import { TooltipDirective } from '../components/feedback/tooltip/tooltip.directive';

import { InputComponent } from '../components/forms/input/input';
import { TextareaComponent } from '../components/forms/textarea/textarea';
import { CheckboxComponent } from '../components/forms/checkbox/checkbox';
import { ToggleComponent } from '../components/forms/toggle/toggle';
import { RadioGroupComponent } from '../components/forms/radio-group/radio-group';
import { SelectComponent } from '../components/forms/select/select';
import { AsyncSelectComponent } from '../components/forms/async-select/async-select';
import { MultiSelectComponent } from '../components/forms/multi-select/multi-select';
import { ComboBoxComponent } from '../components/forms/combo-box/combo-box';
import { DatePickerComponent } from '../components/forms/date-picker/date-picker';
import { ButtonGroupComponent } from '../components/forms/button-group/button-group';

import { TabsComponent, TabComponent } from '../components/data/tabs/tabs';
import { AccordionComponent, AccordionItemComponent } from '../components/data/accordion/accordion';
import { TableComponent, ColumnDef, PagedResult, TableParams } from '../components/data/table/table';
import { CalendarComponent, CalendarEvent } from '../components/data/calendar/calendar';
import { MasonryComponent } from '../components/data/masonry/masonry';

import { NavGroup, UserProfile, LogoConfig } from '../components/layout/layout.types';

interface Employee {
  id: number;
  name: string;
  role: string;
  department: string;
  status: string;
  joined: string;
}

const MOCK_EMPLOYEES: Employee[] = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  name: ['Alice Martin', 'Bob Chen', 'Carol Davis', 'David Lee', 'Eva Müller', 'Frank Torres'][i % 6],
  role: ['Engineer', 'Designer', 'Manager', 'Analyst', 'DevOps', 'QA'][i % 6],
  department: ['Engineering', 'Design', 'Product', 'Data', 'Infrastructure', 'Quality'][i % 6],
  status: i % 5 === 0 ? 'inactive' : 'active',
  joined: `202${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}-01`,
}));

@Component({
  selector: 'app-showcase',
  imports: [
    ReactiveFormsModule,
    AppShellComponent, BreadcrumbComponent, PageHeaderComponent,
    AlertComponent, AvatarComponent, BadgeComponent, ButtonComponent, CardComponent,
    ChipComponent, DividerComponent, EmptyStateComponent, ProgressComponent, SpinnerComponent,
    SkeletonComponent, ToastContainerComponent, ModalComponent, PopoverComponent,
    LoadingOverlayComponent, TooltipDirective,
    InputComponent, TextareaComponent, CheckboxComponent, ToggleComponent, RadioGroupComponent,
    SelectComponent, AsyncSelectComponent, MultiSelectComponent, ComboBoxComponent,
    DatePickerComponent, ButtonGroupComponent,
    TabsComponent, TabComponent, AccordionComponent, AccordionItemComponent,
    TableComponent, CalendarComponent, MasonryComponent,
  ],
  templateUrl: './showcase.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowcaseComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly toast = inject(ToastService);

  protected readonly navGroups: NavGroup[] = [
    {
      label: 'Components',
      items: [
        { label: 'Atoms', icon: 'atom', route: '/showcase' },
        { label: 'Forms', icon: 'edit_note', route: '/showcase' },
        { label: 'Feedback', icon: 'notifications', route: '/showcase' },
        { label: 'Data', icon: 'table_chart', route: '/showcase' },
        { label: 'Layout', icon: 'dashboard', route: '/showcase' },
      ],
    },
  ];

  protected readonly logo: LogoConfig = { icon: 'palette', name: 'Shade UI', subtitle: 'Component Kit' };
  protected readonly user: UserProfile = {
    name: 'Shade Dev',
    email: 'dev@shade.io',
    role: 'Administrator',
  };

  protected readonly calendarEvents: CalendarEvent[] = [
    { date: new Date().toISOString().slice(0, 10), label: 'Today', color: 'primary' },
    { date: offsetDate(2), label: 'Meeting', color: 'success' },
    { date: offsetDate(5), label: 'Deadline', color: 'danger' },
    { date: offsetDate(8), label: 'Review', color: 'warning' },
  ];

  protected readonly tableColumns: ColumnDef<Employee>[] = [
    { key: 'name', header: 'Name', sortable: true, filterable: true },
    { key: 'role', header: 'Role', sortable: true },
    { key: 'department', header: 'Department', filterable: true },
    {
      key: 'status',
      header: 'Status',
      cell: (row) =>
        `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          row.status === 'active'
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
        }">${row.status}</span>`,
    },
    { key: 'joined', header: 'Joined', sortable: true },
  ];

  protected readonly loadEmployees = (params: TableParams): Observable<PagedResult<Employee>> => {
    let data = [...MOCK_EMPLOYEES];
    if (params.filters['name']) {
      const q = params.filters['name'].toLowerCase();
      data = data.filter((e) => e.name.toLowerCase().includes(q));
    }
    if (params.filters['department']) {
      const q = params.filters['department'].toLowerCase();
      data = data.filter((e) => e.department.toLowerCase().includes(q));
    }
    if (params.sort) {
      const { key, dir } = params.sort;
      data.sort((a, b) => {
        const av = String(a[key as keyof Employee]);
        const bv = String(b[key as keyof Employee]);
        return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    const total = data.length;
    const start = (params.page - 1) * params.pageSize;
    return of({ data: data.slice(start, start + params.pageSize), total }).pipe(delay(400));
  };

  protected readonly countryLoadFn = (q: string): Observable<{ value: string; label: string }[]> => {
    const countries = ['France', 'Germany', 'Spain', 'Italy', 'Portugal', 'Netherlands', 'Belgium', 'Austria'];
    const filtered = countries.filter((c) => c.toLowerCase().includes(q.toLowerCase())).map((c) => ({ value: c, label: c }));
    return of(filtered).pipe(delay(300));
  };

  protected readonly form = this.fb.group({
    name: [''],
    bio: [''],
    country: [null],
    asyncCountry: [null],
    multiCountry: [[]],
    combo: [''],
    date: [''],
    toggle: [false],
    checkbox: [false],
    priority: ['medium'],
    role: ['engineer'],
  });

  protected readonly staticOptions = [
    { value: 'fr', label: 'France' },
    { value: 'de', label: 'Germany' },
    { value: 'es', label: 'Spain' },
    { value: 'it', label: 'Italy' },
  ];

  protected readonly priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];

  protected readonly roleOptions = [
    { value: 'engineer', label: 'Engineer' },
    { value: 'designer', label: 'Designer' },
    { value: 'manager', label: 'Manager' },
  ];

  protected showModal = signal(false);
  protected loadingOverlay = signal(false);
  protected chipList = signal(['Angular', 'Tailwind', 'TypeScript', 'RxJS']);

  protected removeChip(label: string): void {
    this.chipList.update((chips) => chips.filter((c) => c !== label));
  }

  protected triggerLoadingOverlay(): void {
    this.loadingOverlay.set(true);
    setTimeout(() => this.loadingOverlay.set(false), 2000);
  }
}

function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
