import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { API_BASE_URL } from '../../../core/api.config';
import { JwtService, HasRoleDirective } from '../../../core/jwt';
import { APP_PERMISSIONS } from '../../../core/permissions';
import { ToastService } from '../../../components/feedback/toast/toast.service';
import { ModalComponent } from '../../../components/feedback/modal/modal';
import { SelectOption, SelectComponent } from '../../../components/forms/select/select';
import { PageContainerComponent } from '../../../components/layout/page-container/page-container';
import { BreadcrumbComponent } from '../../../components/layout/breadcrumb/breadcrumb';
import { PageHeaderComponent } from '../../../components/layout/page-header/page-header';
import { ButtonComponent } from '../../../components/atoms/button/button';
import { CardComponent } from '../../../components/atoms/card/card';
import { MasonryComponent } from '../../../components/data/masonry/masonry';
import { SpinnerComponent } from '../../../components/atoms/spinner/spinner';
import { SkeletonComponent } from '../../../components/feedback/skeleton/skeleton';

interface ClientPayment {
  id: string;
  billingMonth: string; // "YYYY-MM" year-month format
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

interface SearchClientPaymentsResponse {
  payments: ClientPayment[];
  pageSize: number;
  pageNumber: number;
  totalElements: number;
  totalPages: number;
}

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

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PageContainerComponent,
    BreadcrumbComponent,
    PageHeaderComponent,
    ButtonComponent,
    CardComponent,
    MasonryComponent,
    SpinnerComponent,
    SkeletonComponent,
    ModalComponent,
    SelectComponent,
    DatePipe,
    DecimalPipe,
    CurrencyPipe,
    HasRoleDirective,
  ],
  templateUrl: './client-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientDetailComponent {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly jwt = inject(JwtService);
  private readonly toast = inject(ToastService);

  protected readonly P = APP_PERMISSIONS;

  private readonly clientId = this.route.snapshot.paramMap.get('id') || '';
  private readonly companyId =
    (history.state?.['companyId'] as string) || this.jwt.getClaim<string>('businessId') || '';

  protected readonly client = signal<ClientResponse | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly payments = signal<ClientPayment[]>([]);
  protected readonly isLoadingPayments = signal(true);

  // ── Payment modal ────────────────────────────────────────────────────────────
  protected readonly currentYear = new Date().getFullYear();
  protected readonly isPayModalOpen = signal(false);
  protected readonly isSubmittingPayment = signal(false);
  /** Pre-selects the current month so the user can confirm without changing anything. */
  protected readonly monthControl = new FormControl<number | null>(new Date().getMonth() + 1);
  protected readonly monthOptions: SelectOption<number>[] = [
    { label: 'January',   value: 1  },
    { label: 'February',  value: 2  },
    { label: 'March',     value: 3  },
    { label: 'April',     value: 4  },
    { label: 'May',       value: 5  },
    { label: 'June',      value: 6  },
    { label: 'July',      value: 7  },
    { label: 'August',    value: 8  },
    { label: 'September', value: 9  },
    { label: 'October',   value: 10 },
    { label: 'November',  value: 11 },
    { label: 'December',  value: 12 },
  ];

  protected readonly breadcrumbs = computed(() => {
    const c = this.client();
    const name = c
      ? `${c.information.firstName} ${c.information.lastName}`.trim()
      : 'Client';
    return [
      { label: 'Dashboard', route: '/dashboard' },
      { label: 'Clients', route: '/clients' },
      { label: name },
    ];
  });

  constructor() {
    this.loadClient();
    this.loadPayments();
  }

  protected onPayClick(): void {
    this.isPayModalOpen.set(true);
  }

  protected onPayModalClosed(): void {
    this.isPayModalOpen.set(false);
    this.isSubmittingPayment.set(false);
    // Reset to current month for next time the modal is opened
    this.monthControl.setValue(new Date().getMonth() + 1);
  }

  protected onSubmitPayment(): void {
    const month = this.monthControl.value;
    if (month == null) return;

    this.isSubmittingPayment.set(true);
    const billingMonth = `${this.currentYear}-${String(month).padStart(2, '0')}`;

    this.http
      .post(
        `${this.apiBaseUrl}/api/companies/${this.companyId}/clients/${this.clientId}/payments`,
        { billingMonth },
      )
      .subscribe({
        next: () => {
          this.isSubmittingPayment.set(false);
          const monthLabel =
            this.monthOptions.find((m) => m.value === month)?.label ?? billingMonth;
          this.toast.success(`Payment recorded for ${monthLabel} ${this.currentYear}`);
          this.onPayModalClosed();
          this.loadPayments(); // refresh payment history
        },
        error: () => {
          this.isSubmittingPayment.set(false);
        },
      });
  }

  private loadPayments(): void {
    this.isLoadingPayments.set(true);
    const params = new URLSearchParams({
      pageNumber: '0',
      pageSize: '5',
      sort: 'BILLING_MONTH',
      descendingSort: 'true',
    });
    this.http
      .get<SearchClientPaymentsResponse>(
        `${this.apiBaseUrl}/api/companies/${this.companyId}/clients/${this.clientId}/payments?${params}`,
      )
      .subscribe({
        next: (data) => {
          this.payments.set(data.payments);
          this.isLoadingPayments.set(false);
        },
        error: () => {
          this.isLoadingPayments.set(false);
        },
      });
  }

  private loadClient(): void {
    this.http
      .get<ClientResponse>(
        `${this.apiBaseUrl}/api/companies/${this.companyId}/clients/${this.clientId}`,
      )
      .subscribe({
        next: (data) => {
          this.client.set(data);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  protected onEdit(): void {
    this.router.navigate(['/clients', this.clientId, 'edit'], {
      state: { companyId: this.companyId },
    });
  }

  protected onBack(): void {
    this.router.navigate(['/clients'], { state: { companyId: this.companyId } });
  }

  protected formatGender(gender: string | undefined): string {
    if (!gender) return '—';
    const map: Record<string, string> = {
      MALE: 'Male',
      FEMALE: 'Female',
      OTHER: 'Other',
      PREFER_NOT_TO_SAY: 'Prefer not to say',
    };
    return map[gender] || gender;
  }

  protected formatPlan(plan: string | undefined): string {
    if (!plan) return '—';
    const map: Record<string, string> = { NORMAL: 'Normal', PERSONAL: 'Personal' };
    return map[plan] || plan;
  }

  /** Converts "YYYY-MM" year-month string to a human-readable label, e.g. "January 2025". */
  protected formatBillingMonth(yearMonth: string): string {
    if (!yearMonth) return '—';
    const [year, month] = yearMonth.split('-');
    if (!year || !month) return yearMonth;
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  }

  protected paymentTotal(payment: ClientPayment): number {
    return (payment.standardPrice || 0) + (payment.additionalPrice || 0);
  }
}
