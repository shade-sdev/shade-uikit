import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, delay, map, of } from 'rxjs';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PagedResult, TableParams, ColumnDef, TableComponent } from '../../components/data/table/table';
import { API_BASE_URL } from '../../core/api.config';
import { JwtService, HasRoleDirective } from '../../core/jwt';
import { APP_PERMISSIONS } from '../../core/permissions';
import { AsyncLoadFn, AsyncSelectComponent } from '../../components/forms/async-select/async-select';
import { SelectOption } from '../../components/forms/select/select';
import { PageContainerComponent } from '../../components/layout/page-container/page-container';
import { BreadcrumbComponent } from '../../components/layout/breadcrumb/breadcrumb';
import { PageHeaderComponent } from '../../components/layout/page-header/page-header';
import { ButtonComponent } from '../../components/atoms/button/button';

interface CoachResponse {
  id: string;
  userId?: string;
  companyId: string;
  information: {
    firstName: string;
    lastName: string;
    picture?: string;
    location?: string;
  };
  contact: {
    email: string;
    contactNumber: string;
  };
  details: {
    coachingMode?: string;
    availability?: string;
    yearsOfExperience?: number;
    spokenLanguages?: string;
    biography?: string;
    hourlyRate?: number;
    certifications?: string;
  };
  auditData: {
    createdDate: string;
    createdBy: string;
    lastModifiedDate: string;
    lastModifiedBy: string;
  };
  version: number;
}

interface SearchCoachesResponse {
  coaches: CoachResponse[];
  pageSize: number;
  pageNumber: number;
  totalElements: number;
  totalPages: number;
}

interface CompanySearchResponse {
  companies: Array<{ id: string; information: { companyName: string } }>;
  totalElements: number;
}

