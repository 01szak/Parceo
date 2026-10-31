import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {MatCard} from '@angular/material/card';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-new-date-picker',
  imports: [
    CommonModule,
    FormsModule,
    MatCard,
    MatSelect,
    MatOption,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './new-date-picker.component.html',
  standalone: true,
  styleUrl: './new-date-picker.component.css'
})
export class NewDatePickerComponent implements OnInit {

  @Output() month = new EventEmitter<number>();
  @Output() year = new EventEmitter<number>();

  months: string[] =
    [
      "Pokaż dla wszystkich",
      "Styczeń",
      "Luty",
      "Marzec",
      "Kwiecień",
      "Maj",
      "Czerwiec",
      "Lipiec",
      "Sierpień",
      "Wrzesień",
      "Październik",
      "Listopad",
      "Grudzień"
    ];
  years: number[] = []
  currentMonth: string = this.months[new Date().getMonth() + 1];
  currentYear: number = new Date().getFullYear();

  ngOnInit() {
    this.getYears();
  }

  decreaseMonth() {
    let index = this.months.indexOf(this.currentMonth);
    index--;

    if (index === 0) {
      this.currentYear--;
      if (!this.years.includes(this.currentYear)) {
        this.years.unshift(this.currentYear);
      }
      this.year.emit(this.currentYear)
      index = this.months.length - 1;
    }
    let month = index;
    this.currentMonth = this.months[month];
    this.month.emit(month - 1)
  }

  increaseMonth() {
    let index = this.months.indexOf(this.currentMonth);
    index++;
    if (index >= this.months.length) {
      this.currentYear++;
      if (!this.years.includes(this.currentYear)) {
        this.years.push(this.currentYear);
      }
      this.year.emit(this.currentYear)
      index = 1
    }
    let month = index;
    this.currentMonth = this.months[month];
    this.month.emit(month - 1);
  }

  changeMonth(month: string) {
    let index = this.months.indexOf(month);

    this.currentMonth = this.months[index];
    this.month.emit(index - 1);
  }

  changeYear(year: number) {
    let index = this.years.indexOf(year)
    this.currentYear = this.years[index];
    this.year.emit(this.currentYear);
  }

  getYears() {
    const currentYear = new Date().getFullYear();
    if (!this.years.includes(currentYear)) {
      for (let i = 0; i < (currentYear - 2024) + 1 ; i++) {
        this.years.push(2024 + i);
      }
    }
  }

  reset() {
    this.currentYear = new Date().getFullYear();
    const monthNumeric = new Date().getMonth();
    this.currentMonth = this.months[monthNumeric + 1];
    this.month.emit(monthNumeric);
    this.year.emit(this.currentYear);
  }

}
