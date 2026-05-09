import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, catchError, debounceTime, of, switchMap } from 'rxjs';
import { SkeletonComponent } from '../../feedback/skeleton/skeleton';

export interface ColumnDef<T = any> {
  key: string;
  header: string;
  sortable?: boolean;
  /** Show a per-column filter input in the header (works in both modes) */
  filterable?: boolean;
  width?: string;
  /** Return HTML string for custom cell rendering */
  cell?: (row: T) => string;
  /** Return extra CSS classes for the cell */
  cellClass?: (row: T) => string;
}

export interface PagedResult<T = any> {
  data: T[];
  total: number;
}

export interface TableParams {
  page: number;
  pageSize: number;
  sort: { key: string; dir: 'asc' | 'desc' } | null;
  /** Per-column filter values keyed by ColumnDef.key */
  filters: Record<string, string>;
  /** Global quick-filter search string */
  search: string;
}

export interface SortState {
  key: string;
  dir: 'asc' | 'desc';
}

/**
 * A bulk action shown in the selection toolbar when rows are checked.
 * Pass an array via [bulkActions]; listen with (bulkAction) to receive
 * { action, rows } and perform any operation you like.
 */
export interface BulkAction {
  /** Unique key — use this in (bulkAction) to identify which button was clicked */
  key: string;
  label: string;
  icon?: string;
  /** Defaults to 'outline' */
  variant?: 'primary' | 'danger' | 'outline' | 'ghost';
}

