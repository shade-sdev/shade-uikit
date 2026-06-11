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
import { InputComponent } from '../../../components/forms/input/input';
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

// ─── Diet interfaces ─────────────────────────────────────────────────────────

interface ClientDiet {
  id: string;
  clientId: string;
  companyId: string;
  mealInterval: string; // BREAKFAST | LUNCH | DINNER | SPECIFIC
  mealTime: string;     // ISO date-time
  mealDescription: string;
  auditData: {
    createdDate: string;
    createdBy: string;
    lastModifiedDate: string;
    lastModifiedBy: string;
  };
  version: number;
}

interface SearchClientDietsResponse {
  diets: ClientDiet[];
  pageSize: number;
  pageNumber: number;
  totalElements: number;
  totalPages: number;
}

/** One row in the "Add Diet" modal form */
interface DietFormEntry {
  mealInterval:    FormControl<string | null>;
  mealTime:        FormControl<string | null>;
  mealDescription: FormControl<string | null>;
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
    InputComponent,
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

  // ── Diets ─────────────────────────────────────────────────────────────────────
  protected readonly diets = signal<ClientDiet[]>([]);
  protected readonly isLoadingDiets = signal(true);

  // ── Add Diet modal ────────────────────────────────────────────────────────────
  protected readonly isAddDietModalOpen = signal(false);
  protected readonly isSubmittingDiet = signal(false);
  /** Signal array of form-control triples — one per diet row in the add modal. */
  protected readonly dietEntries = signal<DietFormEntry[]>([this.newDietEntry()]);

  /** Reusable meal-interval options for both add and edit modals. */
  protected readonly mealIntervalOptions: SelectOption<string>[] = [
    { label: 'Breakfast', value: 'BREAKFAST' },
    { label: 'Lunch',     value: 'LUNCH'     },
    { label: 'Dinner',    value: 'DINNER'    },
    { label: 'Specific',  value: 'SPECIFIC'  },
  ];

  // ── Edit Diet modal ───────────────────────────────────────────────────────────
  protected readonly isEditDietModalOpen = signal(false);
  protected readonly editingDiet = signal<ClientDiet | null>(null);
  protected readonly isUpdatingDiet = signal(false);
  protected readonly editIntervalCtrl  = new FormControl<string | null>(null);
  protected readonly editTimeCtrl      = new FormControl<string | null>(null);
  protected readonly editDescCtrl      = new FormControl<string | null>(null);

  // ── Delete Diet modal ─────────────────────────────────────────────────────────
  protected readonly isDeleteDietModalOpen = signal(false);
  protected readonly dietToDelete = signal<ClientDiet | null>(null);
  protected readonly isDeletingDiet = signal(false);

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
    this.loadDiets();
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

  // ─── Diet helpers ──────────────────────────────────────────────────────────

  private newDietEntry(): DietFormEntry {
    return {
      mealInterval:    new FormControl<string | null>(null),
      mealTime:        new FormControl<string | null>(null),
      mealDescription: new FormControl<string | null>(null),
    };
  }

  protected formatMealInterval(interval: string): string {
    const map: Record<string, string> = {
      BREAKFAST: 'Breakfast',
      LUNCH:     'Lunch',
      DINNER:    'Dinner',
      SPECIFIC:  'Specific',
    };
    return map[interval] || interval;
  }

  protected mealIntervalBadgeClass(interval: string): string {
    const map: Record<string, string> = {
      BREAKFAST: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
      LUNCH:     'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border border-sky-200 dark:border-sky-800',
      DINNER:    'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800',
      SPECIFIC:  'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
    };
    return map[interval] ?? map['SPECIFIC'];
  }

