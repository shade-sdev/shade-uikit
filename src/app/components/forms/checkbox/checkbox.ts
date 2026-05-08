import { ChangeDetectionStrategy, Component, forwardRef, input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { FormFieldBase } from '../form-field.base';

@Component({
  selector: 'sk-checkbox',
  templateUrl: './checkbox.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CheckboxComponent), multi: true }],
})
export class CheckboxComponent extends FormFieldBase<boolean> {
  readonly label = input('');
  readonly hint = input('');
  readonly indeterminate = input(false);
  readonly id = input(`sk-checkbox-${Math.random().toString(36).slice(2)}`);

  toggle(): void {
    if (this._disabled()) return;
    const next = !this._value();
    this._value.set(next);
    this.onChange(next);
    this.markTouched();
  }
}
