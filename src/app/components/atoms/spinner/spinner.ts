import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg';

@Component({
  selector: 'sk-spinner',
  templateUrl: './spinner.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpinnerComponent {
  readonly size = input<SpinnerSize>('md');

  protected readonly sizeClass = computed(() => {
    const map: Record<SpinnerSize, string> = {
      xs: 'size-3',
      sm: 'size-4',
      md: 'size-5',
      lg: 'size-8',
    };
    return map[this.size()];
  });
}
