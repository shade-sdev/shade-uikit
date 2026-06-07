import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { API_BASE_URL } from '../../../core/api.config';
import { JwtService } from '../../../core/jwt';
import { ToastService } from '../../../components/feedback/toast/toast.service';
import { SelectOption, SelectComponent } from '../../../components/forms/select/select';
import { PageContainerComponent } from '../../../components/layout/page-container/page-container';
import { BreadcrumbComponent } from '../../../components/layout/breadcrumb/breadcrumb';
import { PageHeaderComponent } from '../../../components/layout/page-header/page-header';
import { InputComponent } from '../../../components/forms/input/input';
import { TextareaComponent } from '../../../components/forms/textarea/textarea';
import { ButtonComponent } from '../../../components/atoms/button/button';
import { SpinnerComponent } from '../../../components/atoms/spinner/spinner';

interface CoachResponse {
  id: string;
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

@Component({
  selector: 'app-coach-edit',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PageContainerComponent,
    BreadcrumbComponent,
    PageHeaderComponent,
    InputComponent,
    TextareaComponent,
    SelectComponent,
    ButtonComponent,
    SpinnerComponent,
  ],
  templateUrl: './coach-edit.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoachEditComponent {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly jwt = inject(JwtService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly toast = inject(ToastService);

  private readonly coachId = this.route.snapshot.paramMap.get('id') || '';
  private readonly companyId =
    (history.state?.['companyId'] as string) || this.jwt.getClaim<string>('businessId') || '';

  protected readonly coach = signal<CoachResponse | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isSubmitting = signal(false);

  protected readonly breadcrumbs = computed(() => {
    const c = this.coach();
    const name = c
      ? `${c.information.firstName} ${c.information.lastName}`.trim()
      : 'Coach';
    return [
      { label: 'Dashboard', route: '/dashboard' },
      { label: 'Coaches', route: '/coaches' },
      { label: name, route: `/coaches/${this.coachId}` },
      { label: 'Edit' },
    ];
  });

  protected readonly coachingModeOptions: SelectOption[] = [
    { label: 'In Person', value: 'IN_PERSON' },
    { label: 'Online', value: 'ONLINE' },
    { label: 'Hybrid', value: 'HYBRID' },
  ];

  protected readonly availabilityOptions: SelectOption[] = [
    { label: 'Weekdays', value: 'WEEKDAYS' },
    { label: 'Weekend', value: 'WEEKEND' },
    { label: 'Weekdays & Weekend', value: 'WEEKDAYS_WEEKEND' },
    { label: 'Flexible', value: 'FLEXIBLE' },
  ];

  protected readonly form = this.fb.group({
    information: this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      picture: [''],
      location: [''],
    }),
    contact: this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      contactNumber: ['', Validators.required],
    }),
    details: this.fb.group({
      coachingMode: ['', Validators.required],
      availability: ['', Validators.required],
      yearsOfExperience: [''],
      hourlyRate: [''],
      spokenLanguages: [''],
      biography: [''],
      certifications: [''],
    }),
  });

  constructor() {
    this.loadCoach();
  }

  private loadCoach(): void {
    this.http
      .get<CoachResponse>(
        `${this.apiBaseUrl}/api/companies/${this.companyId}/coaches/${this.coachId}`,
      )
      .subscribe({
        next: (data) => {
          this.coach.set(data);
          this.form.patchValue({
            information: {
              firstName: data.information.firstName,
              lastName: data.information.lastName,
              picture: data.information.picture || '',
              location: data.information.location || '',
            },
            contact: {
              email: data.contact.email,
              contactNumber: data.contact.contactNumber,
            },
            details: {
              coachingMode: data.details.coachingMode || '',
              availability: data.details.availability || '',
              yearsOfExperience:
                data.details.yearsOfExperience !== undefined
                  ? String(data.details.yearsOfExperience)
                  : '',
              hourlyRate:
                data.details.hourlyRate !== undefined ? String(data.details.hourlyRate) : '',
              spokenLanguages: data.details.spokenLanguages || '',
              biography: data.details.biography || '',
              certifications: data.details.certifications || '',
            },
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

  protected getDetailsGroup(): FormGroup {
    return this.form.get('details') as FormGroup;
  }

  protected onPictureSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.form.get('information')?.get('picture')?.setValue(reader.result as string);
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  protected getPicturePreview(): string | null {
    return this.form.get('information')?.get('picture')?.value || null;
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
        ...(fv.information.picture ? { picture: fv.information.picture } : {}),
        ...(fv.information.location ? { location: fv.information.location } : {}),
      },
      contact: {
        email: fv.contact.email,
        contactNumber: fv.contact.contactNumber,
      },
      details: {
        coachingMode: fv.details.coachingMode,
        availability: fv.details.availability,
        ...(fv.details.yearsOfExperience ? { yearsOfExperience: Number(fv.details.yearsOfExperience) } : {}),
        ...(fv.details.hourlyRate ? { hourlyRate: Number(fv.details.hourlyRate) } : {}),
        ...(fv.details.spokenLanguages ? { spokenLanguages: fv.details.spokenLanguages } : {}),
        ...(fv.details.biography ? { biography: fv.details.biography } : {}),
        ...(fv.details.certifications ? { certifications: fv.details.certifications } : {}),
      },
    };

    this.http
      .put(
        `${this.apiBaseUrl}/api/companies/${this.companyId}/coaches/${this.coachId}`,
        payload,
      )
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          const name = `${fv.information.firstName} ${fv.information.lastName}`.trim();
          this.toast.success(`Coach "${name}" updated successfully!`);
          this.router.navigate(['/coaches', this.coachId], {
            state: { companyId: this.companyId },
          });
        },
        error: () => {
          this.isSubmitting.set(false);
        },
      });
  }

  protected onCancel(): void {
    this.router.navigate(['/coaches', this.coachId], {
      state: { companyId: this.companyId },
    });
  }
}
