import {
  blockStarts,
  containsDay,
  dayIndex,
  extendBackward,
  extendForward,
  initialWindow,
  MAX_BLOCKS,
  visibleMonthsTitle,
  windowEnd
} from './calendar-window';
import {addDays} from './stay-range';

describe('calendar window', () => {
  const today = '2026-11-06';

  it('starts with three blocks and today in the middle', () => {
    const window = initialWindow(today, 30);
    expect(window.days).toBe(90);
    expect(dayIndex(window, today)).toBe(45);
    expect(window.from).toBe('2026-09-22');
  });

  it('grows forward without shifting the scroll position', () => {
    const change = extendForward(initialWindow(today, 30), 30);
    expect(change.window.days).toBe(120);
    expect(change.shiftedDays).toBe(0);
  });

  it('grows backward and moves the scroll position by the added days', () => {
    const start = initialWindow(today, 30);
    const change = extendBackward(start, 30);
    expect(change.window.from).toBe('2026-08-23');
    expect(change.window.days).toBe(120);
    expect(change.shiftedDays).toBe(30);
  });

  it('drops a block on the far side when the window is full', () => {
    let window = initialWindow(today, 30);
    window = extendForward(window, 30).window;
    window = extendForward(window, 30).window;
    expect(window.days).toBe(MAX_BLOCKS * 30);

    const forward = extendForward(window, 30);
    expect(forward.window.days).toBe(MAX_BLOCKS * 30);
    expect(forward.window.from).toBe(addDays(window.from, 30));
    expect(forward.shiftedDays).toBe(-30);

    const backward = extendBackward(window, 30);
    expect(backward.window.days).toBe(MAX_BLOCKS * 30);
    expect(windowEnd(backward.window)).toBe(addDays(windowEnd(window), -30));
  });

  it('splits the window into blocks loaded one by one', () => {
    expect(blockStarts({from: '2026-10-01', days: 60}, 30)).toEqual(['2026-10-01', '2026-10-31']);
  });

  it('knows which days are loaded', () => {
    const window = {from: '2026-10-01', days: 30};
    expect(containsDay(window, '2026-10-30')).toBeTrue();
    expect(containsDay(window, '2026-10-31')).toBeFalse();
  });

  it('names the visible months', () => {
    expect(visibleMonthsTitle('2026-11-02', '2026-11-30')).toBe('Listopad 2026');
    expect(visibleMonthsTitle('2026-10-20', '2026-11-18')).toBe('Październik – listopad 2026');
    expect(visibleMonthsTitle('2026-12-20', '2027-01-18')).toBe('Grudzień 2026 – styczeń 2027');
  });
});