  protected formatMealTime(mealTime: string | undefined): string {
    if (!mealTime) return '—';
    return new Date(mealTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  // ─── Diet data loading ─────────────────────────────────────────────────────

  private loadDiets(): void {
    this.isLoadingDiets.set(true);
    // Note: API path uses singular /client/ (not /clients/)
    const params = new URLSearchParams({
      pageNumber: '0',
      pageSize:   '50',
      sort:       'MEAL_INTERVAL',
      descendingSort: 'false',
    });
    this.http
      .get<SearchClientDietsResponse>(
        `${this.apiBaseUrl}/api/companies/${this.companyId}/client/${this.clientId}/diets?${params}`,
      )
      .subscribe({
        next: (data) => {
          this.diets.set(data.diets);
          this.isLoadingDiets.set(false);
        },
        error: () => {
          this.isLoadingDiets.set(false);
        },
      });
  }

  // ─── Add Diet modal ────────────────────────────────────────────────────────

  protected onAddDietClick(): void {
    this.isAddDietModalOpen.set(true);
  }

  protected onAddDietModalClosed(): void {
    this.isAddDietModalOpen.set(false);
    this.isSubmittingDiet.set(false);
    this.dietEntries.set([this.newDietEntry()]); // reset to one blank row
  }

  protected addDietEntry(): void {
    this.dietEntries.update((rows) => [...rows, this.newDietEntry()]);
  }

  protected removeDietEntry(index: number): void {
    this.dietEntries.update((rows) => rows.filter((_, i) => i !== index));
  }

  protected onSubmitDiets(): void {
    const validDiets = this.dietEntries()
      .filter((e) => e.mealInterval.value)
      .map((e) => ({
        mealInterval:    e.mealInterval.value,
        // mealTime is only relevant (and visible) when interval is SPECIFIC
        mealTime:        e.mealInterval.value === 'SPECIFIC' ? (e.mealTime.value || undefined) : undefined,
        mealDescription: e.mealDescription.value || undefined,
      }));

    if (!validDiets.length) return;

    this.isSubmittingDiet.set(true);
    this.http
      .post(
        `${this.apiBaseUrl}/api/companies/${this.companyId}/client/${this.clientId}/diets`,
        { diets: validDiets },
      )
      .subscribe({
        next: () => {
          this.isSubmittingDiet.set(false);
          const count = validDiets.length;
          this.toast.success(`${count} diet entr${count === 1 ? 'y' : 'ies'} saved`);
          this.onAddDietModalClosed();
          this.loadDiets();
        },
        error: () => {
          this.isSubmittingDiet.set(false);
        },
      });
  }

  // ─── Edit Diet modal ───────────────────────────────────────────────────────

  protected onEditDietClick(diet: ClientDiet): void {
    this.editingDiet.set(diet);
    this.editIntervalCtrl.setValue(diet.mealInterval ?? null);
    // datetime-local input expects "YYYY-MM-DDTHH:mm" — slice ISO to 16 chars
    this.editTimeCtrl.setValue(diet.mealTime ? diet.mealTime.slice(0, 16) : null);
    this.editDescCtrl.setValue(diet.mealDescription ?? null);
    this.isEditDietModalOpen.set(true);
  }

  protected onEditDietModalClosed(): void {
    this.isEditDietModalOpen.set(false);
    this.isUpdatingDiet.set(false);
    this.editingDiet.set(null);
  }

  protected onUpdateDiet(): void {
    const diet = this.editingDiet();
    if (!diet) return;

    this.isUpdatingDiet.set(true);
    this.http
      .put(
        `${this.apiBaseUrl}/api/companies/${this.companyId}/client/${this.clientId}/diets/${diet.id}`,
        {
          mealInterval:    this.editIntervalCtrl.value,
          // mealTime is only relevant (and visible) when interval is SPECIFIC
          mealTime:        this.editIntervalCtrl.value === 'SPECIFIC' ? (this.editTimeCtrl.value || undefined) : undefined,
          mealDescription: this.editDescCtrl.value || undefined,
        },
      )
      .subscribe({
        next: () => {
          this.isUpdatingDiet.set(false);
          this.toast.success('Diet entry updated');
          this.onEditDietModalClosed();
          this.loadDiets();
        },
        error: () => {
          this.isUpdatingDiet.set(false);
        },
      });
  }

  // ─── Delete Diet modal ─────────────────────────────────────────────────────

  protected onDeleteDietClick(diet: ClientDiet): void {
    this.dietToDelete.set(diet);
    this.isDeleteDietModalOpen.set(true);
  }

  protected onDeleteDietModalClosed(): void {
    this.isDeleteDietModalOpen.set(false);
    this.isDeletingDiet.set(false);
    this.dietToDelete.set(null);
  }

  protected onConfirmDeleteDiet(): void {
    const diet = this.dietToDelete();
    if (!diet) return;

    this.isDeletingDiet.set(true);
    this.http
      .delete(
        `${this.apiBaseUrl}/api/companies/${this.companyId}/client/${this.clientId}/diets/${diet.id}`,
      )
      .subscribe({
        next: () => {
          this.isDeletingDiet.set(false);
          this.toast.success('Diet entry deleted');
          this.onDeleteDietModalClosed();
          this.loadDiets();
        },
        error: () => {
          this.isDeletingDiet.set(false);
        },
      });
  }
}
