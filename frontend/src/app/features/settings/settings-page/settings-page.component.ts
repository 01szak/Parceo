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

//Kemping and Pracownicy wait for backend endpoints (see PLAN.md)
const TABS: readonly SettingsTab[] = [
  {path: 'parcele', label: 'Parcele i ceny', icon: 'grid_view'},
  {path: 'wyglad', label: 'Wygląd', icon: 'contrast'},
];

//every category has its own address (ustawienia/parcele, ustawienia/wyglad), so links and "back" work
@Component({
  selector: 'settings-page',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatTabNav, MatTabLink, MatTabNavPanel, MatIcon, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Ustawienia" />
    <nav mat-tab-nav-bar mat-stretch-tabs="false" mat-align-tabs="start" [tabPanel]="panel" aria-label="Kategorie ustawień">
      @for (tab of tabs; track tab.path) {
        <a mat-tab-link [routerLink]="tab.path" routerLinkActive #active="routerLinkActive" [active]="active.isActive">
          <mat-icon aria-hidden="true">{{ tab.icon }}</mat-icon>
          {{ tab.label }}
        </a>
      }
    </nav>
    <mat-tab-nav-panel #panel>
      <router-outlet />
    </mat-tab-nav-panel>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      max-width: 1200px;
    }

    a mat-icon {
      margin-right: var(--space-2);
    }

    mat-tab-nav-panel {
      display: block;
      padding-top: var(--space-4);
    }
  `,
})
export class SettingsPage {
  protected readonly tabs = TABS;
}
