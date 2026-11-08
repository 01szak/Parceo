import {DestroyRef, Directive, ElementRef, inject, signal} from '@angular/core';

//the pointer has to move this far (px) before a press becomes a drag; a shorter move is still a click
const DRAG_THRESHOLD = 5;

/**
 * Lets a mouse scroll the element sideways by dragging, the way a finger does on a phone.
 * Touch and pen keep the browser's own scrolling. A press that turned into a drag does not click what it started on.
 */
@Directive({
  selector: '[appDragScroll]',
  host: {
    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'onPointerEnd($event)',
    '(pointercancel)': 'onPointerEnd($event)',
    '[class.drag-scrolling]': 'dragging()',
  },
})
export class DragScrollDirective {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  private pointerId: number | null = null;
  private startX = 0;
  private lastX = 0;
  protected readonly dragging = signal(false);
  private suppressClick = false;

  constructor() {
    //capture phase: stops the click before the cell or bar under the pointer sees it
    const swallowClick = (event: MouseEvent) => {
      if (!this.suppressClick) return;
      this.suppressClick = false;
      event.preventDefault();
      event.stopPropagation();
    };
    this.element.addEventListener('click', swallowClick, true);
    inject(DestroyRef).onDestroy(() => this.element.removeEventListener('click', swallowClick, true));
  }

  protected onPointerDown(event: PointerEvent): void {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    this.pointerId = event.pointerId;
    this.startX = event.clientX;
    this.lastX = event.clientX;
    this.suppressClick = false;
  }

  protected onPointerMove(event: PointerEvent): void {
    if (event.pointerId !== this.pointerId) return;
    if (!this.dragging()) {
      if (Math.abs(event.clientX - this.startX) < DRAG_THRESHOLD) return;
      this.dragging.set(true);
      //keeps the drag going when the pointer leaves the element; throws if the pointer is already gone
      try {
        this.element.setPointerCapture(event.pointerId);
      } catch {
        //the drag still works while the pointer stays over the element
      }
    }
    event.preventDefault();
    //move by the step since the last event, not from the drag start: the content may move the scroll position
    //during the drag (the calendar does when it adds days before the first one) and that must not be undone
    this.element.scrollLeft -= event.clientX - this.lastX;
    this.lastX = event.clientX;
  }

  protected onPointerEnd(event: PointerEvent): void {
    if (event.pointerId !== this.pointerId) return;
    if (this.dragging()) {
      this.suppressClick = true;
      //a drag released outside the element produces no click: do not swallow the next real one
      setTimeout(() => this.suppressClick = false);
      if (this.element.hasPointerCapture(event.pointerId)) this.element.releasePointerCapture(event.pointerId);
    }
    this.dragging.set(false);
    this.pointerId = null;
  }
}
