import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'sk-chip',
  templateUrl: './chip.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipComponent {
  readonly removable = input(false);
  readonly removed = output<void>();
}
