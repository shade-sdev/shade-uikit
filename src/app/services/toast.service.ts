import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private readonly maxToasts = 5;
  private toastIdCounter = 0;

  constructor() {}

  success(message: string, title?: string, duration = 3000) {
    this.add({ type: 'success', message, title, duration });
  }

  error(message: string, title?: string, duration = 5000) {
    this.add({ type: 'error', message, title, duration });
  }

  warning(message: string, title?: string, duration = 4000) {
    this.add({ type: 'warning', message, title, duration });
  }

  info(message: string, title?: string, duration = 3000) {
    this.add({ type: 'info', message, title, duration });
  }

  private add(toast: Omit<Toast, 'id'>) {
    const id = `toast-${++this.toastIdCounter}`;
    const newToast: Toast = { ...toast, id };

    const currentToasts = this.toasts();
    if (currentToasts.length >= this.maxToasts) {
      this.remove(currentToasts[0].id);
    }

    this.toasts.set([...currentToasts, newToast]);

    if (toast.duration && toast.duration > 0) {
      setTimeout(() => this.remove(id), toast.duration);
    }
  }

  remove(id: string) {
    this.toasts.set(this.toasts().filter((t) => t.id !== id));
  }

  clear() {
    this.toasts.set([]);
  }
}
