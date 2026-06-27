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
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API_BASE_URL } from '../../../core/api.config';
import { JwtService, HasRoleDirective } from '../../../core/jwt';
import { APP_PERMISSIONS } from '../../../core/permissions';
import { ToastService } from '../../../components/feedback/toast/toast.service';
import { ModalComponent } from '../../../components/feedback/modal/modal';
import { SelectOption, SelectComponent } from '../../../components/forms/select/select';
import { AsyncLoadFn, AsyncSelectComponent } from '../../../components/forms/async-select/async-select';
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

// ─── Training Plan interfaces ──────────────────────────────────────────────────

interface ClientTrainingPlan {
  id: string;
  clientId: string;
  companyId: string;
  trainingMonday?: string;
  trainingTuesday?: string;
  trainingWednesday?: string;
  trainingThursday?: string;
  trainingFriday?: string;
  trainingSaturday?: string;
  trainingSunday?: string;
  auditData: {
    createdDate: string;
    createdBy: string;
    lastModifiedDate: string;
    lastModifiedBy: string;
  };
  version: number;
}

interface SearchClientTrainingPlansResponse {
  trainingPlans: ClientTrainingPlan[];
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
    InputComponent,
    AsyncSelectComponent,
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

  // ── Training Plan ─────────────────────────────────────────────────────────────
  protected readonly trainingPlan = signal<ClientTrainingPlan | null>(null);
  protected readonly isLoadingTrainingPlan = signal(true);

  // ── Add Training Plan modal ───────────────────────────────────────────────────
  protected readonly isAddTrainingPlanModalOpen = signal(false);
  protected readonly isSubmittingTrainingPlan = signal(false);

  // ── Edit Training Plan modal ──────────────────────────────────────────────────
  protected readonly isEditTrainingPlanModalOpen = signal(false);
  protected readonly editingTrainingPlan = signal<ClientTrainingPlan | null>(null);
  protected readonly isUpdatingTrainingPlan = signal(false);

  // ── Delete Training Plan modal ────────────────────────────────────────────────
  protected readonly isDeleteTrainingPlanModalOpen = signal(false);
  protected readonly trainingPlanToDelete = signal<ClientTrainingPlan | null>(null);
  protected readonly isDeletingTrainingPlan = signal(false);

  // 7-day form controls (shared between add & edit — reset on modal close)
  protected readonly tpMondayCtrl    = new FormControl<string | null>(null);
  protected readonly tpTuesdayCtrl   = new FormControl<string | null>(null);
  protected readonly tpWednesdayCtrl = new FormControl<string | null>(null);
  protected readonly tpThursdayCtrl  = new FormControl<string | null>(null);
  protected readonly tpFridayCtrl    = new FormControl<string | null>(null);
  protected readonly tpSaturdayCtrl  = new FormControl<string | null>(null);
  protected readonly tpSundayCtrl    = new FormControl<string | null>(null);

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

  // ── Add Training Session modal ─────────────────────────────────────────────

  protected readonly isAddSessionModalOpen  = signal(false);
  protected readonly isSubmittingSession    = signal(false);
  protected readonly sessionTitleCtrl       = new FormControl<string | null>(null);
  protected readonly sessionDateCtrl        = new FormControl<string | null>(null);
  protected readonly sessionStartTimeCtrl   = new FormControl<string | null>(null);
  protected readonly sessionEndTimeCtrl     = new FormControl<string | null>(null);
  protected readonly sessionCoachCtrl       = new FormControl<string | null>(null);

  /** Admins/managers with OTHER permissions need to select a coach when booking. */
  protected readonly showSessionCoachSelector = computed(() => {
    const r = this.jwt.roles();
    return r.includes('TRAINING_SESSION_OTHER_MANAGEMENT') ||
           r.includes('TRAINING_SESSION_OTHER_CREATE');
  });

