import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppShellComponent } from '../components/layout/app-shell/app-shell';
import { ToastContainerComponent } from '../components/feedback/toast/toast-container';
import { JwtService } from '../core/jwt';
import { NavGroup, NavItem, LogoConfig, UserProfile } from '../components/layout/layout.types';
import { APP_PERMISSIONS } from '../core/permissions';

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

  /**
   * Full nav definition. Each item may declare `roles: ['ROLE_A', 'ROLE_B']`.
   * If roles are declared, the item is only shown to users who have at least
   * one matching role. Items without `roles` are visible to all authenticated users.
   */
  private readonly allNavGroups: NavGroup[] = [
    {
      label: 'Overview',
      items: [{ label: 'Dashboard', icon: 'dashboard', route: '/dashboard' }],
    },
    {
      label: 'Workforce',
      items: [
        { label: 'Companies',      icon: 'corporate_fare', route: '/companies',      roles: APP_PERMISSIONS.companies.view },
        { label: 'Employees',      icon: 'people',         route: '/employees',      roles: APP_PERMISSIONS.employees.view },
        { label: 'Clients',             icon: 'group',     route: '/clients',             roles: APP_PERMISSIONS.clients.view },
        { label: 'Metric Definitions', icon: 'analytics',      route: '/metric-definitions', roles: APP_PERMISSIONS.clientMetricDefinitions.view },
        { label: 'Client Metrics',    icon: 'monitoring',     route: '/metric-values',      roles: APP_PERMISSIONS.clientMetricValues.view },
        { label: 'Coaches',        icon: 'sports',         route: '/coaches',        roles: APP_PERMISSIONS.coaches.view },
        { label: 'Payments',       icon: 'payments',       route: '/payments',       roles: APP_PERMISSIONS.payments.view },
        { label: 'Directory',      icon: 'contacts',       route: '/directory',      roles: APP_PERMISSIONS.directory.view },
        { label: 'Training',       icon: 'school',         route: '/training',       roles: APP_PERMISSIONS.training.view, badge: 4 },
        { label: 'Absences',       icon: 'event_busy',     route: '/absences',       roles: APP_PERMISSIONS.absences.view, badge: 4 },
        { label: 'Leave Calendar', icon: 'calendar_month', route: '/leave-calendar', roles: APP_PERMISSIONS.leaveCalendar.view },
      ],
    },
    {
      label: 'My Account',
      items: [
        { label: 'My Profile', icon: 'person', route: '/my-profile', roles: APP_PERMISSIONS.selfProfile.view },
      ],
    },
    {
      label: 'Account',
      items: [{ label: 'Settings', icon: 'settings', route: '/settings', roles: APP_PERMISSIONS.settings.view }],
    },
  ];

  /**
   * Filtered nav groups — recomputed whenever the user's roles change.
   * Groups with no visible items are removed entirely.
   */
  protected readonly navGroups = computed((): NavGroup[] => {
    const userRoles = this.jwt.roles();

    const canSee = (item: NavItem): boolean =>
      !item.roles || item.roles.some((r) => userRoles.includes(r));

    return this.allNavGroups
      .map((group) => ({ ...group, items: group.items.filter(canSee) }))
      .filter((group) => group.items.length > 0);
  });

  protected readonly user = computed((): UserProfile => {
    const decoded = this.jwt.decodedToken();
    if (!decoded) return { name: '' };

    const sub = decoded['sub'] as string | undefined;
    const email = decoded['email'] as string | undefined;

    // Use the roles signal — already resolved via JwtConfig.rolesPath
    const roles = this.jwt.roles();
    const firstRole = roles[0];

    return {
      name: sub ?? email ?? 'User',
      email: email,
      role: firstRole,
    };
  });

  protected logout(): void {
    this.jwt.logout();
  }
}
