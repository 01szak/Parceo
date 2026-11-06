import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {DragScrollDirective} from './drag-scroll.directive';

@Component({
  imports: [DragScrollDirective],
  template: `
    <div appDragScroll style="width: 200px; overflow-x: auto">
      <button type="button" style="width: 1000px; height: 40px" (click)="clicks = clicks + 1">wide</button>
    </div>`,
})
class HostComponent {
  clicks = 0;
}

describe('DragScrollDirective', () => {
  function setup() {
    const fixture = TestBed.createComponent(HostComponent);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    const scroller = fixture.nativeElement.querySelector('[appDragScroll]') as HTMLElement;
    const button = scroller.querySelector('button') as HTMLButtonElement;
    return {fixture, scroller, button};
  }

  function pointer(target: HTMLElement, type: string, clientX: number, pointerType = 'mouse'): void {
    target.dispatchEvent(new PointerEvent(type, {bubbles: true, cancelable: true, clientX, pointerId: 1, pointerType, button: 0}));
  }

  it('scrolls when the mouse drags and does not click what the drag started on', () => {
    const {fixture, scroller, button} = setup();
    scroller.scrollLeft = 300;

    pointer(button, 'pointerdown', 150);
    pointer(button, 'pointermove', 100);
    pointer(button, 'pointerup', 100);
    button.click();

    expect(scroller.scrollLeft).toBe(350);
    expect(fixture.componentInstance.clicks).toBe(0);
    fixture.nativeElement.remove();
  });

  it('keeps a scroll position the content moved during the drag', () => {
    const {fixture, scroller, button} = setup();
    scroller.scrollLeft = 300;

    pointer(button, 'pointerdown', 150);
    pointer(button, 'pointermove', 140);
    //the calendar added days before the first one and moved the view by their width
    scroller.scrollLeft += 400;
    pointer(button, 'pointermove', 130);

    expect(scroller.scrollLeft).toBe(720);
    fixture.nativeElement.remove();
  });

  it('still clicks after a press that barely moved', () => {
    const {fixture, scroller, button} = setup();

    pointer(button, 'pointerdown', 150);
    pointer(button, 'pointermove', 148);
    pointer(button, 'pointerup', 148);
    button.click();

    expect(scroller.scrollLeft).toBe(0);
    expect(fixture.componentInstance.clicks).toBe(1);
    fixture.nativeElement.remove();
  });

  it('leaves touch to the browser', () => {
    const {fixture, scroller, button} = setup();

    pointer(button, 'pointerdown', 150, 'touch');
    pointer(button, 'pointermove', 50, 'touch');

    expect(scroller.scrollLeft).toBe(0);
    fixture.nativeElement.remove();
  });
});
