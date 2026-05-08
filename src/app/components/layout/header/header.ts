import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { AvatarComponent } from '../../atoms/avatar/avatar';
import { UserProfile } from '../layout.types';
import { ThemeService } from '../theme.service';

@Component({
  selector: 'sk-header',
  imports: [AvatarComponent],
  templateUrl: './header.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  readonly notificationCount = input(0);
  readonly searchPlaceholder = input('Search...');
  readonly showSearch = input(true);
  readonly user = input<UserProfile | null>(null);
  readonly menuClick = output<void>();

  protected readonly theme = inject(ThemeService);
}