@Component({
  selector: 'sk-table',
  imports: [SkeletonComponent],
  templateUrl: './table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableComponent<T extends Record<string, any> = Record<string, any>> {

  // ── Inputs ─────────────────────────────────────────────────────────────────

  readonly columns         = input.required<ColumnDef<T>[]>();

  /**
   * CLIENT-SIDE MODE — pass a plain array.
   * The table handles search, per-column filters, sorting, and pagination
   * entirely in the browser via computed signals. Reactive: any signal-driven
   * array passed here will re-process automatically.
   */
  readonly data            = input<T[]>();

  /**
   * SERVER-SIDE MODE — pass an async load function.
   * Called whenever page / sort / filter / search changes.
   * Receives the full TableParams so the server can do everything.
   * Use `of(result).pipe(delay(n))` for hardcoded mock data,
   * or `http.get(...)` for real HTTP calls.
   */
  readonly loadFn          = input<(params: TableParams) => Observable<PagedResult<T>>>();

  readonly pageSize        = input(10);
  readonly pageSizeOptions = input([10, 25, 50]);
  readonly selectable      = input(false);
  /** Clicking a row emits (rowClick). Adds cursor-pointer styling. */
  readonly clickable       = input(false);
  /** Show a built-in global search bar above the table. */
  readonly quickFilter     = input(false);
  readonly emptyMessage    = input('No data found');
  /**
   * Bulk actions shown in the selection toolbar when ≥1 row is checked.
   * Listen with (bulkAction) to receive { action, rows } and do anything you like.
   */
  readonly bulkActions     = input<BulkAction[]>([]);

  readonly rowSelected = output<T[]>();
  readonly rowClick    = output<T>();
  /** Emitted when a bulk action button is clicked. Carries the action config + every selected row. */
  readonly bulkAction  = output<{ action: BulkAction; rows: T[] }>();

  // ── Shared interaction state ────────────────────────────────────────────────

  protected readonly globalSearch    = signal('');
  protected readonly page            = signal(1);
  protected readonly currentPageSize = signal(10);
  protected readonly sort            = signal<SortState | null>(null);
  protected readonly filters         = signal<Record<string, string>>({});
  protected readonly selectedRows    = signal<Set<unknown>>(new Set());

  // ── Server-side state (updated by reload$ subscription) ────────────────────

  protected readonly serverRows  = signal<T[]>([]);
  protected readonly serverTotal = signal(0);
  protected readonly loading     = signal(false);

  // ── Client-side computed chain ──────────────────────────────────────────────

  /** Full filtered + sorted dataset before pagination (client mode only). */
  private readonly filteredData = computed((): T[] | null => {
    const raw = this.data();
    if (raw === undefined) return null; // server mode — skip

    let d = [...raw];

    // Global search across every column
    const q = this.globalSearch().trim().toLowerCase();
    if (q) {
      d = d.filter(row =>
        this.columns().some(col =>
          String(row[col.key] ?? '').toLowerCase().includes(q)
        )
      );
    }

    // Per-column filters
    for (const [key, val] of Object.entries(this.filters())) {
      if (val) {
        const v = val.toLowerCase();
        d = d.filter(row => String(row[key] ?? '').toLowerCase().includes(v));
      }
    }

    // Sort
    const s = this.sort();
    if (s) {
      d = [...d].sort((a, b) => {
        const av = String(a[s.key] ?? '');
        const bv = String(b[s.key] ?? '');
        return s.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }

    return d;
  });

  private readonly clientTotal = computed(() => this.filteredData()?.length ?? 0);

  private readonly clientRows = computed((): T[] => {
    const d = this.filteredData();
    if (!d) return [];
    const start = (this.page() - 1) * this.currentPageSize();
    return d.slice(start, start + this.currentPageSize());
  });

  // ── Unified view (template always reads these) ──────────────────────────────

  protected readonly isClientMode = computed(() => this.data() !== undefined);
  protected readonly displayRows  = computed(() =>
    this.isClientMode() ? this.clientRows()  : this.serverRows()
  );
  protected readonly displayTotal = computed(() =>
    this.isClientMode() ? this.clientTotal() : this.serverTotal()
  );

  // ── Pagination helpers ──────────────────────────────────────────────────────

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.displayTotal() / this.currentPageSize()))
  );

  protected readonly pageNumbers = computed(() => {
    const total   = this.totalPages();
    const current = this.page();
    const pages: (number | '...')[] = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
      if (current < total - 2) pages.push('...');
      pages.push(total);
    }
    return pages;
  });

  protected readonly allSelected = computed(() => {
    // In client mode, "select all" covers every filtered row across all pages.
    // In server mode, it covers only the current visible page.
    const all = this.isClientMode() ? (this.filteredData() ?? []) : this.displayRows();
    return all.length > 0 && all.every(r => this.selectedRows().has(this.rowId(r)));
  });

  protected readonly skeletonRows = computed(() =>
    Array.from({ length: this.currentPageSize() })
  );

  // ── Server-side reload pipeline ─────────────────────────────────────────────

  private readonly reload$    = new Subject<TableParams>();
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.currentPageSize.set(this.pageSize());

    this.reload$
      .pipe(
        debounceTime(50),
        switchMap(params => {
          const fn = this.loadFn();
          if (!fn) return of({ data: [], total: 0 });
          this.loading.set(true);
          return fn(params).pipe(catchError(() => of({ data: [], total: 0 })));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(result => {
        this.serverRows.set(result.data);
        this.serverTotal.set(result.total);
        this.loading.set(false);
      });

    // Trigger initial load; no-op in client mode (computed handles it)
    this.triggerLoad();
  }

  // ── Actions ─────────────────────────────────────────────────────────────────

  protected triggerLoad(): void {
    if (this.isClientMode()) return; // client mode is fully reactive via computed
    this.reload$.next({
      page:     this.page(),
      pageSize: this.currentPageSize(),
      sort:     this.sort(),
      filters:  this.filters(),
      search:   this.globalSearch(),
    });
  }

  protected onSearch(val: string): void {
    this.globalSearch.set(val);
    this.page.set(1);
    if (!this.isClientMode()) this.triggerLoad();
  }

  protected setPage(p: number | '...'): void {
    if (p === '...' || p === this.page()) return;
    this.page.set(p as number);
    if (!this.isClientMode()) this.triggerLoad();
  }

  protected prevPage(): void {
    if (this.page() > 1) {
      this.page.update(p => p - 1);
      if (!this.isClientMode()) this.triggerLoad();
    }
  }

  protected nextPage(): void {
    if (this.page() < this.totalPages()) {
      this.page.update(p => p + 1);
      if (!this.isClientMode()) this.triggerLoad();
    }
  }

  protected setPageSize(size: number): void {
    this.currentPageSize.set(size);
    this.page.set(1);
    if (!this.isClientMode()) this.triggerLoad();
  }

  protected toggleSort(col: ColumnDef<T>): void {
    if (!col.sortable) return;
    const current = this.sort();
    if (current?.key === col.key) {
      this.sort.set(current.dir === 'asc' ? { key: col.key, dir: 'desc' } : null);
    } else {
      this.sort.set({ key: col.key, dir: 'asc' });
    }
    this.page.set(1);
    if (!this.isClientMode()) this.triggerLoad();
  }

  protected onFilter(key: string, value: string): void {
    this.filters.update(f => {
      const next = { ...f };
      if (value) next[key] = value;
      else delete next[key];
      return next;
    });
    this.page.set(1);
    if (!this.isClientMode()) this.triggerLoad();
  }

  protected toggleSelectAll(): void {
    if (this.allSelected()) {
      this.selectedRows.set(new Set());
    } else {
      const all = this.isClientMode() ? (this.filteredData() ?? []) : this.displayRows();
      this.selectedRows.set(new Set(all.map(r => this.rowId(r))));
    }
    this.emitSelection();
  }

  protected clearSelection(): void {
    this.selectedRows.set(new Set());
  }

  protected onBulkActionClick(action: BulkAction): void {
    this.bulkAction.emit({ action, rows: this.getSelectedRows() });
  }

  protected toggleRow(row: T): void {
    this.selectedRows.update(set => {
      const next = new Set(set);
      const id   = this.rowId(row);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    this.emitSelection();
  }

  protected isRowSelected(row: T): boolean {
    return this.selectedRows().has(this.rowId(row));
  }

  protected cellValue(row: T, col: ColumnDef<T>): string {
    if (col.cell) return col.cell(row);
    const val = row[col.key];
    return val === null || val === undefined ? '' : String(val);
  }

  protected hasCustomCell(col: ColumnDef<T>): boolean { return !!col.cell; }

  protected sortIcon(col: ColumnDef<T>): string {
    const s = this.sort();
    if (!s || s.key !== col.key) return 'unfold_more';
    return s.dir === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  protected startIndex(): number {
    return this.displayTotal() === 0 ? 0 : (this.page() - 1) * this.currentPageSize() + 1;
  }

  protected endIndex(): number {
    return Math.min(this.page() * this.currentPageSize(), this.displayTotal());
  }

  private rowId(row: T): unknown { return (row as any)['id'] ?? row; }

  /** Returns every selected row across all pages (client mode) or current page (server mode). */
  private getSelectedRows(): T[] {
    const source = this.isClientMode() ? (this.filteredData() ?? []) : this.displayRows();
    return source.filter(r => this.selectedRows().has(this.rowId(r)));
  }

  private emitSelection(): void {
    this.rowSelected.emit(this.getSelectedRows());
  }
}
