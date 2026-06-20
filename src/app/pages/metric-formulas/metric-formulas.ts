import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API_BASE_URL } from '../../core/api.config';
import { JwtService, HasRoleDirective } from '../../core/jwt';
import { APP_PERMISSIONS } from '../../core/permissions';
import { ToastService } from '../../components/feedback/toast/toast.service';
import { ModalComponent } from '../../components/feedback/modal/modal';
import { InputComponent } from '../../components/forms/input/input';
import { TextareaComponent } from '../../components/forms/textarea/textarea';
import { PageContainerComponent } from '../../components/layout/page-container/page-container';
import { BreadcrumbComponent } from '../../components/layout/breadcrumb/breadcrumb';
import { PageHeaderComponent } from '../../components/layout/page-header/page-header';
import { ButtonComponent } from '../../components/atoms/button/button';
import { CardComponent } from '../../components/atoms/card/card';
import { SkeletonComponent } from '../../components/feedback/skeleton/skeleton';

interface MetricDefinition {
  id: string;
  code: string;
  unit?: string;
  group?: string;
}

interface MetricFormula {
  id: string;
  label: string;
  expression: string;
  description?: string;
  definitionIds?: string[];
}

interface SearchMetricFormulasResponse {
  formulas: MetricFormula[];
}

interface SearchDefinitionsResponse {
  definitions: MetricDefinition[];
}

