import {TestBed} from '@angular/core/testing';
import {TodayService} from './TodayService';

describe('TodayService', () => {
  beforeEach(() => jasmine.clock().install());
  afterEach(() => jasmine.clock().uninstall());

  it('moves on to the next day at midnight', () => {
    jasmine.clock().mockDate(new Date(2026, 10, 6, 23, 59, 0));
    const today = TestBed.inject(TodayService).today;
    expect(today()).toBe('2026-11-06');

    jasmine.clock().tick(2 * 60 * 1000);

    expect(today()).toBe('2026-11-07');
  });

  it('catches up when the tab becomes visible after the computer slept', () => {
    jasmine.clock().mockDate(new Date(2026, 10, 6, 22, 0, 0));
    const today = TestBed.inject(TodayService).today;

    //the clock jumps without the midnight timer running, as after sleep
    jasmine.clock().mockDate(new Date(2026, 10, 7, 8, 0, 0));
    document.dispatchEvent(new Event('visibilitychange'));

    expect(today()).toBe('2026-11-07');
  });
});
