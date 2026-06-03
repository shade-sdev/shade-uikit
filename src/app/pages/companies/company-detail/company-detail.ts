import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { API_BASE_URL } from '../../../core/api.config';
import { ToastService } from '../../../components/feedback/toast/toast.service';
import { PageContainerComponent } from '../../../components/layout/page-container/page-container';
import { BreadcrumbComponent } from '../../../components/layout/breadcrumb/breadcrumb';
import { PageHeaderComponent } from '../../../components/layout/page-header/page-header';
import { ButtonComponent } from '../../../components/atoms/button/button';
import { HasRoleDirective } from '../../../core/jwt';
import { APP_PERMISSIONS } from '../../../core/permissions';

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

@Component({
  selector: 'app-company-detail',
  standalone: true,
  imports: [
    PageContainerComponent,
    BreadcrumbComponent,
    PageHeaderComponent,
    ButtonComponent,
    CurrencyPipe,
    DatePipe,
    HasRoleDirective,
  ],
  templateUrl: './company-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyDetailComponent {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  protected readonly P = APP_PERMISSIONS;

  private readonly companyId = this.route.snapshot.paramMap.get('id') || '';
  protected readonly company = signal<CompanyResponse | null>(null);
  protected readonly isLoading = signal(true);

  protected readonly breadcrumbs = computed(() => {
    const comp = this.company();
    return [
      { label: 'Dashboard', route: '/dashboard' },
      { label: 'Companies', route: '/companies' },
      { label: comp?.information?.companyName || 'Company' },
    ];
  });

  constructor() {
    this.loadCompany();
  }

  private loadCompany(): void {
    this.http.get<CompanyResponse>(`${this.apiBaseUrl}/api/companies/${this.companyId}`).subscribe({
      next: (data) => {
        this.company.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        // Error handling is done by HttpErrorInterceptor
      },
    });
  }

  protected onEdit(): void {
    this.router.navigate(['/companies', this.companyId, 'edit']);
  }

  protected onBack(): void {
    this.router.navigate(['/companies']);
  }

  protected getLogoSrc(logo: string | undefined): string | null {
    if (!logo) return null;

    if (logo.startsWith('data:image/')) {
      return logo;
    }

    if (logo.startsWith('base64,')) {
      return `data:image/png;${logo}`;
    }

    if (this.isBase64(logo)) {
      return `data:image/png;base64,${logo}`;
    }

    // Assume it's a URL
    return logo;
  }

  private isBase64(str: string): boolean {
    try {
      // Check if it's valid base64 format (no URL special characters)
      return /^[A-Za-z0-9+/=]+$/.test(str) && str.length % 4 === 0;
    } catch {
      return false;
    }
  }
}
