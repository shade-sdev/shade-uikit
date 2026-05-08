import { ChangeDetectionStrategy, Component, forwardRef, input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { FormFieldBase } from '../form-field.base';

@Component({
  selector: 'sk-toggle',
  templateUrl: './toggle.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ToggleComponent), multi: true }],
})
export class ToggleComponent extends FormFieldBase<boolean> {
  readonly label = input('');
  readonly labelPosition = input<'left' | 'right'>('right');
  readonly hint = input('');
  readonly id = input(`sk-toggle-${Math.random().toString(36).slice(2)}`);

  toggle(): void {
    if (this._disabled()) return;
    const next = !this._value();
    this._value.set(next);
    this.onChange(next);
    this.markTouched();
  }
}
