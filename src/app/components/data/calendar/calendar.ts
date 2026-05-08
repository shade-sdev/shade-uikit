import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export interface CalendarEvent {
  date: string; // ISO yyyy-MM-dd
  label: string;
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

export interface CalendarCell {
  date: Date;
  iso: string;
  currentMonth: boolean;
  today: boolean;
  selected: boolean;
  events: CalendarEvent[];
}

@Component({
  selector: 'sk-calendar',
  templateUrl: './calendar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarComponent {
  /** Read-only mode disables date selection */
  readonly readonly = input(false);
  /** Currently selected ISO date */
  readonly selected = input('');
  /** Events to display on the calendar */
  readonly events = input<CalendarEvent[]>([]);
  readonly dateSelected = output<string>();

  protected readonly weekDays = DAYS;
  protected readonly viewYear = signal(new Date().getFullYear());
  protected readonly viewMonth = signal(new Date().getMonth());
  protected readonly internalSelected = signal('');

  protected readonly monthLabel = computed(() => `${MONTHS[this.viewMonth()]} ${this.viewYear()}`);

  protected readonly cells = computed((): CalendarCell[] => {
    const year = this.viewYear();
    const month = this.viewMonth();
    const today = new Date();
    const sel = this.internalSelected() || this.selected();
    const eventsMap = buildEventsMap(this.events());

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();

    const cells: CalendarCell[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, daysInPrev - i);
      const iso = toIso(date);
      cells.push({ date, iso, currentMonth: false, today: false, selected: iso === sel, events: eventsMap[iso] ?? [] });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const iso = toIso(date);
      cells.push({
        date,
        iso,
        currentMonth: true,
        today: sameDay(date, today),
        selected: iso === sel,
        events: eventsMap[iso] ?? [],
      });
    }

    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(year, month + 1, d);
      const iso = toIso(date);
      cells.push({ date, iso, currentMonth: false, today: false, selected: iso === sel, events: eventsMap[iso] ?? [] });
    }

    return cells;
  });

  protected prevMonth(): void {
    if (this.viewMonth() === 0) {
      this.viewMonth.set(11);
      this.viewYear.update((y) => y - 1);
    } else {
      this.viewMonth.update((v) => v - 1);
    }
  }

  protected nextMonth(): void {
    if (this.viewMonth() === 11) {
      this.viewMonth.set(0);
      this.viewYear.update((y) => y + 1);
    } else {
      this.viewMonth.update((v) => v + 1);
    }
  }

  protected selectDate(cell: CalendarCell): void {
    if (this.readonly()) return;
    this.internalSelected.set(cell.iso);
    this.dateSelected.emit(cell.iso);
  }

  protected today(): void {
    const now = new Date();
    this.viewYear.set(now.getFullYear());
    this.viewMonth.set(now.getMonth());
  }

  protected eventColorClass(color: CalendarEvent['color']): string {
    const map: Record<string, string> = {
      primary: 'bg-primary',
      success: 'bg-emerald-500',
      warning: 'bg-amber-500',
      danger: 'bg-rose-500',
    };
    return map[color ?? 'primary'] ?? map['primary'];
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

function buildEventsMap(events: CalendarEvent[]): Record<string, CalendarEvent[]> {
  return events.reduce(
    (acc, e) => {
      (acc[e.date] ??= []).push(e);
      return acc;
    },
    {} as Record<string, CalendarEvent[]>,
  );
}
