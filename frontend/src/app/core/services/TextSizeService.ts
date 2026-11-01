import {DOCUMENT, effect, inject, Injectable, signal} from '@angular/core';

export type TextSize = 'normal' | 'large' | 'xlarge';

const STORAGE_KEY = 'parceo.textSize';
//Material's type scale is in rem, so the root font size scales every text of the app
const ROOT_FONT_SIZE: Record<TextSize, string> = {
  normal: '100%',
  large: '112.5%',
  xlarge: '125%',
};

//the text size chosen in Ustawienia › Wygląd, kept per device
@Injectable({providedIn: 'root'})
export class TextSizeService {
  private readonly document = inject(DOCUMENT);

  public readonly size = signal<TextSize>(this.readStored());

  constructor() {
    this.apply(this.size());
    effect(() => this.apply(this.size()));
  }

  public setSize(size: TextSize): void {
    this.size.set(size);
    try {
      localStorage.setItem(STORAGE_KEY, size);
    } catch {
      //storage can be blocked (private mode); the size still applies for this session
    }
  }

  private apply(size: TextSize): void {
    this.document.documentElement.style.fontSize = ROOT_FONT_SIZE[size];
  }

  private readStored(): TextSize {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'large' || stored === 'xlarge' ? stored : 'normal';
    } catch {
      return 'normal';
    }
  }
}
