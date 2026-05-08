import { ComponentRef, Directive, ElementRef, inject, input, OnDestroy } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { TooltipContentComponent } from './tooltip-content';

@Directive({
  selector: '[skTooltip]',
  host: {
    '(mouseenter)': 'show()',
    '(mouseleave)': 'hide()',
    '(focus)': 'show()',
    '(blur)': 'hide()',
  },
})
export class TooltipDirective implements OnDestroy {
  readonly skTooltip = input('');
  readonly skTooltipPosition = input<'top' | 'bottom' | 'left' | 'right'>('top');

  private readonly overlay = inject(Overlay);
  private readonly elementRef = inject(ElementRef);
  private overlayRef: OverlayRef | null = null;
  private contentRef: ComponentRef<TooltipContentComponent> | null = null;

  show(): void {
    if (!this.skTooltip() || this.overlayRef) return;

    const pos = this.skTooltipPosition();
    const positions = {
      top: [
        { originX: 'center' as const, originY: 'top' as const, overlayX: 'center' as const, overlayY: 'bottom' as const, offsetY: -6 },
        { originX: 'center' as const, originY: 'bottom' as const, overlayX: 'center' as const, overlayY: 'top' as const, offsetY: 6 },
      ],
      bottom: [
        { originX: 'center' as const, originY: 'bottom' as const, overlayX: 'center' as const, overlayY: 'top' as const, offsetY: 6 },
        { originX: 'center' as const, originY: 'top' as const, overlayX: 'center' as const, overlayY: 'bottom' as const, offsetY: -6 },
      ],
      left: [
        { originX: 'start' as const, originY: 'center' as const, overlayX: 'end' as const, overlayY: 'center' as const, offsetX: -6 },
      ],
      right: [
        { originX: 'end' as const, originY: 'center' as const, overlayX: 'start' as const, overlayY: 'center' as const, offsetX: 6 },
      ],
    };

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.elementRef)
      .withPositions(positions[pos]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.close(),
      hasBackdrop: false,
    });

    const portal = new ComponentPortal(TooltipContentComponent);
    this.contentRef = this.overlayRef.attach(portal);
    this.contentRef.setInput('text', this.skTooltip());
  }

  hide(): void {
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this.contentRef = null;
  }

  ngOnDestroy(): void {
    this.hide();
  }
}
