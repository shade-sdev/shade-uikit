import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type StackDirection = 'vertical' | 'horizontal';
export type StackGap      = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type StackAlign    = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type StackJustify  = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';

/**
 * Flex container for vertical stacks and horizontal rows.
 * Replaces raw `flex flex-col gap-X` and `flex items-center gap-X flex-wrap` divs.
 *
 * ```html
 * <!-- vertical stack (default) -->
 * <sk-stack gap="lg">...</sk-stack>
 *
 * <!-- horizontal toolbar row with wrapping -->
 * <sk-stack direction="horizontal" [wrap]="true" gap="sm">...</sk-stack>
 *
 * <!-- modal footer: right-aligned buttons -->
 * <sk-stack direction="horizontal" justify="end" gap="sm">...</sk-stack>
 * ```
 */
@Component({
  selector: 'sk-stack',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()' },
})
export class StackComponent {
  readonly direction = input<StackDirection>('vertical');
  readonly gap       = input<StackGap>('md');
  readonly align     = input<StackAlign | undefined>(undefined);
  readonly justify   = input<StackJustify>('start');
  readonly wrap      = input<boolean>(false);

  protected readonly classes = computed(() => {
    const dir = this.direction();

    const dirMap: Record<StackDirection, string> = {
      vertical:   'flex flex-col',
      horizontal: 'flex flex-row',
    };
    const gapMap: Record<StackGap, string> = {
      none: '',
      xs:   'gap-1',
      sm:   'gap-2',
      md:   'gap-4',
      lg:   'gap-6',
      xl:   'gap-8',
    };
    const alignMap: Record<StackAlign, string> = {
      start:    'items-start',
      center:   'items-center',
      end:      'items-end',
      stretch:  'items-stretch',
      baseline: 'items-baseline',
    };
    const justifyMap: Record<StackJustify, string> = {
      start:   'justify-start',
      center:  'justify-center',
      end:     'justify-end',
      between: 'justify-between',
      around:  'justify-around',
      evenly:  'justify-evenly',
    };

    // Sensible defaults: horizontal stacks center-align by default
    const resolvedAlign: StackAlign =
      this.align() ?? (dir === 'horizontal' ? 'center' : 'stretch');

    return [
      dirMap[dir],
      gapMap[this.gap()],
      alignMap[resolvedAlign],
      justifyMap[this.justify()],
      this.wrap() ? 'flex-wrap' : '',
    ].filter(Boolean).join(' ');
  });
}
