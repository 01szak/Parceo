import {ChangeDetectionStrategy, Component} from '@angular/core';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {MatTabLink, MatTabNav, MatTabNavPanel} from '@angular/material/tabs';
import {MatIcon} from '@angular/material/icon';
import {PageHeaderComponent} from '@shared/ui/page-header/page-header.component';

interface SettingsTab {
  path: string;
  label: string;
  icon: string;
}

const TABS: readonly SettingsTab[] = [
  {path: 'kemping', label: 'Kemping', icon: 'cottage'},
  {path: 'parcele', label: 'Parcele i ceny', icon: 'grid_view'},
  {path: 'pracownicy', label: 'Pracownicy', icon: 'group'},
  {path: 'wyglad', label: 'Wygląd', icon: 'contrast'},
];

//every category has its own address (ustawienia/kemping, ustawienia/parcele…), so links and "back" work
@Component({
  selector: 'settings-page',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatTabNav, MatTabLink, MatTabNavPanel, MatIcon, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Ustawienia"/>
    <nav mat-tab-nav-bar mat-stretch-tabs="false" mat-align-tabs="start" [tabPanel]="panel"
         aria-label="Kategorie ustawień">
      @for (tab of tabs; track tab.path) {
        <a mat-tab-link [routerLink]="tab.path" routerLinkActive #active="routerLinkActive" [active]="active.isActive">
          <mat-icon aria-hidden="true">{{ tab.icon }}</mat-icon>
          {{ tab.label }}
        </a>
      }
    </nav>
    <mat-tab-nav-panel #panel>
      <router-outlet/>
    </mat-tab-nav-panel>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      max-width: 100%;
    }

    a mat-icon {
      margin-right: var(--space-2);
    }

    mat-tab-nav-panel {
      display: block;
      padding-top: var(--space-4);
    }
  `,
  standalone: true
})
export class SettingsPage {
  protected readonly tabs = TABS;
}