@Component({
  selector: 'app-coaches',
  imports: [
    ReactiveFormsModule,
    PageContainerComponent,
    BreadcrumbComponent,
    PageHeaderComponent,
    ButtonComponent,
    TableComponent,
    AsyncSelectComponent,
    HasRoleDirective,
  ],
  templateUrl: './coaches.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoachesComponent {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly jwt = inject(JwtService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly P = APP_PERMISSIONS;

  protected readonly isAdmin = computed(() =>
    this.jwt.roles().includes('COACH_OTHER_MANAGEMENT'),
  );
  protected readonly companyId = signal<string>('');
  protected readonly companySelectorControl = new FormControl<string | null>(null);

  constructor() {
    if (!this.isAdmin()) {
      this.companyId.set(this.jwt.getClaim<string>('businessId') || '');
    }

    this.companySelectorControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (value) this.companyId.set(value);
      });
  }

  protected readonly companyLoadFn: AsyncLoadFn = (search: string): Observable<SelectOption[]> => {
    const params = new URLSearchParams({ pageNumber: '0', pageSize: '10' });
    if (search.trim()) params.set('companyName', search);
    return this.http
      .get<CompanySearchResponse>(`${this.apiBaseUrl}/api/companies?${params}`)
      .pipe(map((r) => r.companies.map((c) => ({ label: c.information.companyName, value: c.id }))));
  };

  protected readonly columns: ColumnDef<CoachResponse>[] = [
    {
      key: 'name',
      header: 'Coach',
      cell: (coach) => {
        const first = coach.information?.firstName || '';
        const last = coach.information?.lastName || '';
        const name = `${first} ${last}`.trim() || '—';
        const initials = [first[0], last[0]].filter(Boolean).join('').toUpperCase() || '?';
        const hasPic = !!coach.information?.picture;
        const avatar = hasPic
          ? `<img src="${coach.information.picture}" alt="${name}" class="size-8 rounded-full object-cover" />`
          : `<div class="size-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">${initials}</div>`;
        return `
          <div class="flex items-center gap-3">
            ${avatar}
            <div>
              <div class="font-medium text-slate-900 dark:text-white text-sm">${name}</div>
              ${coach.information?.location ? `<div class="text-xs text-slate-400">${coach.information.location}</div>` : ''}
            </div>
          </div>`;
      },
      sortable: true,
      filterable: true,
    },
    {
      key: 'email',
      header: 'Email',
      cell: (coach) => coach.contact?.email || '—',
      sortable: true,
      filterable: true,
    },
    {
      key: 'contactNumber',
      header: 'Contact',
      cell: (coach) => coach.contact?.contactNumber || '—',
      sortable: false,
      filterable: true,
    },
    {
      key: 'coachingMode',
      header: 'Mode',
      cell: (coach) => {
        const mode = coach.details?.coachingMode;
        if (!mode) return '—';
        const labels: Record<string, string> = {
          IN_PERSON: 'In Person',
          ONLINE: 'Online',
          HYBRID: 'Hybrid',
        };
        const colors: Record<string, string> = {
          IN_PERSON: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
          ONLINE: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
          HYBRID: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
        };
        const label = labels[mode] || mode;
        const color = colors[mode] || 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300';
        return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}">${label}</span>`;
      },
      sortable: true,
      filterable: false,
    },
    {
      key: 'availability',
      header: 'Availability',
      cell: (coach) => {
        const a = coach.details?.availability;
        if (!a) return '—';
        const labels: Record<string, string> = {
          WEEKDAYS: 'Weekdays',
          WEEKEND: 'Weekend',
          WEEKDAYS_WEEKEND: 'All Week',
          FLEXIBLE: 'Flexible',
        };
        return labels[a] || a;
      },
      sortable: true,
      filterable: false,
    },
    {
      key: 'hourlyRate',
      header: 'Rate / hr',
      cell: (coach) => {
        const rate = coach.details?.hourlyRate;
        if (rate === undefined || rate === null) return '—';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(rate);
      },
      sortable: true,
      filterable: false,
    },
    {
      key: 'createdDate',
      header: 'Joined',
      cell: (coach) => {
        const d = coach.auditData?.createdDate;
        return d ? new Date(d).toLocaleDateString() : '—';
      },
      sortable: true,
      filterable: false,
    },
  ];

  protected readonly loadFn = computed(() => {
    const cid = this.companyId();
    return (params: TableParams): Observable<PagedResult<CoachResponse>> => {
      if (!cid) return of({ data: [], total: 0 });

      const queryParams = new URLSearchParams();
      queryParams.append('pageNumber', String(params.page - 1));
      queryParams.append('pageSize', String(params.pageSize));

      if (params.sort) {
        const sortMap: Record<string, string> = {
          name: 'FIRST_NAME',
          email: 'EMAIL',
          contactNumber: 'CONTACT_NUMBER',
          coachingMode: 'COACHING_MODE',
          availability: 'AVAILABILITY',
          hourlyRate: 'HOURLY_RATE',
          createdDate: 'CREATION_DATE',
        };
        queryParams.append('sort', sortMap[params.sort.key] || 'FIRST_NAME');
        queryParams.append('descendingSort', String(params.sort.dir === 'desc'));
      }

      const filterKeyMap: Record<string, string> = {
        name: 'firstName',
        email: 'email',
        contactNumber: 'contactNumber',
      };
      Object.entries(params.filters).forEach(([k, v]) => {
        if (v?.trim()) {
          const bk = filterKeyMap[k];
          if (bk) queryParams.append(bk, v);
        }
      });

      if (params.search?.trim()) {
        queryParams.append('firstName', params.search);
      }

      return this.http
        .get<SearchCoachesResponse>(
          `${this.apiBaseUrl}/api/companies/${cid}/coaches?${queryParams}`,
        )
        .pipe(
          delay(300),
          map((r) => ({ data: r.coaches, total: r.totalElements })),
        );
    };
  });

  protected onAddCoach(): void {
    this.router.navigate(['/coaches/add'], { state: { companyId: this.companyId() } });
  }

  protected onCoachClick(coach: CoachResponse): void {
    this.router.navigate(['/coaches', coach.id], { state: { companyId: this.companyId() } });
  }
}
