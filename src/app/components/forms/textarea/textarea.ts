import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { FormFieldBase } from '../form-field.base';

@Component({
  selector: 'sk-textarea',
  templateUrl: './textarea.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TextareaComponent), multi: true }],
})
export class TextareaComponent extends FormFieldBase<string> {
  readonly label = input('');
  readonly placeholder = input('');
  readonly rows = input(4);
  readonly hint = input('');
  readonly error = input('');
  readonly required = input(false);
  readonly id = input(`sk-textarea-${Math.random().toString(36).slice(2)}`);

  protected readonly textareaClass = computed(() => {
    const base =
      'w-full rounded-lg border bg-slate-100 dark:bg-background-dark text-sm text-slate-900 dark:text-white ' +
      'placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-shadow px-3 py-2.5 resize-y ' +
      'disabled:opacity-50 disabled:cursor-not-allowed';
    const border = this.error()
      ? 'border-rose-400 dark:border-rose-600 focus:ring-rose-400/30'
      : 'border-transparent focus:ring-primary/30 focus:border-primary/60 dark:focus:border-primary/40';
    return `${base} ${border}`;
  });

  handleInput(event: Event): void {
    const val = (event.target as HTMLTextAreaElement).value;
    this._value.set(val);
    this.onChange(val);
  }
}
