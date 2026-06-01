import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, delay, map } from 'rxjs';
import {
  PagedResult, TableParams, ColumnDef,
} from '../../components/data/table/table';
import { API_BASE_URL } from '../../core/api.config';
import { PageContainerComponent } from '../../components/layout/page-container/page-container';
import { BreadcrumbComponent } from '../../components/layout/breadcrumb/breadcrumb';
import { PageHeaderComponent } from '../../components/layout/page-header/page-header';
import { TableComponent } from '../../components/data/table/table';
import { ButtonComponent } from '../../components/atoms/button/button';

interface CompanyResponse {
  id: string;
  information: {
    companyName: string;
    logo?: string;
    brn: string;
    email: string;
    contactNumber: string;
    branches?: Array<{ id: string; branchName: string }>;
  };
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  miscellaneous: {
    disclaimer?: string;
    agreeTermsOfService?: boolean;
  };
  price: {
    standardPrice: number;
  };
  auditData: {
    createdDate: string;
    createdBy: string;
    lastModifiedDate: string;
    lastModifiedBy: string;
  };
  version: number;
}

interface SearchCompaniesResponse {
  companies: CompanyResponse[];
  pageSize: number;
  pageNumber: number;
  totalElements: number;
  totalPages: number;
}

@Component({
  selector: 'app-companies',
  imports: [
    PageContainerComponent,
    BreadcrumbComponent, PageHeaderComponent,
    ButtonComponent, TableComponent,
  ],
  templateUrl: './companies.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompaniesComponent {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  protected readonly columns: ColumnDef<CompanyResponse>[] = [
    {
      key: 'companyName',
      header: 'Company Name',
      cell: (company) => {
        const name = company.information?.companyName || '—';
        const brn = company.information?.brn || '';
        const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
        return `
          <div class="flex items-center gap-3">
            <div class="size-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
              ${initials}
            </div>
            <div>
              <div class="font-medium text-slate-900 dark:text-white text-sm">${name}</div>
              <div class="text-xs text-slate-400">${brn}</div>
            </div>
          </div>`;
      },
      sortable: true,
      filterable: true,
    },
    {
      key: 'brn',
      header: 'BRN',
      cell: (company) => company.information?.brn || '—',
      sortable: true,
      filterable: true,
    },
    {
      key: 'email',
      header: 'Email',
      cell: (company) => company.information?.email || '—',
      sortable: true,
      filterable: true,
    },
    {
      key: 'contactNumber',
      header: 'Contact',
      cell: (company) => company.information?.contactNumber || '—',
      sortable: true,
      filterable: true,
    },
    {
      key: 'city',
      header: 'City',
      cell: (company) => company.address?.city || '—',
      sortable: false,
      filterable: true,
    },
    {
      key: 'standardPrice',
      header: 'Standard Price',
      cell: (company) => {
        const price = company.price?.standardPrice;
        if (price === undefined) return '—';
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(price);
      },
      sortable: false,
      filterable: true,
    },
    {
      key: 'createdDate',
      header: 'Created',
      cell: (company) => {
        const date = company.auditData?.createdDate;
        if (!date) return '—';
        return new Date(date).toLocaleDateString();
      },
      sortable: true,
      filterable: false,
    },
  ];

  protected onAddCompany(): void {
    this.router.navigate(['/companies/add']);
  }

  protected onCompanyClick(company: CompanyResponse): void {
    this.router.navigate(['/companies', company.id]);
  }

  protected readonly loadFn = (params: TableParams): Observable<PagedResult<CompanyResponse>> => {
    const queryParams = new URLSearchParams();

    queryParams.append('pageNumber', String(params.page - 1));
    queryParams.append('pageSize', String(params.pageSize));

    if (params.sort) {
      const sortFieldMap: Record<string, string> = {
        companyName: 'COMPANY_NAME',
        brn: 'BRN',
        email: 'EMAIL',
        contactNumber: 'CONTACT_NUMBER',
        createdDate: 'CREATION_DATE',
      };
      const backendSortField = sortFieldMap[params.sort.key] || 'COMPANY_NAME';
      queryParams.append('sort', backendSortField);
      queryParams.append('descendingSort', String(params.sort.dir === 'desc'));
    }

    const filterKeyMap: Record<string, string> = {
      companyName: 'companyName',
      brn: 'brn',
      email: 'email',
      contactNumber: 'contactNumber',
      city: 'city',
      state: 'state',
      standardPrice: 'standardPrice',
    };

    Object.entries(params.filters).forEach(([columnKey, filterValue]) => {
      if (filterValue && filterValue.trim()) {
        const backendKey = filterKeyMap[columnKey];
        if (backendKey) {
          queryParams.append(backendKey, filterValue);
        }
      }
    });

    if (params.search && params.search.trim()) {
      queryParams.append('companyName', params.search);
    }

    return this.http.get<SearchCompaniesResponse>(
      `${this.apiBaseUrl}/api/companies?${queryParams.toString()}`,
    ).pipe(
      delay(300),
      map((response) => ({
        data: response.companies,
        total: response.totalElements,
      })),
    );
  };
}
