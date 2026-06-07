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

interface ClientResponse {
  id: string;
  companyId: string;
  coachId?: string;
  coachName?: string;
  information: {
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    gender?: string;
  };
  contact: {
    email: string;
    phoneNumber: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
  };
  plan: {
    membershipPlan: string;
    additionalFees?: number;
    startDate?: string;
  };
  medicalConditions?: string;
  agreeTermsOfService: boolean;
  auditData: {
    createdDate: string;
    createdBy: string;
    lastModifiedDate: string;
    lastModifiedBy: string;
  };
  version: number;
}

interface SearchClientsResponse {
  clients: ClientResponse[];
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
  selector: 'app-clients',
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
  templateUrl: './clients.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientsComponent {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly jwt = inject(JwtService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly P = APP_PERMISSIONS;

  protected readonly isAdmin = computed(() =>
    this.jwt.roles().includes('CLIENT_OTHER_MANAGEMENT'),
  );
  protected readonly companyId = signal<string>('');
  protected readonly companySelectorControl = new FormControl<string | null>(null);

  constructor() {
    // For regular company users, auto-resolve companyId from JWT claim
    if (!this.isAdmin()) {
      this.companyId.set(this.jwt.getClaim<string>('businessId') || '');
    }

    // For admin users, watch the company selector dropdown for changes
    this.companySelectorControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (value) this.companyId.set(value);
      });
  }

  /** Searches companies by name — used by admin company selector */
  protected readonly companyLoadFn: AsyncLoadFn = (search: string): Observable<SelectOption[]> => {
    const params = new URLSearchParams({ pageNumber: '0', pageSize: '10' });
    if (search.trim()) params.set('companyName', search);
    return this.http
      .get<CompanySearchResponse>(`${this.apiBaseUrl}/api/companies?${params}`)
      .pipe(map((r) => r.companies.map((c) => ({ label: c.information.companyName, value: c.id }))));
  };

  protected readonly columns: ColumnDef<ClientResponse>[] = [
    {
      key: 'name',
      header: 'Client',
      cell: (client) => {
        const first = client.information?.firstName || '';
        const last = client.information?.lastName || '';
        const name = `${first} ${last}`.trim() || '—';
        const initials = [first[0], last[0]].filter(Boolean).join('').toUpperCase() || '?';
        return `
          <div class="flex items-center gap-3">
            <div class="size-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
              ${initials}
            </div>
            <div class="font-medium text-slate-900 dark:text-white text-sm">${name}</div>
          </div>`;
      },
      sortable: true,
      filterable: true,
    },
    {
      key: 'email',
      header: 'Email',
      cell: (client) => client.contact?.email || '—',
      sortable: true,
      filterable: true,
    },
    {
      key: 'phoneNumber',
      header: 'Phone',
      cell: (client) => client.contact?.phoneNumber || '—',
      sortable: false,
      filterable: true,
    },
    {
      key: 'membershipPlan',
      header: 'Plan',
      cell: (client) => {
        const plan = client.plan?.membershipPlan;
        if (!plan) return '—';
        return plan === 'PERSONAL'
          ? `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">${plan}</span>`
          : `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">${plan}</span>`;
      },
      sortable: true,
      filterable: false,
    },
    {
      key: 'startDate',
      header: 'Start Date',
      cell: (client) => {
        const d = client.plan?.startDate;
        return d ? new Date(d).toLocaleDateString() : '—';
      },
      sortable: true,
      filterable: false,
    },
    {
      key: 'coachName',
      header: 'Coach',
      cell: (client) => client.coachName || '—',
      sortable: false,
      filterable: true,
    },
    {
      key: 'createdDate',
      header: 'Joined',
      cell: (client) => {
        const d = client.auditData?.createdDate;
        return d ? new Date(d).toLocaleDateString() : '—';
      },
      sortable: true,
      filterable: false,
    },
  ];

  /**
   * loadFn is a computed signal so a new function reference is produced
   * whenever companyId changes — this causes the table to reload from page 1.
   */
  protected readonly loadFn = computed(() => {
    const cid = this.companyId();
    return (params: TableParams): Observable<PagedResult<ClientResponse>> => {
      if (!cid) return of({ data: [], total: 0 });

      const queryParams = new URLSearchParams();
      queryParams.append('pageNumber', String(params.page - 1));
      queryParams.append('pageSize', String(params.pageSize));

      if (params.sort) {
        const sortMap: Record<string, string> = {
          name: 'FIRST_NAME',
          email: 'EMAIL',
          membershipPlan: 'MEMBERSHIP_PLAN',
          startDate: 'MEMBERSHIP_PLAN_START_DATE',
          createdDate: 'CREATION_DATE',
        };
        queryParams.append('sort', sortMap[params.sort.key] || 'FIRST_NAME');
        queryParams.append('descendingSort', String(params.sort.dir === 'desc'));
      }

      const filterKeyMap: Record<string, string> = {
        name: 'firstName',
        email: 'email',
        phoneNumber: 'phoneNumber',
        coachName: 'coachName',
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
        .get<SearchClientsResponse>(
          `${this.apiBaseUrl}/api/companies/${cid}/clients?${queryParams}`,
        )
        .pipe(
          delay(300),
          map((r) => ({ data: r.clients, total: r.totalElements })),
        );
    };
  });

  protected onAddClient(): void {
    this.router.navigate(['/clients/add'], { state: { companyId: this.companyId() } });
  }

  protected onClientClick(client: ClientResponse): void {
    this.router.navigate(['/clients', client.id], { state: { companyId: this.companyId() } });
  }
}
