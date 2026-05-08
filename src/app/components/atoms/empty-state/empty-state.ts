import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'sk-empty-state',
  templateUrl: './empty-state.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly icon = input('inbox');
  readonly title = input('No results found');
  readonly message = input('');
}
