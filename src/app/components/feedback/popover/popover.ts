import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

type PopoverPosition = 'bottom-start' | 'bottom-end' | 'bottom' | 'top-start' | 'top-end' | 'top';

@Component({
  selector: 'sk-popover',
  templateUrl: './popover.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'relative inline-block',
  },
})
export class PopoverComponent {
  readonly position = input<PopoverPosition>('bottom-start');
  readonly width = input('auto');

  protected readonly open = signal(false);

  protected readonly panelClass = computed(() => {
    const base =
      'absolute z-40 mt-2 bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark shadow-xl';
    const positions: Record<PopoverPosition, string> = {
      'bottom-start': 'top-full left-0',
      'bottom-end': 'top-full right-0',
      bottom: 'top-full left-1/2 -translate-x-1/2',
      'top-start': 'bottom-full left-0 mb-2 mt-0',
      'top-end': 'bottom-full right-0 mb-2 mt-0',
      top: 'bottom-full left-1/2 -translate-x-1/2 mb-2 mt-0',
    };
    return `${base} ${positions[this.position()]}`;
  });

  toggle(): void {
    this.open.update((v) => !v);
  }

  close(): void {
    this.open.set(false);
  }
}
