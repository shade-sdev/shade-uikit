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
  filterable?: boolean;
  width?: string;
  /** Return HTML string for custom cell rendering */
  cell?: (row: T) => string;
  /** Return CSS classes for the cell */
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
  filters: Record<string, string>;
}

export interface SortState {
  key: string;
  dir: 'asc' | 'desc';
}

@Component({
  selector: 'sk-table',
  imports: [SkeletonComponent],
  templateUrl: './table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableComponent<T extends Record<string, any> = Record<string, any>> {
  readonly columns = input.required<ColumnDef<T>[]>();
  readonly loadFn = input.required<(params: TableParams) => Observable<PagedResult<T>>>();
  readonly pageSize = input(10);
  readonly pageSizeOptions = input([10, 25, 50]);
  readonly selectable = input(false);
  readonly clickable  = input(false);
  readonly emptyMessage = input('No data found');
  readonly rowSelected = output<T[]>();
  readonly rowClick    = output<T>();

  protected readonly rows = signal<T[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);
  protected readonly page = signal(1);
  protected readonly currentPageSize = signal(10);
  protected readonly sort = signal<SortState | null>(null);
  protected readonly filters = signal<Record<string, string>>({});
  protected readonly selectedRows = signal<Set<unknown>>(new Set());

  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.currentPageSize())));
  protected readonly pageNumbers = computed(() => {
    const total = this.totalPages();
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
    const rows = this.rows();
    return rows.length > 0 && rows.every((r) => this.selectedRows().has(this.rowId(r)));
  });

  protected readonly skeletonRows = computed(() => Array.from({ length: this.currentPageSize() }));

  private readonly reload$ = new Subject<TableParams>();
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.currentPageSize.set(this.pageSize());

    this.reload$
      .pipe(
        debounceTime(50),
        switchMap((params) => {
          this.loading.set(true);
          return this.loadFn()(params).pipe(catchError(() => of({ data: [], total: 0 })));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        this.rows.set(result.data);
        this.total.set(result.total);
        this.loading.set(false);
      });

    this.triggerLoad();
  }

  protected triggerLoad(): void {
    this.reload$.next({
      page: this.page(),
      pageSize: this.currentPageSize(),
      sort: this.sort(),
      filters: this.filters(),
    });
  }

  protected setPage(p: number | '...'): void {
    if (p === '...' || p === this.page()) return;
    this.page.set(p as number);
    this.triggerLoad();
  }

  protected prevPage(): void {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
      this.triggerLoad();
    }
  }

  protected nextPage(): void {
    if (this.page() < this.totalPages()) {
      this.page.update((p) => p + 1);
      this.triggerLoad();
    }
  }

  protected setPageSize(size: number): void {
    this.currentPageSize.set(size);
    this.page.set(1);
    this.triggerLoad();
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
    this.triggerLoad();
  }

  protected onFilter(key: string, value: string): void {
    this.filters.update((f) => {
      const next = { ...f };
      if (value) next[key] = value;
      else delete next[key];
      return next;
    });
    this.page.set(1);
    this.triggerLoad();
  }

  protected toggleSelectAll(): void {
    if (this.allSelected()) {
      this.selectedRows.set(new Set());
    } else {
      this.selectedRows.set(new Set(this.rows().map((r) => this.rowId(r))));
    }
    this.emitSelection();
  }

  protected toggleRow(row: T): void {
    this.selectedRows.update((set) => {
      const next = new Set(set);
      const id = this.rowId(row);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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

  protected hasCustomCell(col: ColumnDef<T>): boolean {
    return !!col.cell;
  }

  protected sortIcon(col: ColumnDef<T>): string {
    const s = this.sort();
    if (!s || s.key !== col.key) return 'unfold_more';
    return s.dir === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  protected startIndex(): number {
    return (this.page() - 1) * this.currentPageSize() + 1;
  }

  protected endIndex(): number {
    return Math.min(this.page() * this.currentPageSize(), this.total());
  }

  private rowId(row: T): unknown {
    return (row as any)['id'] ?? row;
  }

  private emitSelection(): void {
    const selected = this.rows().filter((r) => this.selectedRows().has(this.rowId(r)));
    this.rowSelected.emit(selected);
  }
}
