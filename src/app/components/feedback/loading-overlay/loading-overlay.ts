import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SpinnerComponent } from '../../atoms/spinner/spinner';

@Component({
  selector: 'sk-loading-overlay',
  imports: [SpinnerComponent],
  templateUrl: './loading-overlay.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'contents',
  },
})
export class LoadingOverlayComponent {
  readonly loading = input(false);
  readonly message = input('');
  /** Set to true when wrapping a full page; uses fixed instead of absolute */
  readonly fullPage = input(false);
}
