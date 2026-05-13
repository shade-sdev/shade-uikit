import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AvatarComponent } from '../../atoms/avatar/avatar';
import { LogoConfig, NavGroup, NavItem, UserProfile } from '../layout.types';

@Component({
  selector: 'sk-sidebar',
  imports: [RouterLink, RouterLinkActive, AvatarComponent],
  templateUrl: './sidebar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex flex-col h-full w-64 bg-white dark:bg-surface-dark border-r border-slate-200 dark:border-border-dark shrink-0',
  },
})
export class SidebarComponent {
  readonly groups = input<NavGroup[]>([]);
  readonly items = input<NavItem[]>([]);
  readonly logo = input<LogoConfig>({ icon: 'grid_view', name: 'App' });
  readonly user = input<UserProfile | null>(null);
  readonly logoutClick = output();

  private readonly expandedKeys = signal<Set<string>>(new Set());

  protected readonly resolvedGroups = computed<NavGroup[]>(() => {
    const groups = this.groups();
    if (groups.length > 0) return groups;
    const items = this.items();
    return items.length > 0 ? [{ items }] : [];
  });

  protected isVisible(item: NavItem): boolean {
    return item.visible !== false;
  }

  protected isExpanded(key: string): boolean {
    return this.expandedKeys().has(key);
  }

  protected toggleExpand(key: string): void {
    this.expandedKeys.update((set) => {
      const next = new Set(set);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }
}
