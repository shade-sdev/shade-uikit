import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API_BASE_URL } from '../../core/api.config';
import { JwtService, HasRoleDirective } from '../../core/jwt';
import { APP_PERMISSIONS } from '../../core/permissions';
import { AsyncLoadFn, AsyncSelectComponent } from '../../components/forms/async-select/async-select';
import { SelectOption } from '../../components/forms/select/select';
import { InputComponent } from '../../components/forms/input/input';
import { PageContainerComponent } from '../../components/layout/page-container/page-container';
import { BreadcrumbComponent } from '../../components/layout/breadcrumb/breadcrumb';
import { PageHeaderComponent } from '../../components/layout/page-header/page-header';
import { ButtonComponent } from '../../components/atoms/button/button';
import { CardComponent } from '../../components/atoms/card/card';
import { SkeletonComponent } from '../../components/feedback/skeleton/skeleton';
import { ToastService } from '../../components/feedback/toast/toast.service';

interface ClientMetricDefinition {
  id: string;
  code: string;
  unit: string;
  group: string;
}

interface SearchDefinitionsResponse {
  definitions: ClientMetricDefinition[];
}

/** A single metric value as returned by the GET values endpoint */
interface MetricValueItem {
  id: string;
  definitionId: string;
  code: string;
  unit: string;
  value: string;
}

/** Either a flat value item or a grouped container */
interface SearchMetricValuesResponse {
  groups: (MetricValueItem | { groupName: string; fields: MetricValueItem[] })[];
}

interface SearchClientsResponse {
  clients: {
    id: string;
    information: { firstName: string; lastName: string };
    plan?: { membershipPlan?: string };
  }[];
}

interface ClientResponse {
  id: string;
  information: { firstName: string; lastName: string };
  plan?: { membershipPlan?: string };
}

interface SelectedClient {
  id: string;
  name: string;
  plan: string;
}

interface FieldState {
  definitionId: string;
  code: string;
  unit: string;
  group: string;
  existingId: string | null;
  originalValue: string;
  ctrl: FormControl<string | null>;
}

