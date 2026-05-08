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

  protected readonly isOpen = signal(false);
  protected readonly searchText = signal('');
  protected readonly options = signal<SelectOption[]>([]);
  protected readonly loading = signal(false);
  protected readonly selectedLabel = signal('');

  private readonly search$ = new Subject<string>();
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    super();
    this.search$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
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

  openPanel(e: Event): void {
    e.stopPropagation();
    if (this._disabled()) return;
    this.isOpen.set(true);
    this.search$.next(this.searchText());
  }

  onSearch(e: Event): void {
    const val = (e.target as HTMLInputElement).value;
    this.searchText.set(val);
    this.search$.next(val);
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
