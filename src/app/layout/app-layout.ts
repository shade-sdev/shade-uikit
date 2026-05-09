import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppShellComponent } from '../components/layout/app-shell/app-shell';
import { ToastContainerComponent } from '../components/feedback/toast/toast-container';
import { AuthService } from '../core/auth.service';
import { NavGroup, LogoConfig, UserProfile } from '../components/layout/layout.types';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, AppShellComponent, ToastContainerComponent],
  templateUrl: './app-layout.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppLayoutComponent {
  private readonly auth = inject(AuthService);

  protected readonly logo: LogoConfig = { icon: 'corporate_fare', name: 'PeopleOS', subtitle: 'HR Management' };

  protected readonly navGroups: NavGroup[] = [
    {
      label: 'Overview',
      items: [
        { label: 'Dashboard',       icon: 'dashboard',      route: '/dashboard' },
      ],
    },
    {
      label: 'Workforce',
      items: [
        { label: 'Employees',       icon: 'people',         route: '/employees' },
        { label: 'Directory',       icon: 'contacts',       route: '/directory' },
        { label: 'Training',        icon: 'school',         route: '/training',       badge: 4 },
        { label: 'Absences',        icon: 'event_busy',     route: '/absences',       badge: 4 },
        { label: 'Leave Calendar',  icon: 'calendar_month', route: '/leave-calendar' },
      ],
    },
    {
      label: 'Account',
      items: [
        { label: 'Settings',        icon: 'settings',       route: '/settings' },
      ],
    },
  ];

  protected get user(): UserProfile {
    const u = this.auth.user();
    return { name: u?.name ?? '', email: u?.email, role: u?.role };
  }

  protected logout(): void {
    this.auth.logout();
  }
}
