import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppShellComponent } from '../components/layout/app-shell/app-shell';
import { ToastContainerComponent } from '../components/feedback/toast/toast-container';
import { JwtService } from '../core/jwt';
import { NavGroup, LogoConfig, UserProfile } from '../components/layout/layout.types';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, AppShellComponent, ToastContainerComponent],
  templateUrl: './app-layout.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppLayoutComponent {
  private readonly jwt = inject(JwtService);

  protected readonly logo: LogoConfig = {
    icon: 'corporate_fare',
    name: 'PeopleOS',
    subtitle: 'HR Management',
  };

  protected readonly navGroups: NavGroup[] = [
    {
      label: 'Overview',
      items: [{ label: 'Dashboard', icon: 'dashboard', route: '/dashboard' }],
    },
    {
      label: 'Workforce',
      items: [
        { label: 'Companies', icon: 'corporate_fare', route: '/companies' },
        { label: 'Employees', icon: 'people', route: '/employees' },
        { label: 'Directory', icon: 'contacts', route: '/directory' },
        { label: 'Training', icon: 'school', route: '/training', badge: 4 },
        { label: 'Absences', icon: 'event_busy', route: '/absences', badge: 4 },
        { label: 'Leave Calendar', icon: 'calendar_month', route: '/leave-calendar' },
      ],
    },
    {
      label: 'Account',
      items: [{ label: 'Settings', icon: 'settings', route: '/settings' }],
    },
  ];

  /**
   * Build the user profile for the app-shell header from JWT claims.
   *
   * Standard JWT claims used:
   *  - `sub`   → username / display name
   *  - `email` → email address (if present in token)
   *  - `role` / `roles` → first role string
   *
   * Adjust claim names here to match whatever your backend embeds.
   */
  protected readonly user = computed((): UserProfile => {
    const decoded = this.jwt.decodedToken();
    if (!decoded) return { name: '' };

    // Token claims: sub (username), email, roles (string[]), contextType, businessId
    const sub = decoded['sub'] as string | undefined;
    const email = decoded['email'] as string | undefined;

    const rolesClaim = decoded['roles'];
    const role = Array.isArray(rolesClaim)
      ? (rolesClaim[0] as string)
      : (decoded['role'] as string | undefined);

    return {
      name: sub ?? email ?? 'User',
      email: email,
      role: role,
    };
  });

  protected logout(): void {
    this.jwt.logout();
  }
}
