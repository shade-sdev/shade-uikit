import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type PageContainerMaxWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
export type PageContainerGap = 'sm' | 'md' | 'lg';

/**
 * Page-level wrapper that replaces the boilerplate
 * `<div class="flex flex-col gap-6 max-w-7xl mx-auto">` on every page.
 *
 * Uses host-class binding so the component element itself IS the flex
 * container — no extra wrapper div in the DOM.
 *
 * ```html
 * <sk-page-container>            <!-- defaults: maxWidth=2xl, gap=md -->
 * <sk-page-container maxWidth="md">   <!-- max-w-4xl, settings-width -->
 * <sk-page-container maxWidth="lg">   <!-- max-w-5xl, detail pages -->
 * ```
 */
@Component({
  selector: 'sk-page-container',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()' },
})
export class PageContainerComponent {
  readonly maxWidth = input<PageContainerMaxWidth>('2xl');
  readonly gap      = input<PageContainerGap>('md');

  protected readonly classes = computed(() => {
    const maxWidthMap: Record<PageContainerMaxWidth, string> = {
      sm:   'max-w-3xl',
      md:   'max-w-4xl',
      lg:   'max-w-5xl',
      xl:   'max-w-6xl',
      '2xl':'max-w-7xl',
      full: '',
    };
    const gapMap: Record<PageContainerGap, string> = {
      sm: 'gap-4',
      md: 'gap-6',
      lg: 'gap-8',
    };
    return [
      'flex flex-col w-full mx-auto',
      maxWidthMap[this.maxWidth()],
      gapMap[this.gap()],
    ].filter(Boolean).join(' ');
  });
}
