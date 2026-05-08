import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'sk-divider',
  templateUrl: './divider.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DividerComponent {
  readonly label = input('');
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
}