  protected readonly coachLoadFn: AsyncLoadFn<string> = (search) =>
    this.http.get<{ coaches: Array<{ id: string; information: { firstName: string; lastName: string } }> }>(
      `${this.apiBaseUrl}/api/companies/${this.companyId}/coaches`,
      { params: { pageNumber: '0', pageSize: '20', firstName: search } },
    ).pipe(
      map(d => (d.coaches ?? []).map(c => ({
        label: `${c.information.firstName} ${c.information.lastName}`,
        value: c.id,
      }))),
      catchError(() => of([])),
    );

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
    this.loadTrainingPlans();
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

  // ─── Training Plan ───────────────────────────────────────────────────────────

  private loadTrainingPlans(): void {
    this.isLoadingTrainingPlan.set(true);
    const qp = new URLSearchParams({
      pageNumber:     '0',
      pageSize:       '1',
      sort:           'CREATION_DATE',
      descendingSort: 'true',
    });
    this.http
      .get<SearchClientTrainingPlansResponse>(
        `${this.apiBaseUrl}/api/companies/${this.companyId}/client/${this.clientId}/training-plans?${qp}`,
      )
      .subscribe({
        next: (data) => {
          this.trainingPlan.set(data.trainingPlans[0] ?? null);
          this.isLoadingTrainingPlan.set(false);
        },
        error: () => {
          this.isLoadingTrainingPlan.set(false);
        },
      });
  }

  private resetTpControls(): void {
    this.tpMondayCtrl.setValue(null);
    this.tpTuesdayCtrl.setValue(null);
    this.tpWednesdayCtrl.setValue(null);
    this.tpThursdayCtrl.setValue(null);
    this.tpFridayCtrl.setValue(null);
    this.tpSaturdayCtrl.setValue(null);
    this.tpSundayCtrl.setValue(null);
  }

  // ─── Add Training Plan ─────────────────────────────────────────────────────

  protected onAddTrainingPlanClick(): void {
    this.resetTpControls();
    this.isAddTrainingPlanModalOpen.set(true);
  }

  protected onAddTrainingPlanModalClosed(): void {
    this.isAddTrainingPlanModalOpen.set(false);
    this.isSubmittingTrainingPlan.set(false);
  }

  protected onSubmitTrainingPlan(): void {
    this.isSubmittingTrainingPlan.set(true);
    this.http
      .post(
        `${this.apiBaseUrl}/api/companies/${this.companyId}/client/${this.clientId}/training-plans`,
        {
          trainingMonday:    this.tpMondayCtrl.value    || undefined,
          trainingTuesday:   this.tpTuesdayCtrl.value   || undefined,
          trainingWednesday: this.tpWednesdayCtrl.value || undefined,
          trainingThursday:  this.tpThursdayCtrl.value  || undefined,
          trainingFriday:    this.tpFridayCtrl.value    || undefined,
          trainingSaturday:  this.tpSaturdayCtrl.value  || undefined,
          trainingSunday:    this.tpSundayCtrl.value    || undefined,
        },
      )
      .subscribe({
        next: () => {
          this.isSubmittingTrainingPlan.set(false);
          this.toast.success('Training plan saved');
          this.onAddTrainingPlanModalClosed();
          this.loadTrainingPlans();
        },
        error: () => {
          this.isSubmittingTrainingPlan.set(false);
        },
      });
  }

  // ─── Edit Training Plan ────────────────────────────────────────────────────

  protected onEditTrainingPlanClick(plan: ClientTrainingPlan): void {
    this.editingTrainingPlan.set(plan);
    this.tpMondayCtrl.setValue(plan.trainingMonday    ?? null);
    this.tpTuesdayCtrl.setValue(plan.trainingTuesday  ?? null);
    this.tpWednesdayCtrl.setValue(plan.trainingWednesday ?? null);
    this.tpThursdayCtrl.setValue(plan.trainingThursday  ?? null);
    this.tpFridayCtrl.setValue(plan.trainingFriday    ?? null);
    this.tpSaturdayCtrl.setValue(plan.trainingSaturday  ?? null);
    this.tpSundayCtrl.setValue(plan.trainingSunday    ?? null);
    this.isEditTrainingPlanModalOpen.set(true);
  }

  protected onEditTrainingPlanModalClosed(): void {
    this.isEditTrainingPlanModalOpen.set(false);
    this.isUpdatingTrainingPlan.set(false);
    this.editingTrainingPlan.set(null);
  }

