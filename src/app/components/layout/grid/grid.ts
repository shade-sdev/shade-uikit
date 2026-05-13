import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type GridCols = 1 | 2 | 3 | 4 | 5 | 6;
export type GridGap  = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Responsive CSS grid that replaces inline grid boilerplate.
 * Every class value is a complete literal string so Tailwind v4 can scan them.
 *
 * ```html
 * <!-- stats row: 2 cols → 4 on lg -->
 * <sk-grid [cols]="2" [colsLg]="4">...</sk-grid>
 *
 * <!-- sidebar layout: 1 col → 3 on lg, wider gap -->
 * <sk-grid [cols]="1" [colsLg]="3" gap="lg">...</sk-grid>
 *
 * <!-- form fields: 1 col → 2 on sm -->
 * <sk-grid [cols]="1" [colsSm]="2">...</sk-grid>
 * ```
 */
@Component({
  selector: 'sk-grid',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()' },
})
export class GridComponent {
  readonly cols   = input<GridCols | undefined>(undefined);
  readonly colsSm = input<GridCols | undefined>(undefined);
  readonly colsMd = input<GridCols | undefined>(undefined);
  readonly colsLg = input<GridCols | undefined>(undefined);
  readonly colsXl = input<GridCols | undefined>(undefined);
  readonly gap    = input<GridGap>('md');

  protected readonly classes = computed(() => {
    // Complete literal strings — Tailwind scanner picks these up via @source "../src"
    const base: Record<GridCols, string> = {
      1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3',
      4: 'grid-cols-4', 5: 'grid-cols-5', 6: 'grid-cols-6',
    };
    const sm: Record<GridCols, string> = {
      1: 'sm:grid-cols-1', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3',
      4: 'sm:grid-cols-4', 5: 'sm:grid-cols-5', 6: 'sm:grid-cols-6',
    };
    const md: Record<GridCols, string> = {
      1: 'md:grid-cols-1', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3',
      4: 'md:grid-cols-4', 5: 'md:grid-cols-5', 6: 'md:grid-cols-6',
    };
    const lg: Record<GridCols, string> = {
      1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3',
      4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5', 6: 'lg:grid-cols-6',
    };
    const xl: Record<GridCols, string> = {
      1: 'xl:grid-cols-1', 2: 'xl:grid-cols-2', 3: 'xl:grid-cols-3',
      4: 'xl:grid-cols-4', 5: 'xl:grid-cols-5', 6: 'xl:grid-cols-6',
    };
    const gapMap: Record<GridGap, string> = {
      none: '',
      xs:   'gap-2',
      sm:   'gap-3',
      md:   'gap-4',
      lg:   'gap-6',
      xl:   'gap-8',
    };

    const c   = this.cols();
    const cSm = this.colsSm();
    const cMd = this.colsMd();
    const cLg = this.colsLg();
    const cXl = this.colsXl();

    return [
      'grid',
      c   != null ? base[c]   : '',
      cSm != null ? sm[cSm]   : '',
      cMd != null ? md[cMd]   : '',
      cLg != null ? lg[cLg]   : '',
      cXl != null ? xl[cXl]   : '',
      gapMap[this.gap()],
    ].filter(Boolean).join(' ');
  });
}
