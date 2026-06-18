import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { API_BASE_URL } from '../../core/api.config';
import { JwtService, HasRoleDirective } from '../../core/jwt';
import { APP_PERMISSIONS } from '../../core/permissions';
import { ToastService } from '../../components/feedback/toast/toast.service';
import { ModalComponent } from '../../components/feedback/modal/modal';
import { InputComponent } from '../../components/forms/input/input';
import { PageContainerComponent } from '../../components/layout/page-container/page-container';
import { BreadcrumbComponent } from '../../components/layout/breadcrumb/breadcrumb';
import { PageHeaderComponent } from '../../components/layout/page-header/page-header';
import { ButtonComponent } from '../../components/atoms/button/button';
import { CardComponent } from '../../components/atoms/card/card';
import { SkeletonComponent } from '../../components/feedback/skeleton/skeleton';

interface ClientMetricDefinition {
  id: string;
  companyId: string;
  code: string;
  unit: string;
  group: string;
  auditData: {
    createdDate: string;
    createdBy: string;
    lastModifiedDate: string;
    lastModifiedBy: string;
  };
  version: number;
}

interface SearchClientMetricDefinitionsResponse {
  definitions: ClientMetricDefinition[];
  pageSize: number;
  pageNumber: number;
  totalElements: number;
  totalPages: number;
}

@Component({
  selector: 'app-client-metric-definitions',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PageContainerComponent,
    BreadcrumbComponent,
    PageHeaderComponent,
    ButtonComponent,
    CardComponent,
    ModalComponent,
    InputComponent,
    SkeletonComponent,
    HasRoleDirective,
  ],
  templateUrl: './client-metric-definitions.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientMetricDefinitionsComponent {
  private readonly http       = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly jwt        = inject(JwtService);
  private readonly toast      = inject(ToastService);

  protected readonly P = APP_PERMISSIONS;

  private readonly companyId = this.jwt.getClaim<string>('businessId') ?? '';

  protected readonly definitions = signal<ClientMetricDefinition[]>([]);
  protected readonly isLoading   = signal(true);

  /** Definitions grouped alphabetically by their `group` field. */
  protected readonly groupedDefinitions = computed((): [string, ClientMetricDefinition[]][] => {
    const map = new Map<string, ClientMetricDefinition[]>();
    for (const def of this.definitions()) {
      const g = def.group?.trim() || 'Uncategorized';
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(def);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  });

  // Shared form controls — reset on add, pre-filled on edit
  protected readonly codeCtrl  = new FormControl<string | null>(null);
  protected readonly unitCtrl  = new FormControl<string | null>(null);
  protected readonly groupCtrl = new FormControl<string | null>(null);

  // Add modal
  protected readonly isAddModalOpen  = signal(false);
  protected readonly isSubmitting    = signal(false);

  // Edit modal
  protected readonly isEditModalOpen = signal(false);
  protected readonly editingDef      = signal<ClientMetricDefinition | null>(null);
  protected readonly isUpdating      = signal(false);

  // Delete modal
  protected readonly isDeleteModalOpen = signal(false);
  protected readonly defToDelete       = signal<ClientMetricDefinition | null>(null);
  protected readonly isDeleting        = signal(false);

  protected readonly breadcrumbs = [
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'Metric Definitions' },
  ];

  constructor() {
    this.load();
  }

  // ── Data loading ─────────────────────────────────────────────────────────

  private load(): void {
    this.isLoading.set(true);
    const params = new URLSearchParams({ pageNumber: '0', pageSize: '999' });
    this.http
      .get<SearchClientMetricDefinitionsResponse>(
        `${this.apiBaseUrl}/api/companies/${this.companyId}/client-metric-definitions?${params}`,
      )
      .subscribe({
        next: (data) => {
          this.definitions.set(data.definitions);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  private resetControls(): void {
    this.codeCtrl.setValue(null);
    this.unitCtrl.setValue(null);
    this.groupCtrl.setValue(null);
  }

  // ── Add ───────────────────────────────────────────────────────────────────

  protected onAddClick(): void {
    this.resetControls();
    this.isAddModalOpen.set(true);
  }

  protected onAddModalClosed(): void {
    this.isAddModalOpen.set(false);
    this.isSubmitting.set(false);
  }

  protected onSubmitAdd(): void {
    const code  = this.codeCtrl.value?.trim();
    const group = this.groupCtrl.value?.trim();
    if (!code || !group) return;

    this.isSubmitting.set(true);
    this.http
      .post(
        `${this.apiBaseUrl}/api/companies/${this.companyId}/client-metric-definitions`,
        { code, unit: this.unitCtrl.value?.trim() || undefined, group },
      )
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.toast.success('Metric definition added');
          this.onAddModalClosed();
          this.load();
        },
        error: () => this.isSubmitting.set(false),
      });
  }

  // ── Edit ──────────────────────────────────────────────────────────────────

  protected onEditClick(def: ClientMetricDefinition): void {
    this.editingDef.set(def);
    this.codeCtrl.setValue(def.code);
    this.unitCtrl.setValue(def.unit ?? null);
    this.groupCtrl.setValue(def.group);
    this.isEditModalOpen.set(true);
  }

  protected onEditModalClosed(): void {
    this.isEditModalOpen.set(false);
    this.isUpdating.set(false);
    this.editingDef.set(null);
  }

  protected onSubmitEdit(): void {
    const def = this.editingDef();
    if (!def) return;
    const code  = this.codeCtrl.value?.trim();
    const group = this.groupCtrl.value?.trim();
    if (!code || !group) return;

    this.isUpdating.set(true);
    this.http
      .put(
        `${this.apiBaseUrl}/api/companies/${this.companyId}/client-metric-definitions/${def.id}`,
        { code, unit: this.unitCtrl.value?.trim() || undefined, group },
      )
      .subscribe({
        next: () => {
          this.isUpdating.set(false);
          this.toast.success('Metric definition updated');
          this.onEditModalClosed();
          this.load();
        },
        error: () => this.isUpdating.set(false),
      });
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  protected onDeleteClick(def: ClientMetricDefinition): void {
    this.defToDelete.set(def);
    this.isDeleteModalOpen.set(true);
  }

  protected onDeleteModalClosed(): void {
    this.isDeleteModalOpen.set(false);
    this.isDeleting.set(false);
    this.defToDelete.set(null);
  }

  protected onConfirmDelete(): void {
    const def = this.defToDelete();
    if (!def) return;
    this.isDeleting.set(true);
    this.http
      .delete(
        `${this.apiBaseUrl}/api/companies/${this.companyId}/client-metric-definitions/${def.id}`,
      )
      .subscribe({
        next: () => {
          this.isDeleting.set(false);
          this.toast.success('Metric definition deleted');
          this.onDeleteModalClosed();
          this.load();
        },
        error: () => this.isDeleting.set(false),
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

  private groupHash(name: string, mod: number): number {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % mod;
    return h;
  }
}
