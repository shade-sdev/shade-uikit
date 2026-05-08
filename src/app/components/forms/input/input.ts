import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { FormFieldBase } from '../form-field.base';

export type InputType = 'text' | 'email' | 'number' | 'password' | 'search' | 'url' | 'tel';

@Component({
  selector: 'sk-input',
  imports: [ReactiveFormsModule],
  templateUrl: './input.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => InputComponent), multi: true }],
})
export class InputComponent extends FormFieldBase<string> {
  readonly label = input('');
  readonly placeholder = input('');
  readonly type = input<InputType>('text');
  readonly hint = input('');
  readonly error = input('');
  readonly prefixIcon = input('');
  readonly suffixIcon = input('');
  readonly required = input(false);
  readonly id = input(`sk-input-${Math.random().toString(36).slice(2)}`);

  protected readonly showPassword = signal(false);

  protected readonly resolvedType = computed(() =>
    this.type() === 'password' && this.showPassword() ? 'text' : this.type(),
  );

  protected readonly inputClass = computed(() => {
    const base =
      'w-full rounded-lg border bg-slate-100 dark:bg-background-dark text-sm text-slate-900 dark:text-white ' +
      'placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-shadow ' +
      'disabled:opacity-50 disabled:cursor-not-allowed';
    const border = this.error()
      ? 'border-rose-400 dark:border-rose-600 focus:ring-rose-400/30'
      : 'border-transparent focus:ring-primary/30 focus:border-primary/60 dark:focus:border-primary/40';
    const padding =
      (this.prefixIcon() ? 'pl-10 ' : 'pl-3 ') +
      (this.type() === 'password' || this.suffixIcon() ? 'pr-10 ' : 'pr-3 ') +
      'py-2.5';
    return `${base} ${border} ${padding}`;
  });

  handleInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this._value.set(val);
    this.onChange(val);
  }

  handleBlur(): void {
    this.markTouched();
  }
}
