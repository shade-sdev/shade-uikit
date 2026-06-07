import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable, Subject, catchError, debounceTime, distinctUntilChanged, merge, of, switchMap } from 'rxjs';
import { FormFieldBase } from '../form-field.base';
import { SelectOption } from '../select/select';
import { SkeletonComponent } from '../../feedback/skeleton/skeleton';

export type AsyncLoadFn<T = unknown> = (search: string) => Observable<SelectOption<T>[]>;

@Component({
  selector: 'sk-async-select',
  imports: [SkeletonComponent],
  templateUrl: './async-select.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
    '(document:click)': 'closePanel()',
  },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AsyncSelectComponent), multi: true }],
})
export class AsyncSelectComponent extends FormFieldBase<unknown> {
  readonly loadFn = input.required<AsyncLoadFn>();
  readonly label = input('');
  readonly placeholder = input('Search...');
  readonly error = input('');
  readonly hint = input('');
  readonly required = input(false);
  readonly id = input(`sk-async-select-${Math.random().toString(36).slice(2)}`);
  /** Pre-populate the display label when editing an existing record.
   *  Pass the human-readable name that corresponds to the current form value
   *  (e.g. the coach's full name when patching a client edit form).
   *  The label is only applied while selectedLabel is still empty, so a
   *  subsequent user selection will never be overwritten. */
  readonly initialLabel = input('');

  protected readonly isOpen = signal(false);
  protected readonly searchText = signal('');
  protected readonly options = signal<SelectOption[]>([]);
  protected readonly loading = signal(false);
  protected readonly selectedLabel = signal('');

  /** Typing input — debounced + deduplicated so rapid keystrokes collapse. */
  private readonly search$ = new Subject<string>();
  /** Panel-open trigger — always fires immediately, bypasses distinctUntilChanged. */
  private readonly open$   = new Subject<string>();
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    super();

    merge(
      this.search$.pipe(debounceTime(300), distinctUntilChanged()),
      this.open$,   // no debounce, no dedup — always fetches on open
    )
      .pipe(
        switchMap((q) => {
          this.loading.set(true);
          return this.loadFn()(q).pipe(catchError(() => of([])));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((opts) => {
        this.options.set(opts as SelectOption[]);
        this.loading.set(false);
      });

    // Seed the display label from initialLabel when editing an existing record.
    // Only applies while selectedLabel is still empty (before any user interaction),
    // so an explicit selection by the user is never overwritten.
    effect(() => {
      const val = this._value();
      const hint = this.initialLabel();
      if (val && hint && !this.selectedLabel()) {
        this.selectedLabel.set(hint);
      }
    });
  }

  protected readonly triggerClass = computed(() => {
    const base =
      'w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border text-sm ' +
      'bg-slate-100 dark:bg-background-dark transition-shadow focus:outline-none focus:ring-2 ' +
      'disabled:opacity-50 disabled:cursor-not-allowed';
    const border = this.error()
      ? 'border-rose-400 focus:ring-rose-400/30'
      : 'border-transparent focus:ring-primary/30';
    const text = this.selectedLabel() ? 'text-slate-900 dark:text-white' : 'text-slate-400';
    return `${base} ${border} ${text}`;
  });

  /** Override so that setValue(null) also clears the visible display label. */
  override writeValue(val: unknown): void {
    super.writeValue(val);
    if (!val) this.selectedLabel.set('');
  }

  openPanel(e: Event): void {
    e.stopPropagation();
    if (this._disabled()) return;
    this.isOpen.set(true);
    // Use open$ (not search$) so distinctUntilChanged never suppresses this fetch.
    // This matters after parent state changes (e.g. company changed) where the
    // search text is still '' — the same value as the last search emission.
    this.open$.next(this.searchText());
  }

  onSearch(e: Event): void {
    const val = (e.target as HTMLInputElement).value;
    this.searchText.set(val);
    this.search$.next(val); // debounced + distinct, safe for rapid typing
  }

  select(option: SelectOption, e: Event): void {
    e.stopPropagation();
    this._value.set(option.value);
    this.selectedLabel.set(option.label);
    this.onChange(option.value);
    this.markTouched();
    this.isOpen.set(false);
    this.searchText.set('');
  }

  closePanel(): void {
    this.isOpen.set(false);
  }
}
