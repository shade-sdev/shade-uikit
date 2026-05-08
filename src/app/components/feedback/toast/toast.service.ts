import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration: number;
  dismissing: boolean;
}

export interface ToastOptions {
  title?: string;
  /** Duration in ms. Set to 0 for persistent. Default: 4000 */
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  success(message: string, options: ToastOptions = {}): string {
    return this.add('success', message, options);
  }

  error(message: string, options: ToastOptions = {}): string {
    return this.add('error', message, options);
  }

  warning(message: string, options: ToastOptions = {}): string {
    return this.add('warning', message, options);
  }

  info(message: string, options: ToastOptions = {}): string {
    return this.add('info', message, options);
  }

  dismiss(id: string): void {
    this._toasts.update((list) => list.map((t) => (t.id === id ? { ...t, dismissing: true } : t)));
    setTimeout(() => {
      this._toasts.update((list) => list.filter((t) => t.id !== id));
    }, 220);
  }

  private add(type: ToastType, message: string, options: ToastOptions): string {
    const id = crypto.randomUUID();
    const duration = options.duration ?? 4000;
    this._toasts.update((list) => [
      ...list,
      { id, type, message, title: options.title, duration, dismissing: false },
    ]);
    if (duration > 0) setTimeout(() => this.dismiss(id), duration);
    return id;
  }
}
