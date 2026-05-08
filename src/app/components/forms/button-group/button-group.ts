import { ChangeDetectionStrategy, Component, computed, forwardRef, input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { FormFieldBase } from '../form-field.base';

export interface ButtonGroupOption {
  value: unknown;
  label: string;
  icon?: string;
}

type ButtonGroupSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'sk-button-group',
  templateUrl: './button-group.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ButtonGroupComponent), multi: true }],
})
export class ButtonGroupComponent extends FormFieldBase<unknown> {
  readonly options = input.required<ButtonGroupOption[]>();
  readonly label = input('');
  readonly size = input<ButtonGroupSize>('md');
  readonly fullWidth = input(false);

  protected readonly sizeClass = computed(() => {
    const map: Record<ButtonGroupSize, string> = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-5 text-base',
    };
    return map[this.size()];
  });

  select(value: unknown): void {
    if (this._disabled()) return;
    this._value.set(value);
    this.onChange(value);
    this.markTouched();
  }

  isActive(value: unknown): boolean {
    return this._value() === value;
  }
}
