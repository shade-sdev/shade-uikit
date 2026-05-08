import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'sk-masonry',
  templateUrl: './masonry.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MasonryComponent {
  /** Number of columns at each breakpoint. Provide 1–4 values: [default, sm, md, lg] */
  readonly columns = input<number[]>([2, 2, 3, 4]);
  readonly gap = input<'sm' | 'md' | 'lg'>('md');

  protected readonly columnClass = computed(() => {
    const cols = this.columns();
    const [base = 2, sm, md, lg] = cols;
    const parts: string[] = [`columns-${base}`];
    if (sm !== undefined) parts.push(`sm:columns-${sm}`);
    if (md !== undefined) parts.push(`md:columns-${md}`);
    if (lg !== undefined) parts.push(`lg:columns-${lg}`);
    return parts.join(' ');
  });

  protected readonly gapClass = computed(() => {
    const map = { sm: 'gap-3', md: 'gap-4', lg: 'gap-6' };
    return map[this.gap()];
  });
}
