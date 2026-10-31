import {ChangeDetectionStrategy, Component, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import {CamperPlaceTable} from './tables/camper-place-table';
import {MatCard} from '@angular/material/card';
import {CamperPlaceTypeTable} from './tables/camper-place-type-table';

@Component({
  selector: 'settings-page',
  imports: [
    CommonModule,
    CamperPlaceTable,
    MatCard,
    CamperPlaceTypeTable
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles:  `
    .settingsTable {
      width: 100%;
      max-width: 800px;
    }
    .settingsContainer {
      justify-self: center;
      width: 80%;

      padding: 20px 0 20px 0;
    }
    .tables {
      display: flex;
      flex-direction: row;
      justify-content: space-evenly;
    }
    .header {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      padding: 0 50px;
    }
    h1 {
      margin: 0;
    }
    .toggle {
      background: none;
      border: none;
      padding: 0.5rem;
      cursor: pointer;
      color: var(--text-primary);
    }
    .toggle i {
      transition: transform 0.2s;
    }
    .toggle.collapsed i {
      transform: rotate(-90deg);
    }
    .tables.hidden {
      display: none;
    }
  `,
  template: `
      <mat-card class="settingsContainer">
        <div class="header">
          <h1>Parcele</h1>
          <button class="toggle" [class.collapsed]="collapsed()" (click)="collapsed.set(!collapsed())"
                  [attr.aria-expanded]="!collapsed()" aria-label="Zwiń lub rozwiń sekcję">
            <i class="fa-solid fa-chevron-down"></i>
          </button>
        </div>
        <div class="tables" [class.hidden]="collapsed()">
          <app-camper-place-settings class="settingsTable"/>
          <app-camper-place-type-table class="settingsTable" />
        </div>
      </mat-card>
  `,
})
export class SettingsPage {
  protected collapsed = signal(false);

}
