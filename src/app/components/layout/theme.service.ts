import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _isDark = signal(false);
  readonly isDark = this._isDark.asReadonly();

  constructor() {
    const stored = localStorage.getItem('sk-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.apply(stored === 'dark' || (!stored && prefersDark));
  }

  toggle(): void {
    this.apply(!this._isDark());
  }

  setDark(dark: boolean): void {
    this.apply(dark);
  }

  private apply(dark: boolean): void {
    this._isDark.set(dark);
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('sk-theme', dark ? 'dark' : 'light');
  }
}
