import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable, Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { FormFieldBase } from '../form-field.base';
import { SelectOption } from '../select/select';
import { ChipComponent } from '../../atoms/chip/chip';
import { SkeletonComponent } from '../../feedback/skeleton/skeleton';

@Component({
  selector: 'sk-multi-select',
  imports: [ChipComponent, SkeletonComponent],
  templateUrl: './multi-select.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
    '(document:click)': 'closePanel()',
  },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MultiSelectComponent), multi: true }],
})
export class MultiSelectComponent extends FormFieldBase<unknown[]> {
  /** Static options. If omitted, provide loadFn for async loading. */
  readonly options = input<SelectOption[]>([]);
  /** Async loader — called with search string, returns Observable<SelectOption[]> */
  readonly loadFn = input<((search: string) => Observable<SelectOption[]>) | null>(null);
  readonly label = input('');
  readonly placeholder = input('Select options...');
  readonly error = input('');
  readonly hint = input('');
  readonly required = input(false);
  readonly id = input(`sk-multi-${Math.random().toString(36).slice(2)}`);

  protected readonly isOpen = signal(false);
  protected readonly searchText = signal('');
  protected readonly asyncOptions = signal<SelectOption[]>([]);
  protected readonly loading = signal(false);

  protected readonly selectedValues = computed(() => (this._value() as unknown[] | null) ?? []);

  protected readonly filteredOptions = computed(() => {
    const fn = this.loadFn();
    const all = fn ? this.asyncOptions() : this.options();
    const q = this.searchText().toLowerCase();
    return q ? all.filter((o) => o.label.toLowerCase().includes(q)) : all;
  });

  protected readonly selectedOptions = computed(() => {
    const all = this.loadFn() ? this.asyncOptions() : this.options();
    return this.selectedValues()
      .map((v) => all.find((o) => o.value === v))
      .filter(Boolean) as SelectOption[];
  });

  private readonly search$ = new Subject<string>();
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    super();
    this.search$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((q) => {
          const fn = this.loadFn();
          if (!fn) return of([]);
          this.loading.set(true);
          return fn(q).pipe(catchError(() => of([])));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((opts) => {
        this.asyncOptions.set(opts);
        this.loading.set(false);
      });
  }

  openPanel(e: Event): void {
    e.stopPropagation();
    if (this._disabled()) return;
    this.isOpen.set(true);
    if (this.loadFn()) this.search$.next('');
  }

  onSearch(e: Event): void {
    const val = (e.target as HTMLInputElement).value;
    this.searchText.set(val);
    if (this.loadFn()) this.search$.next(val);
  }

  toggleOption(option: SelectOption, e: Event): void {
    e.stopPropagation();
    const current = [...this.selectedValues()];
    const idx = current.findIndex((v) => v === option.value);
    const next = idx >= 0 ? current.filter((_, i) => i !== idx) : [...current, option.value];
    this._value.set(next);
    this.onChange(next);
    this.markTouched();
  }

  removeValue(value: unknown): void {
    const next = this.selectedValues().filter((v) => v !== value);
    this._value.set(next);
    this.onChange(next);
  }

  isSelected(value: unknown): boolean {
    return this.selectedValues().includes(value);
  }

  closePanel(): void {
    this.isOpen.set(false);
    this.searchText.set('');
  }
}
