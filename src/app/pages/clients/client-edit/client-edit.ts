import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../core/api.config';
import { JwtService } from '../../../core/jwt';
import { ToastService } from '../../../components/feedback/toast/toast.service';
import { AsyncLoadFn, AsyncSelectComponent } from '../../../components/forms/async-select/async-select';
import { SelectOption, SelectComponent } from '../../../components/forms/select/select';
import { PageContainerComponent } from '../../../components/layout/page-container/page-container';
import { BreadcrumbComponent } from '../../../components/layout/breadcrumb/breadcrumb';
import { PageHeaderComponent } from '../../../components/layout/page-header/page-header';
import { InputComponent } from '../../../components/forms/input/input';
import { TextareaComponent } from '../../../components/forms/textarea/textarea';
import { DatePickerComponent } from '../../../components/forms/date-picker/date-picker';
import { ButtonComponent } from '../../../components/atoms/button/button';
import { SpinnerComponent } from '../../../components/atoms/spinner/spinner';

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

interface CoachSearchResponse {
  coaches: Array<{
    id: string;
    information: { firstName: string; lastName: string };
  }>;
  totalElements: number;
}

@Component({
  selector: 'app-client-edit',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PageContainerComponent,
    BreadcrumbComponent,
    PageHeaderComponent,
    InputComponent,
    TextareaComponent,
    DatePickerComponent,
    SelectComponent,
    AsyncSelectComponent,
    ButtonComponent,
    SpinnerComponent,
  ],
  templateUrl: './client-edit.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientEditComponent {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly jwt = inject(JwtService);
  private readonly toast = inject(ToastService);

  private readonly clientId = this.route.snapshot.paramMap.get('id') || '';
  private readonly companyId =
    (history.state?.['companyId'] as string) || this.jwt.getClaim<string>('businessId') || '';

  protected readonly client = signal<ClientResponse | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isSubmitting = signal(false);

  protected readonly breadcrumbs = computed(() => {
    const c = this.client();
    const name = c
      ? `${c.information.firstName} ${c.information.lastName}`.trim()
      : 'Client';
    return [
      { label: 'Dashboard', route: '/dashboard' },
      { label: 'Clients', route: '/clients' },
      { label: name, route: `/clients/${this.clientId}` },
      { label: 'Edit' },
    ];
  });

  protected readonly genderOptions: SelectOption[] = [
    { label: 'Male', value: 'MALE' },
    { label: 'Female', value: 'FEMALE' },
    { label: 'Other', value: 'OTHER' },
    { label: 'Prefer not to say', value: 'PREFER_NOT_TO_SAY' },
  ];

  protected readonly membershipPlanOptions: SelectOption[] = [
    { label: 'Normal', value: 'NORMAL' },
    { label: 'Personal', value: 'PERSONAL' },
  ];

  protected readonly form = this.fb.group({
    coachId: [''],
    information: this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      dateOfBirth: [''],
      gender: [''],
    }),
    contact: this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', Validators.required],
      emergencyContactName: [''],
      emergencyContactPhone: [''],
    }),
    plan: this.fb.group({
      membershipPlan: ['', Validators.required],
      additionalFees: [''],
    }),
    medicalConditions: [''],
  });

  /** Searches coaches for the current company */
  protected readonly coachLoadFn: AsyncLoadFn = (search: string): Observable<SelectOption[]> => {
    const params = new URLSearchParams({ pageNumber: '0', pageSize: '10' });
    if (search.trim()) params.set('firstName', search);
    return this.http
      .get<CoachSearchResponse>(
        `${this.apiBaseUrl}/api/companies/${this.companyId}/coaches?${params}`,
      )
      .pipe(
        map((r) =>
          r.coaches.map((c) => ({
            label: `${c.information.firstName} ${c.information.lastName}`.trim(),
            value: c.id,
          })),
        ),
      );
  };

  constructor() {
    this.loadClient();
  }

  private loadClient(): void {
    this.http
      .get<ClientResponse>(
        `${this.apiBaseUrl}/api/companies/${this.companyId}/clients/${this.clientId}`,
      )
      .subscribe({
        next: (data) => {
          this.client.set(data);
          this.form.patchValue({
            coachId: data.coachId || '',
            information: {
              firstName: data.information.firstName,
              lastName: data.information.lastName,
              dateOfBirth: data.information.dateOfBirth || '',
              gender: data.information.gender || '',
            },
            contact: {
              email: data.contact.email,
              phoneNumber: data.contact.phoneNumber,
              emergencyContactName: data.contact.emergencyContactName || '',
              emergencyContactPhone: data.contact.emergencyContactPhone || '',
            },
            plan: {
              membershipPlan: data.plan.membershipPlan,
              additionalFees:
                data.plan.additionalFees !== undefined ? String(data.plan.additionalFees) : '',
            },
            medicalConditions: data.medicalConditions || '',
          });
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  protected getInformationGroup(): FormGroup {
    return this.form.get('information') as FormGroup;
  }

  protected getContactGroup(): FormGroup {
    return this.form.get('contact') as FormGroup;
  }

  protected getPlanGroup(): FormGroup {
    return this.form.get('plan') as FormGroup;
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.toast.warning('Please fill in all required fields', { title: 'Form Incomplete' });
      return;
    }

    this.isSubmitting.set(true);
    const fv = this.form.value as any;

    const payload: Record<string, unknown> = {
      information: {
        firstName: fv.information.firstName,
        lastName: fv.information.lastName,
        ...(fv.information.dateOfBirth ? { dateOfBirth: fv.information.dateOfBirth } : {}),
        ...(fv.information.gender ? { gender: fv.information.gender } : {}),
      },
      contact: {
        email: fv.contact.email,
        phoneNumber: fv.contact.phoneNumber,
        ...(fv.contact.emergencyContactName ? { emergencyContactName: fv.contact.emergencyContactName } : {}),
        ...(fv.contact.emergencyContactPhone ? { emergencyContactPhone: fv.contact.emergencyContactPhone } : {}),
      },
      plan: {
        membershipPlan: fv.plan.membershipPlan,
        ...(fv.plan.additionalFees ? { additionalFees: Number(fv.plan.additionalFees) } : {}),
      },
      ...(fv.coachId ? { coachId: fv.coachId } : {}),
      ...(fv.medicalConditions ? { medicalConditions: fv.medicalConditions } : {}),
    };

    this.http
      .put(
        `${this.apiBaseUrl}/api/companies/${this.companyId}/clients/${this.clientId}`,
        payload,
      )
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          const fv2 = this.form.value as any;
          const name = `${fv2.information.firstName} ${fv2.information.lastName}`.trim();
          this.toast.success(`Client "${name}" updated successfully!`);
          this.router.navigate(['/clients', this.clientId], {
            state: { companyId: this.companyId },
          });
        },
        error: () => {
          this.isSubmitting.set(false);
        },
      });
  }

  protected onCancel(): void {
    this.router.navigate(['/clients', this.clientId], {
      state: { companyId: this.companyId },
    });
  }
}
