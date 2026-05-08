import { signal } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';

/** Base class shared by all CVA form controls */
export abstract class FormFieldBase<T> implements ControlValueAccessor {
  protected readonly _value = signal<T | null>(null);
  protected readonly _disabled = signal(false);
  protected readonly _touched = signal(false);

  protected onChange: (v: T | null) => void = () => {};
  protected onTouched: () => void = () => {};

  writeValue(value: T | null): void {
    this._value.set(value);
  }

  registerOnChange(fn: (v: T | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._disabled.set(isDisabled);
  }

  protected markTouched(): void {
    this._touched.set(true);
    this.onTouched();
  }
}
