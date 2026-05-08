import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'sk-tooltip-content',
  template: `
    <div
      class="px-2.5 py-1.5 rounded-lg text-xs font-medium text-white bg-slate-900 dark:bg-slate-700 shadow-lg pointer-events-none whitespace-nowrap max-w-xs"
      role="tooltip"
    >
      {{ text() }}
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipContentComponent {
  readonly text = input('');
}