@Component({
  selector: 'app-client-metric-values',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    HasRoleDirective,
    PageContainerComponent,
    BreadcrumbComponent,
    PageHeaderComponent,
    ButtonComponent,
    CardComponent,
    SkeletonComponent,
    AsyncSelectComponent,
    InputComponent,
  ],
  templateUrl: './client-metric-values.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientMetricValuesComponent {
  private readonly http       = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly jwt        = inject(JwtService);
  private readonly toast      = inject(ToastService);

  protected readonly P = APP_PERMISSIONS;

  private readonly companyId    = this.jwt.getClaim<string>('businessId') ?? '';
  private readonly clientUserId = this.jwt.getClaim<string>('userId') ?? '';

  protected readonly isClientRole = computed(() => this.jwt.roles().includes('CLIENT'));

  protected readonly breadcrumbs = [
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'Client Metrics' },
  ];

  // ── Client selector (admin only) ──────────────────────────────────────────

  protected readonly clientCtrl = new FormControl<string | null>(null);

  protected readonly clientLoadFn: AsyncLoadFn = (search: string) => {
    const params = new URLSearchParams({ pageNumber: '0', pageSize: '15' });
    if (search.trim()) params.set('firstName', search.trim());
    return this.http
      .get<SearchClientsResponse>(
        `${this.apiBaseUrl}/api/companies/${this.companyId}/clients?${params}`,
      )
      .pipe(
        catchError(() => of({ clients: [] })),
        map((data): SelectOption[] =>
          data.clients.map((c) => ({
            label: `${c.information.firstName} ${c.information.lastName}`.trim(),
            value: c.id,
          })),
        ),
      );
  };

  // ── Page state ─────────────────────────────────────────────────────────────

  protected readonly isLoading       = signal(false);
  protected readonly isLoadingClient = signal(false);
  protected readonly isSaving        = signal(false);
  protected readonly selectedClient  = signal<SelectedClient | null>(null);
  protected readonly fields          = signal<FieldState[]>([]);

  protected readonly groupedFields = computed((): [string, FieldState[]][] => {
    const map = new Map<string, FieldState[]>();
    for (const f of this.fields()) {
      const g = f.group?.trim() || 'Uncategorized';
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(f);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  });

  constructor() {
    if (this.isClientRole()) {
      // CLIENT: auto-load own profile, build fields from values response directly
      // (CLIENT does not have CLIENT_METRIC_DEFINITION_MINE_READ)
      this.autoLoadSelfClient();
    } else {
      // Admin: load definitions first, then react to client selector
      this.loadDefinitions();
      this.clientCtrl.valueChanges.subscribe((id) => {
        if (id) this.loadClientValues(id);
      });
    }
  }

  // ── CLIENT: auto-load self via /clients/users/{userId} ────────────────────

  private autoLoadSelfClient(): void {
    this.isLoading.set(true);
    this.isLoadingClient.set(true);
    this.http
      .get<ClientResponse>(
        `${this.apiBaseUrl}/api/companies/${this.companyId}/clients/users/${this.clientUserId}`,
      )
      .pipe(catchError(() => of(null)))
      .subscribe((client) => {
        if (!client) {
          this.isLoading.set(false);
          this.isLoadingClient.set(false);
          return;
        }
        const { firstName, lastName } = client.information;
        this.selectedClient.set({
          id: client.id,
          name: `${firstName} ${lastName}`.trim(),
          plan: client.plan?.membershipPlan ?? '',
        });
        this.loadMetricValuesForClient(client.id);
      });
  }

  /** For CLIENT: build fields FROM the values response (no definitions endpoint needed) */
  private loadMetricValuesForClient(clientId: string): void {
    this.http
      .get<SearchMetricValuesResponse>(
        `${this.apiBaseUrl}/api/companies/${this.companyId}/clients/${clientId}/client-metric-value`,
      )
      .pipe(catchError(() => of({ groups: [] })))
      .subscribe((response) => {
        const newFields: FieldState[] = [];
        for (const item of response.groups ?? []) {
          if ('fields' in item) {
            // ClientMetricGroupValueApiBean — preferred shape
            for (const f of item.fields) {
              newFields.push({
                definitionId: f.definitionId,
                code: f.code,
                unit: f.unit ?? '',
                group: item.groupName,
                existingId: f.id || null,
                originalValue: f.value ?? '',
                ctrl: new FormControl<string | null>(f.value || null),
              });
            }
          } else if ('definitionId' in item) {
            // Flat shape fallback
            newFields.push({
              definitionId: item.definitionId,
              code: item.code,
              unit: item.unit ?? '',
              group: 'Metrics',
              existingId: item.id || null,
              originalValue: item.value ?? '',
              ctrl: new FormControl<string | null>(item.value || null),
            });
          }
        }
        this.fields.set(newFields);
        this.isLoading.set(false);
        this.isLoadingClient.set(false);
      });
  }

  // ── Admin: load definitions (structure) ───────────────────────────────────

  private loadDefinitions(): void {
    this.isLoading.set(true);
    const params = new URLSearchParams({ pageNumber: '0', pageSize: '999' });
    this.http
      .get<SearchDefinitionsResponse>(
        `${this.apiBaseUrl}/api/companies/${this.companyId}/client-metric-definitions?${params}`,
      )
      .pipe(catchError(() => of({ definitions: [] })))
      .subscribe((data) => {
        this.fields.set(
          data.definitions.map((def) => ({
            definitionId: def.id,
            code: def.code,
            unit: def.unit ?? '',
            group: def.group ?? 'Uncategorized',
            existingId: null,
            originalValue: '',
            ctrl: new FormControl<string | null>(null),
          })),
        );
        this.isLoading.set(false);
      });
  }

  // ── Admin: load selected client + their values in parallel ────────────────

  private loadClientValues(clientId: string): void {
    this.isLoadingClient.set(true);
    this.selectedClient.set(null);

    forkJoin({
      client: this.http
        .get<ClientResponse>(
          `${this.apiBaseUrl}/api/companies/${this.companyId}/clients/${clientId}`,
        )
        .pipe(catchError(() => of(null))),
      values: this.http
        .get<SearchMetricValuesResponse>(
          `${this.apiBaseUrl}/api/companies/${this.companyId}/clients/${clientId}/client-metric-value`,
        )
        .pipe(catchError(() => of({ groups: [] }))),
    }).subscribe(({ client, values }) => {
      if (client) {
        const { firstName, lastName } = client.information;
        this.selectedClient.set({
          id: clientId,
          name: `${firstName} ${lastName}`.trim(),
          plan: client.plan?.membershipPlan ?? '',
        });
      }
      this.applyExistingValues(values);
      this.isLoadingClient.set(false);
    });
  }

  /** Admin: merge fetched values into the pre-built fields list */
  private applyExistingValues(response: SearchMetricValuesResponse): void {
    const existing = new Map<string, { id: string; value: string }>();
    for (const item of response.groups ?? []) {
      if ('definitionId' in item) {
        existing.set(item.definitionId, { id: item.id, value: item.value ?? '' });
      } else if ('fields' in item) {
        for (const f of item.fields) {
          existing.set(f.definitionId, { id: f.id, value: f.value ?? '' });
        }
      }
    }
    this.fields.update((list) =>
      list.map((f) => {
        const ex = existing.get(f.definitionId);
        const val = ex?.value ?? '';
        f.ctrl.setValue(val || null, { emitEvent: false });
        return { ...f, existingId: ex?.id ?? null, originalValue: val };
      }),
    );
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  protected onSave(): void {
    const clientId = this.selectedClient()?.id;
    if (!clientId) return;

    const payload = this.fields()
      .filter((f) => {
        const val = f.ctrl.value ?? '';
        if (f.existingId === null && val === '') return false;
        return true;
      })
      .map((f) => ({
        id: f.existingId,
        definitionId: f.definitionId,
        value: f.ctrl.value ?? '',
      }));

    if (!payload.length) {
      this.toast.success('No changes to save');
      return;
    }

    this.isSaving.set(true);
    this.http
      .post(
        `${this.apiBaseUrl}/api/companies/${this.companyId}/clients/${clientId}/client-metric-value`,
        { values: payload },
      )
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.toast.success('Metrics saved');
          if (this.isClientRole()) {
            this.loadMetricValuesForClient(clientId);
          } else {
            this.applyExistingValues({ groups: [] });
            this.loadClientValues(clientId);
          }
        },
        error: () => this.isSaving.set(false),
      });
  }

  // ── Visual helpers ────────────────────────────────────────────────────────

  protected dotClass(groupName: string): string {
    const classes = [
      'w-2.5 h-2.5 rounded-full shrink-0 bg-primary',
      'w-2.5 h-2.5 rounded-full shrink-0 bg-emerald-500',
      'w-2.5 h-2.5 rounded-full shrink-0 bg-violet-500',
      'w-2.5 h-2.5 rounded-full shrink-0 bg-amber-500',
      'w-2.5 h-2.5 rounded-full shrink-0 bg-rose-500',
      'w-2.5 h-2.5 rounded-full shrink-0 bg-sky-500',
      'w-2.5 h-2.5 rounded-full shrink-0 bg-teal-500',
      'w-2.5 h-2.5 rounded-full shrink-0 bg-fuchsia-500',
    ];
    return classes[this.groupHash(groupName, classes.length)];
  }

  protected countBadgeClass(groupName: string): string {
    const classes = [
      'bg-primary/10 text-primary border border-primary/20',
      'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
      'bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800',
      'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
      'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800',
      'bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800',
      'bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-800',
      'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200 dark:bg-fuchsia-900/20 dark:text-fuchsia-400 dark:border-fuchsia-800',
    ];
    return classes[this.groupHash(groupName, classes.length)];
  }

  protected initials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0] ?? '')
      .join('')
      .toUpperCase();
  }

  private groupHash(name: string, mod: number): number {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % mod;
    return h;
  }
}