  protected onUpdateTrainingPlan(): void {
    const plan = this.editingTrainingPlan();
    if (!plan) return;
    this.isUpdatingTrainingPlan.set(true);
    this.http
      .put(
        `${this.apiBaseUrl}/api/companies/${this.companyId}/client/${this.clientId}/training-plans/${plan.id}`,
        {
          trainingMonday:    this.tpMondayCtrl.value    || undefined,
          trainingTuesday:   this.tpTuesdayCtrl.value   || undefined,
          trainingWednesday: this.tpWednesdayCtrl.value || undefined,
          trainingThursday:  this.tpThursdayCtrl.value  || undefined,
          trainingFriday:    this.tpFridayCtrl.value    || undefined,
          trainingSaturday:  this.tpSaturdayCtrl.value  || undefined,
          trainingSunday:    this.tpSundayCtrl.value    || undefined,
        },
      )
      .subscribe({
        next: () => {
          this.isUpdatingTrainingPlan.set(false);
          this.toast.success('Training plan updated');
          this.onEditTrainingPlanModalClosed();
          this.loadTrainingPlans();
        },
        error: () => {
          this.isUpdatingTrainingPlan.set(false);
        },
      });
  }

  // ─── Delete Training Plan ──────────────────────────────────────────────────

  protected onDeleteTrainingPlanClick(plan: ClientTrainingPlan): void {
    this.trainingPlanToDelete.set(plan);
    this.isDeleteTrainingPlanModalOpen.set(true);
  }

  protected onDeleteTrainingPlanModalClosed(): void {
    this.isDeleteTrainingPlanModalOpen.set(false);
    this.isDeletingTrainingPlan.set(false);
    this.trainingPlanToDelete.set(null);
  }

  // ── Add Training Session ───────────────────────────────────────────────────

  protected onAddSessionClick(): void {
    this.sessionTitleCtrl.setValue(null);
    this.sessionDateCtrl.setValue(null);
    this.sessionStartTimeCtrl.setValue(null);
    this.sessionEndTimeCtrl.setValue(null);
    this.sessionCoachCtrl.setValue(null);
    this.isAddSessionModalOpen.set(true);
  }

  protected onSessionModalClosed(): void {
    this.isAddSessionModalOpen.set(false);
    this.isSubmittingSession.set(false);
  }

  protected onSubmitSession(): void {
    const title = this.sessionTitleCtrl.value?.trim();
    const date  = this.sessionDateCtrl.value;
    const start = this.sessionStartTimeCtrl.value;
    const end   = this.sessionEndTimeCtrl.value;
    if (!title || !date || !start || !end) return;

    const body: Record<string, unknown> = {
      sessionTitle:  title,
      startDateTime: `${date}T${start}:00`,
      endDateTime:   `${date}T${end}:00`,
    };
    if (this.showSessionCoachSelector() && this.sessionCoachCtrl.value) {
      body['coachId'] = this.sessionCoachCtrl.value;
    }

    this.isSubmittingSession.set(true);
    this.http.post(
      `${this.apiBaseUrl}/api/companies/${this.companyId}/client/${this.clientId}/training-sessions`,
      body,
    ).subscribe({
      next: () => {
        this.isSubmittingSession.set(false);
        this.toast.success('Training session added');
        this.onSessionModalClosed();
      },
      error: () => this.isSubmittingSession.set(false),
    });
  }

  protected onConfirmDeleteTrainingPlan(): void {
    const plan = this.trainingPlanToDelete();
    if (!plan) return;
    this.isDeletingTrainingPlan.set(true);
    this.http
      .delete(
        `${this.apiBaseUrl}/api/companies/${this.companyId}/client/${this.clientId}/training-plans/${plan.id}`,
      )
      .subscribe({
        next: () => {
          this.isDeletingTrainingPlan.set(false);
          this.toast.success('Training plan deleted');
          this.onDeleteTrainingPlanModalClosed();
          this.loadTrainingPlans();
        },
        error: () => {
          this.isDeletingTrainingPlan.set(false);
        },
      });
  }
}