@Component({
  selector: 'app-metric-formulas',
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
    TextareaComponent,
    SkeletonComponent,
  ],
  templateUrl: './metric-formulas.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricFormulasComponent {
  private readonly http       = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly jwt        = inject(JwtService);
  private readonly toast      = inject(ToastService);

  protected readonly P = APP_PERMISSIONS;

  private readonly companyId = this.jwt.getClaim<string>('businessId') ?? '';

  protected readonly breadcrumbs = [
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'Metric Formulas' },
  ];

  // ── Formulas list ─────────────────────────────────────────────────────────

  protected readonly formulas  = signal<MetricFormula[]>([]);
  protected readonly isLoading = signal(true);

  // ── Definition chips (loaded once per modal open) ─────────────────────────

  protected readonly availableDefinitions = signal<MetricDefinition[]>([]);
  protected readonly isLoadingDefs        = signal(false);

  // ── Form controls ─────────────────────────────────────────────────────────

  protected readonly labelCtrl       = new FormControl<string | null>(null);
  protected readonly expressionCtrl  = new FormControl<string | null>(null);
  protected readonly descriptionCtrl = new FormControl<string | null>(null);

  // Mirror expression as a signal so computed() can derive used-definitions
  private readonly expressionValue = toSignal(
    this.expressionCtrl.valueChanges.pipe(map(v => v ?? '')),
    { initialValue: '' },
  );

  /** IDs of definitions whose code appears in the current expression */
  protected readonly usedDefinitionIds = computed((): Set<string> => {
    const expr = this.expressionValue();
    const used = new Set<string>();
    for (const def of this.availableDefinitions()) {
      try {
        if (new RegExp(`(?<![\\w])${def.code}(?![\\w])`).test(expr)) {
          used.add(def.id);
        }
      } catch { /* skip invalid code */ }
    }
    return used;
  });

  // ── Modals ────────────────────────────────────────────────────────────────

  protected readonly isAddModalOpen  = signal(false);
  protected readonly isSubmitting    = signal(false);

  protected readonly isEditModalOpen = signal(false);
  protected readonly editingFormula  = signal<MetricFormula | null>(null);
  protected readonly isUpdating      = signal(false);

  protected readonly isDeleteModalOpen = signal(false);
  protected readonly formulaToDelete   = signal<MetricFormula | null>(null);
  protected readonly isDeleting        = signal(false);

  constructor() {
    this.load();
  }

  // ── Data ──────────────────────────────────────────────────────────────────

  private load(): void {
    this.isLoading.set(true);
    this.http
      .get<SearchMetricFormulasResponse>(
        `${this.apiBaseUrl}/api/companies/${this.companyId}/metric-formulas`,
      )
      .subscribe({
        next: (data) => {
          this.formulas.set(data.formulas ?? []);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  private loadDefinitions(): void {
    if (this.availableDefinitions().length) return; // already loaded
    this.isLoadingDefs.set(true);
    const params = new URLSearchParams({ pageNumber: '0', pageSize: '999' });
    this.http
      .get<SearchDefinitionsResponse>(
        `${this.apiBaseUrl}/api/companies/${this.companyId}/client-metric-definitions?${params}`,
      )
      .pipe(catchError(() => of({ definitions: [] })))
      .subscribe((data) => {
        this.availableDefinitions.set(data.definitions ?? []);
        this.isLoadingDefs.set(false);
      });
  }

  private resetControls(): void {
    this.labelCtrl.setValue(null);
    this.expressionCtrl.setValue(null);
    this.descriptionCtrl.setValue(null);
  }

  // ── Expression builder ────────────────────────────────────────────────────

  /**
   * Inserts a definition code into the expression textarea at the current
   * cursor position, adding spaces where needed.
   */
  protected insertCode(code: string, textarea: HTMLTextAreaElement): void {
    const start   = textarea.selectionStart ?? (this.expressionCtrl.value?.length ?? 0);
    const end     = textarea.selectionEnd   ?? start;
    const current = this.expressionCtrl.value ?? '';

    const before = current.slice(0, start);
    const after  = current.slice(end);

    // Brackets get no auto-spacing — user places them exactly where needed
    const isBracket = code === '(' || code === ')';
    const spaceBefore = isBracket ? '' : (before.length > 0 && !/[\s(]$/.test(before) ? ' ' : '');
    const spaceAfter  = isBracket ? '' : (/^[\s)]/.test(after) ? '' : ' ');

    this.expressionCtrl.setValue(before + spaceBefore + code + spaceAfter + after);

    // Place cursor after the inserted token, before the trailing space
    const newCursor = start + spaceBefore.length + code.length;
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursor, newCursor);
    });
  }

  /** Scans the expression and returns the IDs of referenced definitions. */
  private getLinkedDefinitionIds(): string[] {
    const expr = this.expressionCtrl.value ?? '';
    return this.availableDefinitions()
      .filter((def) => {
        try {
          return new RegExp(`(?<![\\w])${def.code}(?![\\w])`).test(expr);
        } catch {
          return false;
        }
      })
      .map((def) => def.id);
  }

  // ── Add ───────────────────────────────────────────────────────────────────

  protected onAddClick(): void {
    this.resetControls();
    this.isAddModalOpen.set(true);
    this.loadDefinitions();
  }

  protected onAddModalClosed(): void {
    this.isAddModalOpen.set(false);
    this.isSubmitting.set(false);
  }

  protected onSubmitAdd(): void {
    const label      = this.labelCtrl.value?.trim();
    const expression = this.expressionCtrl.value?.trim();
    if (!label || !expression) return;

    const definitionIds = this.getLinkedDefinitionIds();
    this.isSubmitting.set(true);
    this.http
      .post(`${this.apiBaseUrl}/api/companies/${this.companyId}/metric-formulas`, {
        label,
        expression,
        description: this.descriptionCtrl.value?.trim() || undefined,
        definitionIds: definitionIds.length ? definitionIds : undefined,
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.toast.success('Formula added');
          this.onAddModalClosed();
          this.load();
        },
        error: () => this.isSubmitting.set(false),
      });
  }

  // ── Edit ──────────────────────────────────────────────────────────────────

  protected onEditClick(formula: MetricFormula): void {
    this.editingFormula.set(formula);
    this.labelCtrl.setValue(formula.label);
    this.expressionCtrl.setValue(formula.expression);
    this.descriptionCtrl.setValue(formula.description ?? null);
    this.isEditModalOpen.set(true);
    this.loadDefinitions();
  }

  protected onEditModalClosed(): void {
    this.isEditModalOpen.set(false);
    this.isUpdating.set(false);
    this.editingFormula.set(null);
  }

  protected onSubmitEdit(): void {
    const formula    = this.editingFormula();
    const label      = this.labelCtrl.value?.trim();
    const expression = this.expressionCtrl.value?.trim();
    if (!formula || !label || !expression) return;

    const definitionIds = this.getLinkedDefinitionIds();
    this.isUpdating.set(true);
    this.http
      .put(`${this.apiBaseUrl}/api/companies/${this.companyId}/metric-formulas/${formula.id}`, {
        label,
        expression,
        description: this.descriptionCtrl.value?.trim() || undefined,
        definitionIds,
      })
      .subscribe({
        next: () => {
          this.isUpdating.set(false);
          this.toast.success('Formula updated');
          this.onEditModalClosed();
          this.load();
        },
        error: () => this.isUpdating.set(false),
      });
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  protected onDeleteClick(formula: MetricFormula): void {
    this.formulaToDelete.set(formula);
    this.isDeleteModalOpen.set(true);
  }

  protected onDeleteModalClosed(): void {
    this.isDeleteModalOpen.set(false);
    this.isDeleting.set(false);
    this.formulaToDelete.set(null);
  }

  protected onConfirmDelete(): void {
    const formula = this.formulaToDelete();
    if (!formula) return;
    this.isDeleting.set(true);
    this.http
      .delete(`${this.apiBaseUrl}/api/companies/${this.companyId}/metric-formulas/${formula.id}`)
      .subscribe({
        next: () => {
          this.isDeleting.set(false);
          this.toast.success('Formula deleted');
          this.onDeleteModalClosed();
          this.load();
        },
        error: () => this.isDeleting.set(false),
      });
  }
}
