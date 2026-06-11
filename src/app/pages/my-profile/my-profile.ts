import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe, DecimalPipe } from '@angular/common';
import { API_BASE_URL } from '../../core/api.config';
import { JwtService } from '../../core/jwt';
import { PageContainerComponent } from '../../components/layout/page-container/page-container';
import { BreadcrumbComponent } from '../../components/layout/breadcrumb/breadcrumb';
import { PageHeaderComponent } from '../../components/layout/page-header/page-header';
import { CardComponent } from '../../components/atoms/card/card';
import { MasonryComponent } from '../../components/data/masonry/masonry';
import { SpinnerComponent } from '../../components/atoms/spinner/spinner';
import { SkeletonComponent } from '../../components/feedback/skeleton/skeleton';

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

interface ClientDiet {
  id: string;
  mealInterval: string;
  mealTime: string;
  mealDescription: string;
}

interface SearchClientDietsResponse {
  diets: ClientDiet[];
}

interface ClientTrainingPlan {
  id: string;
  trainingMonday?: string;
  trainingTuesday?: string;
  trainingWednesday?: string;
  trainingThursday?: string;
  trainingFriday?: string;
  trainingSaturday?: string;
  trainingSunday?: string;
}

interface SearchClientTrainingPlansResponse {
  trainingPlans: ClientTrainingPlan[];
}

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    PageContainerComponent,
    BreadcrumbComponent,
    PageHeaderComponent,
    CardComponent,
    MasonryComponent,
    SpinnerComponent,
    SkeletonComponent,
  ],
  templateUrl: './my-profile.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyProfileComponent {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly jwt = inject(JwtService);

  private readonly companyId = this.jwt.getClaim<string>('businessId') ?? '';
  private readonly userId = this.jwt.getClaim<string>('userId') ?? '';

  protected readonly client = signal<ClientResponse | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal(false);

  protected readonly diets = signal<ClientDiet[]>([]);
  protected readonly isLoadingDiets = signal(false);

  protected readonly trainingPlan = signal<ClientTrainingPlan | null>(null);
  protected readonly isLoadingTrainingPlan = signal(false);

  protected readonly breadcrumbs = computed(() => {
    const c = this.client();
    const name = c
      ? `${c.information.firstName} ${c.information.lastName}`.trim()
      : 'My Profile';
    return [
      { label: 'Dashboard', route: '/dashboard' },
      { label: name },
    ];
  });

  constructor() {
    this.loadClient();
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
    return plan === 'PERSONAL' ? 'Personal' : 'Normal';
  }

  protected formatMealInterval(interval: string): string {
    const map: Record<string, string> = {
      BREAKFAST: 'Breakfast',
      LUNCH: 'Lunch',
      DINNER: 'Dinner',
      SPECIFIC: 'Specific',
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

  private loadClient(): void {
    this.isLoading.set(true);
    this.http
      .get<ClientResponse>(
        `${this.apiBaseUrl}/api/companies/${this.companyId}/clients/users/${this.userId}`,
      )
      .subscribe({
        next: (data) => {
          this.client.set(data);
          this.isLoading.set(false);
          this.loadDiets(data.id);
          this.loadTrainingPlan(data.id);
        },
        error: () => {
          this.isLoading.set(false);
          this.loadError.set(true);
        },
      });
  }

  private loadDiets(clientId: string): void {
    this.isLoadingDiets.set(true);
    const params = new URLSearchParams({
      pageNumber: '0',
      pageSize: '50',
      sort: 'MEAL_INTERVAL',
      descendingSort: 'false',
    });
    this.http
      .get<SearchClientDietsResponse>(
        `${this.apiBaseUrl}/api/companies/${this.companyId}/client/${clientId}/diets?${params}`,
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

  private loadTrainingPlan(clientId: string): void {
    this.isLoadingTrainingPlan.set(true);
    const params = new URLSearchParams({
      pageNumber: '0',
      pageSize: '1',
      sort: 'CREATION_DATE',
      descendingSort: 'true',
    });
    this.http
      .get<SearchClientTrainingPlansResponse>(
        `${this.apiBaseUrl}/api/companies/${this.companyId}/client/${clientId}/training-plans?${params}`,
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
}
