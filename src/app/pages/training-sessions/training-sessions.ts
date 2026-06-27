import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API_BASE_URL } from '../../core/api.config';
import { JwtService, HasRoleDirective } from '../../core/jwt';
import { APP_PERMISSIONS } from '../../core/permissions';
import { ToastService } from '../../components/feedback/toast/toast.service';
import { AsyncLoadFn, AsyncSelectComponent } from '../../components/forms/async-select/async-select';
import { ModalComponent } from '../../components/feedback/modal/modal';
import { InputComponent } from '../../components/forms/input/input';
import { PageContainerComponent } from '../../components/layout/page-container/page-container';
import { BreadcrumbComponent } from '../../components/layout/breadcrumb/breadcrumb';
import { PageHeaderComponent } from '../../components/layout/page-header/page-header';
import { ButtonComponent } from '../../components/atoms/button/button';
import { CardComponent } from '../../components/atoms/card/card';
import { SkeletonComponent } from '../../components/feedback/skeleton/skeleton';

type CalendarView = 'month' | 'week' | 'day';
type PickerMode = 'year' | 'month';

interface TrainingSession {
  id?: string;
  clientId?: string;
  coachId?: string;
  coachName?: string;
  clientName?: string;
  sessionTitle: string;
  startDateTime: string;
  endDateTime: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  sessions: TrainingSession[];
}

interface WeekDay {
  date: Date;
  isToday: boolean;
  dayLabel: string;
  dateNum: string;
  sessions: TrainingSession[];
}

