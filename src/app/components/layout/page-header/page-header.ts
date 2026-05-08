import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'sk-page-header',
  templateUrl: './page-header.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly description = input('');
}
