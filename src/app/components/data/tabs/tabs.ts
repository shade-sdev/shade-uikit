import {
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  QueryList,
  input,
  output,
  signal,
} from '@angular/core';

@Component({
  selector: 'sk-tab',
  template: `<ng-content />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.hidden]': '!active()',
    role: 'tabpanel',
  },
})
export class TabComponent {
  readonly label = input.required<string>();
  readonly icon = input('');
  readonly disabled = input(false);
  readonly active = signal(false);
}

@Component({
  selector: 'sk-tabs',
  templateUrl: './tabs.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsComponent {
  readonly activeIndex = input(0);
  readonly tabChanged = output<number>();

  @ContentChildren(TabComponent) tabs!: QueryList<TabComponent>;

  protected readonly currentIndex = signal(0);

  ngAfterContentInit(): void {
    const init = this.activeIndex();
    this.activateTab(init);
  }

  protected activateTab(index: number): void {
    this.tabs.forEach((tab, i) => tab.active.set(i === index));
    this.currentIndex.set(index);
    this.tabChanged.emit(index);
  }
}
