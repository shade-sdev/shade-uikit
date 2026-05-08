import { ChangeDetectionStrategy, Component, computed, effect, input, output } from '@angular/core';
import { CdkTrapFocus } from '@angular/cdk/a11y';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

@Component({
  selector: 'sk-modal',
  imports: [CdkTrapFocus],
  templateUrl: './modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class ModalComponent {
  readonly isOpen = input(false);
  readonly title = input('');
  readonly size = input<ModalSize>('md');
  readonly closeOnBackdrop = input(true);
  readonly showClose = input(true);
  readonly closed = output<void>();

  protected readonly dialogClass = computed(() => {
    const base =
      'relative bg-white dark:bg-surface-dark rounded-2xl shadow-2xl border border-slate-200 dark:border-border-dark flex flex-col max-h-[90vh] w-full';
    const sizes: Record<ModalSize, string> = {
      sm: 'max-w-sm',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      full: 'max-w-[calc(100vw-2rem)] h-[calc(100vh-2rem)]',
    };
    return `${base} ${sizes[this.size()]}`;
  });

  constructor() {
    effect(() => {
      document.body.style.overflow = this.isOpen() ? 'hidden' : '';
    });
  }

  close(): void {
    this.closed.emit();
  }

  protected onBackdropClick(): void {
    if (this.closeOnBackdrop()) this.close();
  }

  protected onEscape(): void {
    if (this.isOpen()) this.close();
  }
}
