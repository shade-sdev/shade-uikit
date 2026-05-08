import { ChangeDetectionStrategy, Component, forwardRef, input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { FormFieldBase } from '../form-field.base';

export interface RadioOption {
  value: unknown;
  label: string;
  hint?: string;
  disabled?: boolean;
}

@Component({
  selector: 'sk-radio-group',
  templateUrl: './radio-group.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RadioGroupComponent), multi: true }],
})
export class RadioGroupComponent extends FormFieldBase<unknown> {
  readonly options = input.required<RadioOption[]>();
  readonly label = input('');
  readonly layout = input<'vertical' | 'horizontal'>('vertical');
  readonly name = input(`sk-radio-${Math.random().toString(36).slice(2)}`);

  select(value: unknown, disabled?: boolean): void {
    if (this._disabled() || disabled) return;
    this._value.set(value);
    this.onChange(value);
    this.markTouched();
  }

  isSelected(value: unknown): boolean {
    return this._value() === value;
  }
}
