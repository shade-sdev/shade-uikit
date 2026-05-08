import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type SkeletonVariant = 'text' | 'block' | 'circle';

@Component({
  selector: 'sk-skeleton',
  templateUrl: './skeleton.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonComponent {
  readonly variant = input<SkeletonVariant>('block');
  readonly width = input('100%');
  readonly height = input('1rem');
  readonly lines = input(1);

  protected readonly linesArray = computed(() => Array.from({ length: this.lines() }));

  protected readonly shapeClass = computed(() => {
    const map: Record<SkeletonVariant, string> = {
      text: 'rounded',
      block: 'rounded-lg',
      circle: 'rounded-full',
    };
    return map[this.variant()];
  });
}
