import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {CalendarEdge, CalendarGridComponent, VisibleDays} from './calendar-grid.component';
import {calendarDays} from '@shared/domain/calendar-layout';
import {initialWindow} from '@shared/domain/calendar-window';
import {addDays} from '@shared/domain/stay-range';

describe('CalendarGridComponent', () => {
  const today = '2026-11-06';
  let fixture: ComponentFixture<CalendarGridComponent>;
  let scroller: HTMLElement;
  let ranges: VisibleDays[];
  let edges: CalendarEdge[];

  const frame = () => new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve)));
  async function settle() {
    for (let i = 0; i < 4; i++) {
      fixture.detectChanges();
      await fixture.whenStable();
      await frame();
    }
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({imports: [CalendarGridComponent], providers: [provideNoopAnimations()]});
    fixture = TestBed.createComponent(CalendarGridComponent);
    (fixture.nativeElement as HTMLElement).style.width = '1096px';
    document.body.appendChild(fixture.nativeElement);
    const window = initialWindow(today, 30);
    fixture.componentRef.setInput('days', calendarDays(window.from, window.days, today));
    fixture.componentRef.setInput('rows', []);
    fixture.componentRef.setInput('visibleDays', 30);
    fixture.componentRef.setInput('initialDay', today);
    ranges = [];
    edges = [];
    fixture.componentInstance.visibleRangeChange.subscribe(r => ranges.push(r));
    fixture.componentInstance.edgeReached.subscribe(e => edges.push(e));
    await settle();
    scroller = (fixture.nativeElement as HTMLElement).querySelector('.scroll')!;
  });

  afterEach(() => fixture.destroy());

  it('opens with today in the middle and as many days as the setting says', () => {
    const range = ranges[ranges.length - 1];
    expect(range).toBeDefined();
    const shown = Math.round((Date.parse(range.last) - Date.parse(range.first)) / 864e5) + 1;
    //30 days of width; with today centred, a half day shows at each edge
    expect(shown).toBeGreaterThanOrEqual(30);
    expect(shown).toBeLessThanOrEqual(31);
    expect(range.first <= today && today <= range.last).toBeTrue();
    expect(Math.abs(Date.parse(today) - Date.parse(range.first) - (Date.parse(range.last) - Date.parse(today)))).toBeLessThanOrEqual(864e5);
  });

  it('asks for more days near the right edge', async () => {
    scroller.scrollLeft = scroller.scrollWidth;
    scroller.dispatchEvent(new Event('scroll'));
    await settle();
    expect(edges).toEqual(['end']);
  });

  it('keeps the same days on screen after days are added before the first one', async () => {
    const before = ranges[ranges.length - 1];
    const window = initialWindow(today, 30);
    const from = addDays(window.from, -30);
    fixture.componentRef.setInput('days', calendarDays(from, window.days + 30, today));
    await settle();
    expect(ranges[ranges.length - 1]).toEqual(before);
  });
});
