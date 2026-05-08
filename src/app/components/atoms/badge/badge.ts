import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type BadgeVariant = 'active' | 'draft' | 'completed' | 'failed' | 'pending' | 'info' | 'warning';

@Component({
  selector: 'sk-badge',
  templateUrl: './badge.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeComponent {
  readonly variant = input<BadgeVariant>('active');

  protected readonly classes = computed(() => {
    const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap';
    const variantMap: Record<BadgeVariant, string> = {
      active: 'bg-primary/10 text-primary',
      draft: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
      completed: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
      failed: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
      pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
      info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    };
    return `${base} ${variantMap[this.variant()]}`;
  });
}
