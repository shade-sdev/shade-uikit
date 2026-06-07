import { ChangeDetectionStrategy, Component, computed, forwardRef, input, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { FormFieldBase } from '../form-field.base';

export interface SelectOption<T = unknown> {
  value: T;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'sk-select',
  templateUrl: './select.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
    '(document:click)': 'closePanel()',
  },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SelectComponent), multi: true }],
})
export class SelectComponent extends FormFieldBase<unknown> {
  readonly options = input<SelectOption[]>([]);
  readonly label = input('');
  readonly placeholder = input('Select an option');
  readonly error = input('');
  readonly hint = input('');
  readonly required = input(false);
  readonly id = input(`sk-select-${Math.random().toString(36).slice(2)}`);

  protected readonly isOpen = signal(false);
  /** Viewport-relative position for the fixed dropdown panel. */
  protected readonly dropdownPos = signal({ top: '0px', left: '0px', width: '0px' });

  protected readonly selectedLabel = computed(() => {
    const val = this._value();
    if (val === null || val === undefined) return '';
    return this.options().find((o) => o.value === val)?.label ?? String(val);
  });

  protected readonly triggerClass = computed(() => {
    const base =
      'w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border text-sm ' +
      'bg-slate-100 dark:bg-background-dark transition-shadow ' +
      'disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2';
    const border = this.error()
      ? 'border-rose-400 dark:border-rose-600 focus:ring-rose-400/30'
      : 'border-transparent focus:ring-primary/30';
    const text = this.selectedLabel()
      ? 'text-slate-900 dark:text-white'
      : 'text-slate-400';
    return `${base} ${border} ${text}`;
  });

  toggle(e: MouseEvent): void {
    e.stopPropagation();
    if (this._disabled()) return;
    if (!this.isOpen()) {
      // Snapshot trigger position so the fixed panel aligns with it.
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      this.dropdownPos.set({
        top:   `${rect.bottom + 4}px`,
        left:  `${rect.left}px`,
        width: `${rect.width}px`,
      });
    }
    this.isOpen.update((v) => !v);
  }

  select(option: SelectOption, e: Event): void {
    e.stopPropagation();
    if (option.disabled) return;
    this._value.set(option.value);
    this.onChange(option.value);
    this.markTouched();
    this.isOpen.set(false);
  }

  closePanel(): void {
    this.isOpen.set(false);
  }
}
