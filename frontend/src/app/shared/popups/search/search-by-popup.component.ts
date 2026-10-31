import {ChangeDetectionStrategy, Component, EventEmitter, inject, Output} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogActions, MatDialogRef, MatDialogTitle} from '@angular/material/dialog';
import {FieldType, SearchDialogData} from '@shared/ui/data-table/regular-table.component';
import {MatFormField, MatInput, MatLabel, MatSuffix} from '@angular/material/input';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {FormButtonsComponent} from '@shared/ui/buttons/form-buttons.component';
import {SearchCriteria} from '../../../api';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
  MatDatepickerToggleIcon
} from '@angular/material/datepicker';
import {DateDelimiter, DateFormater} from '@shared/helper/DateFormater';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatRadioButton, MatRadioGroup} from '@angular/material/radio';

@Component({
  selector: 'app-search-by-popup',
  imports: [
    MatDialogActions,
    MatInput,
    MatDialogTitle,
    MatLabel,
    MatFormField,
    FormsModule,
    FormButtonsComponent,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatDatepicker,
    MatDatepickerToggleIcon,
    MatSuffix,
    ReactiveFormsModule,
    MatSelect,
    MatOption,
    MatRadioGroup,
    MatRadioButton
  ],
  styles: `
    matInput {
      flex-shrink: 1;
    }

    mat-label {
      margin-bottom: 10px;
    }

    .tittle {
      margin-top: 10px;
    }

    .datepickerWrapper, .dateFilter {
      display: flex;
      flex-direction: row;
    }

    .datepickerWrapper {
        border: 1px solid var(--primary);
        border-radius: 8px;
    }

    .dateFilter {
      justify-content: center;
      width: 100%;
      flex-shrink: 1;
      gap: 10px;
    }

    .mat-mdc-form-field.dateInput {
      width: 100% !important;
      max-width: 150px !important;
      max-height: 65px !important;
    }
    .searchDialogAction {
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-self: center;
      padding: 0;
    }

    .content {
      width: 100%;
      max-width: 350px;
    }

    p {
      display: flex;
      align-items: flex-start;
      justify-content: center;
      font-size: large !important;
      width: 100%;
      padding: 0 10px 0 10px;
      text-align: center;
      height: 40px;
    }

    mat-dialog-actions {
      padding: 5px 20px;
    }

    app-form-buttons {
      flex-shrink: 0;
      width: 100%;
      margin: 10px 0 10px 0;
    }
  `,
  template: `
    <div class="content">
      <p class="tittle" mat-dialog-title>Szukaj</p>
      <mat-dialog-actions>
        <div class="searchDialogAction">
          <mat-label>{{ data.label }}</mat-label>

          @if (data.field.selectOption) {

            <mat-form-field>
              <mat-select [(ngModel)]="data.field.value" placeholder="Kliknij aby wybrać">
                @for (option of data.field.selectOption; track option) {
                  <mat-option (click)="$event.stopPropagation()" [value]="option">
                    {{ option }}
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>

          } @else {

            @switch (data.field.type) {
              @case ('BOOLEAN') {
                <mat-radio-group [(ngModel)]="data.field.value">
                  <mat-radio-button value="true">Opłacone</mat-radio-button>
                  <mat-radio-button value="false">Nie opłacone</mat-radio-button>
                </mat-radio-group>
              }
              @case ('DATE') {

                <div class="dateFilter">
                  <div class="datepickerWrapper">
                    <mat-form-field class="dateInput">
                      <input matInput [matDatepicker]="from" placeholder="Od" [(ngModel)]="data.field.value">
                      <mat-datepicker #from></mat-datepicker>
                      <mat-datepicker-toggle matIconSuffix [for]="from">
                        <i class="fa-solid fa-calendar" style="font-size: large" matDatepickerToggleIcon></i>
                      </mat-datepicker-toggle>
                    </mat-form-field>
                  </div>

                  <div class="datepickerWrapper">
                    <div class="datepickerWrapper">
                      <mat-form-field class="dateInput">
                        <input matInput [matDatepicker]="to" placeholder="Do" [(ngModel)]="data.field.secondValue!">
                        <mat-datepicker #to></mat-datepicker>
                        <mat-datepicker-toggle matIconSuffix [for]="to">
                          <i class="fa-solid fa-calendar" style="font-size: large" matDatepickerToggleIcon></i>
                        </mat-datepicker-toggle>
                      </mat-form-field>
                    </div>
                  </div>
                </div>

              }
              @case ('OBJECT') {
                @for (field of data.field.innerFields; track field) {
                  @if (field.selectOption) {

                    <mat-form-field>
                      <mat-select [(ngModel)]="field.value" placeholder="Kliknij aby wybrać">
                        @for (option of field.selectOption; track option) {
                          <mat-option (click)="$event.stopPropagation()" [value]="option">
                            {{ option }}
                          </mat-option>
                        }
                      </mat-select>
                    </mat-form-field>

                  } @else {

                    <mat-form-field>
                      <input matInput
                             type="text"
                             [placeholder]="field.displayName || '' "
                             [(ngModel)]="field.value"
                      >
                    </mat-form-field>

                  }
                }
              }
              @default {

                <mat-form-field>
                  <input matInput
                         type="text"
                         [(ngModel)]="data.field.value"
                  >
                </mat-form-field>

              }
            }
          }
          <app-form-buttons
            secondButtonText="Szukaj"
            [firstAction]="firstAction"
            [secondAction]="secondAction">
          </app-form-buttons>
        </div>
      </mat-dialog-actions>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchByPopupComponent {

  // @() public criteriaEmitter: EventEmitter<SearchCriteria[] | SearchCriteria> = new EventEmitter<SearchCriteria[] | SearchCriteria>();

  private readonly dialogRef = inject(MatDialogRef<SearchByPopupComponent, SearchDialogData>);

  protected data = inject<SearchDialogData>(MAT_DIALOG_DATA);
  protected firstAction = () => this.close();
  protected secondAction = () => this.searchBy();

  protected close() {
    this.clearForm();
    this.dialogRef.close();
  }

  protected searchBy() {
    const criterias: SearchCriteria[] = [];

    if (this.data.field.type === 'OBJECT') {
      this.data.field.innerFields!.forEach(f => {
        if (f.value && f.value !== '') {
          criterias.push({joinObject: this.data.field.name, key: f.name, value: f.value, operation: this.pickOperation(f.type) } as SearchCriteria)
        }
      });
    } else  {
      if (this.data.field.type === 'DATE') {
        this.data.field.value = DateFormater.YYYYMMDD(this.data.field.value!, DateDelimiter.DASH);
        this.data.field.secondValue = DateFormater.YYYYMMDD(this.data.field.secondValue!, DateDelimiter.DASH);
      }
      criterias.push({key: this.data.field.name, value: this.data.field.value, secondValue: this.data.field.secondValue, operation: this.pickOperation(this.data.field.type)} as SearchCriteria);
    }
    this.data.searchCriteriaSignal.set({searchCriteria: criterias})
    this.clearForm();
    this.dialogRef.close();
  }

  private clearForm() {
    const field = this.data.field;
    if (field.innerFields) {
      field.innerFields.forEach(f => {
        f.value = ''
      })
    } else {
      field.value = '';
      if (field.secondValue) {
        field.secondValue = '';
      }
    }
  }

  private pickOperation(type: FieldType): Operation {
    switch (type) {
      case ('TEXT'): {
        return 'LIKE';
      }
      case ("DATE"): {
        return "BETWEEN";
      }
      default: {
        return 'EQUALS';
      }
    }
  }

}
export type Operation = "EQUALS" | "NOT_EQUALS" | "LESS_THEN" | "GREATER_THEN" | "BETWEEN" | "LIKE";

