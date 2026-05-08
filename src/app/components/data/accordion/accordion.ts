import {
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  QueryList,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';

@Component({
  selector: 'sk-accordion',
  templateUrl: './accordion.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccordionComponent {
  /** When true, only one item can be open at a time */
  readonly single = input(false);

  @ContentChildren(forwardRef(() => AccordionItemComponent)) items!: QueryList<AccordionItemComponent>;

  onItemOpen(opened: AccordionItemComponent): void {
    if (this.single()) {
      this.items.forEach((item) => {
        if (item !== opened) item.isOpen.set(false);
      });
    }
  }
}

@Component({
  selector: 'sk-accordion-item',
  templateUrl: './accordion-item.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccordionItemComponent {
  readonly title = input.required<string>();
  readonly icon = input('');
  readonly disabled = input(false);

  readonly isOpen = signal(false);

  private readonly accordion = inject(AccordionComponent, { optional: true });

  toggle(): void {
    if (this.disabled()) return;
    const opening = !this.isOpen();
    this.isOpen.set(opening);
    if (opening) this.accordion?.onItemOpen(this);
  }
}
