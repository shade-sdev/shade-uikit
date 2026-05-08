import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type CardPadding = 'none' | 'sm' | 'md' | 'lg';

@Component({
  selector: 'sk-card',
  templateUrl: './card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  readonly padding = input<CardPadding>('md');
  readonly shadow = input(true);
  readonly border = input(true);

  protected readonly classes = computed(() => {
    const padMap: Record<CardPadding, string> = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };
    return [
      'bg-white dark:bg-surface-dark rounded-xl',
      this.border() ? 'border border-slate-200 dark:border-border-dark' : '',
      this.shadow() ? 'shadow-sm' : '',
      padMap[this.padding()],
    ]
      .filter(Boolean)
      .join(' ');
  });
}
