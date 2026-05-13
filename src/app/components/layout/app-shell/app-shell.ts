import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { HeaderComponent } from '../header/header';
import { SidebarComponent } from '../sidebar/sidebar';
import { LogoConfig, NavGroup, NavItem, UserProfile } from '../layout.types';

@Component({
  selector: 'sk-app-shell',
  imports: [SidebarComponent, HeaderComponent],
  templateUrl: './app-shell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  readonly navGroups = input<NavGroup[]>([]);
  readonly navItems = input<NavItem[]>([]);
  readonly logo = input<LogoConfig>({ icon: 'grid_view', name: 'App' });
  readonly user = input<UserProfile | null>(null);
  readonly notificationCount = input(0);
  readonly searchPlaceholder = input('Search...');
  readonly showSearch = input(true);
  readonly logoutClick = output();

  protected readonly mobileMenuOpen = signal(false);
}
