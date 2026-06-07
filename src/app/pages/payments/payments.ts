import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PagedResult, TableParams, ColumnDef, TableComponent } from '../../components/data/table/table';
import { API_BASE_URL } from '../../core/api.config';
import { JwtService } from '../../core/jwt';
import { APP_PERMISSIONS } from '../../core/permissions';
import { AsyncLoadFn, AsyncSelectComponent } from '../../components/forms/async-select/async-select';
import { SelectOption } from '../../components/forms/select/select';
import { PageContainerComponent } from '../../components/layout/page-container/page-container';
import { BreadcrumbComponent } from '../../components/layout/breadcrumb/breadcrumb';
import { PageHeaderComponent } from '../../components/layout/page-header/page-header';

// ── Response shapes ───────────────────────────────────────────────────────────

interface ClientPayment {
  id: string;
  billingMonth: string; // "YYYY-MM"
  standardPrice: number;
  additionalPrice: number;
  auditData: {
    createdDate: string;
    createdBy: string;
    lastModifiedDate: string;
    lastModifiedBy: string;
  };
  version: number;
}

interface SearchPaymentsResponse {
  payments: ClientPayment[];
  pageSize: number;
  pageNumber: number;
  totalElements: number;
  totalPages: number;
}

interface CompanySearchResponse {
  companies: Array<{ id: string; information: { companyName: string } }>;
  totalElements: number;
}

interface ClientSearchResponse {
  clients: Array<{ id: string; information: { firstName: string; lastName: string } }>;
  totalElements: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-payments',
  imports: [
    ReactiveFormsModule,
    PageContainerComponent,
    BreadcrumbComponent,
    PageHeaderComponent,
    TableComponent,
    AsyncSelectComponent,
  ],
  templateUrl: './payments.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentsComponent {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly jwt = inject(JwtService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly P = APP_PERMISSIONS;

  protected readonly isAdmin = computed(() =>
    this.jwt.roles().includes('CLIENT_OTHER_MANAGEMENT'),
  );

  /** Resolved company UUID — set from JWT for regular users, from dropdown for admin. */
  protected readonly companyId = signal<string>('');
  /** Selected client UUID — always from the client dropdown. */
  protected readonly clientId = signal<string>('');

  protected readonly companySelectorControl = new FormControl<string | null>(null);
  protected readonly clientSelectorControl  = new FormControl<string | null>(null);

  constructor() {
    if (!this.isAdmin()) {
      this.companyId.set(this.jwt.getClaim<string>('businessId') || '');
    }

    // Admin: company selection → update companyId, reset client picker
    this.companySelectorControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (value) {
          this.companyId.set(value);
        }
        // Always reset the client selector when the company changes
        this.clientId.set('');
        this.clientSelectorControl.setValue(null); // triggers writeValue → clears display label
      });

    // Client selection → update clientId
    this.clientSelectorControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.clientId.set(value ?? '');
      });
  }

  // ── Async select load functions ─────────────────────────────────────────────

  /** Loads companies by name — used by the admin company selector. */
  protected readonly companyLoadFn: AsyncLoadFn = (search: string): Observable<SelectOption[]> => {
    const params = new URLSearchParams({ pageNumber: '0', pageSize: '10' });
    if (search.trim()) params.set('companyName', search);
    return this.http
      .get<CompanySearchResponse>(`${this.apiBaseUrl}/api/companies?${params}`)
      .pipe(
        map((r) => r.companies.map((c) => ({ label: c.information.companyName, value: c.id }))),
      );
  };

  /**
   * Loads clients for the currently selected company.
   * Returns a new function reference whenever companyId changes so that
   * sk-async-select automatically searches in the right company.
   */
  protected readonly clientLoadFn = computed((): AsyncLoadFn => {
    const cid = this.companyId();
    return (search: string): Observable<SelectOption[]> => {
      if (!cid) return of([]);
      const params = new URLSearchParams({ pageNumber: '0', pageSize: '10' });
      if (search.trim()) params.set('firstName', search);
      return this.http
        .get<ClientSearchResponse>(`${this.apiBaseUrl}/api/companies/${cid}/clients?${params}`)
        .pipe(
          map((r) =>
            r.clients.map((c) => ({
              label: `${c.information.firstName} ${c.information.lastName}`.trim(),
              value: c.id,
            })),
          ),
        );
    };
  });

  // ── Table ───────────────────────────────────────────────────────────────────

  protected readonly columns: ColumnDef<ClientPayment>[] = [
    {
      key: 'billingMonth',
      header: 'Billing Month',
      cell: (p) => this.formatBillingMonth(p.billingMonth),
      sortable: true,
      filterable: false,
    },
    {
      key: 'standardPrice',
      header: 'Standard',
      cell: (p) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
          p.standardPrice,
        ),
      sortable: true,
      filterable: false,
    },
    {
      key: 'additionalPrice',
      header: 'Additional',
      cell: (p) =>
        p.additionalPrice
          ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
              p.additionalPrice,
            )
          : '—',
      sortable: true,
      filterable: false,
    },
    {
      key: 'total',
      header: 'Total',
      cell: (p) => {
        const total = (p.standardPrice || 0) + (p.additionalPrice || 0);
        return `<span class="font-semibold text-slate-900 dark:text-white">${
          new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(total)
        }</span>`;
      },
      sortable: false,
    },
    {
      key: 'paidOn',
      header: 'Paid On',
      cell: (p) => {
        const d = p.auditData?.createdDate;
        return d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
      },
      sortable: true,
      filterable: false,
    },
  ];

  protected readonly emptyMessage = computed(() => {
    if (this.isAdmin()) {
      if (!this.companyId()) return 'Select a company and client above to view payments.';
      if (!this.clientId()) return 'Select a client above to view payments.';
    } else {
      if (!this.clientId()) return 'Select a client above to view payments.';
    }
    return 'No payments found for this client.';
  });

  /**
   * Server-side load function. New reference produced whenever companyId or
   * clientId changes — the table's effect resets pagination and reloads.
   */
  protected readonly loadFn = computed(() => {
    const cid = this.companyId();
    const lid = this.clientId();

    return (params: TableParams): Observable<PagedResult<ClientPayment>> => {
      if (!cid || !lid) return of({ data: [], total: 0 });

      const queryParams = new URLSearchParams();
      queryParams.append('pageNumber', String(params.page - 1));
      queryParams.append('pageSize', String(params.pageSize));

      if (params.sort) {
        const sortMap: Record<string, string> = {
          billingMonth:    'BILLING_MONTH',
          standardPrice:   'STANDARD_PRICE',
          additionalPrice: 'ADDITIONAL_PRICE',
          paidOn:          'CREATION_DATE',
        };
        queryParams.append('sort', sortMap[params.sort.key] || 'BILLING_MONTH');
        queryParams.append('descendingSort', String(params.sort.dir === 'desc'));
      }

      return this.http
        .get<SearchPaymentsResponse>(
          `${this.apiBaseUrl}/api/companies/${cid}/clients/${lid}/payments?${queryParams}`,
        )
        .pipe(map((r) => ({ data: r.payments, total: r.totalElements })));
    };
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private formatBillingMonth(yearMonth: string): string {
    if (!yearMonth) return '—';
    const [year, month] = yearMonth.split('-');
    if (!year || !month) return yearMonth;
    return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  }
}
