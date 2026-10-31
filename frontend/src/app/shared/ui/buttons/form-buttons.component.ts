import {Component, Input} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-form-buttons',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule
  ],
  templateUrl: './form-buttons.component.html',
  styleUrls: ['./form-buttons.component.css']
})
export class FormButtonsComponent {
  @Input() firstButtonText: string = 'Cofnij';
  @Input() secondButtonText: string = 'Wyślij';
  @Input() firstAction?: () => any;
  @Input() secondAction?: () => any;
}
