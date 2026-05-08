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

@Component({
  selector: 'sk-combo-box',
  imports: [SkeletonComponent],
  templateUrl: './combo-box.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
    '(document:click)': 'closePanel()',
  },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ComboBoxComponent), multi: true }],
})
export class ComboBoxComponent extends FormFieldBase<string> {
  /** Static suggestions. Omit when using loadFn. */
  readonly options = input<SelectOption<string>[]>([]);
  /** Async loader — called with search string, returns Observable<SelectOption<string>[]> */
  readonly loadFn = input<((search: string) => Observable<SelectOption<string>[]>) | null>(null);
  readonly label = input('');
  readonly placeholder = input('Type to search...');
  readonly error = input('');
  readonly hint = input('');
  readonly required = input(false);
  readonly id = input(`sk-combo-${Math.random().toString(36).slice(2)}`);

  protected readonly isOpen = signal(false);
  protected readonly inputText = signal('');
  protected readonly asyncOptions = signal<SelectOption<string>[]>([]);
  protected readonly loading = signal(false);

  protected readonly filteredOptions = computed(() => {
    const fn = this.loadFn();
    const all = fn ? this.asyncOptions() : this.options();
    const q = this.inputText().toLowerCase();
    if (!q) return all;
    return fn ? all : all.filter((o) => o.label.toLowerCase().includes(q));
  });

  protected readonly inputClass = computed(() => {
    const base =
      'w-full px-3 py-2.5 rounded-lg border text-sm bg-slate-100 dark:bg-background-dark ' +
      'text-slate-900 dark:text-white placeholder:text-slate-400 transition-shadow ' +
      'focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed';
    return (
      base +
      (this.error()
        ? ' border-rose-400 dark:border-rose-600 focus:ring-rose-400/30'
        : ' border-transparent focus:ring-primary/30')
    );
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

  onInput(e: Event): void {
    const val = (e.target as HTMLInputElement).value;
    this.inputText.set(val);
    this._value.set(val);
    this.onChange(val);
    this.isOpen.set(true);
    if (this.loadFn()) this.search$.next(val);
  }

  onFocus(e: Event): void {
    e.stopPropagation();
    if (!this._disabled()) {
      this.isOpen.set(true);
      if (this.loadFn()) this.search$.next(this.inputText());
    }
  }

  selectOption(option: SelectOption<string>, e: Event): void {
    e.stopPropagation();
    this.inputText.set(option.label);
    this._value.set(option.value);
    this.onChange(option.value);
    this.markTouched();
    this.isOpen.set(false);
  }

  clearValue(e: Event): void {
    e.stopPropagation();
    this.inputText.set('');
    this._value.set(null);
    this.onChange(null);
    this.markTouched();
    this.isOpen.set(false);
  }

  closePanel(): void {
    this.isOpen.set(false);
  }

  override writeValue(value: string | null): void {
    super.writeValue(value);
    this.inputText.set(value ?? '');
  }
}
