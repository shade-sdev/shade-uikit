import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  absencesStore, AbsenceRequest, AbsenceType,
  ABSENCE_TYPE_LABELS, getEmployeeName, employeesStore,
} from '../../core/mock-data';
import { CalendarEvent } from '../../components/data/calendar/calendar';
import { BreadcrumbComponent } from '../../components/layout/breadcrumb/breadcrumb';
import { PageHeaderComponent } from '../../components/layout/page-header/page-header';
import { CardComponent } from '../../components/atoms/card/card';
import { AvatarComponent } from '../../components/atoms/avatar/avatar';
import { BadgeComponent } from '../../components/atoms/badge/badge';
import { ChipComponent } from '../../components/atoms/chip/chip';
import { EmptyStateComponent } from '../../components/atoms/empty-state/empty-state';
import { CalendarComponent } from '../../components/data/calendar/calendar';
import { AccordionComponent, AccordionItemComponent } from '../../components/data/accordion/accordion';

type AbsenceColor = 'primary' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-leave-calendar',
  imports: [
    DatePipe,
    BreadcrumbComponent, PageHeaderComponent,
    CardComponent, AvatarComponent, BadgeComponent, ChipComponent, EmptyStateComponent,
    CalendarComponent, AccordionComponent, AccordionItemComponent,
  ],
  templateUrl: './leave-calendar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaveCalendarComponent {

  protected readonly selectedDate  = signal('');
  protected readonly typeFilter    = signal<AbsenceType | ''>('');

  protected readonly typeFilters: { value: AbsenceType | ''; label: string }[] = [
    { value: '',          label: 'All Types'  },
    { value: 'vacation',  label: 'Vacation'   },
    { value: 'sick',      label: 'Sick Leave' },
    { value: 'personal',  label: 'Personal'   },
    { value: 'maternity', label: 'Maternity'  },
    { value: 'paternity', label: 'Paternity'  },
    { value: 'unpaid',    label: 'Unpaid'     },
  ];

  private readonly absenceColorMap: Record<AbsenceType, AbsenceColor> = {
    vacation:  'primary',
    sick:      'danger',
    personal:  'warning',
    maternity: 'success',
    paternity: 'success',
    unpaid:    'warning',
  };

  /** Only approved absences participate in the calendar */
  private readonly approvedAbsences = computed(() =>
    absencesStore().filter(a => a.status === 'approved')
  );

  private readonly filteredAbsences = computed(() => {
    const type = this.typeFilter();
    const all  = this.approvedAbsences();
    return type ? all.filter(a => a.type === type) : all;
  });

  /** Expand multi-day absences into one CalendarEvent per day */
  protected readonly calendarEvents = computed((): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    for (const a of this.filteredAbsences()) {
      const start = new Date(a.startDate);
      const end   = new Date(a.endDate);
      const name  = getEmployeeName(a.employeeId);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        events.push({
          date:  d.toISOString().slice(0, 10),
          label: name,
          color: this.absenceColorMap[a.type],
        });
      }
    }
    return events;
  });

  /** Absences on the selected date */
  protected readonly selectedDayAbsences = computed((): AbsenceRequest[] => {
    const date = this.selectedDate();
    if (!date) return [];
    return this.filteredAbsences().filter(a => a.startDate <= date && a.endDate >= date);
  });

  /** Upcoming approved absences (within 60 days), grouped into weeks */
  protected readonly upcomingGroups = computed(() => {
    const today  = new Date();
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() + 60);

    const upcoming = this.filteredAbsences()
      .filter(a => new Date(a.startDate) >= today && new Date(a.startDate) <= cutoff)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));

    // Group by ISO week label
    const groups: { label: string; items: AbsenceRequest[] }[] = [];
    let currentLabel = '';
    for (const a of upcoming) {
      const weekLabel = weekOf(a.startDate);
      if (weekLabel !== currentLabel) {
        currentLabel = weekLabel;
        groups.push({ label: weekLabel, items: [] });
      }
      groups[groups.length - 1].items.push(a);
    }
    return groups;
  });

  protected readonly absenceTypeLabels = ABSENCE_TYPE_LABELS;

  protected statusVariant(type: AbsenceType) {
    const map: Record<AbsenceType, 'active' | 'info' | 'pending' | 'completed' | 'warning'> = {
      vacation:  'active',
      sick:      'failed' as any,
      personal:  'warning',
      maternity: 'completed',
      paternity: 'completed',
      unpaid:    'draft'    as any,
    };
    return map[type];
  }

  protected getEmployee(id: string) {
    return employeesStore().find(e => e.id === id);
  }
  protected getEmployeeName = getEmployeeName;
}

function weekOf(iso: string): string {
  const d = new Date(iso);
  const mon = new Date(d);
  mon.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
  const fri = new Date(mon);
  fri.setDate(mon.getDate() + 4);
  const fmt = (dt: Date) =>
    dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `Week of ${fmt(mon)} – ${fmt(fri)}`;
}
