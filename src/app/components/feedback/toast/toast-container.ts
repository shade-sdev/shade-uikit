import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Toast, ToastPosition, ToastService } from './toast.service';

@Component({
  selector: 'sk-toast-container',
  templateUrl: './toast-container.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainerComponent {
  readonly position = input<ToastPosition>('bottom-right');

  protected readonly toast = inject(ToastService);


  protected readonly containerClass = computed(() => {
    const base = 'fixed z-[9999] flex flex-col gap-2 pointer-events-none w-80 max-w-[calc(100vw-2rem)]';
    const positions: Record<ToastPosition, string> = {
      'top-left': 'top-4 left-4 items-start',
      'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
      'top-right': 'top-4 right-6 items-end',
      'bottom-left': 'bottom-4 left-4 items-start',
      'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
      'bottom-right': 'bottom-4 right-6 items-end',
    };
    return `${base} ${positions[this.position()]}`;
  });

  protected toastIcon(type: Toast['type']): string {
    const icons: Record<Toast['type'], string> = {
      success: 'check_circle',
      error: 'error',
      warning: 'warning',
      info: 'info',
    };
    return icons[type];
  }

  protected toastColors(type: Toast['type']): string {
    const colors: Record<Toast['type'], string> = {
      success: 'border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400',
      error: 'border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400',
      warning: 'border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
      info: 'border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400',
    };
    return colors[type];
  }
}
