import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { BreadcrumbComponent } from '../../components/layout/breadcrumb/breadcrumb';
import { PageHeaderComponent } from '../../components/layout/page-header/page-header';
import { CardComponent } from '../../components/atoms/card/card';
import { AvatarComponent } from '../../components/atoms/avatar/avatar';
import { AlertComponent } from '../../components/atoms/alert/alert';
import { DividerComponent } from '../../components/atoms/divider/divider';
import { ButtonComponent } from '../../components/atoms/button/button';
import { InputComponent } from '../../components/forms/input/input';
import { TextareaComponent } from '../../components/forms/textarea/textarea';
import { SelectComponent } from '../../components/forms/select/select';
import { ToggleComponent } from '../../components/forms/toggle/toggle';
import { CheckboxComponent } from '../../components/forms/checkbox/checkbox';
import { RadioGroupComponent, RadioOption } from '../../components/forms/radio-group/radio-group';
import { ButtonGroupComponent, ButtonGroupOption } from '../../components/forms/button-group/button-group';
import { TabsComponent, TabComponent } from '../../components/data/tabs/tabs';
import { AccordionComponent, AccordionItemComponent } from '../../components/data/accordion/accordion';
import { LoadingOverlayComponent } from '../../components/feedback/loading-overlay/loading-overlay';

@Component({
  selector: 'app-settings',
  imports: [
    FormsModule,
    BreadcrumbComponent, PageHeaderComponent,
    CardComponent, AvatarComponent, AlertComponent, DividerComponent, ButtonComponent,
    InputComponent, TextareaComponent, SelectComponent,
    ToggleComponent, CheckboxComponent, RadioGroupComponent, ButtonGroupComponent,
    TabsComponent, TabComponent,
    AccordionComponent, AccordionItemComponent,
    LoadingOverlayComponent,
  ],
  templateUrl: './settings.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  private readonly auth = inject(AuthService);

  // ── Profile ─────────────────────────────────────────────────────────────────
  protected readonly profileName     = signal(this.auth.user()?.name ?? 'Admin User');
  protected readonly profileEmail    = signal(this.auth.user()?.email ?? 'admin@corp.io');
  protected readonly profileRole     = signal(this.auth.user()?.role ?? 'HR Administrator');
  protected readonly profilePhone    = signal('+1 555-0100');
  protected readonly profileLocation = signal('New York, NY');
  protected readonly profileBio      = signal('Passionate HR professional focused on people operations and culture.');
  protected readonly profileTimezone = signal('America/New_York');

  protected readonly timezoneOptions = [
    { value: 'America/New_York',    label: 'Eastern Time (UTC-5)' },
    { value: 'America/Chicago',     label: 'Central Time (UTC-6)' },
    { value: 'America/Denver',      label: 'Mountain Time (UTC-7)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (UTC-8)' },
    { value: 'Europe/London',       label: 'London (UTC+0)' },
    { value: 'Europe/Berlin',       label: 'Berlin (UTC+1)' },
    { value: 'Asia/Tokyo',          label: 'Tokyo (UTC+9)' },
  ];

  // ── Notifications ────────────────────────────────────────────────────────────
  protected readonly notifEmail  = signal(true);
  protected readonly notifPush   = signal(false);
  protected readonly notifSlack  = signal(true);

  protected readonly notifAbsenceRequests = signal(true);
  protected readonly notifTrainingOverdue = signal(true);
  protected readonly notifNewHires        = signal(false);
  protected readonly notifPayroll         = signal(true);
  protected readonly notifReports         = signal(false);

  protected readonly digestOptions: ButtonGroupOption[] = [
    { value: 'immediate', label: 'Immediate' },
    { value: 'daily',     label: 'Daily'     },
    { value: 'weekly',    label: 'Weekly'    },
  ];
  protected readonly digestFrequency = signal<unknown>('daily');

  // ── Appearance ───────────────────────────────────────────────────────────────
  protected readonly themeOptions: RadioOption[] = [
    { value: 'light',  label: 'Light',  hint: 'Always use the light theme' },
    { value: 'dark',   label: 'Dark',   hint: 'Always use the dark theme'  },
    { value: 'system', label: 'System', hint: 'Follow your OS preference'  },
  ];
  protected readonly theme    = signal<unknown>('system');

  protected readonly densityOptions: ButtonGroupOption[] = [
    { value: 'compact',      label: 'Compact'      },
    { value: 'normal',       label: 'Normal'       },
    { value: 'comfortable',  label: 'Comfortable'  },
  ];
  protected readonly density  = signal<unknown>('normal');

  protected readonly languageOptions: RadioOption[] = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
  ];
  protected readonly language = signal<unknown>('en');

  // ── Security ─────────────────────────────────────────────────────────────────
  protected readonly currentPassword = signal('');
  protected readonly newPassword     = signal('');
  protected readonly confirmPassword = signal('');
  protected readonly twoFaEnabled    = signal(false);

  // ── Save state ────────────────────────────────────────────────────────────────
  protected readonly saving  = signal(false);
  protected readonly saved   = signal(false);

  protected save(): void {
    this.saving.set(true);
    this.saved.set(false);
    setTimeout(() => {
      this.saving.set(false);
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 4000);
    }, 1400);
  }
}
