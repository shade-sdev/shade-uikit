import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type ProgressColor = 'primary' | 'success' | 'warning' | 'danger';
type ProgressSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'sk-progress',
  templateUrl: './progress.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressComponent {
  readonly value = input(0);
  readonly max = input(100);
  readonly color = input<ProgressColor>('primary');
  readonly label = input('');
  readonly showValue = input(false);
  readonly size = input<ProgressSize>('md');

  protected readonly percentage = computed(() =>
    Math.min(100, Math.max(0, (this.value() / this.max()) * 100)),
  );

  protected readonly percentageLabel = computed(() => `${Math.round(this.percentage())}%`);

  protected readonly barColor = computed(() => {
    const map: Record<ProgressColor, string> = {
      primary: 'bg-primary',
      success: 'bg-emerald-500',
      warning: 'bg-amber-500',
      danger: 'bg-rose-500',
    };
    return map[this.color()];
  });

  protected readonly trackHeight = computed(() => {
    const map: Record<ProgressSize, string> = {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3',
    };
    return map[this.size()];
  });
}
