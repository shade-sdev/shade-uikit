import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup, FormArray } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { API_BASE_URL } from '../../../core/api.config';
import { ToastService } from '../../../services/toast.service';
import { PageContainerComponent } from '../../../components/layout/page-container/page-container';
import { BreadcrumbComponent } from '../../../components/layout/breadcrumb/breadcrumb';
import { PageHeaderComponent } from '../../../components/layout/page-header/page-header';
import { InputComponent } from '../../../components/forms/input/input';
import { TextareaComponent } from '../../../components/forms/textarea/textarea';
import { CheckboxComponent } from '../../../components/forms/checkbox/checkbox';
import { ButtonComponent } from '../../../components/atoms/button/button';

interface CompanyRequest {
  information: {
    companyName: string;
    brn: string;
    email: string;
    contactNumber: string;
    logo?: string;
    branches?: Array<{ branchName: string }>;
  };
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  miscellaneous: {
    disclaimer: string;
    agreeTermsOfService: boolean;
  };
  price: {
    standardPrice: number;
  };
}

interface CompanyResponse {
  id: string;
}

@Component({
  selector: 'app-company-add',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PageContainerComponent,
    BreadcrumbComponent,
    PageHeaderComponent,
    InputComponent,
    TextareaComponent,
    CheckboxComponent,
    ButtonComponent,
  ],
  templateUrl: './company-add.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyAddComponent {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly toast = inject(ToastService);

  protected readonly isSubmitting = signal(false);

  protected readonly form = this.fb.group({
    information: this.fb.group({
      companyName: ['', Validators.required],
      brn: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      contactNumber: ['', Validators.required],
      logo: [''],
      branches: this.fb.array([]),
    }),
    address: this.fb.group({
      street: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      postalCode: ['', Validators.required],
    }),
    miscellaneous: this.fb.group({
      disclaimer: ['', Validators.required],
      agreeTermsOfService: [false, Validators.requiredTrue],
    }),
    price: this.fb.group({
      standardPrice: ['', Validators.required],
    }),
  });

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.toast.warning('Please fill in all required fields', 'Form Incomplete');
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.form.value as any;
    const payload: CompanyRequest = {
      ...formValue,
      price: {
        standardPrice: Number(formValue.price.standardPrice),
      },
    };

    this.http
      .post<CompanyResponse>(`${this.apiBaseUrl}/api/companies`, payload)
      .subscribe({
        next: (response) => {
          this.isSubmitting.set(false);
          this.toast.success(`Company "${formValue.information.companyName}" created successfully!`);
          this.router.navigate(['/companies', response.id]);
        },
        error: () => {
          this.isSubmitting.set(false);
          // Error handling is done by HttpErrorInterceptor
        },
      });
  }

  protected onCancel(): void {
    this.router.navigate(['/companies']);
  }

  protected getBranchesArray(): FormArray {
    return this.form.get('information')?.get('branches') as FormArray;
  }

  protected getBranchIndices(): number[] {
    return Array.from({ length: this.getBranchesArray().length }, (_, i) => i);
  }

  protected getBranchAt(index: number): FormGroup {
    return this.getBranchesArray().at(index) as FormGroup;
  }

  protected addBranch(): void {
    const branchGroup = this.fb.group({
      branchName: ['', Validators.required],
    });
    this.getBranchesArray().push(branchGroup);
  }

  protected removeBranch(index: number): void {
    this.getBranchesArray().removeAt(index);
  }

  protected getInformationGroup(): FormGroup {
    return this.form.get('information') as FormGroup;
  }

  protected getAddressGroup(): FormGroup {
    return this.form.get('address') as FormGroup;
  }

  protected getMiscellaneousGroup(): FormGroup {
    return this.form.get('miscellaneous') as FormGroup;
  }

  protected getPriceGroup(): FormGroup {
    return this.form.get('price') as FormGroup;
  }

  protected onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      console.error('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      this.form.get('information')?.get('logo')?.setValue(base64String);
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  protected getLogoPreview(): string | null {
    const logo = this.form.get('information')?.get('logo')?.value;
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

    return logo;
  }

  private isBase64(str: string): boolean {
    try {
      return /^[A-Za-z0-9+/=]+$/.test(str) && str.length % 4 === 0;
    } catch {
      return false;
    }
  }
}
