import {DestroyRef, inject, Injectable, signal} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {todayIso} from '@shared/domain/iso-date';

//checked a little after midnight, so the new day has surely started
const AFTER_MIDNIGHT_MS = 1000;

/**
 * Today's date (YYYY-MM-DD) as a signal. The reception computer often stays on one screen overnight, so the date
 * moves on at midnight, and again when the tab becomes visible (a sleeping computer may miss the timer).
 */
@Injectable({providedIn: 'root'})
export class TodayService {
  private readonly current = signal(todayIso());
  public readonly today = this.current.asReadonly();

  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    const document = inject(DOCUMENT);
    const onVisible = () => {
      if (document.visibilityState === 'visible') this.refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    inject(DestroyRef).onDestroy(() => {
      document.removeEventListener('visibilitychange', onVisible);
      clearTimeout(this.timer);
    });
    this.scheduleMidnight();
  }

  private refresh(): void {
    //set() ignores an unchanged value, so nothing reloads when the day is still the same
    this.current.set(todayIso());
    this.scheduleMidnight();
  }

  private scheduleMidnight(): void {
    clearTimeout(this.timer);
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    this.timer = setTimeout(() => this.refresh(), midnight.getTime() - now.getTime() + AFTER_MIDNIGHT_MS);
  }
}
