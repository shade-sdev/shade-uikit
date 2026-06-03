import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'sk-masonry',
  template: `<ng-content />`,
  styles: [`
    sk-masonry {
      display: block;
    }
    sk-masonry > * {
      display: block;
      break-inside: avoid;
      margin-bottom: var(--sk-masonry-gap, 1rem);
    }
    sk-masonry > *:last-child {
      margin-bottom: 0;
    }
  `],
  // None so sk-masonry > * selector reaches projected content
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[style.--sk-masonry-gap]': 'gapValue()',
  },
})
export class MasonryComponent {
  /** Number of columns at each breakpoint. Provide 1–4 values: [default, sm, md, lg] */
  readonly columns = input<number[]>([2, 2, 3, 4]);
  readonly gap     = input<'sm' | 'md' | 'lg'>('md');

  protected readonly hostClass = computed(() => {
    const [base = 2, sm, md, lg] = this.columns();

    // Full literal strings — Tailwind's scanner must see complete class names
    const baseMap: Record<number, string> = {
      1: 'columns-1', 2: 'columns-2', 3: 'columns-3',
      4: 'columns-4', 5: 'columns-5', 6: 'columns-6',
    };
    const smMap: Record<number, string> = {
      1: 'sm:columns-1', 2: 'sm:columns-2', 3: 'sm:columns-3',
      4: 'sm:columns-4', 5: 'sm:columns-5', 6: 'sm:columns-6',
    };
    const mdMap: Record<number, string> = {
      1: 'md:columns-1', 2: 'md:columns-2', 3: 'md:columns-3',
      4: 'md:columns-4', 5: 'md:columns-5', 6: 'md:columns-6',
    };
    const lgMap: Record<number, string> = {
      1: 'lg:columns-1', 2: 'lg:columns-2', 3: 'lg:columns-3',
      4: 'lg:columns-4', 5: 'lg:columns-5', 6: 'lg:columns-6',
    };
    const gapColMap: Record<string, string> = {
      sm: 'gap-3', md: 'gap-4', lg: 'gap-6',
    };

    const parts = [baseMap[base] ?? 'columns-2', gapColMap[this.gap()]];
    if (sm !== undefined) parts.push(smMap[sm] ?? '');
    if (md !== undefined) parts.push(mdMap[md] ?? '');
    if (lg !== undefined) parts.push(lgMap[lg] ?? '');
    return parts.filter(Boolean).join(' ');
  });

  // Syncs margin-bottom on children with the column-gap value
  protected readonly gapValue = computed(() => {
    const map: Record<string, string> = { sm: '0.75rem', md: '1rem', lg: '1.5rem' };
    return map[this.gap()];
  });
}