@Component({
  selector: 'app-training-sessions',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    HasRoleDirective,
    PageContainerComponent,
    BreadcrumbComponent,
    PageHeaderComponent,
    ButtonComponent,
    CardComponent,
    ModalComponent,
    InputComponent,
    AsyncSelectComponent,
    SkeletonComponent,
  ],
  templateUrl: './training-sessions.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrainingSessionsComponent {
  private readonly http       = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly jwt        = inject(JwtService);
  private readonly toast      = inject(ToastService);

  protected readonly P = APP_PERMISSIONS;
  private readonly companyId = this.jwt.getClaim<string>('businessId') ?? '';

  protected readonly breadcrumbs = [
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'Training Sessions' },
  ];

  protected readonly views: Array<{ value: CalendarView; label: string }> = [
    { value: 'month', label: 'Month' },
    { value: 'week',  label: 'Week'  },
    { value: 'day',   label: 'Day'   },
  ];

  protected readonly monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];

  // ── Role detection ─────────────────────────────────────────────────────────

  protected readonly isClientRole = computed(() => this.jwt.roles().includes('CLIENT'));

  /** Admins/managers with OTHER permissions need to select a coach when booking. */
  protected readonly showCoachSelector = computed(() => {
    const r = this.jwt.roles();
    return r.includes('TRAINING_SESSION_OTHER_MANAGEMENT') ||
           r.includes('TRAINING_SESSION_OTHER_CREATE');
  });

  protected readonly canEdit = computed(() =>
    APP_PERMISSIONS.trainingSessions.edit.some(r => this.jwt.roles().includes(r))
  );
  protected readonly canDelete = computed(() =>
    APP_PERMISSIONS.trainingSessions.delete.some(r => this.jwt.roles().includes(r))
  );

  // ── Calendar state ─────────────────────────────────────────────────────────

  protected readonly view        = signal<CalendarView>('month');
  protected readonly currentDate = signal(new Date());
  protected readonly sessions    = signal<TrainingSession[]>([]);
  protected readonly isLoading   = signal(false);

  // ── Year/month picker ──────────────────────────────────────────────────────

  protected readonly isPickerOpen = signal(false);
  protected readonly pickerYear   = signal(new Date().getFullYear());
  protected readonly pickerMode   = signal<PickerMode>('year');

  // ── Modals ─────────────────────────────────────────────────────────────────

  protected readonly isEditModalOpen   = signal(false);
  protected readonly editingSession    = signal<TrainingSession | null>(null);
  protected readonly isUpdating        = signal(false);
  protected readonly isDeleteModalOpen = signal(false);
  protected readonly sessionToDelete   = signal<TrainingSession | null>(null);
  protected readonly isDeleting        = signal(false);

  // ── Form controls ─────────────────────────────────────────────────────────

  protected readonly titleCtrl     = new FormControl<string | null>(null);
  protected readonly dateCtrl      = new FormControl<string | null>(null);
  protected readonly startTimeCtrl = new FormControl<string | null>(null);
  protected readonly endTimeCtrl   = new FormControl<string | null>(null);
  protected readonly coachCtrl     = new FormControl<string | null>(null);

  // ── Grid constants ─────────────────────────────────────────────────────────

  protected readonly HOUR_START  = 6;
  protected readonly HOUR_END    = 22;
  protected readonly HOUR_HEIGHT = 64;
  protected readonly gridHeight  = (this.HOUR_END - this.HOUR_START) * this.HOUR_HEIGHT;
  protected readonly gridHours   = Array.from({ length: this.HOUR_END - this.HOUR_START }, (_, i) => i);

  // ── Computed calendar data ─────────────────────────────────────────────────

  protected readonly monthDays = computed((): CalendarDay[] => {
    const date      = this.currentDate();
    const year      = date.getFullYear();
    const month     = date.getMonth();
    const sessions  = this.sessions();
    const today     = this.todayMidnight();
    const firstDay  = new Date(year, month, 1);
    const lastDayN  = new Date(year, month + 1, 0).getDate();
    const startDow  = (firstDay.getDay() + 6) % 7; // Mon=0

    const days: CalendarDay[] = [];
    for (let i = startDow; i > 0; i--) {
      days.push(this.makeDay(new Date(year, month, 1 - i), false, today, sessions));
    }
    for (let d = 1; d <= lastDayN; d++) {
      days.push(this.makeDay(new Date(year, month, d), true, today, sessions));
    }
    let n = 1;
    while (days.length < 42) {
      days.push(this.makeDay(new Date(year, month + 1, n++), false, today, sessions));
    }
    return days;
  });

  protected readonly weekDays = computed((): WeekDay[] => {
    const date      = this.currentDate();
    const sessions  = this.sessions();
    const weekStart = this.getWeekStart(date);
    const today     = this.todayMidnight();

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const ds = this.dateStr(d);
      return {
        date: d,
        isToday: d.getTime() === today.getTime(),
        dayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dateNum:  String(d.getDate()),
        sessions: sessions.filter(s => s.startDateTime.startsWith(ds)),
      };
    });
  });

  protected readonly daySessions = computed((): TrainingSession[] =>
    [...this.sessions()]
      .filter(s => s.startDateTime.startsWith(this.dateStr(this.currentDate())))
      .sort((a, b) => a.startDateTime.localeCompare(b.startDateTime))
  );

  protected readonly monthYearLabel = computed(() =>
    this.currentDate().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  );

  protected readonly weekLabel = computed(() => {
    const ws = this.getWeekStart(this.currentDate());
    const we = new Date(ws);
    we.setDate(we.getDate() + 6);
    return `${ws.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${we.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  });

  protected readonly dayLabel = computed(() =>
    this.currentDate().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  );

  protected readonly pickerYears = computed(() =>
    Array.from({ length: 12 }, (_, i) => this.pickerYear() - 5 + i)
  );

  // ── Async load functions ──────────────────────────────────────────────────

  protected readonly coachLoadFn: AsyncLoadFn<string> = (search) =>
    this.http.get<{ coaches: Array<{ id: string; information: { firstName: string; lastName: string } }> }>(
      `${this.apiBaseUrl}/api/companies/${this.companyId}/coaches`,
      { params: { pageNumber: '0', pageSize: '20', firstName: search } },
    ).pipe(
      map(d => (d.coaches ?? []).map(c => ({
        label: `${c.information.firstName} ${c.information.lastName}`,
        value: c.id,
      }))),
      catchError(() => of([])),
    );

  // ── Constructor ────────────────────────────────────────────────────────────

  constructor() {
    effect(() => {
      const view = this.view();
      const date = this.currentDate();
      untracked(() => this.doLoad(view, date));
    }, { allowSignalWrites: true });
  }

  // ── Calendar helpers ───────────────────────────────────────────────────────

  private todayMidnight(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private makeDay(date: Date, isCurrentMonth: boolean, today: Date, sessions: TrainingSession[]): CalendarDay {
    const ds = this.dateStr(date);
    return {
      date,
      isCurrentMonth,
      isToday: date.getTime() === today.getTime(),
      sessions: sessions.filter(s => s.startDateTime.startsWith(ds)),
    };
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    d.setDate(d.getDate() - (d.getDay() + 6) % 7);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private getISOYearWeek(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((d.valueOf() - yearStart.valueOf()) / 86400000 + 1) / 7);
    return d.getUTCFullYear() * 100 + week;
  }

  protected dateStr(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  protected formatTime(dt: string): string {
    return new Date(dt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Returns the name(s) to show beneath the session title in calendar events.
   * CLIENT → coachName only
   * COACH  → clientName only
   * OTHER  → "clientName · coachName"
   */
  protected sessionSubtitle(session: TrainingSession): string {
    if (this.isClientRole()) return session.coachName ?? '';
    if (this.showCoachSelector()) {
      return [session.clientName, session.coachName].filter(Boolean).join(' · ');
    }
    return session.clientName ?? '';
  }

  protected sessionSubtitleIcon(): string {
    return this.isClientRole() ? 'sports' : 'person';
  }

  protected formatHour(offset: number): string {
    const h = this.HOUR_START + offset;
    if (h === 0)  return '12 AM';
    if (h < 12)   return `${h} AM`;
    if (h === 12) return '12 PM';
    return `${h - 12} PM`;
  }

  protected getSessionTop(session: TrainingSession): number {
    const d = new Date(session.startDateTime);
    return Math.max(0, (d.getHours() - this.HOUR_START + d.getMinutes() / 60) * this.HOUR_HEIGHT);
  }

  protected getSessionHeight(session: TrainingSession): number {
    const start  = new Date(session.startDateTime);
    const end    = new Date(session.endDateTime);
    const hours  = (end.getTime() - start.getTime()) / 3600000;
    return Math.max(this.HOUR_HEIGHT / 2, hours * this.HOUR_HEIGHT);
  }

  protected isToday(date: Date): boolean {
    return date.getTime() === this.todayMidnight().getTime();
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  protected navigate(dir: 1 | -1): void {
    const d = new Date(this.currentDate());
    const v = this.view();
    if      (v === 'month') d.setMonth(d.getMonth() + dir);
    else if (v === 'week')  d.setDate(d.getDate() + dir * 7);
    else                    d.setDate(d.getDate() + dir);
    this.currentDate.set(d);
  }

  protected goToToday(): void {
    this.currentDate.set(new Date());
  }

  protected switchView(v: CalendarView): void {
    this.view.set(v);
  }

  protected onDayClick(date: Date): void {
    this.currentDate.set(new Date(date));
    this.view.set('day');
  }

  // ── Picker ─────────────────────────────────────────────────────────────────

  protected openPicker(): void {
    this.pickerYear.set(this.currentDate().getFullYear());
    this.pickerMode.set('year');
    this.isPickerOpen.set(true);
  }

  protected closePicker(): void {
    this.isPickerOpen.set(false);
  }

  protected navigatePickerDecade(dir: 1 | -1): void {
    this.pickerYear.update(y => y + dir * 12);
  }

  protected selectPickerYear(year: number): void {
    this.pickerYear.set(year);
    this.pickerMode.set('month');
  }

  protected selectPickerMonth(monthIndex: number): void {
    const d = new Date(this.currentDate());
    d.setFullYear(this.pickerYear());
    d.setMonth(monthIndex);
    this.currentDate.set(d);
    this.isPickerOpen.set(false);
  }

  // ── Data loading ───────────────────────────────────────────────────────────

  private doLoad(view: CalendarView, date: Date): void {
    this.sessions.set([]);
    this.isLoading.set(true);

    const params: Record<string, string> = {};
    if (view === 'month') {
      params['yearMonth'] = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else if (view === 'week') {
      params['yearWeek'] = String(this.getISOYearWeek(date));
    } else {
      params['date'] = this.dateStr(date);
    }

    this.http.get<{ sessions: TrainingSession[] }>(
      `${this.apiBaseUrl}/api/companies/training-sessions`,
      { params },
    ).pipe(catchError(() => of({ sessions: [] })))
    .subscribe(data => {
      this.sessions.set(data.sessions ?? []);
      this.isLoading.set(false);
    });
  }

  // ── Edit ───────────────────────────────────────────────────────────────────

  protected onEditClick(session: TrainingSession): void {
    if (!this.canEdit()) return;
    this.editingSession.set(session);
    this.titleCtrl.setValue(session.sessionTitle ?? null);
    const start = new Date(session.startDateTime);
    const end   = new Date(session.endDateTime);
    this.dateCtrl.setValue(this.dateStr(start));
    this.startTimeCtrl.setValue(`${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`);
    this.endTimeCtrl.setValue(`${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`);
    this.coachCtrl.setValue(session.coachId ?? null);
    this.isEditModalOpen.set(true);
  }

  protected onEditModalClosed(): void {
    this.isEditModalOpen.set(false);
    this.isUpdating.set(false);
    this.editingSession.set(null);
  }

  protected onSubmitEdit(): void {
    const session = this.editingSession();
    const title   = this.titleCtrl.value?.trim();
    const date    = this.dateCtrl.value;
    const start   = this.startTimeCtrl.value;
    const end     = this.endTimeCtrl.value;
    if (!session?.id || !session?.clientId || !title || !date || !start || !end) return;

    const body: Record<string, unknown> = {
      sessionTitle:  title,
      startDateTime: `${date}T${start}:00`,
      endDateTime:   `${date}T${end}:00`,
    };
    if (this.showCoachSelector() && this.coachCtrl.value) {
      body['coachId'] = this.coachCtrl.value;
    }

    this.isUpdating.set(true);
    this.http.put(
      `${this.apiBaseUrl}/api/companies/${this.companyId}/client/${session.clientId}/training-sessions/${session.id}`,
      body,
    ).subscribe({
      next: () => {
        this.isUpdating.set(false);
        this.toast.success('Session updated');
        this.onEditModalClosed();
        this.doLoad(this.view(), this.currentDate());
      },
      error: () => this.isUpdating.set(false),
    });
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  protected onDeleteClick(session: TrainingSession): void {
    this.sessionToDelete.set(session);
    this.isDeleteModalOpen.set(true);
  }

  protected onDeleteModalClosed(): void {
    this.isDeleteModalOpen.set(false);
    this.isDeleting.set(false);
    this.sessionToDelete.set(null);
  }

  protected onConfirmDelete(): void {
    const session = this.sessionToDelete();
    if (!session?.id) return;

    this.isDeleting.set(true);
    this.http.delete(
      `${this.apiBaseUrl}/api/companies/${this.companyId}/client/${session.clientId}/training-sessions/${session.id}`,
    ).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.toast.success('Session deleted');
        this.onDeleteModalClosed();
        this.doLoad(this.view(), this.currentDate());
      },
      error: () => this.isDeleting.set(false),
    });
  }

}
