import {DOCUMENT, effect, inject, Injectable, signal} from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'parceo.theme';
const THEME_CLASSES: Record<Exclude<ThemeMode, 'system'>, string> = {
  light: 'light-theme',
  dark: 'dark-theme',
};

//the chosen mode is kept per device; 'system' leaves the decision to prefers-color-scheme
@Injectable({providedIn: 'root'})
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  public readonly mode = signal<ThemeMode>(this.readStoredMode());

  constructor() {
    this.apply(this.mode()); //synchronously, so the first frame is already in the right scheme
    effect(() => this.apply(this.mode()));
  }

  public setMode(mode: ThemeMode): void {
    this.mode.set(mode);
    this.store(mode);
  }

  //switches between light and dark, resolving 'system' to the scheme currently shown
  public toggle(): void {
    this.setMode(this.isDarkShown() ? 'light' : 'dark');
  }

  private isDarkShown(): boolean {
    const mode = this.mode();
    if (mode !== 'system') return mode === 'dark';
    return this.document.defaultView?.matchMedia('(prefers-color-scheme: dark)').matches ?? false;
  }

  private apply(mode: ThemeMode): void {
    const classList = this.document.documentElement.classList;
    Object.values(THEME_CLASSES).forEach(cls => classList.remove(cls));
    if (mode !== 'system') classList.add(THEME_CLASSES[mode]);
  }

  private readStoredMode(): ThemeMode {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'light' || stored === 'dark' ? stored : 'system';
    } catch {
      return 'system';
    }
  }

  private store(mode: ThemeMode): void {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      //storage can be blocked (private mode); the mode still applies for this session
    }
  }
}
