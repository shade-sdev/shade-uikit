import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarStatus = 'online' | 'offline' | 'away' | null;

@Component({
  selector: 'sk-avatar',
  templateUrl: './avatar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarComponent {
  readonly src = input<string | null>(null);
  readonly name = input('');
  readonly size = input<AvatarSize>('md');
  readonly status = input<AvatarStatus>(null);

  protected readonly initials = computed(() => {
    const parts = this.name().trim().split(/\s+/);
    if (!parts[0]) return '?';
    return parts.length === 1
      ? parts[0][0].toUpperCase()
      : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  });

  protected readonly sizeClass = computed(() => {
    const map: Record<AvatarSize, string> = {
      xs: 'size-6 text-xs',
      sm: 'size-8 text-xs',
      md: 'size-10 text-sm',
      lg: 'size-12 text-base',
      xl: 'size-16 text-lg',
    };
    return map[this.size()];
  });

  protected readonly statusDotClass = computed(() => {
    const colorMap: Record<NonNullable<AvatarStatus>, string> = {
      online: 'bg-emerald-500',
      offline: 'bg-slate-400',
      away: 'bg-amber-500',
    };
    const dotSizeMap: Record<AvatarSize, string> = {
      xs: 'size-1.5',
      sm: 'size-2',
      md: 'size-2.5',
      lg: 'size-3',
      xl: 'size-3.5',
    };
    const s = this.status();
    if (!s) return '';
    return `${colorMap[s]} ${dotSizeMap[this.size()]}`;
  });
}
