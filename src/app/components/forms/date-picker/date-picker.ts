import { ChangeDetectionStrategy, Component, computed, forwardRef, input, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { FormFieldBase } from '../form-field.base';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export interface CalendarDay {
  date: Date;
  currentMonth: boolean;
  today: boolean;
  selected: boolean;
}

@Component({
  selector: 'sk-date-picker',
  templateUrl: './date-picker.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
    '(document:click)': 'closePanel()',
  },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DatePickerComponent), multi: true }],
})
export class DatePickerComponent extends FormFieldBase<string> {
  readonly label = input('');
  readonly placeholder = input('Select a date');
  readonly error = input('');
  readonly hint = input('');
  readonly required = input(false);
  readonly id = input(`sk-date-${Math.random().toString(36).slice(2)}`);

  protected readonly isOpen = signal(false);
  protected readonly viewYear = signal(new Date().getFullYear());
  protected readonly viewMonth = signal(new Date().getMonth());
  protected readonly weekDays = DAYS;

  protected readonly displayValue = computed(() => {
    const v = this._value();
    if (!v) return '';
    const d = new Date(v + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  });

  protected readonly monthLabel = computed(() => `${MONTHS[this.viewMonth()]} ${this.viewYear()}`);

  protected readonly calendarDays = computed((): CalendarDay[] => {
    const year = this.viewYear();
    const month = this.viewMonth();
    const today = new Date();
    const selectedIso = this._value();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();

    const days: CalendarDay[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, daysInPrev - i);
      days.push({ date, currentMonth: false, today: false, selected: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const iso = toIso(date);
      days.push({
        date,
        currentMonth: true,
        today: sameDay(date, today),
        selected: iso === selectedIso,
      });
    }

    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(year, month + 1, d);
      days.push({ date, currentMonth: false, today: false, selected: false });
    }

    return days;
  });

  protected readonly triggerClass = computed(() => {
    const base =
      'w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border text-sm ' +
      'bg-slate-100 dark:bg-background-dark transition-shadow ' +
      'disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2';
    const border = this.error()
      ? 'border-rose-400 dark:border-rose-600 focus:ring-rose-400/30'
      : 'border-transparent focus:ring-primary/30';
    const text = this.displayValue() ? 'text-slate-900 dark:text-white' : 'text-slate-400';
    return `${base} ${border} ${text}`;
  });

  openPanel(e: Event): void {
    e.stopPropagation();
    if (this._disabled()) return;
    if (!this.isOpen()) {
      const v = this._value();
      if (v) {
        const d = new Date(v + 'T00:00:00');
        this.viewYear.set(d.getFullYear());
        this.viewMonth.set(d.getMonth());
      } else {
        this.viewYear.set(new Date().getFullYear());
        this.viewMonth.set(new Date().getMonth());
      }
    }
    this.isOpen.update((v) => !v);
  }

  prevMonth(): void {
    const m = this.viewMonth();
    if (m === 0) {
      this.viewMonth.set(11);
      this.viewYear.update((y) => y - 1);
    } else {
      this.viewMonth.update((v) => v - 1);
    }
  }

  nextMonth(): void {
    const m = this.viewMonth();
    if (m === 11) {
      this.viewMonth.set(0);
      this.viewYear.update((y) => y + 1);
    } else {
      this.viewMonth.update((v) => v + 1);
    }
  }

  selectDay(day: CalendarDay, e: Event): void {
    e.stopPropagation();
    const iso = toIso(day.date);
    this._value.set(iso);
    this.onChange(iso);
    this.markTouched();
    this.isOpen.set(false);
  }

  clearValue(e: Event): void {
    e.stopPropagation();
    this._value.set(null);
    this.onChange(null);
    this.markTouched();
  }

  closePanel(): void {
    this.isOpen.set(false);
  }
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
