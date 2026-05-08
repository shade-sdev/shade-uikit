import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

export type AlertVariant = 'success' | 'info' | 'warning' | 'error';

interface AlertConfig {
  container: string;
  iconName: string;
}

@Component({
  selector: 'sk-alert',
  templateUrl: './alert.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertComponent {
  readonly variant = input<AlertVariant>('info');
  readonly dismissible = input(false);
  readonly dismissed = output<void>();

  protected readonly visible = signal(true);

  protected readonly config = computed((): AlertConfig => {
    const map: Record<AlertVariant, AlertConfig> = {
      success: {
        container:
          'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400',
        iconName: 'check_circle',
      },
      info: {
        container:
          'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-400',
        iconName: 'info',
      },
      warning: {
        container:
          'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-400',
        iconName: 'warning',
      },
      error: {
        container:
          'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-400',
        iconName: 'error',
      },
    };
    return map[this.variant()];
  });

  dismiss(): void {
    this.visible.set(false);
    this.dismissed.emit();
  }
}
