import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { API_BASE_URL } from '../../../core/api.config';
import { JwtService, HasRoleDirective } from '../../../core/jwt';
import { APP_PERMISSIONS } from '../../../core/permissions';
import { PageContainerComponent } from '../../../components/layout/page-container/page-container';
import { BreadcrumbComponent } from '../../../components/layout/breadcrumb/breadcrumb';
import { PageHeaderComponent } from '../../../components/layout/page-header/page-header';
import { ButtonComponent } from '../../../components/atoms/button/button';
import { CardComponent } from '../../../components/atoms/card/card';
import { MasonryComponent } from '../../../components/data/masonry/masonry';
import { SpinnerComponent } from '../../../components/atoms/spinner/spinner';

interface CoachResponse {
  id: string;
  userId?: string;
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
  selector: 'app-coach-detail',
  standalone: true,
  imports: [
    PageContainerComponent,
    BreadcrumbComponent,
    PageHeaderComponent,
    ButtonComponent,
    CardComponent,
    MasonryComponent,
    SpinnerComponent,
    DatePipe,
    CurrencyPipe,
    HasRoleDirective,
  ],
  templateUrl: './coach-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoachDetailComponent {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly jwt = inject(JwtService);

  protected readonly P = APP_PERMISSIONS;

  private readonly coachId = this.route.snapshot.paramMap.get('id') || '';
  private readonly companyId =
    (history.state?.['companyId'] as string) || this.jwt.getClaim<string>('businessId') || '';

  protected readonly coach = signal<CoachResponse | null>(null);
  protected readonly isLoading = signal(true);

  protected readonly breadcrumbs = computed(() => {
    const c = this.coach();
    const name = c
      ? `${c.information.firstName} ${c.information.lastName}`.trim()
      : 'Coach';
    return [
      { label: 'Dashboard', route: '/dashboard' },
      { label: 'Coaches', route: '/coaches' },
      { label: name },
    ];
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
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  protected onEdit(): void {
    this.router.navigate(['/coaches', this.coachId, 'edit'], {
      state: { companyId: this.companyId },
    });
  }

  protected onBack(): void {
    this.router.navigate(['/coaches'], { state: { companyId: this.companyId } });
  }

  protected formatMode(mode: string | undefined): string {
    if (!mode) return '—';
    const map: Record<string, string> = {
      IN_PERSON: 'In Person',
      ONLINE: 'Online',
      HYBRID: 'Hybrid',
    };
    return map[mode] || mode;
  }

  protected formatAvailability(a: string | undefined): string {
    if (!a) return '—';
    const map: Record<string, string> = {
      WEEKDAYS: 'Weekdays',
      WEEKEND: 'Weekend',
      WEEKDAYS_WEEKEND: 'Weekdays & Weekend',
      FLEXIBLE: 'Flexible',
    };
    return map[a] || a;
  }

  protected getPictureSrc(picture: string | undefined): string | null {
    if (!picture) return null;
    if (picture.startsWith('data:image/') || picture.startsWith('http')) return picture;
    if (/^[A-Za-z0-9+/=]+$/.test(picture) && picture.length % 4 === 0) {
      return `data:image/png;base64,${picture}`;
    }
    return picture;
  }
}
