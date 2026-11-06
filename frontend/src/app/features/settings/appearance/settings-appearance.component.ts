import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatRadioButton, MatRadioGroup} from '@angular/material/radio';
import {ThemeMode, ThemeService} from '@core/services/ThemeService';
import {TextSize, TextSizeService} from '@core/services/TextSizeService';

interface ThemeOption {
  mode: ThemeMode;
  label: string;
  //mini preview colors; the only fixed colors of the app, they show the other theme regardless of the current one
  preview: 'light' | 'dark' | 'system';
}

const THEMES: readonly ThemeOption[] = [
  {mode: 'light', label: 'Jasny', preview: 'light'},
  {mode: 'dark', label: 'Ciemny', preview: 'dark'},
  {mode: 'system', label: 'Jak w systemie', preview: 'system'},
];

const TEXT_SIZES: readonly { size: TextSize, label: string }[] = [
  {size: 'normal', label: 'Normalny'},
  {size: 'large', label: 'Duży'},
  {size: 'xlarge', label: 'Bardzo duży'},
];

//settings of this device; a change applies at once, without a save button
@Component({
  selector: 'app-settings-appearance',
  imports: [MatRadioGroup, MatRadioButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card" aria-labelledby="theme-title">
      <h2 id="theme-title">Motyw</h2>
      <p class="lead">Zmiana działa od razu na tym urządzeniu.</p>
      <mat-radio-group class="options" aria-labelledby="theme-title"
                       [value]="theme.mode()" (change)="theme.setMode($event.value)">
        @for (option of themes; track option.mode) {
          <label class="option" [class.selected]="theme.mode() === option.mode">
            <span class="preview" [class]="'preview preview-' + option.preview" aria-hidden="true">
              <span class="nav"></span>
              <span class="lines"><span></span><span class="accent"></span></span>
            </span>
            <mat-radio-button [value]="option.mode">{{ option.label }}</mat-radio-button>
          </label>
        }
      </mat-radio-group>
    </section>

    <section class="card" aria-labelledby="size-title">
      <h2 id="size-title">Wielkość tekstu</h2>
      <p class="lead">Większy tekst łatwiej przeczytać, ale na ekranie mieści się mniej.</p>
      <mat-radio-group class="options" aria-labelledby="size-title"
                       [value]="textSize.size()" (change)="textSize.setSize($event.value)">
        @for (option of sizes; track option.size) {
          <label class="option" [class.selected]="textSize.size() === option.size">
            <span class="sample" [class]="'sample sample-' + option.size">Anna Wiśniewska</span>
            <mat-radio-button [value]="option.size">{{ option.label }}</mat-radio-button>
          </label>
        }
      </mat-radio-group>
    </section>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
    }

    .card {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      padding: var(--space-6);
      border-radius: 20px;
      background: var(--mat-sys-surface-container-low);
    }

    h2 {
      margin: 0;
      font: var(--mat-sys-title-large);
      font-weight: 700;
    }

    .lead {
      margin: 0;
      font: var(--mat-sys-body-large);
      color: var(--mat-sys-on-surface-variant);
    }

    .options {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-3);
    }

    .option {
      flex: 1 1 200px;
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      padding: var(--space-4);
      border-radius: var(--radius-lg);
      border: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface-container-lowest);
      cursor: pointer;

      &.selected {
        border: 2px solid var(--mat-sys-primary);
        padding: calc(var(--space-4) - 1px);
      }
    }

    .preview {
      height: 72px;
      display: flex;
      gap: 6px;
      padding: 8px;
      box-sizing: border-box;
      border-radius: 10px;
      border: 1px solid var(--mat-sys-outline-variant);
    }

    .nav {
      width: 28%;
      border-radius: 6px;
    }

    .lines {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;

      span {
        height: 10px;
        width: 70%;
        border-radius: 4px;
      }

      .accent {
        width: 40%;
        background: #00677F;
      }
    }

    .preview-light {
      background: #F6FAFD;

      .nav {
        background: #EAEEF1;
      }

      .lines span:first-child {
        background: #171C1F;
      }
    }

    .preview-dark {
      background: #0F1417;

      .nav {
        background: #1B2023;
      }

      .lines span:first-child {
        background: #DEE3E6;
      }
    }

    .preview-system {
      background: linear-gradient(90deg, #F6FAFD 50%, #0F1417 50%);

      .nav {
        background: #C0C8CC;
      }

      .lines span:first-child {
        background: #70787C;
      }
    }

    .sample {
      font-weight: 700;
      line-height: 1.3;
      color: var(--mat-sys-on-surface);
    }

    /* fixed px on purpose: the samples show the sizes regardless of the current one */
    .sample-normal {
      font-size: 18px;
    }

    .sample-large {
      font-size: 20px;
    }

    .sample-xlarge {
      font-size: 22px;
    }
  `,
  standalone: true
})
export class SettingsAppearanceComponent {
  protected readonly theme = inject(ThemeService);
  protected readonly textSize = inject(TextSizeService);
  protected readonly themes = THEMES;
  protected readonly sizes = TEXT_SIZES;
}
