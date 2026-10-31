import {ChangeDetectorRef, Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {MatTableModule} from '@angular/material/table';
import {CommonModule} from '@angular/common';
import {MatCard} from '@angular/material/card';
import {GraphComponent} from '../graph/graph.component';

export interface StatColumnConfig {
  collumnDef: string;
  headerCellDef: string;
  sum?: string | number;
}

@Component({
  selector: 'app-statistic-panel',
  styles: `:host {
    display: block;
    width: 100%;
  }

  .table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  h3 {
    margin: 0;
    color: var(--text-primary);
  }


  .change-button {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--primary);
    color: white;
    border-radius: var(--radius-sm);
    cursor: pointer;
    box-shadow: var(--shadow-md);
  }

  .change-button:hover {
    opacity: 0.8;
  }

  .container-card {
    height: 600px; /* Same height for both table and graph */
    overflow: hidden;
    padding: 0 !important;
  }

  .content-wrapper {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .table {
    overflow-y: auto;
    flex: 1;
  }

  .graph-wrapper {
    flex: 1;
    width: 100%;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.1);
    padding: 5px; /* Added padding as requested */
  }

  /* Fix for GraphComponent inside the card */
  .graph-wrapper ::ng-deep mat-card {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    width: 100% !important;
    height: 100% !important;
  }

  th, td, tr {
    color: var(--text-primary);
  }

  .header {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--bg-card) !important;
  }

  .footer {
    position: sticky;
    bottom: 0;
    z-index: 10;
    background: var(--bg-card) !important;
  }
  `,
  template: `
    <div class="table-header">
      <h3>{{title}}</h3>
      <div class="header-actions">
        @if (showGraph && canToggleMode) {
          <i (click)="toggleGraphMode()"
             class="change-button fa-solid"
             [ngClass]="graphMode === 'revenue' ? 'fa-hashtag' : 'fa-dollar-sign'"
             style="margin-right: 12px; cursor: pointer;"
             [title]="graphMode === 'revenue' ? 'Pokaż ilość rezerwacji' : 'Pokaż obrót'">
          </i>
        }
        <i (click)="toggleView()"
           class="change-button fa-solid"
           [ngClass]="showGraph ? 'fa-table' : 'fa-chart-column'"
           style="cursor: pointer;">
        </i>
      </div>
    </div>

    <mat-card class="container-card">
      <div class="content-wrapper">
        <div class="table content" [style.display]="showGraph ? 'none' : 'block'">
          <table mat-table [dataSource]="displayData || []">

            @for (d of displayedColumns; track d.collumnDef) {
              <ng-container matColumnDef="{{ d.collumnDef }}">
                <th mat-header-cell *matHeaderCellDef> {{ d.headerCellDef }}</th>
                <td mat-cell *matCellDef="let row"> {{ row[d.collumnDef] }}</td>
                <td mat-footer-cell *matFooterCellDef> {{ d.sum }}</td>
              </ng-container>
            }

            <tr mat-header-row class="header" *matHeaderRowDef="columnDefs"></tr>
            <tr mat-row  *matRowDef="let row; let i = index; columns: columnDefs;"
                [ngClass]="{
            'quaternary': i % 2 !== 0,
             }"></tr>
            <tr mat-footer-row class="footer" *matFooterRowDef="columnDefs"></tr>
          </table>
        </div>

        <div class="graph-wrapper" [style.display]="showGraph ? 'flex' : 'none'">
          <app-graph
            [results]="getGraphData()"
            [xAxisLabel]="xAxisLabel"
            [yAxisLabel]="yAxisLabel">
          </app-graph>
        </div>
      </div>
    </mat-card>
  `,
  imports: [
    MatTableModule,
    CommonModule,
    MatCard,
    GraphComponent
  ],
  standalone: true
})
export class StatisticsPanelComponent {

  @Input() title: string = '';
  @Input() displayedColumns: StatColumnConfig[] = [];
  @Input() displayData: any[] = [];
  @Input() getGraphData: () => any[] = () => [];
  @Input() xAxisLabel: string = '';
  @Input() yAxisLabel: string = '';
  @Input() canToggleMode: boolean = false;

  @Output() modeChange = new EventEmitter<'revenue' | 'count'>();

  private cdr = inject(ChangeDetectorRef);

  showGraph: boolean = false;
  graphMode: 'revenue' | 'count' = 'revenue';

  get columnDefs() {
    return this.displayedColumns.map(d => d.collumnDef);
  }

  toggleView() {
    this.showGraph = !this.showGraph;
    this.cdr.detectChanges();
  }

  toggleGraphMode() {
    this.graphMode = this.graphMode === 'revenue' ? 'count' : 'revenue';
    this.modeChange.emit(this.graphMode);
    this.cdr.detectChanges();
  }
}
